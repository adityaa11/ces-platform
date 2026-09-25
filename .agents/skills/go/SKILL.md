---
name: go
description: Atlas implementation-phase GO workflow control. Use only when the user invokes `go` as the Atlas ticket workflow command or explicitly authorizes GO for a bounded Atlas ticket. Do not use for Go language/code requests or ordinary uses of the word “go”.
---

# Atlas GO Workflow

## Purpose and authority

GO authorizes bounded implementation work and is the only workflow skill that may advance to the next dependency-ready ticket. The frozen ticket remains the executable contract. GO does not author requirements, grant review approval, or replace planning.

The authority order is:

```text
accepted project and architecture baseline
-> frozen ticket
-> GO / CK / CFC workflow
-> implementation
```

Only act when the user explicitly invokes `go` as this workflow command or explicitly authorizes GO for a bounded ticket. Resolve the current ticket and dependencies from repository state; do not make the user repeat information already recorded there.

## Resolve the work unit

Inspect the relevant ticket-set README, current ticket, declared dependencies, referenced implementation context, accepted dependency checkpoints, latest CK artifact, current committed `HEAD`, and `git status`.

If the user names a ticket or batch, use that one. Otherwise select the first dependency-ready ticket in the authorized set. Before implementation, confirm that:

- the ticket exists and has a bounded scope and acceptance criteria;
- the ticket is not complete;
- the ticket is authorized to start under its ticket-set state and the user's GO instruction;
- every dependency is approved or has a `PASS` review for its final committed checkpoint, as required by the ticket;
- the current checkpoint has no open blocking review result; and
- the implementation target and any existing user changes are distinguishable.

If the ticket, dependency state, frozen baseline, or current review status is ambiguous, stop and ask for the smallest planning decision needed. Do not infer approval from an `awaiting_review` state, a successful build, or a non-`PASS` review.

## Scope grounding

Before implementation, distinguish the ticket's binding authority from repository context:

- **Binding authority:** the frozen ticket, its explicit acceptance/scope items, mandatory review bindings, explicitly incorporated source anchors, and accepted dependency checkpoints.
- **Implementation evidence:** repository files, framework configuration, build output, runtime entrypoints, local services, and existing tests.

Implementation evidence may inform how the ticket is carried out, but it does not create a new acceptance criterion, deployment target, provider, runtime, or architecture constraint by itself. Do not treat an existing Worker/Cloudflare entrypoint, Vite middleware, preview server, Compose service, or alternate adapter as mandatory unless binding authority explicitly names it or the stated acceptance criterion necessarily requires it.

For each material implementation choice that depends on context outside the ticket, record the exact binding requirement it serves. If no such requirement exists, treat the choice as optional implementation context; do not expand the ticket. When the required authority is genuinely ambiguous, request the smallest planning decision rather than selecting a new target by inference.

## Advancement after review

When GO follows CK, inspect the latest review artifact for the current ticket and confirm its `PASS` applies to the exact final reviewed commit and frozen ticket baseline.

- On `PASS`, preserve the CK artifact, update ticket and ticket-set status using their existing vocabulary, then select and begin the next dependency-ready ticket authorized by this GO.
- On `CHANGES_REQUIRED`, `BLOCKED`, or `REVIEW_CONVERGENCE_BLOCKED`, do not advance. For `CHANGES_REQUIRED`, report that the separately invoked CFC workflow may address eligible findings; do not start remediation from GO. Blocked results return to human or planning authority.
- A closed review session may be reopened only for an explicitly authorized new implementation revision or a planning-approved new ticket baseline. Do not silently reopen a `PASS` session.

Never start a dependent ticket while its predecessor is only `awaiting_review`.

## Implement the frozen ticket

Read the full ticket and only the accepted dependency/context material needed to implement its scope. Apply relevant repository skills and required validation. Implement only the authorized ticket or batch. Do not use incidental runtime context to add work that lacks a trace to a ticket requirement.

GO may inspect, implement, validate, record evidence, commit the bounded changes, and mark the checkpoint `awaiting_review`. Use repository-established status vocabulary; do not invent a new ticket state. Record the implementation commit and exact validation commands, outcomes, test counts, skips, service health, and environment limits required by the ticket. For frontend changes, include the rendered states actually checked under the UI validation protocol.

Preserve unrelated or pre-existing user changes. Stage and commit only paths belonging to the authorized ticket; never use a broad add that captures unrelated work. If in-scope edits are mixed with user edits and cannot be safely separated, pause and ask.

After implementation:

```text
bounded implementation
-> required validation and evidence
-> commit
-> awaiting_review
-> CK
```

GO must not issue its own final review, label its implementation `PASS`, waive findings, edit the frozen ticket to force acceptance, or begin unrelated cleanup. Only CK may issue the review result GO consumes.

## Planning and stop conditions

Return to planning or human authority when implementation requires a new product requirement, a changed authority boundary, an accepted predecessor redesign, a new technology/provider, or resolution of a planning/knowledge gap. Do not use implementation to silently resolve those matters.

Stop without advancing when the latest CK result is blocked, when round-limit convergence failed, when required dependencies cannot be verified, or when current state does not identify a single authorized ticket.

## Final rule

GO implements the ticket that was authorized. It does not invent a different job or approve its own work.
