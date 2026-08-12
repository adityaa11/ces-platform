# CES Policies v1 Ticket Plan

**Status:** Proposed

This is the active greenfield delivery sequence for CES Policies v1.1. It is
governed by [`CES_POLICIES_FROZEN_CONTEXT_V1_1_ASCII.md`](../../../CES_POLICIES_FROZEN_CONTEXT_V1_1_ASCII.md).
The predecessor [`CES_POLICIES_FROZEN_CONTEXT_V1_ASCII.md`](../../../CES_POLICIES_FROZEN_CONTEXT_V1_ASCII.md)
remains immutable historical evidence. If a ticket conflicts with the active
context, the frozen context wins and the ticket must be corrected through an
explicit change proposal.

## Delivery sequence

| Order | Ticket | Outcome | Depends on |
|---:|---|---|---|
| G01 | [POL-000](CES-GF-POL-000-source-glossary-governance.md) | Permanent source glossary governance contract | POL-001 |
| G02 | [POL-000-R01](CES-GF-POL-000-R01-source-strategy-revision-001.md) | Governed machine-source strategy revision | POL-000 |
| G03 | [POL-000-R01-F01](CES-GF-POL-000-R01-F01-publish-frozen-context-v1-1.md) | Successor frozen source context v1.1 | POL-000-R01 |
| R02 | [POL-002-R01](CES-GF-POL-002-R01-source-governance-reconciliation.md) | Versioned source-governance model reconciliation | POL-000-R01-F01, POL-002 |
| R03 | [POL-003-R01](CES-GF-POL-003-R01-governed-source-set-reconciliation.md) | Six-record governed source-set successor | POL-002-R01, POL-003 |
| R04 | [POL-004-R01](CES-GF-POL-004-R01-class-aware-update-reconciliation.md) | Class-aware, authority-neutral source update detection | POL-002-R01, POL-003-R01, POL-004 |
| R05 | [POL-005-V01](CES-GF-POL-005-V01-governed-compatibility-validation.md) | Governed raw-vocabulary compatibility validation | POL-002-R01, POL-003-R01, POL-005 |
| R06 | [POL-006-R01](CES-GF-POL-006-R01-extraction-contract-synchronization.md) | Governed extraction-contract synchronization only | POL-003-R01, POL-004-R01, POL-005-V01, POL-006 |
| P01 | [POL-001](CES-GF-POL-001-freeze-policy-charter.md) | Frozen CES Policies charter | None |
| P02 | [POL-002](CES-GF-POL-002-source-glossary-model.md) | Versioned source glossary contract | POL-001, FND-002 |
| P03 | [POL-003](CES-GF-POL-003-seed-core-source-releases.md) | Four governed core source releases | POL-002 |
| P04 | [POL-004](CES-GF-POL-004-source-update-detection.md) | Non-mutating update candidates | POL-003 |
| P05 | [POL-005](CES-GF-POL-005-raw-source-vocabulary-model.md) | Source-faithful vocabulary contract | POL-002 |
| P06 | [POL-006](CES-GF-POL-006-raw-vocabulary-extraction.md) | Traceable representative raw vocabulary corpus | Accepted POL-003-R01, POL-004-R01, POL-005-V01, and POL-006-R01 |
| P07 | [POL-007](CES-GF-POL-007-canonical-vocabulary.md) | Versioned CES canonical concepts | POL-006 |
| P08 | [POL-008](CES-GF-POL-008-canonical-policy-taxonomy.md) | Small enduring policy taxonomy | POL-007 |
| P09 | [POL-009](CES-GF-POL-009-policy-contract.md) | Canonical policy, concern, and capability contract | POL-008 |
| P10 | [POL-010](CES-GF-POL-010-atlas-fact-input-contract.md) | Revision-pinned Atlas input boundary | POL-009, ATLAS-V2-007 |
| P11 | [POL-011](CES-GF-POL-011-context-binding-contract.md) | Fact-grounded policy bindings | POL-009, POL-010 |
| P12 | [POL-012](CES-GF-POL-012-deterministic-validator.md) | Fail-closed candidate validation | POL-011 |
| P13 | [POL-013](CES-GF-POL-013-policy-reasoning-agent.md) | Bounded policy reasoning contract | POL-012 |
| P14 | [POL-014](CES-GF-POL-014-agents-bridge-integration.md) | Generic bridge execution integration | POL-013, AGB-002 |
| P15 | [POL-015](CES-GF-POL-015-developer-baseline-output.md) | Developer-facing baseline awareness | POL-014 |
| P16 | [POL-016](CES-GF-POL-016-cross-domain-validation.md) | Domain-neutral qualification evidence | POL-015 |
| P16A | [POL-016-V01](CES-GF-POL-016-V01-safara-complete-prd-coverage.md) | Complete Safara PRD baseline-awareness accountability | Accepted POL-016 |
| P16A-I01 | [POL-016-V01-I01](CES-GF-POL-016-V01-I01-manual-safara-cycle-input.md) | Human-reconciled Safara input for the first Policy evolution cycle | Accepted POL-008 direction |
| P17 | [POL-017](CES-GF-POL-017-policy-baseline-v1-freeze.md) | Immutable CES Policy Baseline v1.1 | Accepted POL-016-V01 |

Tickets execute in dependency order. P04 may proceed beside P05 after P03;
otherwise a later ticket must not pull its model or behavior into an earlier
ticket.

POL-000 is a permanent governance layer established after the v1 source-rights
blocker was discovered; its `G01` label does not rewrite the historical P01-P05
execution order. Concrete source-set changes use `POL-000-Rxx` revision tickets.
The POL-006 source-governance gate closed in acceptance-bookkeeping commit
`f8e2e41`; POL-006's own REVIEW_GATE later received an `ACCEPTED` terminal
outcome after implementation and bounded remediation through `b3bebc0`.

## Review classification ledger

The explicit ticket headers are authoritative. The current grouping is:

- `REVIEW_GATE`: POL-000, POL-000-R01, POL-000-R01-F01, POL-001, POL-002,
  POL-002-R01, POL-005, POL-006, POL-007, POL-008, POL-009, POL-010, POL-011,
  POL-013, POL-016, POL-016-V01, POL-016-V01-I01, and POL-017.
- `BATCHABLE`: POL-003, POL-003-R01, POL-004, POL-004-R01, POL-005-V01,
  POL-006-R01, POL-012, POL-014, and POL-015.

`CES-GF-POL-006-H01` is human approval evidence rather than a ticket, so it has
no review class. A `BATCHABLE` ticket must still stop or split at any newly
discovered authority decision under the accepted promotion rule.

## Review closure contract

- Every review finding must have a stable ID, class, cited ticket criterion,
  and concrete evidence.
- Round 1 is the sole discovery review. It may report BLOCKER, REQUIRED, and
  DEFERRED findings.
- Round 2 closes existing blocking findings and checks regressions caused by
  their fixes. New blockers are limited to the exceptions in the frozen
  context.
- DEFERRED findings are recorded in a follow-up ledger or ticket and do not
  block completion. OPTIONAL findings are normally suppressed.
- Every review ends in `ACCEPTED`, `NOT ACCEPTED`, or
  `ACCEPTED WITH DEFERRED ITEMS`.
- Closed work is changed only by a new ticket or an explicit frozen-context
  change proposal.

## Product boundaries

- Atlas owns business and system facts; Policies owns engineering awareness.
- Policies references durable Atlas identities and never substitutes a fresh
  interpretation of the buyer PRD.
- Architect project analysis and final decisions consume the governed POL-015
  baseline; approved Atlas facts alone are not sufficient architecture input.
- The Agents Bridge owns execution infrastructure only.
- Architecture, stack, implementation guidance, and full ISMS management are
  outside CES Policies v1.
