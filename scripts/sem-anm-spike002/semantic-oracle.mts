import type { z } from "zod";
import { SemanticPromptSchema } from "../sem-anm-prompt001/semantic-schema.mts";

export type Proposal = z.infer<typeof SemanticPromptSchema>;
export type SemanticUnit = Proposal["source_results"][number]["semantic_units"][number];

export function normalizeSurface(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ").replace(/^[\s.,!?;:()[\]{}"'“”‘’]+|[\s.,!?;:()[\]{}"'“”‘’]+$/g, "").replace(/^(?:a|an|the)\s+/, "");
}

function hasAny(values: readonly string[], patterns: readonly RegExp[]): boolean {
  return values.some((value) => patterns.some((pattern) => pattern.test(normalizeSurface(value))));
}

export function assertSourceAccounting(proposal: Proposal, slots: readonly string[] = ["S1", "S2", "S3", "S4"]): void {
  const actual = proposal.source_results.map(({ slot }) => slot);
  if (actual.length !== slots.length || new Set(actual).size !== actual.length || slots.some((slot) => actual.filter((item) => item === slot).length !== 1) || actual.some((slot) => !slots.includes(slot))) {
    throw new Error("Provider output must account for S1-S4 exactly once, with no unknown or duplicate slots");
  }
}

export function evaluateOracle(proposal: Proposal): { readonly passed: boolean; readonly slots: Record<string, { readonly passed: boolean; readonly observations: string[] }> } {
  assertSourceAccounting(proposal);
  const bySlot = new Map(proposal.source_results.map((item) => [item.slot, item.semantic_units]));
  const out: Record<string, { passed: boolean; observations: string[] }> = {};
  const units = (slot: string) => bySlot.get(slot)!;
  const s1 = units("S1");
  const s1ok = s1.length === 1 && s1[0].semantic_kind === "workflow_step" && s1[0].resolution_status === "resolved" && s1[0].clarification_question === null && normalizeSurface(s1[0].actor ?? "") === "customer" && hasAny([s1[0].action ?? ""], [/^submit(?:s|ting)?$/, /^submission$/]) && normalizeSurface(s1[0].object ?? "") === "order";
  out.S1 = { passed: s1ok, observations: [s1ok ? "workflow step preserves customer submission of an order without incidental clarification" : "workflow step, actor, submit meaning, object, or resolved state differs"] };

  const s2 = units("S2");
  const s2ok = s2.length >= 1 && s2.some((unit) => unit.semantic_kind === "constraint" && unit.resolution_status === "resolved" && (normalizeSurface(unit.actor ?? "").includes("pelanggan") || normalizeSurface(unit.subject ?? "").includes("pelanggan") || normalizeSurface(unit.actor ?? "").includes("customer")) && hasAny(unit.quantitative_constraints, [/maksimal\s*2/, /maximum\s*(?:of\s*)?2/, /max\s*(?:of\s*)?2/]) && unit.quantitative_constraints.some((value) => /\b2\b/.test(value)) && hasAny([...unit.scope_constraints, ...unit.quantitative_constraints], [/pesanan/, /per order/, /each order/, /one order/]) && hasAny([...(unit.subject ? [unit.subject] : []), ...(unit.object ? [unit.object] : []), ...unit.quantitative_constraints], [/produk/, /product/]));
  out.S2 = { passed: s2ok, observations: [s2ok ? "resolved maximum of exactly two products per order is preserved" : "constraint, customer, maximum direction/value, product, or per-order scope differs"] };

  const s3 = units("S3");
  const s3ok = s3.length === 0;
  out.S3 = { passed: s3ok, observations: [s3ok ? "heading yields zero semantic units" : "heading was turned into a business proposition"] };

  const s4 = units("S4");
  const s4ok = s4.length === 1 && s4[0].semantic_kind === "rule" && s4[0].modality === "possible" && s4[0].actor === null && s4[0].resolution_status === "needs_resolution" && s4[0].clarification_question !== null && s4[0].clarification_question.trim().endsWith("?") && /\b(?:when|circumstances|under what)\b/i.test(s4[0].clarification_question) && hasAny(s4[0].temporal_constraints, [/before processing/, /approval occurs before processing/]) && s4[0].applicability_conditions.length === 0;
  out.S4 = { passed: s4ok, observations: [s4ok ? "possible rule retains temporal ordering, absent applicability trigger, and neutral clarification" : "modality, temporal/applicability distinction, or unresolved clarification differs"] };
  return { passed: Object.values(out).every(({ passed }) => passed), slots: out };
}

export function assertOracle(proposal: Proposal): ReturnType<typeof evaluateOracle> {
  const result = evaluateOracle(proposal);
  if (!result.passed) throw new Error(`S1-S4 semantic oracle failed: ${JSON.stringify(result.slots)}`);
  return result;
}
