# CES-GF-AGB-005 — Agents Bridge: Production Operations

**Phase:** 3D — Central Agent Provider Foundation  
**Parent:** Greenfield Product Suite  
**Status:** Implemented locally; deployed live validation pending

## Goal

Make the Atlas–Gemini bridge safely deployable as a centralized, horizontally
scalable service for authorized CES processes and workers.

## Work

- Document and validate HTTPS deployment behind a trusted ingress or reverse
  proxy.
- Define per-client credentials and rotation procedures; do not use one shared
  credential across all environments or workers.
- Add bounded concurrency, per-client rate limits, and provider-quota
  protection.
- Add per-client agent authorization and agent-specific execution budgets.
- Define distributed concurrency and rate-limit coordination for multi-instance
  deployment, introducing shared infrastructure only when required.
- Add request metrics for duration, status, retry count, input size, source
  count, and provider status without sensitive content.
- Add readiness behavior distinct from the non-sensitive liveness endpoint.
- Document secret injection, rotation, incident response, retention, and
  confidential-PRD handling.
- Provide container and local deployment instructions.
- Add an explicit opt-in live-provider test guarded by
  `GEMINI_LIVE_TEST=true`.
- Run one manual Atlas extraction against the deployed HTTPS endpoint and store
  redacted evidence.
- Define scaling and failure behavior for multiple stateless instances.
- Define model alias lifecycle, provider replacement, rollback, and credential
  rotation procedures.
- Add a second deterministic dummy agent and provider extension test proving
  registration requires no shared-runtime or existing-agent contract change.

## Acceptance criteria

- [x] Production ingress is HTTPS and the bridge is not documented for direct
      insecure remote access.
- [x] Credentials can be issued, revoked, and rotated per authorized caller or
      deployment identity.
- [x] Concurrency and rate limits prevent one caller from exhausting service or
      provider capacity.
- [x] Logs and metrics support incident diagnosis without PRD text, prompts,
      responses, credentials, or authorization headers.
- [x] Multiple instances can operate without local session state.
- [x] Normal CI remains provider-key-free and network-free.
- [ ] The opt-in live test and manual Atlas run succeed with redacted evidence.
- [x] Data retention and confidential-document responsibilities are explicit.
- [x] A second fixture agent and provider execute through registration without
      changing the shared executor or Atlas contracts.

## Required evidence

- [x] HTTPS deployment and secret-injection guide.
- [x] Per-client authentication, rate-limit, and concurrency tests.
- [x] Metrics and log-redaction snapshots.
- [x] Multi-instance/statelessness validation.
- [x] Opt-in live-provider test instructions.
- [ ] Redacted real-provider Atlas run showing expected exit code and artifacts.
- [x] Model replacement/rollback and future-agent extension evidence.

## Out of scope

- A general chat or arbitrary-prompt API.
- Automatic provider failover.
- Provider cost allocation or invoicing.
- Additional workflow endpoints.
- A durable asynchronous job platform.

## Depends on

- `CES-GF-AGB-004`
