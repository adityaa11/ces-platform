# CES-GF-ATLAS-V2-010E - Coverage and Publication Gates

**Status:** Planned
**Depends on:** ATLAS-V2-010D

## Outcome

Make it impossible for sparse, misleading, or structurally unsupported output
to be published as a usable Atlas proposal.

## Scope

- Calculate structural coverage over pages, reconstructed sections, extraction
  scopes, facts, modules, relationships, and evidence.
- Require every major section to have a disposition.
- Detect vague module labels, introduction-only models, missing endpoints,
  unsupported root graph kinds, isolated modules, and zero-relationship maps.
- Separate `complete`, `awaiting_human_review`, `incomplete`, and `failed` run
  states.
- On incomplete extraction, write diagnostics and resumable intermediate data
  but do not publish `atlas-knowledge.json` as a usable proposal.
- Return a documented distinct CLI exit code for incomplete extraction.
- Prevent the UI from presenting incomplete diagnostics as an authoritative
  Main Workflow.

## Acceptance

- The previously generated one-introduction-module result is rejected.
- No run with zero graph assessments can claim a usable Main Workflow.
- Thresholds are structural and domain-neutral, not fixed Safara counts.
- Diagnostics state exactly which sections, facts, endpoints, or graph
  prerequisites remain unresolved.
- Complete repeated runs remain byte-deterministic.

