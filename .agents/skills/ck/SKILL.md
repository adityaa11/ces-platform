---
name: ck
description: Atlas committed-checkpoint review workflow. Use only when the user invokes `ck` as the Atlas ticket review command or explicitly requests CK review of a bounded Atlas checkpoint.
---

# Atlas CK Workflow

CK reviews one committed checkpoint against the frozen current ticket and produces one consolidated review. The ticket is the review contract. A CK artifact records whether existing ticket authority was met; it cannot create requirements.

## First review

Confirm the ticket is `awaiting_review`, the recorded commit matches the committed revision under review, and the worktree does not make the review target ambiguous. If these preconditions fail, stop and return control for clarification; do not invent a review result.

Review the current ticket's scope, acceptance criteria, explicit review requirements, explicit source references, and the approved dependency interfaces/boundaries it actually consumes. Check only regressions the ticket requires to remain green. Inspect enough implementation evidence to make a reasonable consolidated review; broad inspection does not broaden review authority.

A blocking finding must name the current-ticket requirement it violates and include the evidence, affected location, and observable correction needed. Use only these ordinary results:

- `PASS`: the committed work satisfies the current ticket and its explicit review obligations.
- `CHANGES_REQUIRED`: one or more implementation-repairable violations of the current ticket remain.

Record concerns requiring a ticket change, a new provider/runtime/deployment target, an architecture or product decision, unresolved policy, or reopening an approved predecessor as separate scope-change observations. They are not `CHANGES_REQUIRED` findings and are not CFC work. If the ticket cannot be reviewed without such a decision, stop and return control to human/planning authority.

Dependency approval permits use of only the interfaces, capabilities, invariants, and authority boundaries that the ticket explicitly consumes. It does not import deferred work. For example, PCC may be reviewed for correct use and preservation of BSS-007 `DocumentStore`; BSS-007's future S3/R2-compatible adapter is not PCC scope. Do not require R2, S3, Cloudflare storage, or a deployment change, and do not reopen BSS-007 for that future work. “Production” means the real Atlas application path when used that way in a ticket; it does not select cloud deployment infrastructure by itself.

Specialist skills may help reason about evidence. They are review authorities only when the frozen ticket explicitly incorporates a specific requirement or binding from them. A skill's `MUST` statement alone cannot expand ticket acceptance.

## Review after CFC

After the single bounded CFC remediation commit, verify only the original consolidated findings, the remediation diff, evidence needed to assess those findings, and direct regressions introduced in behavior necessary to evaluate those findings. Do not restart broad review or add unrelated findings discovered along the way.

Record whether the original findings are resolved and whether a direct remediation regression exists. If a finding remains unresolved or remediation introduced a direct regression, report `CHANGES_REQUIRED` with the evidence and stop for human/planning authority. Do not start another CFC pass. Otherwise record `PASS`. This verification does not authorize a new full review.

## Review record

Write one consolidated artifact for the reviewed checkpoint under `project's goal/feedback/`, following the repository's batch/commit naming convention. Preserve prior artifacts. Include the ticket and batch, reviewed commit, frozen ticket reference, result, validation/evidence, findings traced to explicit ticket authority, any separate scope-change observations, and the decision. A post-CFC artifact must identify the original findings and state that it is verification. Record only checks actually performed.

## Authority

```text
frozen current ticket
> its explicit source references
> the published dependency interfaces/boundaries it consumes
> repository evidence
> general engineering or specialist guidance
```

CK judges only the committed work against that authority. One consolidated first review, then at most one verification after CFC; anything beyond that returns to human/planning authority.
