# CES Dynamic Atlas and Policy Evolution Ticket Plan

**Status:** Planned

This plan implements the architecture in
[CES Dynamic Atlas and Policy Evolution Update](../../../CES_DYNAMIC_ATLAS_AND_POLICY_EVOLUTION_UPDATE.md).

The delivery order is intentionally gated. Atlas must first publish complete,
domain-open, approved business truth. Shared-model integration follows, then
extensible registries, governed policy evolution, and downstream product views.

## Delivery order

| Order | Priority | Ticket | Outcome | Depends on |
|---:|---|---|---|---|
| 1 | P0 | [DAPE-001](CES-GF-DAPE-001-source-units-and-document-structure.md) | Immutable deterministic source units and document structure | AGB-005 |
| 2 | P0 | [DAPE-002](CES-GF-DAPE-002-project-domain-concepts.md) | Project-scoped domain dictionary | DAPE-001 |
| 3 | P0 | [DAPE-003](CES-GF-DAPE-003-semantic-record-contracts.md) | Domain-open semantic record union | DAPE-002 |
| 4 | P0 | [DAPE-004](CES-GF-DAPE-004-bounded-atlas-agent-roles.md) | Structure, discovery, and section extraction agents | DAPE-003 |
| 5 | P0 | [DAPE-005](CES-GF-DAPE-005-coverage-gate-and-targeted-retry.md) | Deterministic coverage gate, critic, and retries | DAPE-004 |
| 6 | P0 | [DAPE-006](CES-GF-DAPE-006-coverage-aware-human-review.md) | Review of candidates, terminology, and uncovered units | DAPE-005 |
| 7 | P0 | [DAPE-007](CES-GF-DAPE-007-approved-project-model-and-projections.md) | Immutable ApprovedProjectModel and legacy projections | DAPE-006 |
| 8 | P0 | [DAPE-008](CES-GF-DAPE-008-safara-golden-regression-and-cli.md) | Realistic completeness regression and staged CLI | DAPE-007 |
| 9 | P1 | [DAPE-009](CES-GF-DAPE-009-shared-identity-and-traceability.md) | One revision and identity chain across CES | DAPE-008 |
| 10 | P1 | [DAPE-010](CES-GF-DAPE-010-semantic-mapping-and-disposition.md) | Reviewed mappings, downstream dispositions, and gaps | DAPE-009 |
| 11 | P1 | [DAPE-011](CES-GF-DAPE-011-project-policy-compilation.md) | Project-level deterministic policy compilation | DAPE-010 |
| 12 | P2 | [DAPE-012](CES-GF-DAPE-012-registry-composition-and-policy-packs.md) | Pinned registry composition and initial policy packs | DAPE-011 |
| 13 | P2 | [DAPE-013](CES-GF-DAPE-013-extensible-registry-identities.md) | Registry-validated capability, trait, policy, trigger, and evidence IDs | DAPE-012 |
| 14 | P3 | [DAPE-014](CES-GF-DAPE-014-policy-gap-analysis-and-standards-research.md) | Existing-policy inspection and governed research proposals | DAPE-013 |
| 15 | P3 | [DAPE-015](CES-GF-DAPE-015-registry-governance-versioning-and-impact.md) | Approval, immutable publication, semantic diff, and impact | DAPE-014 |
| 16 | P4 | [DAPE-016](CES-GF-DAPE-016-downstream-product-adaptation.md) | Architect, Assurance, Forge, Verification, and graph views | DAPE-015 |

## Program gates

- P1 cannot start until the Safara golden regression proves P0 coverage.
- P2 cannot replace closed IDs until registry composition is pinned and
  backward-compatible projections pass.
- P3 agents may propose changes but cannot publish or approve registry content.
- P4 products consume the same ApprovedProjectModel revision and may not
  independently reinterpret source documents.
- Existing profile-picture, Phase 1, Phase 2, Agents Bridge, deterministic
  compilation, adapter, and verification regressions remain mandatory.

