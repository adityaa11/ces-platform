---
name: engineering-security-refactor-readiness
description: Identify security-refactor seams, trust and authority boundaries, prohibited couplings, and mandatory review bindings for planned implementation work. Use during ticket authoring before implementation. This skill does not perform a full security-baseline assessment.
---

# Engineering Security Refactor Readiness

## Outcome

Given a bounded ticket scope plus accepted project and architecture context, identify the implementation seams that must remain available so later security hardening can be added without avoidable architectural redesign.

This skill is implementation-planning guidance only.

It does not declare an implementation secure, select a complete security baseline, or grant review approval.

## Required reasoning

For the supplied work unit, identify only what is supported by the supplied context:

- security-relevant trust transitions;
- sensitive assets and authority;
- existing accepted boundaries inherited by the ticket;
- identity or execution context that should remain available;
- extension seams where later security policy can attach;
- implementation couplings that would make later hardening invasive;
- observability, configuration, persistence, error-handling, and verification seams when materially relevant;
- security policy that remains intentionally unresolved;
- mandatory review bindings for material readiness expectations.

## Boundary preservation

Accepted project or dependency boundaries are authoritative input.

Do not silently:

- replace an accepted technology;
- collapse an accepted authority boundary;
- reopen an approved predecessor;
- invent a security policy;
- introduce a new provider or infrastructure dependency;
- turn an unresolved security question into an implementation assumption.

If the proposed work cannot preserve an accepted boundary, emit a planning finding.

## Scope discipline

Reason only from the supplied ticket scope and bounded project context.

Do not scan the entire project, security standards collection, historical ticket corpus, or unrelated implementation unless explicitly asked to perform planning discovery.

This skill is not the future full security-baseline assessment.

## Output

Return a compact `SecurityReadiness` result containing, as applicable:

- `status`
- `inheritedBoundaries`
- `trustBoundaries`
- `sensitiveAssets`
- `identityContext`
- `extensionSeams`
- `prohibitedCouplings`
- `verificationSeams`
- `unresolvedSecurityPolicy`
- `planningFindings`
- `reviewBindings`

Use stable IDs for every material seam, coupling, finding, and review binding.

Every review binding must reference the readiness item it verifies.

## Status

Use:

- `applicable`
- `minimal-relevance`
- `planning-review-required`

`planning-review-required` blocks ticket finalization until the relevant planning conflict is resolved.

## Review bindings

Review bindings are mandatory minimum coverage for implementation review.

They are not the maximum scope of independent review.

A review binding should contain:

- stable review ID;
- readiness item reference;
- narrow review question;
- expected evidence category.

## Future baseline compatibility

Where possible, describe extension points in implementation-neutral terms.

A later security-baseline system may attach canonical controls and verification requirements to these same readiness IDs.

Do not invent those future controls now.

## Final rule

Preserve tomorrow's security-policy attachment points while implementing today's accepted scope.
