# CES-GF-AGB-001 Local Contract Evidence

**Ticket:** CES-GF-AGB-001  
**Status:** Implemented locally; hosted CI pending

## Implementation

- Added the contract-only `@company/ces-agents-bridge` workspace application.
- Added strict shared schemas for policies, ceilings, model aliases, generic
  requests, clients, execution context, and sanitized errors.
- Added mode-specific structured-generation agent, provider, model, and tool
  registry contracts.
- Added fail-closed duplicate, definition, unresolved-reference, capability,
  authorization, ceiling, and mandatory Atlas review validation.
- Added the Atlas intermediate schema and deterministic trusted normalization.
- Added the architecture assignment with only agent-provider SDK and greenfield
  contract dependencies.
- Recorded trust zones and ownership in
  [`docs/agents-bridge-contracts.md`](../../../../../docs/agents-bridge-contracts.md).

No network server, provider credential, Gemini adapter, or production
deployment was added.

## Local verification

```text
corepack pnpm --filter @company/ces-agents-bridge typecheck
corepack pnpm exec vitest run \
  apps/agents-bridge/src/core/contracts.test.ts \
  apps/agents-bridge/src/agents/atlas-requirement-extractor/normalize.test.ts \
  tests/architecture.test.ts
```

Focused result:

```text
Test Files  3 passed (3)
Tests       13 passed (13)
```

Repository-wide validation:

```text
corepack pnpm check
```

Typechecking completed for all packages and 225 of 227 tests passed. Two
pre-existing Windows process-termination tests in
`packages/bootstrap-runner/src/index.test.ts` hung until Vitest's timeout. They
also hung when rerun alone with a 20-second timeout. No Agents Bridge code is
imported by that package or test.

The build phase was then run independently:

```text
corepack pnpm build
```

All workspace builds, including `apps/agents-bridge`, passed.

## Covered evidence

- Caller payloads cannot add prompts, provider URLs, credentials, physical
  models, schemas, or tools at the generic route boundary.
- Client identities are authorized by both route and registered agent.
- A second fixture agent and provider register without contract changes.
- Duplicate and unresolved registrations fail.
- Invalid identifiers, unsafe physical model strings, and Atlas policies
  without human review fail.
- Policies cannot exceed service ceilings.
- Atlas output is invariant to candidate array ordering.
- Missing source locations sort last.
- Trusted paths, hashes, provider/model identity, and prompt version overwrite
  model-controlled metadata.
- Unknown sources, invalid line ranges, dangling references, duplicate IDs, and
  duplicate semantic candidates fail.
- The fail-closed architecture test recognizes the new workspace package.
