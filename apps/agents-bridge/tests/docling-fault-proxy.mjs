import http from "node:http";

const upstream = process.env.DOCLING_FAULT_UPSTREAM ?? "http://docling-serve:5001";
let mode = "pass";

const json = (response, status, body) => {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
};

const incomplete = { status: "success", document: { json_content: { texts: [] } } };
const mapperRejected = { status: "success", document: { json_content: { texts: [{ self_ref: "#/texts/0", text: "text without source provenance", prov: [] }] } } };
// The mapper must preserve every source-grounded page. This exceeds the
// canonical NormalizedDocument page bound, so the real normalizer/parser
// rejects it without any production-only fault branch.
const normalizationRejected = { status: "success", document: { json_content: { texts: Array.from({ length: 10_001 }, (_, index) => ({ self_ref: `#/texts/${index}`, text: `bounded page ${index + 1}`, prov: [{ page_no: index + 1 }] })) } } };

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://docling-fault");
  if (url.pathname === "/__fault" && request.method === "PUT") {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const next = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (typeof next.mode !== "string") return json(response, 400, { error: "mode is required" });
    mode = next.mode;
    return json(response, 200, { mode });
  }
  if (url.pathname === "/__fault") return json(response, 200, { mode });

  const conversion = url.pathname === "/v1/convert/file";
  const readiness = url.pathname === "/health" || url.pathname === "/ready";
  if (mode === "unavailable" && readiness) return json(response, 503, { error: "controlled unavailable" });
  if (mode === "not-ready" && url.pathname === "/ready") return json(response, 503, { error: "controlled not ready" });
  if (mode === "reset" && conversion) return request.socket.destroy();
  if (mode === "http-5xx" && conversion) return json(response, 503, { error: "controlled 5xx" });
  if (mode === "processing" && conversion) return json(response, 200, { status: "failure", errors: ["controlled processing failure"] });
  if (mode === "timeout" && conversion) return undefined;
  if (mode === "malformed" && conversion) { response.writeHead(200, { "content-type": "application/json" }); return response.end("{controlled malformed"); }
  if (mode === "incomplete" && conversion) return json(response, 200, incomplete);
  if (mode === "mapper-rejection" && conversion) return json(response, 200, mapperRejected);
  if (mode === "normalization-rejection" && conversion) return json(response, 200, normalizationRejected);

  try {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const upstreamResponse = await fetch(`${upstream}${url.pathname}${url.search}`, { method: request.method, headers: Object.fromEntries(Object.entries(request.headers).filter(([name]) => name !== "host")), body: chunks.length ? Buffer.concat(chunks) : undefined, duplex: "half" });
    response.writeHead(upstreamResponse.status, Object.fromEntries(upstreamResponse.headers));
    response.end(Buffer.from(await upstreamResponse.arrayBuffer()));
  } catch (error) {
    json(response, 502, { error: error instanceof Error ? error.message : "upstream failed" });
  }
});

server.listen(5001, "0.0.0.0");
