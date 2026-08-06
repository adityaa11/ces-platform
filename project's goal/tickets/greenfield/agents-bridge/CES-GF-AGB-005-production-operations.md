# CES-GF-AGB-005 - Generic Production Operations

**Status:** Planned
**Depends on:** AGB-001 through AGB-003

## Goal

Operate the generic Agents Bridge safely in a centralized, horizontally
scalable environment.

## Scope

- HTTPS deployment, health, readiness, graceful shutdown, and stateless scale.
- Secret rotation, model-alias rollout/rollback, quotas, rate limits, and
  bounded retries.
- Redacted telemetry and confidential-input retention policy.
- Opt-in provider validation using non-confidential fixtures.
- Incident diagnostics that never expose prompts, PRD text, or credentials.

## Acceptance

- Generic registered-agent execution works through deployed HTTPS.
- Multiple instances share no request-local semantic state.
- Provider/model changes require trusted configuration and are reversible.
- No Atlas-specific endpoint, output artifact, or legacy contract is required.
