# CES Atlas V2 Recursive Knowledge Explorer

**Status:** Active implementation authority

This is the only active ticket sequence for the Atlas recursive Knowledge
Explorer. Older Atlas, hardening, workflow-UI, and release tickets remain as
implementation history or reusable-foundation evidence; they do not authorize
legacy workflow-only artifacts, fixed detail tabs, or compatibility fallbacks.

## Product authority

- [`graphs context.md`](../../../graphs%20context.md)
- [`supporting graphs context.md`](../../../supporting%20graphs%20context.md)
- [HARD-027 golden qualification](../atlas-hardening/CES-GF-ATLAS-HARD-027-golden-model-profile-safara-workflow-qualification.md)
- [`golden-main-workflow.json`](../../../../../tests/fixtures/safara/golden-main-workflow.json)

If these sources conflict, the two context documents define product behavior;
the golden fixture provides concrete qualification evidence.

## Delivery sequence

| Order | Ticket | Outcome |
|---:|---|---|
| 1 | [ATLAS-V2-001](CES-GF-ATLAS-V2-001-recursive-knowledge-contract.md) | One renderer-neutral recursive contract |
| 2 | [ATLAS-V2-002](CES-GF-ATLAS-V2-002-semantic-fact-extraction.md) | Evidence-grounded semantic facts from any PRD |
| 3 | [ATLAS-V2-003](CES-GF-ATLAS-V2-003-graph-selection.md) | General graph-type selection |
| 4 | [ATLAS-V2-004](CES-GF-ATLAS-V2-004-knowledge-assembly.md) | Main Workflow and recursive supporting graphs |
| 5 | [ATLAS-V2-005](CES-GF-ATLAS-V2-005-artifact-cli-replacement.md) | Deterministic v2 artifacts and CLI runtime |
| 6 | [ATLAS-V2-006](CES-GF-ATLAS-V2-006-review-governance.md) | Review and approval on v2 identities |
| 7 | [ATLAS-V2-007](CES-GF-ATLAS-V2-007-knowledge-api.md) | Revision-pinned recursive API |
| 8 | [ATLAS-V2-008](CES-GF-ATLAS-V2-008-interactive-workspace.md) | Recursive interactive Next.js workspace |
| 9 | [ATLAS-V2-009](CES-GF-ATLAS-V2-009-legacy-removal-qualification.md) | Legacy removal and production qualification |

Tickets execute in order. A later ticket may add tests early, but it may not
introduce a temporary legacy contract or parallel production path.

## Clean-state rules

- One canonical semantic model and one recursive navigation model.
- Extraction and graph selection are domain-neutral; Safara is qualification,
  never production logic.
- Original document wording and evidence remain exact.
- Equivalent concepts are not duplicated by language.
- Graph semantics, hierarchy, and membership are backend-owned.
- The renderer is replaceable and never owns semantic truth.
- Reuse is allowed only for naturally graph-neutral infrastructure.
- No adapter may preserve workflow-only or fixed-tab behavior in v2.
- V1 removal is required for completion, not optional cleanup.

