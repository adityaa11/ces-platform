# CES Policies v1 Ticket Plan

**Status:** Proposed

This is the active greenfield delivery sequence for CES Policies v1. It is
governed by [`CES_POLICIES_FROZEN_CONTEXT_V1_ASCII(1).md`](../../../CES_POLICIES_FROZEN_CONTEXT_V1_ASCII(1).md).
If a ticket conflicts with that context, the frozen context wins and the
ticket must be corrected through an explicit change proposal.

## Delivery sequence

| Order | Ticket | Outcome | Depends on |
|---:|---|---|---|
| P01 | [POL-001](CES-GF-POL-001-freeze-policy-charter.md) | Frozen CES Policies charter | None |
| P02 | [POL-002](CES-GF-POL-002-source-glossary-model.md) | Versioned source glossary contract | POL-001, FND-002 |
| P03 | [POL-003](CES-GF-POL-003-seed-core-source-releases.md) | Four governed core source releases | POL-002 |
| P04 | [POL-004](CES-GF-POL-004-source-update-detection.md) | Non-mutating update candidates | POL-003 |
| P05 | [POL-005](CES-GF-POL-005-raw-source-vocabulary-model.md) | Source-faithful vocabulary contract | POL-002 |
| P06 | [POL-006](CES-GF-POL-006-raw-vocabulary-extraction.md) | Traceable raw vocabulary corpus | POL-003, POL-005 |
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
| P17 | [POL-017](CES-GF-POL-017-policy-baseline-v1-freeze.md) | Immutable CES Policy Baseline v1 | POL-016 |

Tickets execute in dependency order. P04 may proceed beside P05 after P03;
otherwise a later ticket must not pull its model or behavior into an earlier
ticket.

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
- The Agents Bridge owns execution infrastructure only.
- Architecture, stack, implementation guidance, and full ISMS management are
  outside CES Policies v1.
