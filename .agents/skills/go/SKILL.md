---
name: go
description: Atlas implementation-phase GO workflow control. Use only when the user invokes `go` as the Atlas ticket workflow command or explicitly authorizes GO for a bounded Atlas ticket. Do not use for Go language/code requests or ordinary uses of the word "go".
---

# Atlas GO Workflow

GO authorizes implementation of the current frozen ticket or explicitly authorized batch. The ticket is the executable contract; GO does not create requirements, approve work, or reopen accepted scope.

## Shared interpretation rule

GO, CK, CFC, and HMN MUST derive active-ticket scope, acceptance obligations,
validation obligations, evidence sufficiency, and finding closure from the
[shared Atlas Review Contract](../_shared/atlas-ticket-review-contract.md).
GO MUST NOT substitute its own broader or narrower interpretation.

## Before implementation

1. Resolve the authorized ticket or batch from the user's instruction and the relevant ticket-set README. Do not choose a new ticket unless the user authorized that progression.
2. Read the frozen ticket and the source references it explicitly incorporates. Read only the accepted dependency material needed to understand interfaces and boundaries this ticket consumes.
3. Confirm required predecessors are approved/PASS for their final checkpoints, the current checkpoint is eligible to start, and the implementation target is clear. An `awaiting_review` predecessor is not approved.
4. Treat dependencies as accepted interfaces, capabilities, invariants, and authority boundaries used by this ticket. Do not inherit their deferred work, recommendations, future providers, deployment plans, or unrelated requirements.
5. Derive the full Review Contract before coding: every implementation,
   validation, and evidence row; required harnesses, scenarios, and observations;
   behavior-versus-proof distinctions; and forbidden scope expansion. GO MUST NOT
   start from only a ticket title or Outcome section.

If a required predecessor must be reopened, or the work needs a new product requirement, provider, runtime, deployment target, architecture decision, or unresolved policy, stop and return that decision to human/planning authority. Repository code, tests, runtime entrypoints, specialist guidance, and deployment configuration are implementation evidence; they do not add ticket scope.

## Implement and hand off

Implement only the authorized ticket. Preserve unrelated user changes and approved predecessor boundaries. Run the validation required by the ticket and regressions directly affected by the implementation. Record the bounded changes, commit, exact validation evidence, and applicable limitations in the ticket/checkpoint record. Commit only authorized paths and set the ticket to `awaiting_review` using its existing vocabulary.

Treat each ticket-named validation scenario as completion work and use the
contract-required harness and observations; a weaker test or generic suite pass
is not a substitute. Before commit/handoff, perform a shadow-CK readiness check for every
applicable contract row, comparing required and actual evidence and assigning
the shared closure status. GO MUST NOT hand off with a known `UNRESOLVED`,
`IMPLEMENTED_UNPROVEN`, or `BLOCKED_AUTHORITY` row. A permitted
`BLOCKED_ENVIRONMENT` limitation must be explicit. Do not use CK as a
requirements-discovery phase.

The checkpoint MUST include a compact `## Review Contract Closure` summary with
stable row IDs, ticket authority, required proof, and status, followed by
`Internal readiness: READY_FOR_CK`. This is never a self-issued `PASS`.

Then stop and return control to CK. GO does not review or label its own work `PASS`, remediate CK findings, or perform unrelated cleanup.

When invoked after a CK `PASS`, record the approved state. Begin another dependency-ready ticket only if the user's GO authorization covers that ticket or batch. A `CHANGES_REQUIRED` result belongs to CFC and must not be remediated by GO.

If a current HMN artifact explicitly records `RETURN_TO_GO`, GO may resume or complete only the frozen-ticket implementation named by that authorization and must record its HMN authorization ID in the checkpoint. GO must not consume `AUTHORIZE_NEXT_CFC`, `AUTHORIZE_EVIDENCE_REMEDIATION`, or `AUTHORIZE_DIRECT_REGRESSION_REPAIR`; those belong to CFC. An HMN artifact never expands ticket scope.

## Authority

```text
frozen current ticket
> its explicit source references
> the published dependency interfaces/boundaries it consumes
> repository evidence for implementation
> general engineering or specialist guidance
```

The ticket decides the work. GO implements that work and leaves it `awaiting_review`.
