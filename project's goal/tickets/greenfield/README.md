# CES Greenfield Product Suite Ticket Plan

**Status:** In progress; Atlas delivery is governed by the clean v2 sequence

The general product direction is documented in
[CES Greenfield Product Suite Context](../../CES_GREENFIELD_FOUR_END_PRODUCTS_CONTEXT.md).
For Atlas, the two graph contexts and the ATLAS-V2 ticket plan exclusively
override that document's historical Atlas sections.
This plan converts that direction into evidence-gated work organized by shared
foundation, Atlas, Architect, Forge, Assurance, and integration.

Ticket IDs describe ownership, not scheduling. Product work may overlap only
when its declared dependencies and the Phase 0 gate permit it.

## CES review governance

| Order | Ticket | Outcome | Depends on |
|---:|---|---|---|
| 1 | [CES-GF-REV-001](review-governance/CES-GF-REV-001-dependency-aware-review-batching.md) | Dependency-aware review batching with per-ticket terminal outcomes | Existing bounded CES review protocol |

REV-001 is an accepted REVIEW_GATE. Dependency-aware batching is the active CES
implementation/review sequencing supplement.

## Phase 0 implementation gate

| Order | Ticket | Outcome | Depends on |
|---:|---|---|---|
| 1 | [CES-GF-FND-001](foundation/CES-GF-FND-001-baseline-validation.md) | Passing local and hosted baseline | Phase 1 and Phase 2 implementation |
| 2 | [CES-GF-FND-002](foundation/CES-GF-FND-002-greenfield-contract-foundation.md) | Backward-compatible collection, identity, and generalized vocabulary contracts | FND-001 |

No greenfield package or feature implementation may begin until
CES-GF-FND-001 is accepted. While the gate remains open, work is limited to:

- documentation and ticket refinement;
- investigation and design validation;
- Phase 1 and Phase 2 baseline corrections;
- local and hosted validation;
- contract inventory and compatibility analysis.

FND-002 and every product implementation ticket depend on this gate.
FND-001 was accepted on baseline commit `b4928cc`; implementation may now
proceed in declared dependency order.

## CES Atlas

The sole active Atlas delivery order is the
[Atlas V2 Recursive Knowledge Explorer plan](atlas-knowledge-explorer/README.md).
It replaces the deleted workflow-only extraction, hardening, and fixed-detail
UI ticket sequences. HARD-027 remains only as the recursive golden acceptance
oracle.

## Atlas production gate

Atlas production release is blocked until ATLAS-V2-009 proves the real
provider, CLI, artifact, API, review, and interactive UI path and confirms that
no legacy Atlas runtime remains active.

## CES Architect

| Order | Ticket | Outcome | Depends on |
|---:|---|---|---|
| 1 | [CES-GF-ARCH-001](architect/CES-GF-ARCH-001-catalog-and-rubric.md) | Versioned technology catalog and deterministic scoring rubric | ATLAS-V2-006, POL-015 |
| 2 | [CES-GF-ARCH-002](architect/CES-GF-ARCH-002-decision-and-context.md) | Approved ADR and exact technical-context emission | ARCH-001 |

## CES Central Agents Bridge

The centralized bridge is generic operational infrastructure for registered
agent execution, not a fifth greenfield end product and not an Atlas semantic
authority. See the
[agents bridge ticket plan](agents-bridge/README.md).

| Order | Ticket | Outcome | Depends on |
|---:|---|---|---|
| 1 | [CES-GF-AGB-001](agents-bridge/CES-GF-AGB-001-service-boundary-and-contracts.md) | Versioned agent, provider, registry, and execution contracts | FND-002 |
| 2 | [CES-GF-AGB-002](agents-bridge/CES-GF-AGB-002-secure-shared-runtime.md) | Secure generic Agents Bridge runtime | AGB-001 |
| 3 | [CES-GF-AGB-003](agents-bridge/CES-GF-AGB-003-gemini-provider-adapter.md) | Gemini structured-generation provider adapter | AGB-002 |
| 4 | [CES-GF-AGB-005](agents-bridge/CES-GF-AGB-005-production-operations.md) | Production-ready generic deployment | AGB-003 |

## CES Policies

The active CES Policies delivery order is the
[CES Policies plan](policies/README.md). It is governed by the frozen CES
Policies v1 context and builds versioned source knowledge before defining the
canonical policy baseline or connecting policy reasoning to Atlas.

CES Policies consumes approved, revision-pinned Atlas facts. It does not
reinterpret source PRDs, choose architecture or stack, or place policy
semantics inside the Agents Bridge.

## CES Forge

| Order | Ticket | Outcome | Depends on |
|---:|---|---|---|
| 1 | [CES-GF-FORGE-001](forge/CES-GF-FORGE-001-task-contract.md) | Agent-neutral implementation task contract and renderer equivalence | ARCH-002 |
| 2 | [CES-GF-FORGE-002](forge/CES-GF-FORGE-002-laravel-scaffold.md) | Safe Laravel baseline scaffold with ownership rules | FORGE-001 |

## CES Assurance

| Order | Ticket | Outcome | Depends on |
|---:|---|---|---|
| 1 | [CES-GF-ASR-001](assurance/CES-GF-ASR-001-traceability-and-evidence.md) | Traceability and evidence-state contracts | ATLAS-V2-006 |
| 2 | [CES-GF-ASR-002](assurance/CES-GF-ASR-002-assurance-views.md) | Developer and delivery views connected to verification | ASR-001, FORGE-001 |
| 3 | [CES-GF-ASR-003](assurance/CES-GF-ASR-003-standards-pack.md) | First independent versioned standards pack | ASR-002 |

ASR-001 and ASR-002 are required for the first integrated demonstration.
ASR-003 is an independent enrichment and does not block that demonstration.

## Integrated demonstration

| Order | Ticket | Outcome | Depends on |
|---:|---|---|---|
| 1 | [CES-GF-INT-001](integration/CES-GF-INT-001-project-management-demonstration.md) | One verified PRD-to-evidence greenfield lifecycle | ARCH-002, FORGE-002, ASR-002 |

## Completion rules

- Every candidate generated by an agent retains source and execution provenance.
- Only approved normalized requirements enter the deterministic core.
- Technical context cannot affect policy applicability.
- Unsupported adapters remain visible gaps.
- Renderers cannot change task obligations.
- Evidence is observed or supplied; Assurance never fabricates it.
- Existing Phase 1 and Phase 2 fixtures remain backward compatible.
