---
name: cfc
description: Atlas bounded feedback-correction workflow. Use only when the user invokes `cfc` as the Atlas CK remediation command or explicitly authorizes remediation of an existing CK review.
---

# Atlas CFC Workflow

## Purpose and authority

CFC performs bounded remediation from the frozen ticket and the latest CK review. It is not a planning command, does not grant `PASS`, and cannot expand the ticket.

## Preflight

Resolve from repository state:

- the current frozen ticket and ticket/batch;
- the latest CK artifact, review round, result, and stable finding IDs;
- all findings still marked `OPEN`;
- the committed revision reviewed by CK and the current remediation base; and
- finding-specific and required regression validation.

Confirm that the current working tree does not mix in-scope remediation with uncommitted user changes. Preserve unrelated work and stage only authorized paths.

CFC may proceed only when the latest result is `CHANGES_REQUIRED`, at least one open finding is an implementation-repairable `IMPLEMENTATION_DEFECT`, and the review session has not reached its three-round limit. The reviewed commit must be the remediation base. If the review is `PASS`, `BLOCKED`, or `REVIEW_CONVERGENCE_BLOCKED`, or the latest artifact/baseline is ambiguous, stop and return control to CK, GO, planning, or human authority as appropriate.

## Eligible remediation

Read the full frozen ticket and latest consolidated review. Fix the open, in-scope implementation defects identified by CK. CFC may inspect adjacent code and add the smallest necessary regression coverage to prove the fix.

Do not silently repair or decide:

- `SCOPE_DIVERGENCE`;
- `PLANNING_GAP`;
- `KNOWLEDGE_GAP` requiring a new policy or evidence source;
- new product requirements, technologies, providers, or authority relationships;
- unrelated cleanup, refactoring, or features; or
- any finding after the review has ended with `REVIEW_CONVERGENCE_BLOCKED`.

Those conditions leave the implementation loop. Return the evidence to human/planning authority instead of inventing a solution. If a finding cannot be fixed without changing the frozen ticket, stop and request a planning decision.

Address eligible open findings as one bounded remediation pass. Do not change historical CK artifacts or mark findings resolved yourself; CK owns finding status and approval.

## Validate and commit

Run the finding-specific validation and affected regressions required by the ticket and repository. For frontend remediation, include the applicable rendered states required by the frontend review gate and Atlas UI/UX protocol. Record exact commands, results, counts/skips, service health, and environment limits; never claim unrun validation passed.

Commit only the bounded remediation. The commit message or implementation checkpoint must identify the CK finding IDs addressed and record the validation evidence. Preserve existing ticket requirements and dependency checkpoints. Leave the ticket/checkpoint at `awaiting_review` and return it to CK.

```text
latest CK: CHANGES_REQUIRED
-> bounded CFC remediation
-> finding-specific and regression validation
-> remediation commit naming CK finding IDs
-> awaiting_review
-> CK next round
```

CFC must not issue a review result, advance to another ticket, waive findings, edit acceptance criteria, or trigger an automatic additional round. If remediation cannot be completed within scope, stop and report the blocker.

## Final rule

CFC repairs defects CK found inside the frozen ticket. Only CK may decide whether the committed remediation satisfies the ticket.
