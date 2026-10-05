import type { z } from "zod";
import { atlasProviderExtractionProposalV1Schema } from "../sem-anm-prompt002/atlas-semantic-v1-zod-reference.ts";

export type Proposal = z.infer<typeof atlasProviderExtractionProposalV1Schema>;
type Candidate = Proposal["source_results"][number]["candidates"][number];

export function normalizeSurface(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/^[\s.,!?;:()[\]{}"'“”‘’]+|[\s.,!?;:()[\]{}"'“”‘’]+$/g, "").replace(/^(?:a|an|the)\s+/, "");
}
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value as Record<string, unknown>).flatMap(strings);
  return [];
}
function contains(values: readonly string[], pattern: RegExp): boolean { return values.some((value) => pattern.test(normalizeSurface(value))); }
function candidateText(candidate: Candidate): string[] { return [candidate.normalized_meaning, ...strings(candidate.payload)]; }

export function assertSourceAccounting(proposal: Proposal): void {
  const expected = ["S1", "S2", "S3", "S4"];
  const actual = proposal.source_results.map(({ slot }) => slot);
  if (actual.length !== expected.length || new Set(actual).size !== actual.length || expected.some((slot) => actual.filter((item) => item === slot).length !== 1) || actual.some((slot) => !expected.includes(slot))) throw new Error("Provider output must account for S1-S4 exactly once, with no unknown or duplicate slots");
}
export function evaluateOracle(proposal: Proposal) {
  assertSourceAccounting(proposal);
  const bySlot = new Map(proposal.source_results.map((item) => [item.slot, item]));
  const out: Record<string, { passed: boolean; observations: string[] }> = {};
  const s1 = bySlot.get("S1")!; const s1c = s1.candidates[0]; const s1t = s1c ? candidateText(s1c) : [];
  const s1ok = s1.classification === "candidate" && s1.candidates.length === 1 && s1c.kind === "workflow_step" && !s1c.needs_resolution && s1.questions.length === 0 && contains(s1t, /\bcustomer\b/) && contains(s1t, /\bsubmit(?:s|ting)?\b|\bsubmission\b/) && contains(s1t, /\border\b/);
  out.S1 = { passed: s1ok, observations: [s1ok ? "workflow step preserves customer submission and order" : "workflow-step meaning or resolution state differs"] };
  const s2 = bySlot.get("S2")!; const s2c = s2.candidates[0]; const s2t = s2c ? candidateText(s2c) : [];
  const s2ok = s2.classification === "candidate" && s2.candidates.length === 1 && !!s2c && ["rule", "constraint"].includes(s2c.kind) && !s2c.needs_resolution && contains(s2t, /\b(customer|pelanggan)\b/) && contains(s2t, /\b(purchase|buy|membeli)\b/) && contains(s2t, /\b(hanya boleh|(?:may|can) only|only (?:may|can)|permitted)\b/) && contains(s2t, /\b(maksimal|maximum|max)\b/) && contains(s2t, /\b2\b/) && contains(s2t, /\b(product|produk)\b/) && contains(s2t, /\b(per (?:one )?order|satu pesanan|(?:in|for) one order)\b/);
  out.S2 = { passed: s2ok, observations: [s2ok ? "one candidate preserves the combined normative maximum-two-products-per-order proposition" : "S2 loses a required facet or splits/changes the proposition"] };
  const s3 = bySlot.get("S3")!; const s3ok = s3.classification === "non_fact" && s3.candidates.length === 0 && !!s3.non_fact_reason?.trim() && s3.questions.length === 0;
  out.S3 = { passed: s3ok, observations: [s3ok ? "heading is a non-fact" : "heading disposition differs"] };
  const s4 = bySlot.get("S4")!; const s4c = s4.candidates[0]; const s4t = s4c ? candidateText(s4c) : []; const question = s4.questions[0]?.question ?? "";
  const s4ok = s4.classification === "candidate" && s4.candidates.length === 1 && !!s4c && s4c.kind === "rule" && s4c.needs_resolution && s4.questions.length === 1 && contains(s4t, /\bapproval\b/) && contains(s4t, /\b(may be required|possibly|required may apply)\b/) && contains(s4t, /\bbefore processing\b/) && /\b(when|under what condition|under what circumstances)\b/i.test(question) && !/\b(threshold|manager|approver|implementation)\b/i.test(question);
  out.S4 = { passed: s4ok, observations: [s4ok ? "rule preserves possible approval before processing and asks only for applicability" : "S4 modality, ordering, question, or resolution state differs"] };
  return { passed: Object.values(out).every(({ passed }) => passed), slots: out };
}
