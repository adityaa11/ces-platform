# GO checkpoint: IDSER-012-03-03-02 / IDSER-BATCH-12-03-03-02

- **Ticket:** `IDSER-012-03-03-02` — GHR output compatibility and composition closure.
- **State:** `awaiting_review`.
- **Authorized checkpoint:** owner invocation `GO IDSER-012-03-03-02` on 2026-10-19.
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-03-03-02-ghr-output-compatibility-composition.md`.
- **Consumed predecessors:** CK `PASS` for `IDSER-012-03-01-01`, `-01-02`, `-01-03`, `-02-01`, `-02-02`, `-02-03`, `-03-03-01` (`470e7958` verification), and corrective `-03-03-01A` (`1db4f9c` verification; ticket approval `293ea38b`).
- **Implementation commit:** `e20d7b5b` (`feat(idser): add strict batch-plan ready fixture`).

## Bounded change record

`packages/atlas-db/src/semantic-batch-plan-ready-fixture.ts` adds the sole
non-delivering `SemanticBatchPlanReady/v1` fixture builder/receiver. The
receiver accepts canonical bounded bodies only after checking the persisted
parent/handoff set, parent hash, slot, immutable scope, batch membership and
complete coverage. Arrays beyond 100 raise a typed manifest-pointer blocker;
the receiver never truncates or adds a field.

The production surface is read-only. It introduces no GHR route, issuer,
outbox, queue, acknowledgement, BSS work/admission/reservation/send, SEM
intake/provider call, or semantic/reconciliation/Master/CES effect.

`packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts`
records both the real persisted-member rejection matrix and the required full
accepted-source → resolver → real BSS prospective read → estimator/partition
→ immutable persistence → fixture receiver composition. It includes accepted
RUN-003 derived-media references and before/after forbidden-effect counters.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- |
| `RC-012030302-01` | Real accepted source composes through approved input/resolution, BSS planning, estimation/partition and persistence to positive N handoffs; zero eligible source has no body. | `semantic-batch-plan-ready-fixture.integration.test.ts`, tests `real accepted source composes…` and `NO_ELIGIBLE_SOURCE cannot produce…`; actual parser/resolver, BSS reader, partitioner and `PostgresImmutableSemanticCorpusPlanRepository` used. Command below: PASS, 3/3. | `PROVEN` |
| `RC-012030302-02` | Strict receiver accepts only real persisted refs and rejects wrong/missing/extra/duplicate/foreign/stale hash/count/member/ownership cases. | Same test, `strict non-delivering…`; PostgreSQL parent/handoff validation plus the named rejection matrix. Command below: PASS, 3/3. | `PROVEN` |
| `RC-012030302-03` | Replay preserves immutable prior versions under changed source/asset/REL/profile/structural conditions, using approved persistence semantics. | Existing predecessor replay/cancel/replan regression: `packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts` — PASS, 6/6. Composition test uses the approved persistence interface without reimplementation. | `PROVEN` |
| `RC-012030302-04` | Body/handoffs retain exact BSS policy/provider provenance, REL/visual/context/deferred state and bounded envelope identity without treating unknown RPD as unlimited. | Real composition maps its approved prospective snapshot provenance into the immutable plan and includes the accepted derived-media fixture. `apps/agents-bridge/tests/idser-structural-fit-corpus-partition.test.ts` — PASS, 4/4, including authorized unknown/not-enforced RPD and full coverage. | `PROVEN` |
| `RC-012030302-05` | Non-inert committed plan/body validation has exact zero downstream effects. | Both new PostgreSQL tests compare `pgboss.job`, Bridge attempts/reservations, and document-scoped semantic execution/candidates/reconciliation before/after. Command below: PASS, 3/3. | `PROVEN` |
| `RC-012030302-06` | Fixture is explicitly replaceable by future GHR delivery but is not a route/SEM intake and introduces no limiter, send lane or OPEN-A acceptance. | Production class exposes only `receive` against persisted records; no routing or write dependency. New test's zero-effect assertion plus `corepack pnpm --filter @atlas/db typecheck` — PASS. | `PROVEN` |

## Validation record

```text
corepack pnpm --filter @atlas/db typecheck
PASS

corepack pnpm --filter @atlas/agents-bridge typecheck
PASS

node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check
PASS — Atlas database migration check passed

node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/semantic-batch-plan-ready-fixture.integration.test.ts
PASS — 3 tests, 3 pass, 0 fail, 0 skipped

node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/semantic-batch-plan-input.integration.test.ts
PASS — 1 test, 1 pass, 0 fail, 0 skipped

node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts
PASS — 6 tests, 6 pass, 0 fail, 0 skipped

node --env-file=.env ./apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/idser-structural-fit-corpus-partition.test.ts
PASS — 4 tests, 4 pass, 0 fail, 0 skipped

git diff --check
PASS
```

Every applicable frozen contract row is proven with the ticket-required
harness and observations. No unresolved, unproven, or blocked row remains.

Internal readiness: READY_FOR_CK

This checkpoint is not a CK PASS. Control returns to CK for independent review
of `e20d7b5b`, this bounded evidence, and direct regressions only.
