---
name: cfc
description: Atlas bounded feedback-correction workflow. Use only when the user invokes `cfc` as the Atlas CK remediation command or explicitly authorizes remediation of an existing CK review.
---

# Atlas CFC Workflow

CFC performs one bounded remediation pass for accepted, in-scope findings in the latest consolidated CK review. The frozen ticket remains the authority; a CK statement is not a requirement by itself. The default remains one CFC pass followed by one CK verification; CFC cannot autonomously start another pass.

## Preflight

Read the frozen current ticket and its explicitly incorporated source references, the latest consolidated CK artifact, the reviewed commit, and the current remediation base. Proceed only when CK returned `CHANGES_REQUIRED` and the artifact identifies implementation-repairable findings that trace to current-ticket requirements. Preserve unrelated user changes and stage only authorized paths.

After CK has performed its allowed post-CFC verification and returned control to human/planning authority, do not begin another remediation from CK alone. Read the active newer HMN artifact under `project's goal/feedback/` during preflight. It must be explicitly delegated by a user `hmn` invocation, match the current ticket and unresolved finding/scope, be newer than the CK blocked event it addresses, remain within frozen-ticket authority, and have no later artifact that supersedes it. Only these HMN decisions authorize a new CFC cycle:

- `AUTHORIZE_NEXT_CFC`
- `AUTHORIZE_EVIDENCE_REMEDIATION`
- `AUTHORIZE_DIRECT_REGRESSION_REPAIR`

For uncommitted interrupted work, `CONTINUE_CURRENT_CFC` permits resuming the same authorized scope only. Confirm there is no remediation commit or CK handoff, that the partial worktree changes are in scope, and that the HMN record identifies what remains. It is not a new remediation cycle. Do not resume or consume a stale, mismatched, superseded, or scope-expanding HMN authorization.

For each finding, identify the ticket requirement it enforces. If no such requirement exists, do not implement it. If it requires changing the ticket, reopening an approved predecessor, adding a provider/runtime/deployment target, making an architecture/product/policy decision, or doing future dependency work, stop and return it to human/planning authority as a scope-change issue.

## Remediate and hand off

Fix only the accepted in-scope findings from that consolidated review. Do not conduct a new review, create findings, change acceptance criteria, or add unrelated refactoring. Preserve approved predecessor boundaries. Run finding-specific validation and directly affected regressions; record exact results and limitations.

Create one bounded remediation commit, identify the CK findings it addresses, and, when HMN-authorized, record `HMN authorization consumed: <stable ID>` in the remediation checkpoint. Update the checkpoint to `awaiting_review` and stop for CK verification. CFC does not issue `PASS` and never invokes another CK/CFC cycle. After CK verification, unresolved findings or direct remediation regressions return to human/planning authority; there is no automatic second remediation pass.

## Authority

```text
frozen current ticket
> its explicit source references
> the published dependency interfaces/boundaries it consumes
> active bounded HMN authorization, when present
> repository evidence for implementation
> CK feedback only when it traces to that ticket authority
```

CFC repairs the ticket's accepted in-scope findings once. An HMN authorization is valid only within frozen-ticket authority; it cannot turn reviewer inference into scope.
