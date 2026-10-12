# PERC-RESET-004 CK review — e03e3dc

- **Ticket:** `PERC-RESET-004` — First clean canonical Compose boot
- **Batch:** `PERC-RESET`
- **Review type:** first independent CK review
- **Ticket state:** `awaiting_review`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Perception_Reset_Phase/PERC-RESET-004-clean-canonical-compose-boot.md`
- **Mirrored ticket copy:** `project's goal/Clean up/Atlas_Canonical_Perception_Reset/tickets/PERC-RESET-004-clean-canonical-compose-boot.md` (same SHA-256)
- **Ticket amendment:** `PERC-RESET-004-ticket-amendment-001.md`
- **Reviewed target commit:** `e03e3dca6eae79a35a02f2f7fa3999c8da911e`
- **Checkpoint binding:** `63a4a7f` records the target SHA and freezes the user-authorized ticket amendment; `8b3c371` corrects the stale HMN-002 citation. Neither changes the implementation target.
- **Predecessors:** PERC-RESET-001 bounded amendment-v1 verification `PASS`; PERC-RESET-002 verification `PASS`; PERC-RESET-003 verification `PASS`.
- **Result:** `PASS`

## Scope and authority

CK reviewed the frozen PERC-RESET-004 ticket, its ticket-specific amendment,
the incorporated implementation context §6, the GO checkpoint, the bounded
predecessor reviews, the implementation diff at the named target, and the
canonical Compose runtime. The amendment replaces only the unavailable
preserved-cache premise with the exact digest-pinned image's embedded model
baseline, where no verified nonempty protected cache exists. It preserves all
other PERC-RESET-004 requirements and does not rely on a separate
`HMN-PERC-RESET-004-002` artifact.

The reviewed target is `e03e3dca6eae79a35a02f2f7fa3999c8da911e`; its parent
`d05b4e2e952d433c2f03b101b1d85e08393be5a4` contains the Compose implementation.
The only implementation file changed for this checkpoint is `docker-compose.yml`.
Unrelated existing dirty and untracked semantic/REL/planning worktree files
were not included in the target and were left unchanged.

## Review Contract

| Row | Ticket authority | Required behavior and proof | Evidence reviewed | Status |
|---|---|---|---|---|
| RC-PERC-RESET-004-01 | Actions 1–3; binary oracle | One canonical Compose project with required services/resources and no obsolete co-running project | `docker compose ... config --format json` and `ps --all`: seven named services, five healthy long-running containers, two one-shot containers exited 0; `docker compose ls --all` shows only `atlas-canonical-perception`; `docker ps -a` shows only those seven containers; `docker volume ls` shows only `atlas-data` and `postgres-data` | PROVEN |
| RC-PERC-RESET-004-02 | Actions 2, 4; context §6 | One enabled normal RUN-003 perception route with matching D1, Bridge, worker, Docling profile and image identity; accepted asset-store mount; no qualification-only route or alternate provider | Effective config and running Bridge/worker environments each parse to exactly one enabled `docling-run-003-capture` route with RUN-003 identity/profile/digest; both use Docling 1.36.0 / Docling Slim 2.132.0; Atlas D1 identity matches; running Atlas has `atlas-canonical-perception_atlas-data` mounted at `/workspace/.atlas-data`; `AGENTS_BRIDGE_QUALIFICATION_ONLY` is absent and `config.ts` defaults it to false; no semantic service is configured | PROVEN |
| RC-PERC-RESET-004-03 | Actions 3, 6; ticket amendment 001 | Exact embedded image baseline, offline warmup readiness without model download, and post-start equality | GO checkpoint records pre-start digest, image ID, path, 103 files, 871M and fingerprint; records `--network none` warmup readiness HTTP 200 and the no-download/model-ready log lines. CK independently inspected the running pinned image and configured embedded path; the container is healthy, has no mounts, and its in-container count/size/fingerprint are 103 / 871M / `01ba86056ff361a5b5efb51a570ea8041e9c48acb2ed1e4107e3265a662ccf45`, matching the recorded baseline. Live Docling logs contain the required valid-artifact/no-download, model-loading, engine-ready, and startup-complete observations | PROVEN |
| RC-PERC-RESET-004-04 | Actions 3–5; binary oracle | Healthy required services, successful migrations and pg-boss bootstrap, fresh persisted database, no semantic activity | Live Compose status: PostgreSQL, Atlas, Bridge, worker and Docling healthy; migration and bootstrap containers exited 0. Read-only DB queries show 25 migrations, 2 pg-boss queues, 0 jobs, and zero rows in project/document/member, perception execution/cache/source-grant/derived asset/manifest/delivery, semantic delivery/execution/context/candidate/evidence/result tables | PROVEN |
| RC-PERC-RESET-004-05 | Action 6; binary oracle; ticket amendment 001 | Embedded models readable and used without falsely claiming a preserved cache | Running Docling has no mounted volumes, uses `/opt/app-root/src/.cache/docling/models`, and matches the recorded sorted fingerprint; effective config declares only the two canonical data volumes and no `docling-models` volume | PROVEN |

## Validation and evidence

CK performed read-only checks:

- `git show d05b4e2 -- docker-compose.yml` to inspect the implementation diff.
- `docker compose -p atlas-canonical-perception -f docker-compose.yml config --format json`, `ps --all`, and `docker compose ls --all`.
- `docker ps -a`, `docker volume ls`, and `docker inspect` for Docling, Bridge, worker, and Atlas runtime identity.
- In-container model count, size, and sorted per-file SHA-256 fingerprint inspection.
- Read-only PostgreSQL counts for migrations, pg-boss, and all ticket-listed state tables.
- Predecessor CK records: PERC-RESET-001 bounded amendment verification, PERC-RESET-002 verification, and PERC-RESET-003 verification.

No tests or state-changing Docker commands were run during CK. The required
network-disabled warmup was performed and recorded by GO before canonical
startup; CK reviewed that recorded output and independently checked live
service logs and the running container fingerprint. No direct in-scope
regression was found.

## Frozen Finding Closure Matrix

No ticket-bound deficiencies remain; there are no CK findings or closure
clauses for this first review.

## Decision

All five applicable ticket-derived rows are proven, the required normal
Compose/runtime/database evidence is present, and no direct in-scope regression
remains. **Result: `PASS` for PERC-RESET-004**.
