import { slots, type Slot } from "./fixture.mts";

export const semanticKinds = ["actor", "business_object", "business_property", "responsibility", "rule", "constraint", "condition", "decision", "workflow_step", "state_transition", "relationship", "input", "output", "acceptance_expectation", "exception", "unresolved"] as const;
export type Disposition = "candidate" | "non_fact" | "uncertain";
export type IntermediateResult = { readonly source_results: readonly { readonly slot: number; readonly disposition: Disposition; readonly candidates: readonly { readonly kind: typeof semanticKinds[number]; readonly semantic_key: string; readonly normalized_meaning: string; readonly needs_resolution: boolean }[]; readonly non_fact_reason: string; readonly question: string; readonly question_reason: string }[] };

const candidate = { type: "object", additionalProperties: false, required: ["kind", "semantic_key", "normalized_meaning", "needs_resolution"], properties: { kind: { enum: semanticKinds }, semantic_key: { type: "string", minLength: 1, maxLength: 300 }, normalized_meaning: { type: "string", minLength: 1, maxLength: 8000 }, needs_resolution: { type: "boolean" } } } as const;
export const intermediateSchema = { type: "object", additionalProperties: false, required: ["source_results"], properties: { source_results: { type: "array", minItems: 4, maxItems: 4, items: { type: "object", additionalProperties: false, required: ["slot", "disposition", "candidates", "non_fact_reason", "question", "question_reason"], properties: { slot: { type: "integer", minimum: 1, maximum: 4 }, disposition: { enum: ["candidate", "non_fact", "uncertain"] }, candidates: { type: "array", maxItems: 8, items: candidate }, non_fact_reason: { type: "string", maxLength: 1000 }, question: { type: "string", maxLength: 2000 }, question_reason: { type: "string", maxLength: 2000 } } } } } } as const;
export function validateIntermediate(value: unknown): IntermediateResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid spike intermediate result: expected object");
  const root = value as Record<string, unknown>;
  if (Object.keys(root).length !== 1 || !Array.isArray(root.source_results) || root.source_results.length !== 4) throw new Error("Invalid spike intermediate result: exact source_results array required");
  const result = value as IntermediateResult;
  const seen = new Set<number>();
  for (const source of result.source_results) {
    if (!source || typeof source !== "object" || Object.keys(source).length !== 6 || !Number.isInteger(source.slot) || !["candidate", "non_fact", "uncertain"].includes(source.disposition) || !Array.isArray(source.candidates) || typeof source.non_fact_reason !== "string" || typeof source.question !== "string" || typeof source.question_reason !== "string") throw new Error("Invalid source result shape");
    for (const candidate of source.candidates) if (!candidate || typeof candidate !== "object" || Object.keys(candidate).length !== 4 || !semanticKinds.includes(candidate.kind) || !candidate.semantic_key || !candidate.normalized_meaning || typeof candidate.needs_resolution !== "boolean") throw new Error(`Invalid candidate shape for S${source.slot}`);
    if (seen.has(source.slot)) throw new Error(`Duplicate source slot S${source.slot}`);
    seen.add(source.slot);
    if (source.disposition === "candidate" && (source.candidates.length === 0 || source.non_fact_reason !== "" || source.question !== "" || source.question_reason !== "")) throw new Error(`Invalid candidate disposition for S${source.slot}`);
    if (source.disposition === "non_fact" && (source.candidates.length !== 0 || !source.non_fact_reason || source.question !== "" || source.question_reason !== "")) throw new Error(`Invalid non_fact disposition for S${source.slot}`);
    if (source.disposition === "uncertain" && (source.candidates.length === 0 || !source.question || !source.question_reason || source.candidates.some((candidate) => !candidate.needs_resolution))) throw new Error(`Invalid uncertain disposition for S${source.slot}`);
  }
  for (const slot of slots) if (!seen.has(Number(slot.slice(1)))) throw new Error(`Missing source slot ${slot}`);
  return result;
}

export const slotFor = (number: number): Slot => `S${number}` as Slot;
