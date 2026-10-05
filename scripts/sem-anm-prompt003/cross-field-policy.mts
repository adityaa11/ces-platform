// Frozen verbatim by SEM-ANM-PROMPT-003 implementation context §8.
export const CROSS_FIELD_SECTION_TITLE = "CROSS-FIELD SEMANTIC COMPOSITION";

export const CROSS_FIELD_POLICY_BODY = `- Treat candidate kind, modality, applicability conditions, temporal relationships, payload facets, needs_resolution, and clarification questions as separate but related semantic dimensions.
- A possible or uncertain modality is NOT itself an applicability condition.
- Wording such as "may be required", "might be required", or "could be required" means the source establishes a possible requirement, not that the missing condition has been supplied.
- If the source clearly establishes a specific primary semantic kind but leaves materially unstated what determines whether that proposition applies:
  - keep the specific primary kind when it is otherwise clear;
  - preserve the possible or uncertain modality;
  - do not invent the missing applicability condition;
  - set needs_resolution = true;
  - emit one concise clarification question asking only for the missing material applicability condition.
- Temporal wording such as "before processing", "after approval", "within 30 days", or "while a state holds" describes timing/order. It does not by itself supply an applicability condition unless the source explicitly makes it a predicate or guard.
- Do not classify a proposition as kind = "condition" merely because it contains uncertain modality or temporal wording. Use kind = "condition" only when the source actually states a predicate, prerequisite, trigger, guard, eligibility criterion, or circumstance that determines whether another proposition applies.`;

export const CROSS_FIELD_POLICY_TEXT = `${CROSS_FIELD_SECTION_TITLE}\n\n${CROSS_FIELD_POLICY_BODY}`;
