# CES-GF-AGB-002 Local Runtime Evidence

**Ticket:** CES-GF-AGB-002  
**Status:** Implemented locally; hosted CI pending

## Implementation

- Added validated environment and injected runtime configuration.
- Added a shared structured-generation executor using registered agents,
  providers, model aliases, policies, and service ceilings.
- Added a Node HTTP server factory and abstract request handler that can be
  instantiated without listening.
- Added health, readiness, and canonical generic execution routes.
- Added timing-safe bearer credential comparison and per-client route/agent
  authorization.
- Added streaming body limits, request IDs, agent and service deadlines,
  sanitized errors, bounded logs, and graceful server close.
- Kept the runtime stateless and isolated from concrete providers and Atlas
  semantic extraction.

## Verification

```text
corepack pnpm --filter @company/ces-agents-bridge typecheck
corepack pnpm exec vitest run \
  apps/agents-bridge/src/server.test.ts \
  apps/agents-bridge/src/core/contracts.test.ts \
  apps/agents-bridge/src/agents/atlas-requirement-extractor/normalize.test.ts \
  tests/architecture.test.ts
```

Focused result after adding the runtime:

```text
Test Files  4 passed (4)
Tests       21 passed (21)
```

Repository validation excluding the independently reproduced Windows
bootstrap-runner timeout file:

```text
corepack pnpm typecheck
corepack pnpm exec vitest run --exclude packages/bootstrap-runner/src/index.test.ts
corepack pnpm build
```

Result:

```text
Typecheck   passed
Test Files  34 passed (34)
Tests       213 passed (213)
Build       passed
```

## Security fixtures

- Missing and malformed bearer credentials return `401`.
- Incorrect credentials and unauthorized agents return `403`.
- Unknown versions, invalid JSON, unsupported methods, and caller-supplied
  execution controls fail before provider execution.
- An oversized first chunk returns `413` without consuming later chunks.
- Deadline errors and structured events contain neither the credential nor a
  confidential source sentinel.
- Health and readiness reveal no provider, model, credential, or quota values.
- Two independent runtime instances execute concurrently without shared state.
