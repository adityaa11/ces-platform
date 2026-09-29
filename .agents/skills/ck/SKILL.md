---
name: ck
description: Atlas committed-checkpoint review workflow. Use only when the user invokes `ck` as the Atlas ticket review command or explicitly requests CK review of a bounded Atlas checkpoint.
---

# Atlas CK Workflow

CK reviews one committed checkpoint against the frozen current ticket and produces one consolidated review. The ticket is the review contract. A CK artifact records whether existing ticket authority was met; it cannot create requirements.

## Shared interpretation rule

GO, CK, CFC, and HMN MUST derive active-ticket scope, acceptance obligations,
validation obligations, evidence sufficiency, and finding closure from the
[shared Atlas Review Contract](../_shared/atlas-ticket-review-contract.md).
CK MUST NOT substitute its own broader or narrower interpretation.

## First review

Confirm the ticket is `awaiting_review`, the recorded commit matches the committed revision under review, and the worktree does not make the review target ambiguous. If these preconditions fail, stop and return control for clarification; do not invent a review result.

Review the current ticket's scope, acceptance criteria, explicit review requirements, explicit source references, and the approved dependency interfaces/boundaries it actually consumes. Check only regressions the ticket requires to remain green. Inspect enough implementation evidence to make a reasonable consolidated review; broad inspection does not broaden review authority.

Resolve the active-ticket tuple and derive the complete Review Contract before
reviewing. The first review MUST traverse every applicable row and consolidate
all currently identifiable ticket-bound deficiencies that a competent review of
the frozen contract and submitted evidence can surface. Do not stop at the first
serious finding. Required harnesses, named scenarios, and named observations
must be proven as specified; a generic or weaker test cannot replace them.

For every proposed required observation, identify the exact ticket row that
requires it. Separate acceptance conditions from probes used to collect
evidence: inspecting an additional surface may help prove a condition, but does
not itself become a condition unless the ticket requires that surface. Do not
add a uniform per-scenario checklist by reviewer preference. If ticket wording
cannot resolve a proposed condition, do not convert it into `CHANGES_REQUIRED`;
record a scope/authority observation and follow the existing human/planning
handoff if that ambiguity prevents a ticket-based decision.

A blocking finding must name the current-ticket requirement it violates and include the evidence, affected location, and observable correction needed. Use only these ordinary results:

- `PASS`: the committed work satisfies the current ticket and its explicit review obligations.
- `CHANGES_REQUIRED`: one or more implementation-repairable violations of the current ticket remain.

Each first-review finding MUST have a stable `CK-###` ID and a `## Frozen Finding Closure Matrix`. Every clause (`CK-###.a`) MUST state exact ticket authority,
unsatisfied evidence, and observable correction/proof. State a binary closure
oracle for each clause: the required observable state, exact evidence location
or validation that demonstrates it, and direct-regression boundary. Freeze all
clauses and oracles when the artifact is written; later verification MUST NOT
silently strengthen them.
CK findings define the complete admissible closure target. HMN may select or
narrow unresolved clauses, but its authorization cannot add pass conditions.

Record concerns requiring a ticket change, a new provider/runtime/deployment target, an architecture or product decision, unresolved policy, or reopening an approved predecessor as separate scope-change observations. They are not `CHANGES_REQUIRED` findings and are not CFC work. If the ticket cannot be reviewed without such a decision, stop and return control to human/planning authority.

Dependency approval permits use of only the interfaces, capabilities, invariants, and authority boundaries that the ticket explicitly consumes. It does not import deferred work. For example, PCC may be reviewed for correct use and preservation of BSS-007 `DocumentStore`; BSS-007's future S3/R2-compatible adapter is not PCC scope. Do not require R2, S3, Cloudflare storage, or a deployment change, and do not reopen BSS-007 for that future work. "Production" means the real Atlas application path when used that way in a ticket; it does not select cloud deployment infrastructure by itself.

Specialist skills may help reason about evidence. They are review authorities only when the frozen ticket explicitly incorporates a specific requirement or binding from them. A skill's `MUST` statement alone cannot expand ticket acceptance.

## Review after CFC

After the single bounded CFC remediation commit, verify only the original consolidated findings, the remediation diff, evidence needed to assess those findings, and direct regressions introduced in behavior necessary to evaluate those findings. Do not restart broad review or add unrelated findings discovered along the way.

Record whether the original findings are resolved and whether a direct remediation regression exists. If a finding remains unresolved or remediation introduced a direct regression, report `CHANGES_REQUIRED` with the evidence and stop for human/planning authority. Do not start another CFC pass. Otherwise record `PASS`. This verification does not authorize a new full review.

For every original clause, record `RESOLVED` or `UNRESOLVED` against its
frozen closure oracle. An `UNRESOLVED` result must name the exact expected
state, actual state, and evidence locator; a general statement that evidence
is incomplete is insufficient. Do not add a new oracle during verification.

Return `PASS` once all ticket-derived frozen clauses are proven and no direct
regression remains. Do not withhold it for extra HMN-authored probes or
observations that are not independently required by the frozen ticket.

If later verification finds a ticket-authorized, non-regression obligation that
was reasonably identifiable during first review but omitted from the frozen
matrix, record `REVIEW_CONTRACT_GAP`, not `CHANGES_REQUIRED` against CFC. State
the omitted authority, why it matters and was omitted, completion impact, and
handoff to human/planning authority. An expectation with no ticket authority is
an out-of-scope observation, not a CFC requirement.

### Supplemental-gap verification

After the shared contract's planning-authorized supplemental freeze and a
newer HMN-authorized CFC checkpoint, verify only the supplemental frozen
clauses named by the consumed HMN authorization, evidence required by their
oracles, the remediation diff, and direct regressions introduced by that
remediation. Confirm that the checkpoint records the consumed authorization
ID. Carry forward every historical original clause and outcome unchanged;
neither reopen resolved clauses nor restart broad review. Record each selected
supplemental clause as resolved or unresolved against its frozen oracle. Return
`PASS` only when every original and supplemental ticket-derived clause is
proven and no direct regression remains. Otherwise identify the exact failed
oracle or direct regression and return control to human/planning authority
under the existing bounded rules. This verification does not authorize another
CFC cycle.

## Review after an HMN-authorized CFC

A newer explicit HMN authorization issued after control returned to human/planning authority establishes one new bounded remediation checkpoint. When its committed CFC remediation records the consumed HMN authorization ID, read the active HMN artifact and verify only its named unresolved original finding(s), the remediation diff, the contract's required evidence, and direct regressions introduced by that remediation. Do not restart broad review or add unrelated findings discovered outside this scope.

Treat the HMN artifact as a scope selector and handoff record, not as an
acceptance source. Verify only ticket-authorized clauses in the original
frozen matrix. If HMN added a condition with no such authority, record it as a
scope/contract error; do not enforce it to deny `PASS`.
Use HMN only to confirm the user authorized another bounded cycle for the
listed unresolved clause IDs. Read each closure oracle and residual mismatch
from the original CK artifact; do not require HMN to retranscribe them and do
not review against a second HMN checklist.

The valid HMN decision satisfies the earlier handoff to human/planning authority; do not reject this verification merely because a previous post-CFC verification occurred. The result remains `PASS`, `CHANGES_REQUIRED`, or `REVIEW_CONTRACT_GAP`. If unresolved again, record the evidence and return control to human/planning authority. Do not authorize or invoke another CFC: a further remediation requires a fresh explicit user `hmn` invocation and new HMN authorization.

## Review record

Write one consolidated artifact for the reviewed checkpoint under `project's goal/feedback/`, following the repository's batch/commit naming convention. Preserve prior artifacts. Include the ticket and batch, reviewed commit, frozen ticket reference, result, validation/evidence, findings traced to explicit ticket authority, any separate scope-change observations, and the decision. A post-CFC artifact must identify the original findings and state that it is verification. Record only checks actually performed.

For legacy artifacts without clause IDs, derive the matrix from the frozen
ticket, existing finding, and evidence at the next applicable workflow event;
record it as legacy normalization and freeze it without rewriting history.

## Authority

```text
frozen current ticket
> its explicit source references
> the published dependency interfaces/boundaries it consumes
> repository evidence
> general engineering or specialist guidance
```

CK judges only the committed work against that authority. Without HMN, there is one consolidated first review and at most one verification after CFC. A valid newer HMN authorization permits one additional bounded verification of its committed remediation; anything further again returns to human/planning authority.
