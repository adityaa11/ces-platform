# CK review: IDSER-012-03-03-02 / IDSER-BATCH-12-03-03-02

- **Ticket:** `IDSER-012-03-03-02` — GHR output compatibility and composition closure.
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-03-03-02-ghr-output-compatibility-composition.md`.
- **GO checkpoint:** `project's goal/feedback/IDSER-BATCH-12-03-03-02-go-checkpoint.md`.
- **Checkpoint revision:** `e4acc48e` (`docs(idser): record 03-03-02 GO checkpoint`).
- **Reviewed implementation commit:** `e20d7b5b` (`feat(idser): add strict batch-plan ready fixture`).
- **Ticket state:** `awaiting_review`.
- **Review kind:** first consolidated CK review.
- **Worktree:** unrelated modified/untracked entries and later GO documentation were present and preserved; the reviewed production file and integration test are unchanged after `e20d7b5b`, so the implementation target is unambiguous.
- **Result:** `CHANGES_REQUIRED`.

## Review Contract assessment

| Row | Status | Evidence reviewed |
| --- | --- | --- |
| `RC-012030302-01` | `PROVEN` | The real composition test uses the accepted input fixture, resolver, BSS prospective reader, estimator, structural partitioner, immutable repository and fixture receiver. The separate partition regression proves typed `NO_ELIGIBLE_SOURCE`, and the fixture builder rejects an empty persisted handoff set. |
| `RC-012030302-02` | `UNRESOLVED` | Exact body/member syntax, parent membership, count, duplicate, foreign-ref and stale-hash checks exist, but the receiver does not compare persisted eligible ownership to handoff `ownedLocators`; the integration matrix also does not exercise the named oversized-field and typed oversized-manifest cases. See `CK-001`. |
| `RC-012030302-03` | `IMPLEMENTED_UNPROVEN` | The approved predecessor persistence suite proves synthetic replay, recovery, cancellation and replan behavior, but the current real accepted-source composition persists and receives only once; it does not replay that composed input across the ticket-named changed source/asset/REL/profile/structural conditions. See `CK-002.a`. |
| `RC-012030302-04` | `IMPLEMENTED_UNPROVEN` | The composition constructs accepted media, REL, BSS provenance, units and envelopes, but only validates the returned body. It does not inspect the stored plan/handoff content to prove exact provenance, visual/context/deferred state and envelope retention on the composed path. See `CK-002.b`. |
| `RC-012030302-05` | `IMPLEMENTED_UNPROVEN` | Before/after counters cover pg-boss, attempts, reservations, semantic executions, candidates and reconciliation, but omit available BSS work/admission, dispatch/transport/send, semantic evidence and knowledge-index surfaces required by the ticket. See `CK-002.c`. |
| `RC-012030302-06` | `PROVEN` | The production receiver has only a fixed read query and `receive` method, imports no route/issuer/outbox/queue/provider/SEM delivery surface, and the cited typechecks and zero-effect assertions pass. |

## Validation performed

- `corepack pnpm --filter @atlas/db typecheck` — PASS.
- `corepack pnpm --filter @atlas/agents-bridge typecheck` — PASS.
- `node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check` — PASS (`Atlas database migration check passed`).
- `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts` — PASS (3 tests, 3 pass, 0 fail, 0 skipped).
- `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/semantic-batch-plan-input.integration.test.ts` — PASS (1 test, 1 pass, 0 fail, 0 skipped).
- `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts` — PASS (6 tests, 6 pass, 0 fail, 0 skipped).
- `node --env-file=.env ./apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/idser-structural-fit-corpus-partition.test.ts` — PASS (4 tests, 4 pass, 0 fail, 0 skipped).
- `git diff --check e20d7b5b^ e20d7b5b` — PASS.

Inspected the frozen ticket, GO closure record, the reviewed production and test diff, the approved immutable-plan repository/test, the structural partition regression, and the predecessor CK PASS artifacts. The required predecessor CK gates, including corrective `IDSER-012-03-03-01A`, are present.

## Findings

### CK-001 — Strict receiver ownership and bounded-input closure is incomplete

The receiver proves the body references a persisted parent/handoff identity, but it does not prove the ticket-required complete once-only owned coverage, and the required bounded rejection observations are not all executed.

**Ticket authority:** The Authorized scope requires rejection of missing/extra/duplicate/oversized fields, a typed blocker for an oversized array, wrong parent/member/hash/count/ownership cases and incomplete owned coverage. `RC-012030302-02` requires the strict receiver to validate real stored plan/handoff ownership and reject the named invalid cases.

**Evidence:** `packages/atlas-db/src/semantic-batch-plan-ready-fixture.ts:120-128` reads `plan_content` and `handoff_content` but checks only plan version/scope/batch IDs and handoff version/parent/batch/slot. It never compares the parent eligible `proposal.units` with each persisted handoff's `ownedLocators`, or verifies once-only complete owned coverage. `packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts:88-96` covers several body/member cases but does not exercise a too-long opaque field, a body over `maxBodyBytes`, or `SemanticBatchPlanReadyManifestRequiredError` for `batchCount > 100`.

## Frozen Finding Closure Matrix

| Clause | Exact ticket authority | Unsatisfied evidence | Binary closure oracle | Direct-regression boundary |
| --- | --- | --- | --- | --- |
| `CK-001.a` | Authorized scope ownership requirement and `RC-012030302-02`: the receiver must reject incomplete, foreign or duplicate owned coverage and accept only real persisted scoped handoffs. | The receiver never inspects persisted eligible units or handoff `ownedLocators`; current tests therefore cannot prove the ownership boundary. | **PASS iff** the committed receiver validation and a real PostgreSQL receiver assertion prove that the referenced persisted plan's eligible locator set is covered exactly once by the referenced handoffs' owned locators, and a missing, foreign or duplicate/incomplete ownership state is rejected. The evidence must identify the exact persisted-content check and passing test command. | Preserve the existing parent/hash/ref/scope/slot checks, immutable persistence boundary and non-delivering behavior; do not add GHR, BSS execution, SEM intake or downstream writes. |
| `CK-001.b` | Authorized scope's explicit oversized-field and oversized-array rejection requirements; `RC-012030302-02` named strict bounded validation. | The implementation has size predicates, but the required too-long field/body and typed manifest-pointer blocker observations are absent from the committed integration matrix. | **PASS iff** the committed test proves a too-long bounded opaque field or body is rejected and proves a body with more than 100 handoff entries raises `SemanticBatchPlanReadyManifestRequiredError` without truncation or a generated field, while the existing rejection matrix remains passing. Evidence must be the exact assertions and passing command. | Keep the v1 four-field body and 100-entry ceiling unchanged; no manifest-pointer version or GHR route is authorized by this clause. |

### CK-002 — Real composition does not close replay, provenance, and complete zero-effect evidence

The end-to-end test reaches the intended positive path, but the current evidence stops at one persist/receive and a partial counter set. The cited predecessor tests are useful regression evidence, but they do not substitute for the current ticket's composed-path observations.

**Ticket authority:** `RC-012030302-03` requires replay across changed source/asset/REL/profile/structural conditions; `RC-012030302-04` requires exact BSS, provider, REL, visual/context/deferred and bounded-envelope retention; and `RC-012030302-05` requires exact zero effects across GHR, BSS, SEM, semantic-truth and reconciliation surfaces.

**Evidence:** `packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts:152-162` builds one real accepted-source `immutableInput`, persists once, receives once, and compares only jobs, attempts, reservations, semantic executions, candidates and reconciliation. It does not replay the composed input under the ticket-named changed conditions, query the stored immutable plan/handoff content for the exact provenance/state/envelope fields, or include available `bridge.provider_work_admission_v1`, `bridge.provider_work_dispatch`/transport, `atlas.semantic_evidence`, and `atlas.knowledge_index` counters.

| Clause | Exact ticket authority | Unsatisfied evidence | Binary closure oracle | Direct-regression boundary |
| --- | --- | --- | --- | --- |
| `CK-002.a` | `RC-012030302-03`: replay the composed path and preserve immutable prior versions across changed source/asset/REL/profile/structural conditions using the approved persistence interface. | The real accepted-source composition has one persist/receive only; the cited replay suite uses synthetic predecessor inputs rather than the composed accepted-source path. | **PASS iff** the committed real composition harness replays the same accepted-source-derived immutable input and exercises the ticket-named changed source/media/REL/profile/structural conditions through the approved repository, proving same-input identity stability and that changed authorized versions do not mutate the prior plan/handoffs. Evidence must identify the assertions and passing real-Postgres command. | Use the existing parser/resolver, BSS reader, estimator, partitioner and immutable repository interfaces; do not reimplement recovery or activate any downstream execution/delivery path. |
| `CK-002.b` | `RC-012030302-04`: every body/referenced handoff retains exact BSS policy/provider provenance, REL/visual/context/deferred state and bounded envelope identity without treating unknown RPD as unlimited. | The composition maps these values into `immutableInput` but never reads back and asserts the stored plan/handoff content for the real accepted-source run. | **PASS iff** the real composition test queries the stored immutable plan and every referenced handoff and proves exact equality of accepted BSS provenance, media/REL state, eligible/deferred units, owned/context locators and bounded resource envelopes, including the authorized unknown/not-enforced RPD treatment. Evidence must be the committed readback assertions and passing command. | Preserve reference-only metadata, accepted media authority, unknown-RPD semantics and the existing non-delivering output body; do not persist raw source, prompt, bytes or credentials. |
| `CK-002.c` | `RC-012030302-05`: positive non-inert plan/body validation must have exact zero GHR issue/outbox/forward/ack, BSS work/attempt/reservation/send, SEM call/intake/fragment, Atlas candidate/evidence/index and reconciliation/Master/CES effects. | The current before/after query omits available BSS work/admission, dispatch/transport/send, semantic evidence and knowledge-index counters, so its equality assertion cannot prove the complete required zero-effect surface. | **PASS iff** the real positive composition and receiver validation capture before/after counts for every available ticket-named surface, including `bridge.provider_work_admission_v1`, dispatch/transport/send state, `atlas.semantic_evidence` and `atlas.knowledge_index`, and prove zero delta while preserving the existing document-scoped checks. Absent GHR/Master/CES routes remain bounded by the repository's available instrumented surfaces and are not invented. | No queue/outbox/router/provider/SEM/reconciliation implementation may be added; the correction is evidence and boundary validation only. |

## Scope observations

None. These are implementation/evidence deficiencies directly traceable to the frozen ticket. No GHR activation authority, new provider/runtime/deployment target, architecture decision, policy decision, or predecessor reopening is required.

## Decision

`CHANGES_REQUIRED`. The frozen closure target is exactly `CK-001.a` through `CK-001.b` and `CK-002.a` through `CK-002.c`. One bounded remediation must address all five clauses, commit the remediation, and return to CK for verification. No additional findings are opened by this review.
