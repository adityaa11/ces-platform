# BSS-005: Agents Bridge service foundation

- **State:** `planned`
- **Review batch:** BSS-BATCH-05
- **Depends on:** BSS-001, BSS-003
- **Baseline:** [Production Baseline](../../atlas-backend-production-baseline.md) §§7, 8, 9, 15, 16; [Architecture Checkpoint](../../atlas-core-architecture-checkpoint-v2.md) — Sections 9–10, Cross-Cutting: Reasoning vs Deterministic Authority

## Outcome

Create the independently deployable Fastify service boundary and provider-neutral execution contract for Agents Bridge without adding model-specific or project-truth behavior.

## Scope

- Create `apps/agents-bridge` as a Fastify Node.js service with environment-based configuration and graceful startup/shutdown.
- Establish health/readiness endpoints and a versioned interactive API boundary.
- Establish an SSE response path for interactive execution.
- Define the generic execution/runtime envelope in `packages/atlas-contracts` so synchronous requests and background workers can use the same contract.
- Keep Atlas retrieval and authorization outside Agents Bridge; the Bridge receives bounded input from Atlas.
- Keep provider integration outside this foundation ticket; the selected first provider adapter is tracked separately in [BSS-008](BSS-008-groq-provider-adapter.md). Final skill definitions, usage pricing, and real reasoning behavior remain later work.

## Acceptance criteria

- Agents Bridge can start independently from `apps/atlas` and exposes documented health/readiness routes.
- The service streams a test response using `text/event-stream` and closes the stream cleanly on completion or cancellation.
- The shared execution contract is provider-neutral and validated at the boundary; no final skill list or CES schema is introduced.
- The runtime contract can be called from both an interactive handler and the later background worker without duplicating execution semantics.
- The service receives only explicit bounded request context; it has no repository implementation that scans Atlas project state.
- Service configuration contains no committed provider secret and has no permission to mutate trusted Atlas state.

## Validation

- Run the Bridge health/readiness integration test independently of the UI app.
- Verify streamed headers, ordered chunks, completion behavior, and cancellation using a test executor.
- Run contract validation against accepted and rejected test payloads.
- Run workspace type-check and tests.

## Review checkpoint

- **Review question:** Can Agents Bridge serve a provider-neutral interactive API and SSE while remaining separate from Atlas truth?
- **Combined acceptance:** Independent Fastify service starts, SSE contract tests pass, execution envelopes validate, and no Atlas truth/retrieval authority is added to the Bridge.
- **Commit to review:** Pending implementation commit.
