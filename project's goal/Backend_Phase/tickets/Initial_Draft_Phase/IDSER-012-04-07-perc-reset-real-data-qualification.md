# IDSER-012-04-07 — PERC-RESET real-data qualification closure

- **State:** `awaiting_review`; GO qualification is complete and awaiting independent CK review.
- **Batch:** `IDSER-BATCH-12-04-07`.
- **Parent:** [IDSER-012-04 split map](IDSER-012-04-canonical-sem-request-sizing-immutable-locator-handoff-and-reconstruction.md).
- **Dependencies:** CK `PASS` for `IDSER-012-04-01` through `IDSER-012-04-06`; protected PERC-RESET accepted `NormalizedDocument V1` evidence in `atlas-canonical-perception`.

## Outcome

This is the sole IDSER-012-04 family closure. Compose already-approved interfaces against real PERC-RESET accepted documents and an isolated writable PostgreSQL qualification copy, proving sizing, v2 persistence, reference-only compatibility, and exact reconstruction without altering canonical source evidence or activating downstream execution.

## Authorized scope

First inspect the canonical Compose project, PostgreSQL container, actual `postgres-data` named volume/mount, accepted-record availability, source identities/counts/hashes/versions, lifecycle state, and established resolver result in read-only mode. Do not expose credentials or source contents. Create a PostgreSQL-supported logical backup/snapshot and restore it into a separate explicitly named disposable database/volume; never share the live data directory. Apply needed v2 migrations, test BSS policy fixtures, plan persistence, rollback/replay tests only to the isolated copy.

Use at least one current, fingerprint-verified text/table Safara PERC-RESET fixture. Prove real source resolution, SEM prompt/schema resolution, shared packet construction, progressive complete sizing, at least two batches under a deliberately bounded valid BSS test workload, atomic v2 records, reference-body validation, and verified read-only reconstruction of every batch. Verify the visual fixture leaves unsupported visuals explicit non-ready while valid text/table batches remain possible. No synthetic-only test satisfies this closure.

Do not run `docker compose down -v`, remove/prune/reinitialize/overwrite the canonical volume, reset/clean the canonical database, apply unreviewed v2 migrations there, mount its directory in another running PostgreSQL instance, replace source with a new Docling conversion, commit a dump/source content, invoke a provider, or send/dispatch GHR work.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| `RC-0120407-01` | Actual canonical project/container/volume identity and accepted source fingerprint/state are verified read-only before use, and the selected document resolves through the established boundary. |
| `RC-0120407-02` | An isolated writable copy—not canonical storage—hosts migrations, atomic v2 persistence, rollback/replay, and bounded qualification policy. |
| `RC-0120407-03` | A real accepted text/table document produces at least two valid batches with exact eligible coverage, real prompt/schema/packet sizing, persisted v2 refs, validated GHR body, and matching reconstruction hash for every batch. |
| `RC-0120407-04` | The visual fixture preserves explicit visual non-ready state; no substitute canonical fixture or fabricated passing result is accepted. |
| `RC-0120407-05` | Environmental evidence proves canonical no-mutation and exact zero provider calls/live GHR dispatch plus zero BSS admission/send, semantic acceptance, reconciliation, Master, and CES effects. |

## SecurityReadiness

- **Status:** `applicable`.
- **Inherited boundaries:** `SR-0120407-B1` treats the canonical PostgreSQL volume as protected source evidence and uses only the approved child interfaces.
- **Trust / sensitive assets:** `SR-0120407-T1` canonical read-only source → isolated writable copy; `SR-0120407-A1` covers source identities/hashes and excludes corpus bytes, dumps, and credentials from evidence.
- **Prohibited couplings:** `SR-0120407-C1` prohibits canonical mutation, live-directory sharing, fixture substitution, provider/GHR activation, and repair of predecessor internals.
- **Verification / unresolved policy:** `SR-0120407-V1` requires compose/volume inspection, isolation, hash/coverage/reconstruction, and counter evidence; `SR-0120407-U1` preserves unavailable image-token and REL policy.
- **Review binding:** `SR-0120407-R1` verifies `T1/C1` through environment provenance, isolated-copy artifacts, no-mutation proof, and zero-effect counters.

## Evidence and hard stop

Record repository commit, Compose/container/volume and PostgreSQL version, migration state, source hashes/counts, resolver result, SEM profile/packet and estimator identities, BSS bounds/output reservation, sizing summaries, isolated plan/handoff IDs/hashes, GHR result, reconstruction comparison, canonical no-mutation proof, and zero-call/dispatch proof. Exclude raw corpus, image bytes, prompts, and credentials.

If volume/source identity cannot be verified, a selected accepted source is absent/stale, an isolated copy cannot be made, a valid bounded BSS policy is unavailable, accounting is inconsistent, reconstruction mismatches, or qualification would mutate canonical data, stop the affected operation with precise evidence. A visual block does not invalidate an independently qualified text/table result. CK `PASS` closes only this family’s planning/reconstruction qualification; it never authorizes provider execution, GHR delivery, semantic acceptance, reconciliation, publication, Master, or CES.
