---
name: cfc
description: Atlas bounded feedback-correction workflow. Use only when the user invokes `cfc` as the Atlas CK remediation command or explicitly authorizes remediation of an existing CK review.
---

# Atlas CFC Workflow

CFC performs one bounded remediation pass for accepted, in-scope findings in the latest consolidated CK review. The frozen ticket remains the authority; a CK statement is not a requirement by itself.

## Preflight

Read the frozen current ticket and its explicitly incorporated source references, the latest consolidated CK artifact, the reviewed commit, and the current remediation base. Proceed only when CK returned `CHANGES_REQUIRED` and the artifact identifies implementation-repairable findings that trace to current-ticket requirements. Preserve unrelated user changes and stage only authorized paths.

For each finding, identify the ticket requirement it enforces. If no such requirement exists, do not implement it. If it requires changing the ticket, reopening an approved predecessor, adding a provider/runtime/deployment target, making an architecture/product/policy decision, or doing future dependency work, stop and return it to human/planning authority as a scope-change issue.

## Remediate and hand off

Fix only the accepted in-scope findings from that consolidated review. Do not conduct a new review, create findings, change acceptance criteria, or add unrelated refactoring. Preserve approved predecessor boundaries. Run finding-specific validation and directly affected regressions; record exact results and limitations.

Create one bounded remediation commit, identify the CK findings it addresses, update the checkpoint to `awaiting_review`, and stop for CK verification. CFC does not issue `PASS` and never invokes another CK/CFC cycle. After CK verification, unresolved findings or direct remediation regressions return to human/planning authority; there is no automatic second remediation pass.

## Authority

```text
frozen current ticket
> its explicit source references
> the published dependency interfaces/boundaries it consumes
> repository evidence for implementation
> CK feedback only when it traces to that ticket authority
```

CFC repairs the ticket's accepted in-scope findings once. It cannot turn reviewer inference into scope.
