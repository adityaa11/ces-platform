export const PROVENANCE = [
  ["system role", "FIXED/SYSTEM ROLE", "You are a semantic extraction component."],
  ["unit cardinality", "FIXED/TASK INSTRUCTION", "zero semantic units"],
  ["output shape", "ZOD_STRUCTURE", "source_results"],
  ["workflow kind", "ZOD_DESCRIPTION/semantic_kind", "A concrete action or event"],
  ["rule kind", "ZOD_DESCRIPTION/semantic_kind", "Governing business or behavioral logic"],
  ["constraint kind", "ZOD_DESCRIPTION/semantic_kind", "A restriction, bound, invariant"],
  ["possibility distinction", "ZOD_DESCRIPTION/modality", "Possibility is uncertainty, not permission."],
  ["timing distinction", "ZOD_DESCRIPTION/temporal_constraints", "Timing/order is not automatically an applicability condition."],
  ["resolution", "ZOD_DESCRIPTION/resolution_status", "Material ambiguity or missing information"],
  ["clarification", "ZOD_DESCRIPTION/SemanticUnit", "clarification_question must contain exactly one concise question"],
  ["reference ambiguity", "FIXED/REFERENCE HANDLING", "multiple plausible referents"],
  ["multiple units", "FIXED/MULTIPLE-UNIT HANDLING", "One grammatical sentence may express multiple semantic units."],
  ["conflict boundary", "FIXED/CONFLICT HANDLING", "Extraction is not conflict resolution."],
  ["source accounting", "FIXED/SOURCE ACCOUNTING", "Return one source_result for every supplied slot."],
  ["JSON-only", "FIXED/OUTPUT RULES", "Return valid JSON only."],
] as const;

export function checkpointCoverage(prompt: string) {
  const entries = PROVENANCE.map(([instruction, authority, marker]) => ({ instruction, authority, marker, present: prompt.includes(marker) }));
  const duplicateAuthorities = new Set(entries.map(({ instruction, authority }) => `${instruction}:${authority}`)).size !== entries.length;
  return { entries, complete: entries.every(({ present }) => present) && !duplicateAuthorities };
}
