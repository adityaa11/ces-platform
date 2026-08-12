# CES Central Agents Bridge Ticket Plan

**Status:** Generic infrastructure implemented; Policy knowledge-evolution tickets proposed

The bridge provides provider-neutral execution for registered agents. The
[generic architecture](../../../CES_AGENTS_BRIDGE_ARCHITECTURE.md) is its
authority. ATLAS-V2-002 owns the Atlas agent contract and uses only the generic
registered-agent endpoint.

| Order | Ticket | Outcome |
|---:|---|---|
| 1 | [AGB-001](CES-GF-AGB-001-service-boundary-and-contracts.md) | Generic contracts and trust boundary |
| 2 | [AGB-002](CES-GF-AGB-002-secure-shared-runtime.md) | Secure generic runtime |
| 3 | [AGB-003](CES-GF-AGB-003-gemini-provider-adapter.md) | Provider adapter |
| 4 | [AGB-005](CES-GF-AGB-005-production-operations.md) | Generic production operations |

## Proposed Policy knowledge-evolution extension

These tickets extend the existing bridge without moving Policy semantics or
governance into its generic core. They require independent review before
implementation. Final POL-008 approval remains deferred and POL-009 remains
blocked throughout this sequence.

| Order | Ticket | Outcome | Depends on | Review |
|---:|---|---|---|---|
| 1 | [AGB-006](CES-GF-AGB-006-policy-knowledge-proposal-contracts.md) | Proposal and execution-evidence contracts | POL-008-V01; AGB-001..003 | REVIEW_GATE |
| 2 | [AGB-008](CES-GF-AGB-008-policy-proposal-deterministic-validation.md) | Deterministic proposal validation | AGB-006 | REVIEW_GATE |
| 3 | [AGB-007](CES-GF-AGB-007-policy-taxonomy-agent-golden-replay.md) | POL-008-R02 taxonomy-agent replay | AGB-006, AGB-008 | REVIEW_GATE |
| 4 | [AGB-009](CES-GF-AGB-009-knowledge-evolution-workflow-state.md) | Durable orchestration state | AGB-006, AGB-008 | REVIEW_GATE |
| 5 | [AGB-010](CES-GF-AGB-010-review-suspension-and-authority-resume.md) | REVIEW_GATE suspend/resume | AGB-009 | REVIEW_GATE |
| 6 | [AGB-011](CES-GF-AGB-011-non-convergence-controls.md) | Duplicate/no-progress/attempt controls | AGB-009, AGB-010 | REVIEW_GATE |
| 7 | [AGB-012](CES-GF-AGB-012-source-knowledge-extraction-agent.md) | Governed raw extraction proposals | AGB-006, AGB-011 | REVIEW_GATE |
| 8 | [AGB-013](CES-GF-AGB-013-canonicalization-agent.md) | Canonicalization proposals | AGB-006, AGB-011, AGB-012 | REVIEW_GATE |
| 9 | [AGB-014](CES-GF-AGB-014-coverage-gap-routing-and-safara-replay.md) | End-to-end Safara golden replay | AGB-007..013 as declared | REVIEW_GATE |
| 10 | [AGB-015](CES-GF-AGB-015-knowledge-agent-provider-conformance.md) | Cross-provider conformance | AGB-014; approved provider | BATCHABLE |

Recommended review transport:

- Group 1: AGB-006, then AGB-008, then AGB-007, with independent terminal
  outcomes and topological review.
- Batch 2: AGB-009, then AGB-010, then AGB-011.
- Batch 3: AGB-012, then AGB-013.
- Gate: AGB-014 independently.
- Deferred batchable follow-up: AGB-015.

No Bridge ticket may define Atlas semantic facts, graph selection, hierarchy,
artifacts, approval, or a legacy Atlas compatibility route.

Policy knowledge proposal schemas, validators, workflow state, review handoff,
and publications remain owned by CES Policies. Agents Bridge owns bounded,
registered, provider-controlled execution only.
