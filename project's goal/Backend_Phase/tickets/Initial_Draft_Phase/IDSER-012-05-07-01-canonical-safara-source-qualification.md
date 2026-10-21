# IDSER-012-05-07-01 — Canonical Safara source qualification

- **State:** `approved`; CK `PASS` recorded in `../../../feedback/IDSER-BATCH-12-05-07-01-a1c40d05-review.md` for reviewed checkpoint commit `a1c40d0587be49ae10fa43155b94bd637873760e`.
- **Parent map:** [IDSER-012-05-07](IDSER-012-05-07-perc-reset-multimodal-terminal-qualification.md).

## Sole scope

Read-only qualify the sole terminal oracle: existing accepted PERC-RESET RUN-003 `Safara_Buyer_Business_PRD_Professional.pdf` in Compose project `atlas-canonical-perception`, source SHA-256 `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df`, profile `docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1`. Inspect actual Compose labels, containers and volumes: Compose-owned `postgres-data` contains accepted normalized/cache/manifest records and `atlas-data` holds canonical image bytes. Verify 12 pages, 254 text blocks, 4 tables, 5 visual regions and 5 distinct accepted `image/png` assets with source/manifest/asset integrity. Create only a PostgreSQL-supported logical backup/snapshot restored into an isolated writable qualification database/volume; prove it retains exact source and accepted-media identities.

## Frozen CK contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-0701-01` | Actual Compose/container/mount identities are inspected read-only and bind the exact Safara source, RUN-003 accepted `NormalizedDocument V1`, stated locator counts and five accepted PNG identities. |
| `RC-01205-0701-02` | The isolated logical snapshot matches canonical source, accepted-media and manifest identities before any later test write. |
| `RC-01205-0701-03` | Missing/mismatched Compose, mount, source, accepted cache or asset returns `BLOCKED_CANONICAL_SAFARA_SOURCE`; no fixture, other document/project, generated PNG, re-perception or replacement DB can PASS. |
| `RC-01205-0701-04` | Pre/post checks prove canonical PostgreSQL and image volumes unchanged; no live GHR/BSS/SEM/provider effect occurs. |

## Boundaries

No v3 migration/persistence tests, planner execution, reconstruction, SEM-CUTOVER handoff, provider/hydration work or canonical write. Never mount the live PG data directory in another server, run `docker compose down -v`, reset/prune/migrate canonical volumes or persist raw corpus contents in Git. CFC/HMN is limited to canonical source/snapshot integrity.
