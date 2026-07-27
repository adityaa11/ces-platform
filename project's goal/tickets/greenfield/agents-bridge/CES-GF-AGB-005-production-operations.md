# CES-GF-AGB-005 — Agents Bridge: Production Operations

**Phase:** 3D — Central Agent Provider Foundation  
**Parent:** Greenfield Product Suite  
**Status:** Planned

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

## Acceptance criteria

- [ ] Production ingress is HTTPS and the bridge is not documented for direct
      insecure remote access.
- [ ] Credentials can be issued, revoked, and rotated per authorized caller or
      deployment identity.
- [ ] Concurrency and rate limits prevent one caller from exhausting service or
      provider capacity.
- [ ] Logs and metrics support incident diagnosis without PRD text, prompts,
      responses, credentials, or authorization headers.
- [ ] Multiple instances can operate without local session state.
- [ ] Normal CI remains provider-key-free and network-free.
- [ ] The opt-in live test and manual Atlas run succeed with redacted evidence.
- [ ] Data retention and confidential-document responsibilities are explicit.

## Required evidence

- [ ] HTTPS deployment and secret-injection guide.
- [ ] Per-client authentication, rate-limit, and concurrency tests.
- [ ] Metrics and log-redaction snapshots.
- [ ] Multi-instance/statelessness validation.
- [ ] Opt-in live-provider test instructions.
- [ ] Redacted real-provider Atlas run showing expected exit code and artifacts.

## Out of scope

- A general chat or arbitrary-prompt API.
- Automatic provider failover.
- Provider cost allocation or invoicing.
- Additional workflow endpoints.
- A durable asynchronous job platform.

## Depends on

- `CES-GF-AGB-004`

