# SEM-ANM-PROMPT-001 prompt provenance

The fixed scaffold owns extraction behavior only: role, task cardinality, reference handling, multiple-unit handling, conflict handling, general fidelity rules, source accounting, and the JSON-only transport rule.

The Zod contract owns provider-visible shape, every semantic field and enum meaning, nullable representation, resolution semantics, clarification semantics, and the SemanticUnit cross-field rule. The renderer consumes only `z.toJSONSchema(...)` output; it does not inspect Zod internals.

`prompt-provenance.mts` is the deterministic, machine-audited mapping for every material checkpoint instruction. The generated coverage artifact records each instruction's sole intended authority and whether the generated prompt contains it.
