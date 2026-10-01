import { createServer } from "node:http";

const port = Number(process.env.MISTRAL_MOCK_PORT ?? "3100");
let ocrCalls = 0;
let structuredCalls = 0;
let structuredDelayMs = 0;
const structuredEvents = [];

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
      const sourceText = Buffer.from(documentUrl.slice("data:application/pdf;base64,".length), "base64").toString("utf8");
      const markdown = ["Conflicting quota statements", "Supports approval statement", "Duplicate approval statement", "Isolation alpha payload", "Isolation beta payload", "Replay restart payload"].find((fixture) => sourceText.includes(fixture)) ?? "Normal approval statement";
      ocrCalls += 1;
      json(response, 200, {
        model: "compose-smoke-ocr",
        pages: [{ index: 0, markdown, images: [{ id: "compose-figure", label: "diagram", bbox: [1, 2, 11, 22], assetRef: "derived/compose-smoke/figure.png" }] }],
        usage_info: { processed_pages: 1 },
      });
    } catch {
      json(response, 400, { error: "malformed mock request" });
    }
    return;
  }
  if (request.method === "POST" && request.url === "/__test-control") {
    try {
      const body = await readBody(request);
      if (!Number.isSafeInteger(body.delayMs) || body.delayMs < 0 || body.delayMs > 10_000) throw new Error("invalid delay");
      structuredDelayMs = body.delayMs;
      json(response, 200, { delayMs: structuredDelayMs });
    } catch { json(response, 400, { error: "invalid test control" }); }
    return;
  }
  if (request.method !== "GET" && request.url === "/v1/chat/completions") {
    try {
      if (request.headers.authorization !== "Bearer compose-smoke-provider-key") {
        json(response, 401, { error: "unauthorized" });
        return;
      }
      const body = await readBody(request);
      const context = JSON.parse(body?.messages?.[1]?.content ?? "null");
      const event = { stage: context?.skill, scope: context?.scope, startedAt: new Date().toISOString() };
      structuredEvents.push(event);
      if (structuredDelayMs) await new Promise((resolve) => setTimeout(resolve, structuredDelayMs));
      const text = context?.normalizedDocument?.pages?.[0]?.textBlocks?.[0]?.text;
      let value;
      if (context?.skill === "atlas.semantic.extract") {
        const conflicting = text === "Conflicting quota statements";
        const candidates = conflicting
          ? [["quota-40", "quota.limit.40", "The quota is 40."], ["quota-45", "quota.limit.45", "The quota is 45."]]
          : [["approval", "order.approval", text === "Supports approval statement" ? "A customer supports an order approval." : text === "Duplicate approval statement" ? "A customer repeats an order approval." : text === "Isolation alpha payload" ? "Scenario F alpha assertion." : text === "Isolation beta payload" ? "Scenario F beta assertion." : text === "Replay restart payload" ? "Scenario H replay assertion." : "A customer approves an order."]];
        value = {
          version: "v1",
          candidate_assertions: candidates.map(([local_candidate_id, semantic_key, meaning]) => ({ local_candidate_id, semantic_key, kind: "rule", payload: { controlled: true }, normalized_meaning: meaning, source_wording: meaning, needs_resolution: conflicting, evidence_refs: [{ page_number: 1, locator_type: "text_block", locator_id: "page-1-markdown", excerpt: text }] })),
          source_statement_inventory: [{ source_unit_id: "source-block", page_number: 1, locator_type: "text_block", locator_id: "page-1-markdown", classification: "candidate", destination_local_candidate_ids: candidates.map(([local_candidate_id]) => local_candidate_id) }, { source_unit_id: "source-visual", page_number: 1, locator_type: "visual_region", locator_id: "compose-figure", classification: "non_fact", destination_local_candidate_ids: [], non_fact_reason: "Controlled fixture diagram carries no semantic assertion." }],
          questions: [],
        };
      } else if (context?.skill === "atlas.semantic.reconcile" && Array.isArray(context.currentCandidates)) {
        const conflicting = context.currentCandidates.length === 2;
        const current = context.currentCandidates[0];
        const prior = context.priorCandidates?.[0];
        const relationshipType = current?.normalized_meaning?.includes("supports") ? "supports" : current?.normalized_meaning?.includes("repeats") ? "duplicates" : undefined;
        value = {
          version: "v1",
          relationships: context.currentCandidates.map((candidate, index) => ({ source_candidate_id: candidate.id, ...(conflicting && index === 0 ? { target_candidate_id: context.currentCandidates[1].id, relationship_type: "contradicts" } : relationshipType && prior ? { target_candidate_id: prior.id, relationship_type: relationshipType } : { relationship_type: "new" }), payload: { controlled: true }, requires_resolution: conflicting, evidence_refs: candidate.evidence_refs })),
          questions: [],
        };
      } else {
        json(response, 400, { error: "unexpected controlled semantic request" });
        return;
      }
      structuredCalls += 1;
      event.finishedAt = new Date().toISOString();
      json(response, 200, { model: "compose-smoke-structured", choices: [{ message: { content: JSON.stringify(value) } }] });
    } catch {
      json(response, 400, { error: "malformed mock request" });
    }
    return;
  }
  if (request.method === "GET" && request.url === "/metrics") {
    json(response, 200, { ocrCalls, structuredCalls, structuredEvents });
    return;
  }
  response.statusCode = 404;
  response.end();
});

server.listen(port, "0.0.0.0");
