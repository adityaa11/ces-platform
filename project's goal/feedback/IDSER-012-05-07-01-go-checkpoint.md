# GO checkpoint: IDSER-012-05-07-01

- **Ticket:** `IDSER-012-05-07-01 — Canonical Safara source qualification`.
- **Authority:** frozen ticket `Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-05-07-01-canonical-safara-source-qualification.md`.
- **Batch:** `IDSER-BATCH-12-05`.
- **Lifecycle:** `awaiting_review`.
- **Predecessors:** the required `IDSER-012-05-01-01` through `IDSER-012-05-04-02` CK PASS records were checked before qualification; `IDSER-BATCH-12-05-04-02-26508622-verification.md` is the terminal predecessor evidence.

## Bounded execution record

Only the existing Compose project `atlas-canonical-perception` was inspected. Its actual container labels, named volume labels, and mounts bind `atlas-canonical-perception_postgres-data` to PostgreSQL and `atlas-canonical-perception_atlas-data` to `/workspace/.atlas-data`. No Compose service other than the existing `postgres` container was started; it was stopped again after read-only PostgreSQL inspection and `pg_dump`.

The PostgreSQL-supported logical snapshot was created with `pg_dump -Fc --no-owner --no-privileges`, piped directly to `pg_restore` in the isolated container `idser012050701-qualification-postgres-20261021` and separate named volume `idser012050701_qualification_pgdata_20261021`. No raw corpus was written to Git or to a repository file. The isolated container is stopped and retained solely as the snapshot.

The canonical database has four pre-existing dangling foreign-key relationships in unrelated historical `ready-*` records. PostgreSQL therefore rejected recreation of those four post-data constraints during restore, while retaining the complete logical rows. This does not concern the exact Safara document, its accepted cache, or its media manifest. The restored isolated source/cache/manifest identity fingerprint below exactly matches canonical before any qualification test write; no qualification test write was performed.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence and exact outcome | Status |
| --- | --- | --- | --- |
| `RC-01205-0701-01` | Frozen contract row 01: inspect actual Compose/container/mount identities and bind the exact Safara source, accepted NormalizedDocument V1, locator counts, and five PNG identities. | Compose labels/mounts identify the required project and its `postgres-data`/`atlas-data` volumes. Canonical row: `Safara_Buyer_Business_PRD_Professional.pdf`, SHA-256 `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df`, 314167 bytes. Cache is `v1` with `docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1`. Decoded counts: 12 pages, 254 text blocks, 4 tables, 5 visual regions. Manifest: five accepted and verified, distinct `image/png` assets on pages 3, 5, 7, 8, and 10; source-to-asset identity digest `3b92e26a0995e30764e475a86fbb5cc2`. Direct read-only image-volume SHA-256 checks match every manifest asset hash. | `PROVEN` |
| `RC-01205-0701-02` | Frozen contract row 02: a PostgreSQL logical snapshot restored into an isolated writable database/volume matches canonical source, accepted media, and manifest identities before later test write. | `pg_dump` from the existing canonical `postgres` container was piped to `pg_restore` in the separately named qualification container/volume. Canonical and isolated fingerprints are identical: exact source SHA and size, cache version/capability identity, 12/254/4/5 counts, 5/5 accepted PNG identities, and asset digest `3b92e26a0995e30764e475a86fbb5cc2`. The isolated target was stopped without later test writes. Restore limitation above is explicitly preserved. | `PROVEN` |
| `RC-01205-0701-03` | Frozen contract row 03: exact source must be present; a fixture, replacement, new perception, generated PNG, or other project cannot pass. | The exact required source and all accepted cache/manifest/asset bindings exist in the required Compose project. The source PDF and all five asset bytes were verified directly through a read-only mount of the canonical image volume. No fixture, alternate document, generated media, re-perception, alternate DB, planner, reconstruction, or historical `idser-012-04-07` script was used. | `PROVEN` |
| `RC-01205-0701-04` | Frozen contract row 04: pre/post checks show canonical PostgreSQL and image volumes unchanged; no live GHR/BSS/SEM/provider effect. | Pre-snapshot and final canonical fingerprints are identical; the direct post-snapshot source/PDF and five PNG hashes match their pre-snapshot values. The only started canonical process was PostgreSQL; Atlas, bridge, worker, migration, and Docling containers remained stopped. Canonical and isolated effect-surface counts match: semantic execution/extraction/reconciliation and BSS admission/attempt/reservation are all 0; `pgboss.job` remains 4. | `PROVEN` |

### Executed validation

- Docker Compose/container/volume label and mount inspection — pass.
- Read-only `psql` source/cache/manifest/count queries — pass.
- Read-only canonical image-volume SHA-256 checks for the exact PDF and five accepted PNG assets — pass before and after snapshot.
- `pg_dump -Fc --no-owner --no-privileges | pg_restore --no-owner --no-privileges --disable-triggers` into `idser012050701_qualification_pgdata_20261021` — source/cache/manifest data restored; four unrelated pre-existing FK recreations rejected as documented above.
- Canonical-versus-isolated fingerprint and downstream-effect count comparison — pass.

Internal readiness: READY_FOR_CK

This is an implementation readiness handoff only; it is not a CK `PASS`.
