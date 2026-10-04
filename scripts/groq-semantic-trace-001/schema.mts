import { slots, type Slot } from "./fixture.mts";

const stringList = { type: "array", items: { type: "string" } } as const;

export const semanticTraceSchema = {
  type: "object", additionalProperties: false, required: ["observations"],
  properties: {
    observations: {
      type: "array", minItems: 4, maxItems: 4,
      items: {
        type: "object", additionalProperties: false,
        required: ["slot", "semantic_role", "proposition", "epistemic_status", "polarity", "stated_conditions", "unresolved_information"],
        properties: {
          slot: { type: "string", enum: slots },
          semantic_role: { type: "string", enum: ["business_proposition", "structural_text"] },
          proposition: { type: "string" },
          epistemic_status: { type: "string", enum: ["certain", "probable", "possible", "underspecified", "not_applicable"] },
          polarity: { type: "string", enum: ["positive", "negative", "underspecified", "not_applicable"] },
          stated_conditions: stringList,
          unresolved_information: stringList,
        },
      },
    },
  },
} as const;

export type SemanticTrace = { observations: Array<{ slot: Slot; semantic_role: "business_proposition" | "structural_text"; proposition: string; epistemic_status: "certain" | "probable" | "possible" | "underspecified" | "not_applicable"; polarity: "positive" | "negative" | "underspecified" | "not_applicable"; stated_conditions: string[]; unresolved_information: string[] }> };

export function validateSemanticTrace(value: unknown): SemanticTrace {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Trace response must be an object.");
  const response = value as Record<string, unknown>;
  if (Object.keys(response).length !== 1 || !("observations" in response) || !Array.isArray(response.observations) || response.observations.length !== 4) throw new Error("Trace response must contain exactly four observations only.");
  const seen = new Set<string>();
  for (const observation of response.observations) {
    if (!observation || typeof observation !== "object" || Array.isArray(observation)) throw new Error("Each observation must be an object.");
    const item = observation as Record<string, unknown>;
    const fields = ["slot", "semantic_role", "proposition", "epistemic_status", "polarity", "stated_conditions", "unresolved_information"];
    if (Object.keys(item).length !== fields.length || fields.some((field) => !(field in item))) throw new Error("Observation contains a missing or unsupported field.");
    if (!slots.includes(item.slot as Slot) || seen.has(item.slot as string)) throw new Error("Trace response has missing, duplicate, or invented slots.");
    seen.add(item.slot as string);
    if (!(["business_proposition", "structural_text"] as const).includes(item.semantic_role as never) || !(["certain", "probable", "possible", "underspecified", "not_applicable"] as const).includes(item.epistemic_status as never) || !(["positive", "negative", "underspecified", "not_applicable"] as const).includes(item.polarity as never) || typeof item.proposition !== "string" || !Array.isArray(item.stated_conditions) || !Array.isArray(item.unresolved_information) || !item.stated_conditions.every((entry) => typeof entry === "string") || !item.unresolved_information.every((entry) => typeof entry === "string")) throw new Error("Trace response has an invalid field type or enum.");
    if (item.semantic_role === "structural_text" && (item.proposition !== "" || item.epistemic_status !== "not_applicable" || item.polarity !== "not_applicable" || item.stated_conditions.length !== 0 || item.unresolved_information.length !== 0)) throw new Error("Structural text invariants are invalid.");
  }
  if (seen.size !== slots.length) throw new Error("Trace response does not account for every authorized slot.");
  return response as SemanticTrace;
}
