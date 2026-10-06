import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
// The spike lives outside a pnpm workspace package. Keep the real Atlas parser
// entrypoint while making its workspace resolution explicit for the isolated
// launcher; no finalization behavior is reimplemented here.
import { parseSemanticExtractionResult } from "../../packages/atlas-contracts/src/index.ts";

const [serializedPath, proposalPath, outputPath] = process.argv.slice(2);
if (!serializedPath || !proposalPath || !outputPath) throw new Error("Usage: finalize-extraction.mts <serialized.json> <proposal.json> <final.json>");
const serialized = JSON.parse(await readFile(resolve(serializedPath), "utf8"));
const proposal = JSON.parse(await readFile(resolve(proposalPath), "utf8"));
const sourceById = new Map(serialized.units.map((unit: any) => [unit.source_unit_id, unit]));
const candidates = proposal.candidates ?? [];
const candidateIds = new Set<string>();
for (const candidate of candidates) {
  if (candidateIds.has(candidate.local_candidate_id)) throw new Error(`Duplicate local candidate ID: ${candidate.local_candidate_id}`);
  candidateIds.add(candidate.local_candidate_id);
  for (const sourceId of candidate.source_unit_ids ?? []) if (!sourceById.has(sourceId)) throw new Error(`Unknown candidate source ID: ${sourceId}`);
}
const dispositions = proposal.source_dispositions ?? [];
const dispositionById = new Map<string, any>();
for (const disposition of dispositions) {
  if (!sourceById.has(disposition.source_unit_id)) throw new Error(`Unknown disposition source ID: ${disposition.source_unit_id}`);
  if (dispositionById.has(disposition.source_unit_id)) throw new Error(`Duplicate disposition source ID: ${disposition.source_unit_id}`);
  for (const id of disposition.destination_local_candidate_ids ?? []) if (!candidateIds.has(id)) throw new Error(`Unknown disposition candidate ID: ${id}`);
  dispositionById.set(disposition.source_unit_id, disposition);
}
if (dispositionById.size !== sourceById.size) throw new Error(`Incomplete source accounting: expected ${sourceById.size}, received ${dispositionById.size}`);
const evidence = (id: string) => { const unit = sourceById.get(id); return { page_number: unit.page_number, locator_type: unit.locator_type, locator_id: unit.locator_id, excerpt: unit.text.slice(0, 4000) }; };
const finalResult = {
  version: "v1",
  candidate_assertions: candidates.map((candidate: any) => ({ local_candidate_id: candidate.local_candidate_id, semantic_key: candidate.semantic_key, kind: candidate.kind, payload: candidate.payload ?? {}, normalized_meaning: candidate.normalized_meaning, ...(candidate.source_wording ? { source_wording: candidate.source_wording } : {}), needs_resolution: Boolean(candidate.needs_resolution), evidence_refs: candidate.source_unit_ids.map(evidence) })),
  source_statement_inventory: serialized.units.map((unit: any) => { const disposition = dispositionById.get(unit.source_unit_id); return { source_unit_id: unit.source_unit_id, page_number: unit.page_number, locator_type: unit.locator_type, locator_id: unit.locator_id, classification: disposition.classification, destination_local_candidate_ids: disposition.destination_local_candidate_ids ?? [], ...(disposition.classification === "non_fact" ? { non_fact_reason: disposition.non_fact_reason } : {}) }; }),
  questions: (proposal.questions ?? []).map((question: any) => ({ question: question.question, reason: question.reason, ...(question.source_unit_ids?.length ? { evidence_refs: question.source_unit_ids.map(evidence) } : {}) })),
};
parseSemanticExtractionResult(finalResult);
await mkdir(dirname(resolve(outputPath)), { recursive: true });
await writeFile(resolve(outputPath), `${JSON.stringify(finalResult, null, 2)}\n`);
console.log(JSON.stringify({ parser: "parseSemanticExtractionResult", status: "PASS", candidates: finalResult.candidate_assertions.length, sources: finalResult.source_statement_inventory.length }));
