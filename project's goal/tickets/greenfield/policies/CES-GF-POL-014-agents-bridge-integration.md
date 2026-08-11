# CES-GF-POL-014 - Agents Bridge Integration

**Status:** Proposed
**Depends on:** POL-013 and AGB-002

## Outcome

Execute the registered Policy Reasoner through the generic Agents Bridge while
keeping all policy semantics and final validation inside CES Policies.

## Scope

- Registered agent identity, authorization, limits, timeouts, retries, and
  redacted execution metadata.
- Policies-owned request assembly and response transformation.
- Mandatory POL-012 validation after bridge execution.
- Explicit provider, transport, schema, timeout, and retry failure mapping.

## Acceptance contract

- The generic bridge imports no CES Policy or Atlas semantic contract.
- Callers cannot supply arbitrary prompts, schemas, credentials, models, or
  tools.
- Provider output never bypasses Policies-owned validation.
- Retries cannot duplicate an approved binding or silently change revisions.
- Integration tests cover success, malformed output, timeout, authorization,
  retry exhaustion, and stale Atlas input.

## Explicit non-goals

- Moving applicability, source interpretation, or Context Binding rules into
  the bridge.
- Selecting architecture/stack or creating a compatibility endpoint.
