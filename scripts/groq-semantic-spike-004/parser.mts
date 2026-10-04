export type MinimalSemanticObservation = {
  slot: "S1" | "S2" | "S3" | "S4";
  structural_only: boolean;
  meaning: string;
  qualifications: string[];
  unspecified: string[];
};

export type MinimalSemanticEnvelope = { observations: MinimalSemanticObservation[] };

const slots = ["S1", "S2", "S3", "S4"] as const;
const envelopeKeys = ["observations"];
const observationKeys = ["slot", "structural_only", "meaning", "qualifications", "unspecified"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: string[]) {
  const actual = Object.keys(value).sort();
  return actual.length === expected.length && actual.every((key, index) => key === [...expected].sort()[index]);
}

export function parseEnvelope(raw: string): MinimalSemanticEnvelope {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("Packaging failure: response is not valid JSON.");
  }
  if (!isRecord(value) || !hasExactKeys(value, envelopeKeys) || !Array.isArray(value.observations)) {
    throw new Error("Packaging failure: expected an object containing only observations.");
  }
  if (value.observations.length !== slots.length) {
    throw new Error("Packaging failure: expected exactly four observations.");
  }

  const observations: MinimalSemanticObservation[] = [];
  for (let index = 0; index < value.observations.length; index += 1) {
    const item = value.observations[index];
    if (!isRecord(item) || !hasExactKeys(item, observationKeys)) {
      throw new Error(`Packaging failure: observation ${index + 1} has missing or additional fields.`);
    }
    if (item.slot !== slots[index]) {
      throw new Error(`Packaging failure: observation ${index + 1} is missing, duplicated, unauthorized, or out of source order.`);
    }
    if (typeof item.structural_only !== "boolean" || typeof item.meaning !== "string") {
      throw new Error(`Packaging failure: observation ${index + 1} has an invalid structural_only or meaning type.`);
    }
    if (!Array.isArray(item.qualifications) || !item.qualifications.every((entry) => typeof entry === "string")) {
      throw new Error(`Packaging failure: observation ${index + 1} qualifications must be a string array.`);
    }
    if (!Array.isArray(item.unspecified) || !item.unspecified.every((entry) => typeof entry === "string")) {
      throw new Error(`Packaging failure: observation ${index + 1} unspecified must be a string array.`);
    }
    if (item.slot === "S3") {
      if (item.structural_only !== true || item.meaning !== "" || item.qualifications.length !== 0 || item.unspecified.length !== 0) {
        throw new Error("Packaging failure: S3 must satisfy the frozen structural-heading shape.");
      }
    } else if (item.structural_only !== false || item.meaning.trim() === "") {
      throw new Error(`Packaging failure: ${item.slot} must be non-structural with non-empty meaning.`);
    }
    observations.push(item as unknown as MinimalSemanticObservation);
  }
  return { observations };
}
