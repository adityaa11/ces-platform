# BSS-005: Agents Bridge service foundation

- **State:** `approved`
- **Review batch:** BSS-BATCH-05
- **Depends on:** BSS-001, BSS-003
- **Baseline:** [Production Baseline](../../atlas-backend-production-baseline-mistral-synced.md) §§7, 8, 9, 15, 16; [Architecture Checkpoint](../../atlas-core-architecture-checkpoint-v2-mistral-enriched-v2.md) — Sections 9–10, Cross-Cutting: Reasoning vs Deterministic Authority

## Outcome

Create the independently deployable Fastify service boundary and provider-neutral execution contract for Agents Bridge without adding model-specific or project-truth behavior.

## Scope

- Create `apps/agents-bridge` as a Fastify Node.js service with environment-based configuration and graceful startup/shutdown.
- Add the Bridge as a root Compose service so `docker compose up` starts it after its required dependencies are ready; define its health/readiness check and graceful stop behavior there.
- Establish health/readiness endpoints and a versioned interactive API boundary.
- Establish an SSE response path for interactive execution.
- Define the generic execution/runtime envelope in `packages/atlas-contracts` so synchronous requests and background workers can use the same contract.
- Keep Atlas retrieval and authorization outside Agents Bridge; the Bridge receives bounded input from Atlas.
- Keep provider integration outside this foundation ticket; the selected first provider adapter is tracked separately in [BSS-008](BSS-008-groq-provider-adapter.md). Final skill definitions, usage pricing, and real reasoning behavior remain later work.

## Acceptance criteria

- Agents Bridge can start independently from `apps/atlas` and exposes documented health/readiness routes.
- `docker compose up` boots the Bridge without a separate manual process-start command, and the Compose health/readiness result reflects the service's availability.
- The service streams a test response using `text/event-stream` and closes the stream cleanly on completion or cancellation.
- The shared execution contract is provider-neutral and validated at the boundary; no final skill list or CES schema is introduced.
- The runtime contract can be called from both an interactive handler and the later background worker without duplicating execution semantics.
- The service receives only explicit bounded request context; it has no repository implementation that scans Atlas project state.
- Service configuration contains no committed provider secret and has no permission to mutate trusted Atlas state.

## Validation

- Run the Bridge health/readiness integration test independently of the UI app.
- Boot the complete supported local stack with `docker compose up` and verify the Bridge's Compose health/readiness result.
- Verify streamed headers, ordered chunks, completion behavior, and cancellation using a test executor.
- Run contract validation against accepted and rejected test payloads.
- Run type-check and tests for Agents Bridge and its directly affected contracts; the ticket-set fixture-suite exclusion applies.

## Review checkpoint

- **Review question:** Can Agents Bridge serve a provider-neutral interactive API and SSE while remaining separate from Atlas truth?
- **Combined acceptance:** Independent Fastify service starts, SSE contract tests pass, execution envelopes validate, and no Atlas truth/retrieval authority is added to the Bridge.
- **Commit to review:** `HEAD` (the BSS-005 checkpoint commit).

## Implementation checkpoint

- Added `@atlas/contracts` with a versioned, AJV-validated provider-neutral execution envelope and a single `ReasoningRuntime` interface shared by interactive and future background callers.
- Added the independently runnable Fastify Agents Bridge with health (`/healthz`), readiness (`/readyz`), and versioned interactive SSE (`/v1/interactive/execute`) boundaries. It only accepts explicit bounded context and has no Atlas retrieval, repository, or trusted-state mutation path.
- Added a deterministic test runtime solely for service-foundation validation; no provider adapter, provider secret, final skill registry, or CES schema is introduced.
- Added Compose boot, health checking, and graceful signal shutdown. The Compose-managed service was verified healthy and returned ordered SSE `text` then `complete` events at `http://127.0.0.1:3002`.
- Verified accepted/rejected contract inputs; service health/readiness; ordered streaming completion; client cancellation propagation; both directly affected package type-checks; and both directly affected test suites.
