# CES Agents Bridge operations

The Agents Bridge is a stateless internal service. Production callers must
reach it through a trusted ingress that terminates HTTPS. Direct HTTP is only
for loopback development or a protected container network; do not publish port
8787 directly.

## Deployment

Inject `GEMINI_API_KEY` and `AGENTS_BRIDGE_CLIENTS_JSON` from the platform
secret manager. Do not put either value in images, source control, command
history, logs, or deployment manifests. A minimal client configuration is:

```json
[{
  "credentials": ["a-random-secret-of-at-least-16-characters"],
  "identity": {
    "client_id": "requirements-worker-production",
    "audit_identity": "Requirements Worker / production",
    "allowed_agents": ["atlas.requirement-extractor"],
    "allowed_routes": ["/v1/atlas/analyze"],
    "max_concurrency": 2,
    "requests_per_minute": 30
  }
}]
```

Give every workload and environment a distinct identity and credential. Set
`PROVIDER_MAX_CONCURRENCY` below the usable provider quota. The bridge enforces
per-client concurrency and fixed-window request limits plus a provider-wide
concurrency limit. These in-memory limits protect one instance. At larger
scale, inject an implementation of `BridgeAdmissionController` backed by an
atomic shared counter/rate-limit store; reserve and release capacity with a
lease and fail closed when coordination is unavailable.

Build and run locally:

```text
docker build -f Dockerfile.agents-bridge -t ces-agents-bridge:local .
docker run --rm -p 127.0.0.1:8787:8787 \
  -e GEMINI_API_KEY \
  -e AGENTS_BRIDGE_CLIENTS_JSON \
  ces-agents-bridge:local
```

`GET /healthz` proves the process is alive. `GET /readyz` is constructed only
after agent, provider, model, and tool references validate, so a process with
an invalid registry does not begin listening. Neither response exposes
registry, model, or secret details.

## Credential rotation and incidents

To rotate without interruption:

1. Generate a new high-entropy value in the secret manager.
2. Add it to that client's `credentials` array beside the old value and roll
   all instances.
3. Update the caller and verify requests under its `client_id`.
4. Remove the old value and roll all instances again.

To revoke, remove the compromised client or credential and redeploy
immediately. Also rotate the Gemini key if provider access may be exposed,
review bounded request/provider telemetry by client and request ID, reduce or
disable the affected identity at ingress, and record the incident. Never paste
credentials, authorization headers, PRD text, prompts, or provider responses
into the incident record.

## Data handling and observability

Request logs and metrics contain identifiers, route, status, duration, byte and
source counts, provider ID/status, and retry count only. They must never contain
documents, prompts, responses, credentials, or authorization headers. Apply the
organization's security-log retention period to telemetry and the
confidential-document retention period to any upstream/downstream artifacts.
The bridge itself stores no request body, response, session, or artifact after
the request completes. Treat PRDs and derived requirements as confidential in
transit, temporary storage, review tools, and backups.

Multiple instances may run concurrently because registries are immutable after
startup and execution has no local session dependency. Draining an instance
should stop new ingress traffic, allow bounded in-flight requests to finish,
then send `SIGTERM`. A provider outage produces sanitized failures; automatic
provider failover is intentionally not enabled.

## Model and provider lifecycle

Callers select registered agents, never physical models or provider URLs.
Change a model by registering/testing a new physical model behind a controlled
alias, deploying a canary, observing status/retry/duration, and then rolling
out. Roll back by restoring the prior alias mapping. Replacing a provider
requires a registered adapter with compatible structured-output capability and
agent policy authorization; keep the old mapping available until validation is
complete. Rotate provider credentials independently of model alias changes.

## Validation

Normal CI uses mocked providers and does not require network access or keys.
An operator can explicitly run the minimal live-provider probe:

```text
GEMINI_LIVE_TEST=true GEMINI_API_KEY=... \
  corepack pnpm exec vitest run apps/agents-bridge/src/providers/gemini/gemini.live.test.ts
```

For release evidence, deploy behind HTTPS, submit one non-sensitive or approved
Atlas fixture with a dedicated client credential, record the HTTP/CLI exit
status and artifact hashes, and redact all document, prompt, response, and
secret content before attaching evidence.
