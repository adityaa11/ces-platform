import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseSemanticReconciliationResult } from "@atlas/contracts";

const [manifestPath, proposalPath, outputPath] = process.argv.slice(2);
if (!manifestPath || !proposalPath || !outputPath) throw new Error("Usage: finalize-reconciliation.mts <manifest.json> <proposal.json> <final.json>");
const manifest = JSON.parse(await readFile(resolve(manifestPath), "utf8"));
const proposal = JSON.parse(await readFile(resolve(proposalPath), "utf8"));
const current = new Set((manifest.currentCandidates ?? manifest.current_candidates ?? []).map((item: any) => item.id));
const prior = new Set((manifest.priorCandidates ?? manifest.prior_candidates ?? []).map((item: any) => item.id));
const sources = new Map((manifest.sourceUnits ?? manifest.source_units ?? []).map((item: any) => [item.id, item]));
const accounted = new Set<string>();
const evidence = (id: string) => { const source = sources.get(id); if (!source) throw new Error(`Unknown reconciliation source ID: ${id}`); return { page_number: source.page_number ?? 1, locator_type: source.locator_type ?? "text_block", locator_id: source.locator_id ?? id, excerpt: source.text ?? id }; };
const relationships = (proposal.relationships ?? []).map((relationship: any) => {
  if (!current.has(relationship.source_candidate_id)) throw new Error(`Unknown current candidate: ${relationship.source_candidate_id}`);
  if (relationship.relationship_type === "new") { if (relationship.target_candidate_id !== undefined && relationship.target_candidate_id !== null) throw new Error("new relationship has a target"); }
  else if (!relationship.target_candidate_id || !prior.has(relationship.target_candidate_id)) throw new Error(`Invalid target for ${relationship.relationship_type}`);
  accounted.add(relationship.source_candidate_id);
  return { source_candidate_id: relationship.source_candidate_id, ...(relationship.target_candidate_id ? { target_candidate_id: relationship.target_candidate_id } : {}), relationship_type: relationship.relationship_type, payload: relationship.payload ?? { rationale: relationship.rationale }, requires_resolution: Boolean(relationship.requires_resolution), evidence_refs: (relationship.source_unit_ids ?? []).map(evidence) };
});
if (accounted.size !== current.size) throw new Error(`Incomplete current-candidate accounting: expected ${current.size}, received ${accounted.size}`);
const result = { version: "v1", relationships, questions: (proposal.questions ?? []).map((question: any) => ({ question: question.question, reason: question.reason, ...(question.source_unit_ids?.length ? { evidence_refs: question.source_unit_ids.map(evidence) } : {}) })) };
parseSemanticReconciliationResult(result);
await mkdir(dirname(resolve(outputPath)), { recursive: true });
await writeFile(resolve(outputPath), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ parser: "parseSemanticReconciliationResult", status: "PASS", relationships: relationships.length }));
