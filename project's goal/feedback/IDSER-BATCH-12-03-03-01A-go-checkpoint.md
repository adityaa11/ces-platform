# GO Checkpoint — IDSER-012-03-03-01A

- **Ticket:** `IDSER-012-03-03-01A` — Canonical RUN-003 derived-media reference compatibility at immutable plan persistence.
- **Batch:** `IDSER-BATCH-12-03-03-01A`.
- **State:** `awaiting_review`.
- **Authorized checkpoint:** owner invocation `GO IDSER-012-03-03-01A` on 2026-10-19.
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-03-03-01A-derived-media-ref-persistence-compatibility.md`.
- **Consumed predecessors:** `IDSER-012-03-01-02` CK PASS and `IDSER-012-03-03-01` CK PASS at `470e7958ce553bee68e44b60f757bc6e74f59b99`; historical evidence was retained unchanged.
- **Implementation commit:** `51576897` (`fix(idser): accept canonical derived media refs`).

## Bounded change record

`packages/atlas-db/src/immutable-semantic-corpus-plan.ts` adds the ticket-exact, file-private `canonicalDerivedAssetRef` predicate and uses it only for `source.media[].assetRef`. It is byte-for-byte compatible with the `asset_ref` grammar in migration `0024_idser012_derived_assets.sql`; `opaque`, public types/signatures, migrations, SQL, persistence and hashing remain unchanged.

`packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts` adds the T-01/T-02 canonicalization and fail-closed coverage plus T-03's real-PostgreSQL N=2 persistence case. No resolver, parser, BSS, GHR, SEM, delivery, or reconciliation owner changed.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- |
| `RC-012030301A-01` | §2 and frozen contract row 01: only the file-private exact lowercase `derived/<uuid>` grammar may replace the media `assetRef` predicate; no global `opaque`, public API, SQL/migration, or hash change. | `51576897`; production diff at `packages/atlas-db/src/immutable-semantic-corpus-plan.ts`; migration comparison at `packages/atlas-db/migrations/0024_idser012_derived_assets.sql`; `corepack pnpm --filter @atlas/db typecheck` — PASS; `git diff --check` — PASS. | `PROVEN` |
| `RC-012030301A-02` | T-01 / contract row 02: canonical nonempty media and zero-media baseline canonicalize; every supplied media value and hash determinism/replay are preserved. | `packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts`, test `canonicalizes exact derived media references without rewriting metadata`; `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts` — PASS (6/6). | `PROVEN` |
| `RC-012030301A-03` | T-02 / contract row 03: every named malformed ref plus unchanged locator/page/type/SHA/length and unrelated opaque-identity negatives reject through the original typed media/error boundary; no normalization or scope widening. | Same test file, test `rejects malformed media references and retains existing media and opaque identity fences`; the executed immutable-plan command above — PASS (6/6). | `PROVEN` |
| `RC-012030301A-04` | T-03 / contract row 04: real PostgreSQL N=2 parent plus two handoffs retains exact nonempty media; replay reuses refs, changed media conflicts, malformed media creates zero records. | Same test file, test `persists exact canonical media metadata immutably with no forbidden side effects`; the executed immutable-plan command above — PASS (6/6). It observes one plan, two handoffs, exact persisted `source.media`, replayed hash, exact retry refs, conflict rejection, and zero invalid-fixture rows. | `PROVEN` |
| `RC-012030301A-05` | T-04 / contract row 05: predecessor persistence regression and actual accepted RUN-003 resolver-grant regression remain passing; provenance is not misreported as `03-03-02` composition. | Immutable-plan command above — PASS (6/6). `node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/semantic-batch-plan-input.integration.test.ts` — PASS (1/1). | `PROVEN` |
| `RC-012030301A-06` | T-03 / contract row 06: positive real persistence has zero BSS work/attempt/reservation, queue, SEM/candidate/reconciliation side effects and does not create an alternate route. | Same real-PostgreSQL test compares `pgboss.job`, Bridge BSS work/attempt/reservation and document-scoped SEM/candidate/reconciliation counts before/after; immutable-plan command above — PASS (6/6). Existing append-only/auth/transaction coverage in the same harness remains passing. | `PROVEN` |

## Validation record

```text
corepack pnpm --filter @atlas/db typecheck
PASS

node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check
PASS — Atlas database migration check passed

node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts
PASS — 6 tests, 6 pass, 0 fail, 0 skipped

node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/semantic-batch-plan-input.integration.test.ts
PASS — 1 test, 1 pass, 0 fail, 0 skipped

git diff --check
PASS
```

## Boundary and handoff

The new real-persistence fixture proves syntax compatibility and immutable persistence shape only. The unchanged resolver regression proves accepted source provenance. It does not prove the parser-to-resolver-to-planner-to-fixture-receiver composition, which remains owned by `IDSER-012-03-03-02` and still requires this ticket's independent CK decision before that ticket may start.

Every applicable Review Contract row is proven with its ticket-required harness and recorded observation. No unresolved, unproven, or blocked row remains.

Internal readiness: READY_FOR_CK

This checkpoint is not a CK PASS. Control returns to CK for independent review of `51576897`, the recorded evidence, and direct regressions only.
