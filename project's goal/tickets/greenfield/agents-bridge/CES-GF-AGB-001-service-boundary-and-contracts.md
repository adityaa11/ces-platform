# CES-GF-AGB-001 - Generic Service Boundary and Contracts

**Status:** Implemented generic foundation; Atlas-specific v1 behavior is not authority

## Goal

Provide a stateless, contract-driven, agent-agnostic and provider-agnostic
execution gateway without becoming an unrestricted model proxy.

## Scope

- Registered-agent, provider, model-alias, policy, context, and error contracts.
- Generic `POST /v1/agents/:agentId/execute` endpoint.
- Authentication, authorization, quotas, limits, retries, and redacted audit.
- Trusted server-side provider/model resolution.
- Untrusted-output transformation followed by agent-owned schema validation.
- Rejection of caller-provided arbitrary prompts, schemas, credentials, URLs,
  physical models, and tools.

## Acceptance

- Agent and provider implementations remain mutually isolated.
- Invalid or duplicate registrations fail startup.
- Callers are authorized per registered agent.
- Provider output cannot bypass final validation.
- The generic bridge imports no Atlas product contract.
- Atlas v2 uses the canonical generic endpoint; no compatibility route is
  required or preserved.

## Atlas boundary

ATLAS-V2-002 owns the Atlas extraction agent contract. ATLAS-V2-000 and
ATLAS-V2-009 own deletion of the existing v1 compatibility endpoint and
candidate-only transformation.
