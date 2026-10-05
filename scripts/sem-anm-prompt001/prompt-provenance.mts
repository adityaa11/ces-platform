type Authority = "FIXED" | "ZOD_STRUCTURE" | "ZOD_DESCRIPTION";
type Entry = readonly [id: string, authority: Authority, checkpointMarker: string, promptMarker?: string];

// Complete explicit material-instruction inventory for checkpoint V1. Each ID
// has one authority and must appear in both fixture and generated prompt.
export const PROVENANCE: readonly Entry[] = [
  ["role", "FIXED", "You are a semantic extraction component."], ["cardinality", "FIXED", "zero semantic units"], ["no-merge", "FIXED", "Do not merge independent requirements"],
  ["shape-root", "ZOD_STRUCTURE", "source_results"], ["shape-slot", "ZOD_STRUCTURE", "semantic_units"], ["shape-kind", "ZOD_STRUCTURE", "workflow_step | rule | constraint"], ["shape-null", "ZOD_STRUCTURE", "string or null"], ["shape-modality", "ZOD_STRUCTURE", "required | prohibited | permitted | possible | unspecified"], ["shape-arrays", "ZOD_STRUCTURE", "applicability_conditions"],
  ["kind-workflow", "ZOD_DESCRIPTION", "A concrete action or event"], ["kind-rule", "ZOD_DESCRIPTION", "Governing business or behavioral logic"], ["kind-constraint", "ZOD_DESCRIPTION", "A restriction, bound, invariant"], ["kind-timing", "ZOD_DESCRIPTION", "primary semantic role"],
  ["subject", "ZOD_DESCRIPTION", "no useful explicit subject"], ["actor", "ZOD_DESCRIPTION", "Do not infer an actor"], ["action", "ZOD_DESCRIPTION", "concise verb"], ["object", "ZOD_DESCRIPTION", "directly acted upon"], ["target", "ZOD_DESCRIPTION", "recipient or destination"],
  ["required", "ZOD_DESCRIPTION", "definitely requires"], ["prohibited", "ZOD_DESCRIPTION", "definitely forbids"], ["permitted", "ZOD_DESCRIPTION", "explicitly allows"], ["possible", "ZOD_DESCRIPTION", "Possibility is uncertainty, not permission."], ["unspecified", "ZOD_DESCRIPTION", "does not establish one of the modalities"],
  ["applicability", "ZOD_DESCRIPTION", "WHETHER or UNDER WHAT CIRCUMSTANCES"], ["applicability-logic", "ZOD_DESCRIPTION", "AND, OR, ONLY IF"], ["temporal", "ZOD_DESCRIPTION", "Explicit timing or ordering"], ["temporal-distinction", "ZOD_DESCRIPTION", "Timing/order is not automatically an applicability condition."], ["quantitative", "ZOD_DESCRIPTION", "numeric limits, minimums, maximums"], ["scope", "ZOD_DESCRIPTION", "Preserve the stated scope rather than broadening it."],
  ["resolved", "ZOD_DESCRIPTION", "enough information to faithfully represent"], ["needs-resolution", "ZOD_DESCRIPTION", "Material ambiguity or missing information"], ["no-guess", "ZOD_DESCRIPTION", "Do not guess merely to avoid needs_resolution."], ["clarification", "ZOD_DESCRIPTION", "requesting only the missing material information"], ["cross-field", "ZOD_DESCRIPTION", "Mark that semantic unit as needs_resolution and ask for clarification.", "clarification_question must contain exactly one concise question"],
  ["reference", "FIXED", "multiple plausible referents"], ["multiple", "FIXED", "One grammatical sentence may express multiple semantic units."], ["shared", "FIXED", "Preserve shared conditions or timing"], ["conflict", "FIXED", "Extraction is not conflict resolution."], ["source", "FIXED", "Use only information supported"], ["no-invent", "FIXED", "Do not invent facts."], ["uncertainty", "FIXED", "Preserve uncertainty."], ["numeric", "FIXED", "Preserve exact numeric limits."], ["accounting", "FIXED", "Return one source_result for every supplied slot."], ["slot", "FIXED", "Preserve the supplied slot exactly."], ["no-slots", "FIXED", "Do not create slots that were not supplied."], ["json", "FIXED", "Return valid JSON only."],
];

export function checkpointCoverage(checkpoint: string, prompt: string) {
  const entries = PROVENANCE.map(([id, authority, checkpointMarker, promptMarker = checkpointMarker]) => ({ id, authority, checkpointMarker, promptMarker, inCheckpoint: checkpoint.includes(checkpointMarker), inPrompt: prompt.includes(promptMarker) }));
  const duplicateIds = entries.map(({ id }) => id).filter((id, index, ids) => ids.indexOf(id) !== index);
  const unmapped = entries.filter(({ inCheckpoint, inPrompt }) => !inCheckpoint || !inPrompt).map(({ id }) => id);
  return { entries, unmapped, duplicateIds, complete: unmapped.length === 0 && duplicateIds.length === 0 };
}
