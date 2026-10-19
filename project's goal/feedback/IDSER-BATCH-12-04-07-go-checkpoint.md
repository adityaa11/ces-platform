# GO checkpoint: IDSER-012-04-07 / IDSER-BATCH-12-04-07

- **Ticket:** `IDSER-012-04-07-perc-reset-real-data-qualification.md`
- **Review target:** pending commit for this checkpoint.
- **State:** `awaiting_review`.
- **Dependencies consumed:** CK `PASS` records for `IDSER-012-04-01` through `-06`, plus the current RUN-003 PERC-RESET Safara Professional accepted-document record.

## Qualification environment

Canonical read-only inspection identified Compose project `atlas-canonical-perception`, PostgreSQL 18.6, and the protected named mount `atlas-canonical-perception_postgres-data` at `/var/lib/postgresql`. The selected RUN-003 source is `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df`, with completion fingerprint `a1701b0a66592d4d8c8638177f3cd612bfb564add29354de20de149d83a1392e`; it remained exactly one `completed` / `perceived` member of a `processing` bundle before and after qualification.

The runner made a PostgreSQL logical copy in the separately named disposable volume `idser-012-04-07-qualification-postgres-data`. The canonical database has four historical dangling test-fixture references, so PostgreSQL could not re-add four FKs during restore. No canonical data was repaired or changed. The isolated copy received all 81 migrations and the v2 plan tables. Its affected historical FK triggers were disabled only in the disposable copy to allow the pre-existing inconsistent snapshot to be exercised; this does not modify or relax canonical behavior.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / outcome | Status |
| --- | --- | --- | --- | --- |
| `RC-0120407-01` | Frozen row 01 | Canonical project, volume, current accepted source, and resolver must be verified read-only. | Compose/container/volume inspection above; the runner resolves the exact accepted RUN-003 record through `PostgresAcceptedSemanticBatchPlanInputFixtureRepository` and `PostgresAcceptedSemanticBatchPlanDocumentResolver`. | `PROVEN` |
| `RC-0120407-02` | Frozen row 02 | Isolated writable copy hosts v2 persistence, replay, rollback, and bounded policy. | Logical restore into the named isolated volume; runner installs its BSS profile only in a rolled-back Bridge transaction, persists v2 records there, proves idempotent replay, and rejects a stale source with no extra parent/child rows. | `PROVEN` |
| `RC-0120407-03` | Frozen row 03 | Real text/table source yields >=2 exact-coverage batches, v2 refs, reference-body validation, and every-batch reconstruction. | 12 pages; 258 eligible text/table units; bounded authenticated BSS policy made 23 valid batches. Plan hash `7c0437995e1727b0ad04ee18c42677702b9ccb296c89e73c7c58a4eaa6b67357`; reference-body hash `28a3360849fbe379e674795e8e18b2694ec60c2dda32d6fe7fbd5584dde45647`; all 23 handoffs reconstructed and matched their planned hashes. | `PROVEN` |
| `RC-0120407-04` | Frozen row 04 | Real visual source stays explicitly non-ready without a substitute fixture. | The same Safara record contained five visual units, all retained as `unexamined` with `image_accounting_unavailable`; none was owned by a batch. | `PROVEN` |
| `RC-0120407-05` | Frozen row 05 | Canonical no-mutation and zero downstream effects. | Canonical source/lifecycle and canonical effects remained `4` plans, `4` handoffs, `0` semantic executions, `0` reconciliations. Isolated before/after counters were unchanged: 4 pre-existing jobs; 0 attempts, reservations, dispatches, semantic executions, candidates, reconciliations, and knowledge-index effects. | `PROVEN` |

## Validation

- `node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs scripts/idser-012-04-07/qualify-real-data.mts` with the isolated database URLs and the recorded source SHA — **PASS**. It uses the actual SEM request composer and shared packet builder, an authenticated prospective BSS reader, v2 persistence/replay, the strict reference-only receiver, and read-only reconstruction.
- `git diff --check -- scripts/idser-012-04-07/qualify-real-data.mts` — **PASS**.

No provider call, GHR issue/dispatch/acknowledgement, BSS admission/attempt/reservation/send, semantic acceptance, reconciliation, Master, or CES behavior was invoked. Evidence contains no corpus content, image bytes, prompts, credentials, or database dump.

Internal readiness: READY_FOR_CK
