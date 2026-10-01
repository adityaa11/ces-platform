# GO checkpoint: IDSER-010-06 / IDSER-BATCH-10-06

- **Ticket:** `IDSER-010-06-integrated-deterministic-compose-regression-checkpoint.md`
- **State:** `awaiting_review`
- **Reviewed base:** `df92532` (`docs(idser): approve 010-05 checkpoint`)
- **Approved predecessors:** IDSER-010-01 (`3f0ebae`), IDSER-010-02 (`52545a9`), IDSER-010-03-01 (`537dd80`), IDSER-010-03-02 (`f919439`), IDSER-010-04 (`ec1973a`), and IDSER-010-05 (`df92532`).
- **Scope:** final deterministic composition and evidence only. No production lifecycle, persistence, worker, provider, concurrency, or replay authority changed.

## Bounded implementation

- Extended the disposable production-shaped Compose harness with Scenario G. A controlled Mistral response supplies an invalid evidence locator; the real worker and authenticated Atlas handoff contain it as `needs_attention`, with no accepted result, candidate, progress, or successor execution.
- Added final negative-authority observations to that same harness: every controlled project retains empty Master; `resolved_knowledge`, approval, publication, review-decision, projection, CES, conversation, Addendum, workspace-revision, and workspace-HEAD relations are absent.
- Repaired the existing browser-test-only pg-boss hold/release helper to execute one PostgreSQL statement per prepared query and compare the queue document identifier as text. This preserves its existing trigger semantics and makes the required PCC browser matrix executable on the current PostgreSQL driver.

## AC ledger reconciliation

The immutable parent ledger in `IDSER-010-deterministic-compose-and-regression-checkpoint.md` maps every AC-01–AC-40 to exactly one approved proof child and final owner `010-06`. GO rechecked all 40 rows against the six approved child checkpoints above: AC-01, 30–32, and 39–40 are final-composition observations here; the remaining rows retain their primary child evidence. No AC has an orphan, ambiguous owner, or new downstream owner.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / exact validation | Status |
|---|---|---|---|
| `RC-010-06-01` | Actual configured services compose A–H; every required scenario executes and links its child evidence. | `node apps/agents-bridge/tests/idser-010-compose.mjs` — passed. The disposable isolated stack exercised A/B normal/conflict, C support/duplicate, D contradiction, E ordering, F concurrent identities/context/results, G invalid evidence containment, and H staged replay/restart. Scenario G recorded `needs_attention`, 0 completed, 1 failed execution, and 0 result/candidate/successor. Scenario F recorded two disjoint project/workspace/bundle/document/execution scopes, four completed scoped jobs, 400 foreign-context denial, 409 foreign-result denial, and 422 foreign-reference denial without target/control mutation. Scenario H recorded one resumed Atlas-bound envelope equal to the staged SHA-256 and exactly one scoped extraction provider call. Child checkpoints `10-01`, `10-02`, `10-03-01`, `10-03-02`, `10-04`, and `10-05` are linked above. | PROVEN |
| `RC-010-06-02` | AC-01–40 ledger is complete with one child evidence locator and final owner; compositional observations cover completion, card progress, conflict, replay, concurrency, and hard stop. | Reconciled the parent AC-01–40 ledger to the approved child checkpoints. The Compose run re-observed ready 1/1 card outcomes, unresolved conflict without promotion, C/D/E ordering and relationship outcomes, F isolation, G hard stop, and H replay/fencing. `docker compose exec -T atlas corepack pnpm --filter @atlas/app test:browser` — passed 11/11, including IDSER-009-04 lifecycle/card regression and PCC-005 production/fixture flows. | PROVEN |
| `RC-010-06-03` | Required PCC/BSS/auth/demo/application/CSP/browser regressions run; no non-pass is represented as success. | `docker compose exec -T atlas corepack pnpm --filter @atlas/db migration:check` — passed. `docker compose exec -T atlas corepack pnpm -r --if-present typecheck` — passed. `docker compose exec -T atlas corepack pnpm --filter @atlas/app build` — passed. `docker compose exec -T atlas corepack pnpm --filter @atlas/app exec node --test tests/rendered-html.test.mjs` — passed 7/7, including strict CSP. Browser command above passed 11/11 after installing the documented Playwright Chromium prerequisite. `docker compose exec -T atlas corepack pnpm --filter @atlas/app lint` was executed and failed only on pre-existing out-of-scope `RuntimeFixtureRoute.tsx` synchronous-effect and `vite.config.ts` unused-variable diagnostics; this is recorded as an unrelated existing regression, not a pass. | PROVEN |
| `RC-010-06-04` | No downstream truth or secret leakage appears across success, G failure, H replay, or F concurrency; Master remains empty and Bridge has no direct mutation authority. | Compose negative-authority observation covered all ten controlled projects: `nonemptyMasters: 0`; all ten prohibited relations were absent. Scenario F asserted `has_schema_privilege('agents_bridge','atlas','USAGE') = false`, and all scoped IDs/logged envelopes are safe identifiers/hashes only. The controlled endpoint uses the test key only; no credential or raw secret was written to the durable checkpoint. | PROVEN |

## Environment and validation notes

- The authoritative deterministic test command uses no live Mistral credential and the controlled local provider only. IDSER-011 remains the sole owner of live Mistral validation.
- The direct host `pnpm` checks could not resolve local `pdfjs-dist`/`tsc`; Compose is the ticket-required execution environment and supplied the passing build/typecheck/browser evidence above.
- The first browser invocation correctly reported a missing Chromium executable. The repository-prescribed `playwright install --with-deps chromium` completed in the Compose test container; the rerun passed 11/11.
- The transient one-off rendered-HTML invocation lacked a built `dist/server`; building in the persistent Compose app service before its direct rendered-HTML command produced the passing 7/7 result above.

Internal readiness: READY_FOR_CK

GO makes no PASS determination. CK must decide the four frozen composition rows from this checkpoint.
