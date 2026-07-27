# CES-GF-AGB-003 Local Gemini Provider Evidence

**Ticket:** CES-GF-AGB-003  
**Status:** Implemented locally; hosted CI pending

## Implementation

- Added a Gemini structured-generation provider with injected native-fetch
  transport, delay, clock, and randomness.
- Added server-only Gemini configuration and controlled alias-to-model mapping.
- Added trusted `generateContent` URL and request translation.
- Added recursive Gemini JSON Schema subset sanitization while retaining final
  application-side Zod validation.
- Added exact single-candidate, prompt-block, finish-state, joined-content,
  JSON, intermediate-schema, response-size, usage, and model-version handling.
- Added transient network/HTTP retries, bounded jitter, bounded `Retry-After`,
  cancellation, and typed sanitized failures.
- Extended provider context with trusted physical model, attempt, and response
  byte limits.
- Added an architecture guard prohibiting Atlas schema imports in production
  provider code.

No live network request, Atlas prompt, provenance transformation, or automatic
model fallback was added.

## Verification

Focused:

```text
corepack pnpm --filter @company/ces-agents-bridge typecheck
corepack pnpm exec vitest run \
  apps/agents-bridge/src/providers/gemini/provider.test.ts \
  apps/agents-bridge/src/server.test.ts \
  apps/agents-bridge/src/core/contracts.test.ts \
  apps/agents-bridge/src/agents/atlas-requirement-extractor/normalize.test.ts \
  tests/architecture.test.ts
```

```text
Test Files  5 passed (5)
Tests       30 passed (30)
```

Repository validation excluding the independently reproduced Windows
bootstrap-runner timeout file:

```text
corepack pnpm typecheck
corepack pnpm exec vitest run --exclude packages/bootstrap-runner/src/index.test.ts
corepack pnpm build
```

```text
Typecheck   passed
Test Files  35 passed (35)
Tests       223 passed (223)
Build       passed
```

## Security and behavior fixtures

- Captured requests prove the fixed Google API root, `x-goog-api-key`, trusted
  model, system instruction, role translation, structured schema, one
  candidate, and output-token limit.
- Unknown aliases and physical-model mismatches fail before fetch.
- `429`, supported `5xx`, and temporary network failures retry within the
  trusted attempt budget.
- Provider `400`, authentication failures, malformed output, and schema
  failures do not retry.
- Excessive `Retry-After` falls back to bounded jitter.
- Abort failures become `PROVIDER_TIMEOUT`.
- Missing, multiple, blocked, empty, truncated, malformed, oversized, and
  schema-invalid responses become `PROVIDER_RESPONSE_INVALID`.
- Errors contain no API key, prompt/source sentinel, or provider response body.
- Every test injects transport; normal tests cannot reach Gemini.

