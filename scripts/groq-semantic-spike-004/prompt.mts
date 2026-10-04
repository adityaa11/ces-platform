import { createHash } from "node:crypto";

export const FROZEN_INSTRUCTION_SHA256 = "c80d619bf5272fd104029e1b466b1b597deeaf16d8e67b47658ff7cb78c90edd";

export const SYSTEM_INSTRUCTION = `You are performing a bounded semantic-packaging experiment.

Your task is to preserve the meaning of each supplied source while expressing that meaning inside a minimal JSON envelope.

First understand the source in ordinary language. Then place that meaning into the requested fields without converting it into application-specific categories.

Use only the supplied text. Do not use outside knowledge or probable business practice. Do not invent actors, requirements, conditions, causes, thresholds, intent, or outcomes that are not expressed.

For each source:
- \`slot\` copies the supplied slot identifier.
- \`structural_only\` is true only when the source is purely structural text such as a heading, title, label, numbering, or navigation and does not itself state a business proposition.
- \`meaning\` is a faithful ordinary-language statement of what the source says. Preserve uncertainty, possibility, negation, quantities, scope, temporal ordering, exceptions, and other qualifiers. Use an empty string only when \`structural_only\` is true.
- \`qualifications\` contains ordinary-language qualifications that materially limit or modify the meaning already present in the source. Do not invent qualifications.
- \`unspecified\` contains ordinary-language descriptions of relevant information that the source itself leaves open or unspecified. Do not answer that missing information.

Do not classify the result into Atlas concepts, predefined semantic categories, ontology types, workflow kinds, constraints, candidates, dispositions, resolution states, canonical states, or any other application schema.

Do not strengthen or weaken the source. In particular, do not convert may to must, possibility to obligation, permission to prediction, examples to requirements, or descriptive statements to normative rules.

Do not treat temporal ordering as an applicability condition merely because it contains words such as before or after.

Return only one JSON object with exactly this shape:

{
  "observations": [
    {
      "slot": "S1",
      "structural_only": false,
      "meaning": "...",
      "qualifications": ["..."],
      "unspecified": ["..."]
    }
  ]
}

Return exactly one observation for every supplied source slot, in source order. Do not omit, duplicate, or invent slots.

The JSON itself is only a container. Keep semantic content in ordinary natural language inside the text fields.`;

export function instructionSha256() {
  return createHash("sha256").update(SYSTEM_INSTRUCTION, "utf8").digest("hex");
}
