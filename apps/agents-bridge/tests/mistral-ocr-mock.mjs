import { createServer } from "node:http";

const port = Number(process.env.MISTRAL_MOCK_PORT ?? "3100");
let ocrCalls = 0;

const readBody = async (request) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 2 * 1024 * 1024) throw new Error("request too large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const json = (response, status, body) => {
  response.statusCode = status;
  response.setHeader("content-type", "application/json");
  response.end(JSON.stringify(body));
};

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/healthz") {
    json(response, 200, { status: "ok" });
    return;
  }
  if (request.method !== "GET" && request.url === "/v1/ocr") {
    try {
      if (request.headers.authorization !== "Bearer compose-smoke-provider-key") {
        json(response, 401, { error: "unauthorized" });
        return;
      }
      const body = await readBody(request);
      const documentUrl = body?.document?.document_url;
      if (body?.document?.type !== "document_url" || typeof documentUrl !== "string" || !documentUrl.startsWith("data:application/pdf;base64,")) {
        json(response, 400, { error: "expected bounded PDF data URL" });
        return;
      }
      ocrCalls += 1;
      json(response, 200, {
        model: "compose-smoke-ocr",
        pages: [{ index: 0, markdown: "Compose synthetic PDF text", images: [{ id: "compose-figure", label: "diagram", bbox: [1, 2, 11, 22], assetRef: "derived/compose-smoke/figure.png" }] }],
        usage_info: { processed_pages: 1 },
      });
    } catch {
      json(response, 400, { error: "malformed mock request" });
    }
    return;
  }
  if (request.method === "GET" && request.url === "/metrics") {
    json(response, 200, { ocrCalls });
    return;
  }
  response.statusCode = 404;
  response.end();
});

server.listen(port, "0.0.0.0");
