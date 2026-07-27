# CES Dynamic Atlas and Policy Evolution Ticket Plan

**Status:** Documentation corrected; DAPE-001 may begin after DAPE-000 oracle acceptance

This plan implements
[CES Dynamic Atlas and Policy Evolution Update](../../../CES_DYNAMIC_ATLAS_AND_POLICY_EVOLUTION_UPDATE.md)
under the controlling corrections in
[CES DAPE Ticket Review Feedback](../../../CES_DAPE_TICKET_REVIEW_FEEDBACK.md).

## Delivery order

| Order | Stage | Ticket | Outcome | Depends on |
|---:|---|---|---|---|
| 0 | Preparation | [DAPE-000](CES-GF-DAPE-000-safara-semantic-oracle.md) | Reviewed Safara semantic inventory and failing oracle | ATLAS-005 |
| 1 | P0 | [DAPE-001](CES-GF-DAPE-001-source-units-and-document-structure.md) | Deterministic source revisions, units, and mechanical structure | DAPE-000, ATLAS-005 |
| 2 | P0 | [DAPE-002](CES-GF-DAPE-002-project-domain-concepts.md) | Pinned project-scoped domain lexicon | DAPE-001 |
| 3 | P0 | [DAPE-003](CES-GF-DAPE-003-semantic-record-contracts.md) | Domain-open semantic union and relationships | DAPE-002 |
| 4 | P0 | [DAPE-004](CES-GF-DAPE-004-bounded-atlas-agent-roles.md) | Bounded roles over deterministic structure | DAPE-003, AGB-004 |
| 5 | P0 | [DAPE-005](CES-GF-DAPE-005-coverage-gate-and-targeted-retry.md) | Recall-and-precision gate, critic, targeted retry | DAPE-004 |
| 6 | P0 | [DAPE-006](CES-GF-DAPE-006-coverage-aware-human-review.md) | Human correction of candidates and omissions | DAPE-005 |
| 7 | P0 | [DAPE-007](CES-GF-DAPE-007-approved-project-model-and-projections.md) | Immutable ApprovedProjectModel and projections | DAPE-006 |
| 8 | P0 gate | [DAPE-008](CES-GF-DAPE-008-safara-golden-regression-and-cli.md) | End-to-end Safara oracle and staged CLI | DAPE-007 |
| 9 | P1 | [DAPE-009](CES-GF-DAPE-009-shared-identity-and-traceability.md) | One identity/revision chain across CES | DAPE-008 |
| 10 | P1 | [DAPE-010](CES-GF-DAPE-010-semantic-mapping-and-disposition.md) | Multi-channel mappings, gaps, terminal status | DAPE-009 |
| 11 | P2 | [DAPE-012](CES-GF-DAPE-012-registry-composition-and-policy-packs.md) | Policy-pack composition and locks | DAPE-010 |
| 12 | P2 | [DAPE-013](CES-GF-DAPE-013-extensible-registry-identities.md) | Extensible IDs, triggers, evidence, compatibility | DAPE-012 |
| 13 | P1 core | [DAPE-011](CES-GF-DAPE-011-project-policy-compilation.md) | Project-level compiler against pinned packs | DAPE-013 |
| 14 | Early adoption | [DAPE-016A](CES-GF-DAPE-016A-early-shared-model-adoption.md) | Architect, core, Assurance, Forge, Verification adoption | DAPE-011 |
| 15 | P3 | [DAPE-014](CES-GF-DAPE-014-policy-gap-analysis-and-standards-research.md) | Controlled research and smallest-change proposals | DAPE-013 |
| 16 | P3 | [DAPE-015](CES-GF-DAPE-015-registry-governance-versioning-and-impact.md) | Governance, immutable publication, diff, impact | DAPE-014 |
| 17 | Evolution operations | [DAPE-016B](CES-GF-DAPE-016B-policy-evolution-operations.md) | Upgrade and migration operational views | DAPE-015, DAPE-016A |

## Program gates

- Architect implementation depends on DAPE-008, not the legacy Atlas pipeline.
- Agents never own source identity, source text, approval, or registry publication.
- Every extraction run pins source, lexicon, semantic-schema, and prompt revisions.
- P0 publication requires complete normative coverage, zero unsupported
  candidates, resolved blocking issues, human approval, and atomic output.
- Every approved semantic record receives multi-channel mappings or explicit gaps.
- Registry versions and project locks are immutable and never upgrade silently.
- Existing Phase 1, Phase 2, profile-picture, Agents Bridge, adapter, compiler,
  bootstrap, and verification regressions remain mandatory.

## Common failure statuses

Atlas distinguishes `success`, `incomplete_coverage`, `unsupported_candidate`,
`review_required`, `clarification_required`, `conflict`, `provider_error`,
`input_error`, and `execution_error`. Later stages add `mapping_gap`,
`policy_gap`, `capability_gap`, `adapter_gap`, `registry_lock_error`,
`registry_conflict`, and `upgrade_required`.

