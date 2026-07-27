# CES Agents Bridge

The centralized CES Agents Bridge executes explicitly registered,
schema-validated agents through controlled provider and model registries.

The runtime provides:

- `GET /healthz`;
- `GET /readyz`;
- `POST /v1/agents/:agentId/execute`;
- bearer authentication and per-client agent authorization;
- streaming request limits and execution deadlines;
- sanitized errors and bounded structured logs;
- injected registries and a server factory that does not listen during
  construction.

Atlas compatibility routing and concrete provider adapters are delivered by
later tickets. AGB-003 adds the first concrete adapter:

- Gemini `generateContent` structured output;
- server-controlled endpoint, API key, model aliases, and physical models;
- bounded responses, completion validation, transient retries, and normalized
  provider failures.

AGB-004 registers `atlas.requirement-extractor@1.0.0`, adds the existing
`POST /v1/atlas/analyze` compatibility contract, and delegates both Atlas entry
routes through the same executor. Atlas outputs remain candidates requiring
human review.

## Configuration

`runtimeConfigFromEnvironment` accepts `AGENTS_BRIDGE_CLIENTS_JSON` for
per-client identities, rotating credentials, authorization, concurrency, and
request-rate limits. `AGENTS_BRIDGE_API_KEY` remains a single-client local
fallback. Production deployments must use the per-client form and inject it
from a secret manager.

Secrets are accepted only by the runtime configuration boundary. They are not
part of agent, provider-neutral request, execution-context, log, or response
contracts.

Production deployment, rotation, incident response, retention, scaling, and
live-test procedures are in `docs/agents-bridge-operations.md`. Production
traffic must use HTTPS through a trusted ingress; direct HTTP is local or
protected-container-network use only.

## Development verification

```text
corepack pnpm --filter @company/ces-agents-bridge typecheck
corepack pnpm exec vitest run apps/agents-bridge/src/server.test.ts
corepack pnpm --filter @company/ces-agents-bridge build
docker build -f Dockerfile.agents-bridge -t ces-agents-bridge:local .
```
