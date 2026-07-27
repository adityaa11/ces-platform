# CES-GF-AGB-002 — Agents Bridge: Secure Shared Runtime

**Phase:** 3D — Central Agent Provider Foundation  
**Parent:** Greenfield Product Suite  
**Status:** Planned

## Goal

Provide the minimal reusable HTTP runtime needed to operate centralized CES
agent-provider endpoints safely and test them without real network access.

## Work

- Create the `apps/atlas-gemini-bridge` TypeScript workspace application.
- Separate configuration parsing, server construction, route handling, and
  executable startup.
- Add `GET /healthz` without exposing environment or quota details.
- Require bearer authentication with distinct missing, malformed, and incorrect
  credential responses and timing-safe token comparison where practical.
- Apply configurable request-body limits before JSON parsing.
- Generate or safely accept a bounded request correlation ID.
- Add request deadlines and clean shutdown behavior.
- Provide structured, redacted logs through an injected logger.
- Inject transport, clock, retry delay, randomness, and logger dependencies
  needed for deterministic tests.
- Fail startup when required configuration is absent or invalid.

## Acceptance criteria

- [ ] The server can be instantiated in tests without listening on a real port.
- [ ] Missing authorization returns `401`; incorrect authorization returns
      `403`.
- [ ] Oversized requests return `413` without buffering the full body.
- [ ] Invalid JSON, unknown routes, and unsupported methods have stable
      sanitized responses.
- [ ] Secrets, authorization headers, request bodies, and complete prompts
      never appear in logs or errors.
- [ ] Health checks reveal no configuration or provider information.
- [ ] The runtime is stateless and supports multiple concurrent instances.

## Required evidence

- [ ] Configuration boundary and invalid-configuration tests.
- [ ] Authentication and timing-safe comparison tests.
- [ ] Streaming body-limit tests.
- [ ] Log-redaction tests using sentinel secrets and source text.
- [ ] Server lifecycle and clean-shutdown tests.

## Out of scope

- Gemini response transformation.
- Atlas semantic extraction.
- Organization-wide identity federation.
- Durable job queues.

## Depends on

- `CES-GF-AGB-001`

