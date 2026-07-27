# CES Agents Bridge

The centralized CES Agents Bridge executes explicitly registered,
schema-validated agents through controlled provider and model registries.

The AGB-002 runtime currently provides:

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

`runtimeConfigFromEnvironment` requires `AGENTS_BRIDGE_API_KEY` and supports
the service ceilings documented in the architecture. Production deployments
will replace the temporary global key with per-client credentials.

Secrets are accepted only by the runtime configuration boundary. They are not
part of agent, provider-neutral request, execution-context, log, or response
contracts.

## Development verification

```text
corepack pnpm --filter @company/ces-agents-bridge typecheck
corepack pnpm exec vitest run apps/agents-bridge/src/server.test.ts
corepack pnpm --filter @company/ces-agents-bridge build
```
