# Security Refactor Readiness Review Extension

Apply this extension only when the frozen ticket declares security-refactor-readiness obligations.

## Required coverage

Verify every declared readiness review binding.

For each referenced readiness item, determine whether implementation evidence supports preservation of the declared seam, boundary, or prohibition.

Inspect at minimum, when declared by the ticket:

- trust-boundary preservation;
- authority-boundary preservation;
- required identity/execution context;
- required extension seams;
- prohibited couplings;
- sensitive-data coupling;
- observability seams;
- configuration/secret ownership seams;
- persistence boundaries;
- transport/error boundaries;
- future verification seams;
- explicitly unresolved security policy.

## Unresolved policy

Implementation must not silently convert an explicitly unresolved security policy into an assumed project rule.

If an implementation choice was required to proceed, determine whether it remained an implementation detail inside the accepted boundary or introduced a new planning/security decision.

## Mandatory bindings are minimum coverage

Passing every declared readiness binding does not end review.

Continue the normal independent implementation review.

The reviewer may discover a relevant concern that the readiness authoring skill did not identify.

### Bounded CK review sessions

For CK Round 1, apply the full applicable security-readiness inspection above and verify every declared binding.

For CK Round 2 or 3, verify unresolved readiness findings and bindings, inspect the security-relevant remediation delta, and check for regressions caused by remediation. Do not restart the entire security inspection over unrelated areas already accepted in the same review session.

A genuinely missed security-relevant ticket violation may still be reported in a later round as `LATE_DISCOVERY`, with concrete evidence and its existing review classification. A late discovery can block PASS and counts toward convergence. This bounded scope does not weaken or waive any declared security requirement.

## Readiness-specific finding classification

### IMPLEMENTATION_DEFECT

The ticket declared the readiness requirement, but implementation violated it.

Example:

`COUPLING-BRIDGE-DOCUMENTSTORE` prohibited direct Bridge storage access, but implementation introduced it.

### SCOPE_DIVERGENCE

Implementation introduced a security-relevant boundary, dependency, technology, or authority relationship not present in the frozen ticket.

Return to planning.

### READINESS_PLAN_GAP

The original frozen ticket scope already contained enough information that a material readiness seam or prohibition should have been identified, but the readiness authoring result omitted it.

Do not silently add the requirement and continue as though planning had been correct.

Report the gap so affected planning can be amended and the authoring skill can be improved.

### SECURITY_KNOWLEDGE_GAP

A potentially material security concern exists, but the current readiness layer intentionally does not contain enough governed security knowledge to define the final policy.

Do not invent a security control.

Preserve the gap for the future security-baseline process.

## Review result

Merge readiness findings into the normal engineering review result.

Do not create a separate security-readiness PASS.

The ticket has one overall implementation review outcome.
