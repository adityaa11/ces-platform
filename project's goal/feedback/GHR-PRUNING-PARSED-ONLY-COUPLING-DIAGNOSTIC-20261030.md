# GHR Parsed-Only Pruning Coupling Diagnostic

**Diagnostic date:** 2026-10-30  
**Mode:** read-only source, history, import, configuration, and test-reference audit.  
**Inspected branch:** `atlas-rebase`  
**Inspected HEAD:** `70180ccb0cf923f2ae2ce3e2144d97fa85aa2e1c` (`chore(db): remove legacy migrations for schema rebuild`)  
**Working tree at audit start:** clean; branch one commit ahead of `origin/atlas-rebase`.  
**Decision:** `COUPLED_BOUNDARY_REWORK_REQUIRED`

This diagnostic records coupling only. It does not change application code,
restore migrations, or authorize the pruning implementation.

## Target contract

The requested retained GHR boundary is:

```text
NormalizedDocumentAccepted/v1
  -> authenticated GHR envelope
  -> can_continue=false
  -> POST /internal/semantic/batch-plan
  -> envelope and payload validation
  -> parsed_only acknowledgement
  -> stop
```

The endpoint remains `/internal/semantic/batch-plan`. The semantic batch-plan
acceptance, planner queue, capacity consumer, and all continuation behavior for
`can_continue=true` are outside the retained boundary.

The requested target matches the historical pre-`94ba8bfa` implementation:

- the route used policy/handler `v1` and `canContinue: false`;
- the issuer serialized `can_continue:false`;
- the receiver rejected `true` and returned `parsed_only`;
- the HTTP acknowledgement used `parsed_only` and did not call a durable
  planning acceptance store.

The current branch is the later v2 implementation and has the opposite
behavior.

## Executive findings

1. **The endpoint is separable, but the current perceived terminal is not.**
   `PostgresPerceptionAuthority.deliver()` updates the member to `perceived`
   and the perception execution to `completed`, then issues the GHR intent and
   enqueues the GHR pointer in the same database transaction. If current GHR
   issuance or queue publication fails, the perceived transition rolls back.

2. **The current GHR route is coupled to semantic planning.**
   The route declares `canContinue: true`; the issuer emits `true`; the receiver
   requires `true`, calls `BatchPlanAcceptanceStore.accept()`, and returns
   `planning_accepted`.

3. **The continuation code has a bounded removal seam.**
   The planner is reached through the acceptance store and the separate
   `bridge-semantic-batch-plan-v1` queue. The generic GHR delivery queue and
   authenticated HTTP endpoint can remain while this continuation is removed.

4. **Composition imports create secondary coupling.**
   The Atlas perception plugin initializes semantic queues, semantic acceptance,
   reconciliation acceptance, and the generic handoff queue together. Removing
   planner files without splitting this composition will cause startup or build
   failures even when perception itself stops at `perceived`.

5. **The deleted migrations are an independent rebuild blocker.**
   `packages/atlas-db/scripts/migrate.mjs` still names the removed migration
   files. The new GHR parsed-only schema and the perception schema therefore
   need to be rebuilt together later; this diagnostic does not alter that
   runner.

## Coupling map

| Area | Current code | Coupling observed | Classification |
|---|---|---|---|
| Perceived terminal | `packages/atlas-db/src/perception-authority.ts`, `PostgresPerceptionAuthority.deliver` | Staged acceptance emits a GHR intent and enqueues `atlas-generic-handoff-v1` before the transaction commits. | **Hard runtime coupling** |
| GHR issuer | `packages/atlas-db/src/generic-handoff-issuer.ts` | Imports `canonicalSemanticBatchPlanInputV1`; emits route/handler `v2`, `can_continue:true`; requires an enabled v2 true policy row. | **Must be changed, issuer retained** |
| GHR route declaration | `apps/agents-bridge/src/ghr/routes/semantic/branches/batch-plan.route.ts` | Declares `canContinue:true`, policy `v2`, handler `v2`. | **Must revert to parsed-only contract** |
| GHR receiver | `apps/agents-bridge/src/ghr/routes/semantic/receivers/batch-plan.receiver.ts` | Requires `true`, requires `BatchPlanAcceptanceStore`, parses planning input, returns `planning_accepted`. | **Continuation coupling; prune acceptance call** |
| HTTP endpoint | `apps/agents-bridge/src/ghr/authenticated-batch-plan-http-receiver.ts` | Registers the retained path but imports planning conflict handling and returns HTTP 202 for planning acceptance. | **Retain endpoint; simplify response path** |
| HTTP acknowledgement | `apps/agents-bridge/src/ghr/http-dispatcher.ts` | Accepts only `planning_accepted`. | **Retain transport; change acknowledgement to `parsed_only`** |
| Durable planner acceptance | `apps/agents-bridge/src/idser-semantic-batch-plan-job.ts` | Calls `bridge.accept_semantic_batch_plan`; owns planning job claim and completion. | **Prune continuation** |
| Planner worker | `apps/agents-bridge/src/worker.ts` | Declares `semanticBatchPlanQueue` and consumes it when a planner handler is supplied. | **Remove planner queue declaration/consumer; retain generic GHR consumer** |
| Planner composition | `apps/agents-bridge/src/worker-main.ts`, `production-worker-composition.ts` | Builds capacity consumer, resolver, estimator, and `runSemanticBatchPlanJob`; passes it into the worker. | **Prune planner branch** |
| Planner configuration | `apps/agents-bridge/src/config.ts` | Requires estimator and v2 capacity snapshot bindings whenever GHR HTTP transport is configured. | **Split GHR transport config from planner config** |
| Atlas plugin composition | `apps/atlas/perception-internal.ts` | Initializes semantic queue, perception queue, generic handoff queue, semantic DB authorities, extraction acceptance, and reconciliation acceptance in one plugin. | **Shared composition coupling** |
| Fastify app | `apps/agents-bridge/src/app.ts`, `main.ts` | Wires `batchPlanAcceptance` into the endpoint. | **Remove acceptance dependency; retain route registration** |
| GHR body contract | `apps/agents-bridge/src/ghr/routes/semantic/bodies/semantic-batch-plan-input.v1.ts`, `packages/atlas-db/src/semantic-batch-plan-input.ts` | Parsed-only GHR still needs a strict canonical payload parser unless the retained contract is deliberately changed. | **Retain narrow parser or replace with a GHR-owned contract** |
| GHR delivery | `apps/agents-bridge/src/ghr/delivery-worker.ts`, `http-dispatcher.ts`, `apps/agents-bridge/src/queue.ts` | Pointer loading, policy verification, lease/receipt fencing, and HTTP dispatch are independent of planner execution. | **Retain** |

## Detailed runtime path and cut points

### 1. Perception acceptance

`PostgresPerceptionAuthority.deliver()` validates the normalized document and
derived assets, writes the normalized cache, then enters the staged bundle
branch. In that branch it:

1. sets `extraction_bundle_document.state='perceived'`;
2. sets `document_perception_execution.state='completed'`;
3. issues `NormalizedDocumentAccepted/v1` through `PostgresGenericHandoffIssuer`;
4. enqueues the opaque GHR pointer transactionally; and
5. admits the next staged perception item after the transaction.

The first two writes are the requested perception terminal. The third and
fourth are the GHR coupling. They must either remain as parsed-only GHR
publication or be explicitly detached; deleting only the planner consumer is
unsafe because the transaction would still expect the v2 issuer/policy and
queue path.

### 2. Current v2 continuation

The current continuation is:

```text
generic_handoff_intent(v2, can_continue=true)
  -> atlas-generic-handoff-v1 pointer job
  -> delivery-worker
  -> POST /internal/semantic/batch-plan
  -> BatchPlanAcceptanceStore.accept()
  -> bridge.accept_semantic_batch_plan()
  -> bridge-semantic-batch-plan-v1
  -> claim_semantic_batch_plan()
  -> accepted document resolver
  -> structural-fit/capacity planner
  -> complete_semantic_batch_plan()
```

Everything after the HTTP receiver's parse/validation step is continuation
code and is a pruning candidate.

### 3. Retained parsed-only boundary

The historical retained behavior is:

```text
generic_handoff_intent(v1, can_continue=false)
  -> atlas-generic-handoff-v1 pointer job
  -> delivery-worker
  -> POST /internal/semantic/batch-plan
  -> validate exact route + false continuation + canonical payload
  -> HTTP parsed_only acknowledgement
```

This keeps GHR authentication, immutable issuance, pointer-only queue payloads,
dispatch policy, lease fencing, and receipt behavior. It does not create a
durable semantic planning acceptance or a planner job.

## Retain versus prune matrix

### Retain for the requested target

- `PostgresGenericHandoffIssuer`, changed to the false-only v1 contract.
- `generic_handoff_intent` issuance and route-policy checks.
- `atlas-generic-handoff-v1` producer and consumer.
- `delivery-worker.ts` pointer loading, integrity checks, route-policy checks,
  leases, receipts, retry handling, and HTTP dispatch.
- `batch-plan.route.ts`, with the same endpoint path but `canContinue:false`.
- `authenticated-batch-plan-http-receiver.ts`, without planner acceptance.
- `batch-plan.receiver.ts`, as a strict parse-only receiver.
- The canonical body parser needed by the retained GHR contract.
- Perception acceptance, normalized cache, derived-asset verification, and the
  `perceived` terminal.

### Prune or detach

- `BatchPlanAcceptanceStore` and `createPostgresSemanticBatchPlanAcceptanceStore`.
- `bridge.accept_semantic_batch_plan`, `claim_semantic_batch_plan`, and
  `complete_semantic_batch_plan` calls from the application composition.
- `semanticBatchPlanQueue`, its queue declaration, parser, and worker consumer.
- `runSemanticBatchPlanJob` and its resolver/estimator/capacity-planning
  dependencies.
- The `batchPlanAcceptance` construction in `main.ts` and its app option.
- Planner-specific configuration gating in `config.ts`.
- v2-only route, handler, policy, and `planning_accepted` acknowledgement
  expectations in source and tests.

### Conditional shared dependencies

`packages/atlas-db/src/semantic-batch-plan-input.ts` and the GHR body adapter
are named for planning but are still used by the retained issuer/parser. They
cannot be deleted solely because execution planning is pruned. Either retain a
narrow parser for the GHR body contract or replace it with a new GHR-owned
parsed-only contract before deleting the semantic-named module.

`capacity-planning-snapshot.ts` and its HTTP endpoint are not required by the
parsed-only GHR transport itself. They may have other BSS consumers, so their
removal requires a separate reference audit.

## Tests and historical evidence

Current source/test references still prove the v2 continuation path:

- `apps/agents-bridge/tests/ghr-04c-v2-durable-acceptance.integration.test.ts`
  expects v2, `can_continue=true`, durable acceptance, and planner delivery.
- `apps/agents-bridge/tests/ghr-03a-semantic-receiver.test.ts` and related
  receiver/dispatcher tests contain parsed-only-era assumptions and need to be
  realigned with the retained v1 contract.
- Historical source at `94ba8bfa^` contains the exact false-only receiver,
  issuer, route, and dispatcher behavior that matches this target.

No tests were run in this diagnostic. The deleted migrations make a fresh
database run unavailable until the migration rebuild is authored.

## Recommended implementation order

1. Restore the false-only v1 GHR contract from the historical behavior, using
   focused patches rather than a broad revert.
2. Remove planner acceptance and planner queue composition from the Bridge.
3. Split `perception-internal.ts` so perception/GHR parsed-only setup does not
   initialize semantic extraction/reconciliation authorities.
4. Re-run static import/reference scans for `planning_accepted`, `true`, v2
   policy pins, planner queue names, and planner SQL functions.
5. Rebuild migrations only after the retained code stabilizes; include the GHR
   v1 false-only policy and the minimal perception/GHR tables/functions.
6. Add focused tests proving: false is accepted, true is rejected, the endpoint
   remains authenticated, no planner acceptance call occurs, and perceived
   completion remains atomic with parsed-only GHR publication.

## Implementation follow-up

The parsed-only pruning was applied after this diagnostic:

- route and issuer are back on policy/handler `v1` with `can_continue:false`;
- GHR delivery no longer reads or binds `can_continue` before dispatch;
- only the semantic batch-plan endpoint/receiver interprets the continuation
  field;
- HTTP acknowledgement is `parsed_only`;
- async planner acceptance, planner queue wiring, and the v2 acceptance test
  were removed;
- the deleted migration runner entry for `0108_ghr_idser_async_batch_plan_acceptance`
  was removed as well.

The future rebuilt `atlas.is_generic_handoff_dispatch_policy_active_v1` function
must match this boundary too: it should authorize from the persisted header
pins only and must not add a `can_continue` predicate.

No database or runtime tests were run because the migration set is intentionally
empty pending the rebuild.

