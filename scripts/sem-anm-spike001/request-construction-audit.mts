import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { serializeStrictRequest } from "./anoman-client.mts";

const serialized = serializeStrictRequest("transport");
const body = JSON.parse(serialized) as { model?: unknown; messages?: unknown; response_format?: { type?: unknown; json_schema?: { name?: unknown; strict?: unknown; schema?: { properties?: Record<string, { const?: unknown }> } } } };
const format = body.response_format, jsonSchema = format?.json_schema, schema = jsonSchema?.schema;
assert.equal(body.model, "gemini-2.5-flash"); assert.ok(Array.isArray(body.messages)); assert.equal(format?.type, "json_schema"); assert.equal(jsonSchema?.name, "transport_qualification"); assert.equal(jsonSchema?.strict, true); assert.ok(schema && typeof schema === "object" && Object.keys(schema).length > 0); assert.equal(schema.properties?.status?.const, "ANOMAN_OK"); assert.equal(schema.properties?.count?.const, 1);
const artifact = { classification: "REQUEST_CONSTRUCTION_CONFIRMED", request_body_serialized: serialized, request_body: body, assertions: { response_format_type: format.type, strict: jsonSchema.strict, schema_non_empty: true, status_literal: schema.properties?.status?.const, count_literal: schema.properties?.count?.const } };
const out = resolve(fileURLToPath(new URL("../../.atlas-data/sem-anm-spike001/", import.meta.url)));
await mkdir(out, { recursive: true }); await writeFile(resolve(out, "gate-a-request-construction.json"), `${JSON.stringify(artifact, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ classification: artifact.classification, response_format: format.type, strict: jsonSchema.strict }));
