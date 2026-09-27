---
name: engineering-implementation-review
description: Independently review implementation work against its frozen ticket scope, accepted dependency boundaries, evidence, and applicable engineering review extensions.
---

# Engineering Implementation Review

## Purpose

Independently review an implemented ticket against the frozen implementation contract and produced evidence.

The reviewer must challenge the implementation rather than assume that implementation intent proves correctness.

## Required review inputs

Use the supplied:

- frozen ticket;
- implementation commit or diff;
- relevant accepted dependency checkpoints;
- implementation evidence and test results.

Do not silently expand or rewrite the ticket.

## Frozen scope controls runtime interpretation

The frozen ticket, explicitly referenced source material, and accepted dependency checkpoints define what the implementation must satisfy. Existing repository architecture is useful evidence, but it is not independent authority for adding a deployment target, runtime, or platform requirement.

Treat a Worker/Cloudflare entrypoint, Vite `configureServer` middleware, preview runtime, Compose service, or alternate storage/runtime adapter as review scope only when the ticket or accepted baseline explicitly identifies it as authoritative or requires behavior that can only be proven there. Do not infer a Worker requirement from the presence of `apps/*/worker`, a build plugin, or a repository template.

Keep validation environment and production deployment distinct: a ticket may require Compose for authoritative validation without making Compose the production runtime, and the word “production” alone does not identify Cloudflare, Workers, or any other deployment target. When the frozen materials do not resolve that target, classify the ambiguity as a planning/knowledge issue or request a scope decision instead of treating one repository runtime as the contract.

## Base review

Always inspect:

- ticket scope conformance;
- acceptance criteria;
- dependency and checkpoint conformance;
- preservation of accepted authority and architecture boundaries;
- introduced technologies or behaviors outside the ticket;
- implementation correctness;
- failure and negative behavior where relevant;
- tests and evidence supporting the ticket's claims;
- regressions within the affected boundary.

## Conditional extension routing

Before completing review, inspect the frozen ticket for declared review extensions.

### Security refactor readiness

If the ticket contains a `Security Refactor Readiness` section or any review binding identified as security-refactor-readiness:

**MUST read and apply:**

`references/security-refactor-readiness.md`

Do not skip the extension because the base review appears sufficient.

If the required extension cannot be loaded or its required ticket references cannot be resolved, return an inconclusive/blocking review finding rather than silently ignoring the extension.

## Extension semantics

Extensions add mandatory minimum review coverage.

They do not replace the base review and do not limit independent inspection.

The reviewer may identify defects that are absent from all declared review bindings.

## Relationship to CK workflow

This skill provides engineering review reasoning and finding classification; it does not define GO/CK/CFC lifecycle, review stages, or finding authority. When explicitly used to assist CK, the frozen ticket remains the only source of requirements, and the [CK skill](../ck/SKILL.md) controls the review scope and handoff. Apply an extension only when the ticket explicitly declares its binding. Do not use this skill to add requirements or restart broad review during post-CFC verification.

When used outside the CK workflow, review the supplied scope and return findings without taking over ticket authorization or workflow decisions.
## Finding classification

### IMPLEMENTATION_DEFECT

The frozen ticket or accepted dependency already required the behavior, and implementation violates it.

The ticket may be corrected without changing its accepted scope.

### SCOPE_DIVERGENCE

Implementation introduced a technology, behavior, authority relationship, trust transition, or architectural responsibility not authorized by the frozen ticket.

Return to planning.

### PLANNING_GAP

The frozen scope itself was incomplete or internally inconsistent in a way that cannot be repaired as implementation-only work.

Return to planning.

Applicable extensions may define a more specific planning-gap subtype.

### KNOWLEDGE_GAP

A material concern is visible, but current governed project or engineering knowledge does not support a defensible requirement or conclusion.

Keep the uncertainty explicit.

## Existing checkpoint preservation

An implementation may extend an accepted predecessor only through its accepted interfaces and authority boundaries.

If satisfying the ticket requires changing an accepted predecessor's responsibility, treat it as scope/planning divergence rather than silently modifying history.

## PASS

PASS means the reviewed implementation satisfies its frozen ticket and mandatory review obligations at the reviewed implementation revision.

PASS does not mean the project is universally secure or free of concerns outside the reviewed scope.

## Final rule

Discovery may exceed the ticket.

Authority may not.

The reviewer may discover additional problems, but must route them according to the appropriate implementation, planning, or knowledge boundary rather than silently redesigning the work.
