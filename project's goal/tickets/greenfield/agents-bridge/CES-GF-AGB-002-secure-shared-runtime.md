# CES-GF-AGB-002 — Agents Bridge: Secure Shared Runtime

**Phase:** 3D — Central Agent Provider Foundation  
**Parent:** Greenfield Product Suite  
**Status:** Implemented locally; hosted CI pending

**Evidence:** [`evidence/CES-GF-AGB-002-local-runtime.md`](evidence/CES-GF-AGB-002-local-runtime.md)

## Goal

Provide the minimal reusable HTTP runtime needed to operate centralized CES
agent-provider endpoints safely and test them without real network access.

## Work

- Create the `apps/agents-bridge` TypeScript workspace application with service
  identity `ces-agents-bridge`.
- Separate configuration parsing, server construction, route handling, and
  executable startup.
- Implement agent, provider, and model registries plus the shared structured
  execution coordinator.
- Add `GET /healthz` and `GET /readyz` without exposing secrets or quota
  details.
- Require bearer authentication with distinct missing, malformed, and incorrect
  credential responses and timing-safe token comparison where practical.
- Authorize each authenticated client for specific agents and routes.
- Apply configurable request-body limits before JSON parsing.
- Generate or safely accept a bounded request correlation ID.
- Add request deadlines and clean shutdown behavior.
- Provide structured, redacted logs through an injected logger.
- Inject transport, clock, retry delay, randomness, and logger dependencies
  needed for deterministic tests.
- Fail startup when required configuration is absent or invalid.
- Implement `POST /v1/agents/:agentId/execute` so it accepts only agent version,
  agent-specific input, and bounded correlation metadata.

## Acceptance criteria

- [x] The server can be instantiated in tests without listening on a real port.
- [x] Missing authorization returns `401`; incorrect authorization returns
      `403`.
- [x] Oversized requests return `413` without buffering the full body.
- [x] Invalid JSON, unknown routes, and unsupported methods have stable
      sanitized responses.
- [x] Secrets, authorization headers, request bodies, and complete prompts
      never appear in logs or errors.
- [x] Health checks reveal no configuration or provider information.
- [x] The runtime is stateless and supports multiple concurrent instances.
- [x] Unknown agents, unsupported versions, and unauthorized agents fail before
      provider execution.
- [x] The generic route cannot accept caller-supplied prompts, providers,
      models, schemas, credentials, or tools.

## Required evidence

- [x] Configuration boundary and invalid-configuration tests.
- [x] Authentication and timing-safe comparison tests.
- [x] Streaming body-limit tests.
- [x] Log-redaction tests using sentinel secrets and source text.
- [x] Server lifecycle and clean-shutdown tests.
- [x] Generic routing, registry, authorization, and execution-context tests
      using a deterministic fixture agent and provider.

## Out of scope

- Concrete provider adapters.
- Atlas semantic extraction.
- Organization-wide identity federation.
- Durable job queues.

## Depends on

- `CES-GF-AGB-001`
