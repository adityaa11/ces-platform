import http from "node:http";

const upstream = process.env.ATLAS_FAULT_UPSTREAM ?? "http://atlas:3001";
let resultOutage = false;
const json = (response, status, body) => { response.writeHead(status, { "content-type": "application/json" }); response.end(JSON.stringify(body)); };

http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://atlas-fault");
  if (url.pathname === "/__fault" && request.method === "PUT") {
    const chunks = []; for await (const chunk of request) chunks.push(chunk);
    resultOutage = JSON.parse(Buffer.concat(chunks).toString("utf8")).resultOutage === true;
    return json(response, 200, { resultOutage });
  }
  if (url.pathname === "/__fault") return json(response, 200, { resultOutage });
  if (resultOutage && url.pathname === "/internal/perception/result") return json(response, 503, { error: "controlled result delivery outage" });
  try {
    const chunks = []; for await (const chunk of request) chunks.push(chunk);
    const upstreamResponse = await fetch(`${upstream}${url.pathname}${url.search}`, { method: request.method, headers: Object.fromEntries(Object.entries(request.headers).filter(([name]) => name !== "host")), body: chunks.length ? Buffer.concat(chunks) : undefined, duplex: "half" });
    response.writeHead(upstreamResponse.status, Object.fromEntries(upstreamResponse.headers));
    response.end(Buffer.from(await upstreamResponse.arrayBuffer()));
  } catch (error) { json(response, 502, { error: error instanceof Error ? error.message : "upstream failed" }); }
}).listen(3001, "0.0.0.0");
