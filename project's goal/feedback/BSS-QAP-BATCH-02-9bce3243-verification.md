# BSS-QAP-BATCH-02 post-CFC CK verification — BSS-QAP-002

- **Ticket:** `BSS-QAP-002` — R2 ID-free writer contract cutover.
- **Batch:** `BSS-QAP-BATCH-02`.
- **Review type:** post-HMN-authorized CFC committed-checkpoint verification.
- **Ticket state:** `awaiting_review`.
- **Reviewed remediation commit:** `9bce3243a10098e79c83a859d463b1cbdc691887`.
- **Remediation base:** `fadc8865c40095b57680d5c82a3592e7e234eae3`.
- **Consumed HMN authorization:** `HMN-BSS-QAP-002-004`.
- **Consumed replacement freeze:** `project's goal/feedback/BSS-QAP-BATCH-02-local-payload-replacement-contract-freeze-002.md`.
- **Authorized clauses:** `RCK-002.a`, `RCK-002.b` only.
- **Result:** `PASS`.

## Review boundary

This verification checked only the two authorized replacement clauses, the
remediation diff from `fadc8865` to `9bce3243`, the evidence required by their
frozen oracles, and direct regressions introduced by that remediation. The
historical `CK-001.a` and all `RCK-001` outcomes remain unchanged and are not
reopened.

The worktree is dirty with unrelated user material, but neither committed
remediation path is modified outside `9bce3243`; the review target is therefore
the committed checkpoint named above.

## Frozen finding closure matrix

| Clause | Frozen oracle | Verification evidence | Outcome |
| --- | --- | --- | --- |
| `RCK-002.a` | Every inventoried local writer-capable artifact has a classified ID-free payload; all matches are permitted direct or same-image-identical nested immutable/R1 migrations; no unmatched, non-identical, or executable dependency-tree writer remains. | `docker image inspect` matched the five recorded image IDs for `agents-bridge`, `agents-bridge-worker`, `agents-bridge-pgboss-bootstrap`, `atlas`, and `atlas-migrate`. Read-only, `--network none` payload scans found **35 files per image: 7 direct, 28 nested, 0 invalid, 0 hash mismatches, `.codex-tools` absent**. The 28 nested files had only the seven allowlisted filenames and matched the same-image direct canonical migration hashes. `packages/atlas-db/scripts/migrate.mjs:11-85` contains the explicit migration list and direct `../migrations/${name}.sql` load boundary. | `RESOLVED` |
| `RCK-002.b` | The local `atlas_dev` target, live connections, host paths, and every local writer-capable artifact are identified and classified; no remote, unknown, or unclassified client/writer remains. | `docker compose config --services` and `--images` identified the local estate. The full Compose-label inventory found the active `ces-platform-postgres-1` plus two stopped historical PostgreSQL containers; all are database containers, not writer-capable application/client artifacts. `docker exec ces-platform-postgres-1 psql ...` returned `current_database=atlas_dev` and only the evidence `psql` backend with a local client address. Host inspection showed only the loopback `127.0.0.1:5432` listener, and the active scheduled-task action scan found zero connection/writer references. All five writer-capable images resolved under `RCK-002.a`. | `RESOLVED` |

The CFC checkpoint reported `TOTAL=7 DIRECT=7 NESTED=0`. Independent
verification found 35 matching files per image because nested dependency-tree
copies are present. Applying the replacement freeze's exact four-part rule
classified those copies as permitted: all 28 per image have an allowlisted
filename, identical same-image SHA-256, and no discovery path in the explicit
migration executor. This evidence-count discrepancy does not fail either
binary closure oracle.

## Direct remediation regression checks

- `git diff --check fadc8865..9bce3243`: PASS.
- `.dockerignore` contains `.codex-tools`; the remediation diff is limited to
  that build-context exclusion, the authorized reconciliation-worker test
  environment correction, and this CFC checkpoint.
- `corepack pnpm --filter @atlas/db test:reconciliation-acceptance`, run with
  the repository's configured local database URL: **1 passed, 0 failed, 0
  skipped**. The expected `CREATE INDEX IF NOT EXISTS` notices were non-failing.
- The `0113` registration search returned no matches in
  `packages/atlas-db/scripts` or `packages/atlas-db/migrations`; the read-only
  `atlas.schema_migrations` query returned zero `0113%` rows.

No direct regression within the frozen replacement boundaries was found.

## Decision

`PASS`. Both authorized replacement clauses are `RESOLVED` against their
frozen binary closure oracles. This artifact is verification only; it does not
rewrite the historical `CK-001.a` result, authorize R3, or authorize physical
column removal.
