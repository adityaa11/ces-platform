# CES-GF-AGB-004 Local Atlas Agent Evidence

**Ticket:** CES-GF-AGB-004  
**Status:** Implemented locally; hosted CI pending

## Implementation

- Registered the mode-specific `atlas.requirement-extractor@1.0.0` definition.
- Added its authoritative input, intermediate, output, policy, prompt,
  line-numbering, source-budget, and transformation behavior.
- Added trusted provider and physical-model identity to execution context
  without exposing credentials.
- Added the strict `1.0.0` Atlas HTTP compatibility envelope and allowlisted
  legacy model mapping.
- Routed generic and compatibility requests through the same shared executor.
- Returned the direct validated `AtlasProviderResult`.
- Retained deterministic source reconstruction, candidate-only review states,
  ID assignment, ordering, and cross-reference remapping from AGB-001.
- Added a mocked existing Atlas CLI-to-bridge run using its unchanged HTTPS
  provider contract.

No automatic review, original PDF-byte upload, additional agent, or public
deployment behavior was added.

## Verification

```text
corepack pnpm typecheck
corepack pnpm exec vitest run --exclude packages/bootstrap-runner/src/index.test.ts
corepack pnpm build
```

```text
Typecheck   passed
Test Files  38 passed (38)
Tests       229 passed (229)
Build       passed
```

The excluded Windows bootstrap-runner process-termination file is the same
independently reproduced baseline timeout documented by AGB-001 and AGB-002.

## Atlas evidence

- Generic and compatibility routes return the same direct schema-valid result.
- Invalid envelopes, contracts, models, nested input, and extra fields fail
  before provider execution.
- Source paths and hashes come from the original request.
- Provider, physical model, prompt-contract version, schema, and review state
  come from trusted execution and agent code.
- Source prompt content is line-numbered without changing the stored input.
- Prompt-injection text remains in the user/source message and cannot alter the
  registered system instructions, model alias, tools, schema, or review policy.
- Source document count and character budgets fail closed.
- Array ordering and temporary model ID changes produce identical normalized
  output.
- Existing unknown-source, range, duplicate, dangling-reference, forbidden
  state, and final-schema fixtures remain green.
- The existing CLI writes review artifacts and returns expected exit code `7`.

