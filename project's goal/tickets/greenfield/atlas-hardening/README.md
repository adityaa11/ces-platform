# CES Atlas Hardening Ticket Plan

**Status:** Planned
**Authority:** [`CES_ATLAS_HARDENING_PLAN.md`](../../../CES_ATLAS_HARDENING_PLAN.md)
**Refinement:** [`CES_ATLAS_CANONICAL_MODEL_WORKFLOW_PROJECTION_FEEDBACK.md`](../../../CES_ATLAS_CANONICAL_MODEL_WORKFLOW_PROJECTION_FEEDBACK.md)
**Foundation:** DAPE-000 through DAPE-008R are completed prerequisites.

This program closes the gap between the completed DAPE extraction foundation
and a production-safe, pre-approval Atlas review and publication lifecycle. It
must extend the canonical DAPE contracts and packages rather than create a
parallel semantic model, source identity system, or approval path.

## Delivery order

| Order | Ticket | Outcome | Depends on |
|---:|---|---|---|
| 1 | [ATLAS-HARD-001](CES-GF-ATLAS-HARD-001-canonical-source-units.md) | Qualify canonical source units for hardening | DAPE-001 |
| 2 | [ATLAS-HARD-002](CES-GF-ATLAS-HARD-002-requirement-taxonomy.md) | Qualify the complete requirement taxonomy | 001, DAPE-002/003 |
| 3 | [ATLAS-HARD-003](CES-GF-ATLAS-HARD-003-broad-candidate-extraction.md) | High-recall discovery before classification | 001–002, DAPE-004 |
| 4 | [ATLAS-HARD-004](CES-GF-ATLAS-HARD-004-category-specific-extractors.md) | Bounded category extraction contracts | 003, DAPE-004 |
| 5 | [ATLAS-HARD-005](CES-GF-ATLAS-HARD-005-source-coverage-map.md) | End-to-end source-unit coverage | 003–004, DAPE-005 |
| 6 | [ATLAS-HARD-006](CES-GF-ATLAS-HARD-006-completeness-critic.md) | Evidence-based completeness findings | 005, DAPE-005 |
| 7 | [ATLAS-HARD-007](CES-GF-ATLAS-HARD-007-targeted-retry.md) | Finding-scoped bounded retry | 006, DAPE-005 |
| 8 | [ATLAS-HARD-008](CES-GF-ATLAS-HARD-008-safara-oracle.md) | Hardening qualification oracle | 001–007, DAPE-000/008R |
| 9 | [ATLAS-HARD-009](CES-GF-ATLAS-HARD-009-proposed-project-model.md) | Immutable non-authoritative proposal | 005–008 |
| 10 | [ATLAS-HARD-010](CES-GF-ATLAS-HARD-010-proposed-graph-projection.md) | Workflow graph before approval | 009, DAPE-007 |
| 11 | [ATLAS-HARD-011](CES-GF-ATLAS-HARD-011-bulk-approval-eligibility.md) | Backend-owned approval eligibility | 009–010 |
| 12 | [ATLAS-HARD-012](CES-GF-ATLAS-HARD-012-approval-decisions.md) | Immutable human decision ledger | 009–011, DAPE-006 |
| 13 | [ATLAS-HARD-013](CES-GF-ATLAS-HARD-013-approved-model-materialization.md) | Authoritative model publication | 012, DAPE-007 |
| 14 | [ATLAS-HARD-014](CES-GF-ATLAS-HARD-014-deterministic-artifacts.md) | Deterministic artifact suite | 009–013, DAPE-008 |
| 15 | [ATLAS-HARD-015](CES-GF-ATLAS-HARD-015-safara-qualification-gate.md) | Production integration gate | 001–014 |
| 16 | [ATLAS-HARD-016](CES-GF-ATLAS-HARD-016-live-semantic-section-classifier.md) | Live semantic section classification | 001–004 |
| 17 | [ATLAS-HARD-017](CES-GF-ATLAS-HARD-017-canonical-provider-candidates.md) | Generic candidates and registry routing | 003–007, 016 |
| 18 | [ATLAS-HARD-018](CES-GF-ATLAS-HARD-018-atomic-claims-coverage.md) | Atomic claims and claim-level completeness | 001, 005–007, 017 |
| 19 | [ATLAS-HARD-019](CES-GF-ATLAS-HARD-019-stable-canonical-record-identity.md) | Stable language-independent record identity | 009, 017–018 |
| 20 | [ATLAS-HARD-020](CES-GF-ATLAS-HARD-020-multilingual-canonical-representation.md) | Reviewable multilingual equivalence | 018–019 |
| 21 | [ATLAS-HARD-021](CES-GF-ATLAS-HARD-021-first-class-workflows-operations.md) | First-class workflows and operations | 009, 017–020 |
| 22 | [ATLAS-HARD-022](CES-GF-ATLAS-HARD-022-reviewable-workflow-assignments.md) | Multi-workflow and cross-cutting assignments | 019–021 |
| 23 | [ATLAS-HARD-023](CES-GF-ATLAS-HARD-023-reviewable-relationship-candidates.md) | Evidence-backed relationship candidates | 019, 021–022 |
| 24 | [ATLAS-HARD-024](CES-GF-ATLAS-HARD-024-multi-target-relationships.md) | Zero-, one-, and multi-target relationships | 022–023 |
| 25 | [ATLAS-HARD-025](CES-GF-ATLAS-HARD-025-focused-ui-projections.md) | Focused backend-owned UI projections | 010, 018–024 |
| 26 | [ATLAS-HARD-026](CES-GF-ATLAS-HARD-026-expanded-approval-and-eligibility.md) | Approval and eligibility across governed entities | 011–013, 022–025 |

ATLAS-HARD-015 is reopened and must be rerun only after ATLAS-HARD-018 through
ATLAS-HARD-026. Earlier library-level completion or cleaner graph output is not
production integration evidence.

## Program rules

- DAPE source-unit IDs, semantic IDs, revision tuples, and canonical schemas
  remain authoritative.
- Atlas remains domain-agnostic: Safara terminology, headings, entities,
  workflow nodes, and oracle output must never become production extraction
  logic.
- Dynamic meaning is represented through stable contracts: built-in semantic
  kinds, registered organization-specific kinds, and a source-grounded
  `unknown` fallback.
- Generic candidate discovery precedes classification; provider contracts must
  not limit discovery to requirement and business-rule arrays.
- Workflow relationships support arbitrary directed graphs, including branches,
  joins, loops, parallel paths, optional steps, actor lanes, and unknown nodes.
- A proposal is immutable, non-authoritative, and never enables downstream
  execution.
- Agents may propose, classify, criticize, and retry; they may not approve,
  suppress findings, publish registries, or manufacture source evidence.
- Approval is represented by immutable human decisions and materialization,
  never by mutation of the proposal.
- The production approval UI remains blocked until ATLAS-HARD-015 passes.
- Safara acceptance qualifies one reviewed fixture and the lifecycle gate; a
  separate multi-domain suite is required before claiming general domain
  coverage.
- Every ticket must preserve existing DAPE, Atlas, CLI, and greenfield
  regressions.
- Runtime integration must prove which implementation executes. Existing
  legacy consumers remain supported through explicit, tested adapters, but
  legacy contract limits must not narrow the canonical semantic model.

## Final artifact boundary

Before approval, the UI consumes the proposed project model, focused proposed
projections, source documents, atomic-claim coverage, relationship candidates,
assignments, and findings. After approval, downstream CES modules consume only
the authoritative approved project model and its approved projections.
