# CFC checkpoint: IDSER-012-04-03 / IDSER-BATCH-12-04-03

- **Ticket:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-04-03-bss-structural-fit-corpus-partition.md`
- **Reviewed commit:** `22ced7045d63e401b3f166772e0ad4b910f5cb89`
- **CK findings addressed:** `CK-001.a`, `CK-001.b`, and `CK-001.c` from `project's goal/feedback/IDSER-BATCH-12-04-03-22ced70-review.md`.
- **Remediation scope:** authenticated prospective-reader consumption and structural partition reporting only.

## Review Contract Closure

| Frozen clause | Status | Closure evidence | Exact command and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | The consumer rejects an authenticated snapshot missing `maxPromptBytes` or `maxContextTokens`. The partition compares the complete request measurement with BSS `maxRequestBytes`, `maxInputTokens`, route `maxPromptBytes`, and the context window calculated from input demand plus BSS output reservation. Focused cases prove deterministic under-limit output and typed blocks for prompt/context overage. The real authenticated reader test exposes the named bounds from the workload structural snapshot. | `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/idser-prospective-capacity-snapshot.test.ts` — **PASS** (2 tests). `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/idser-structural-fit-corpus-partition.test.ts` — **PASS** (7 tests). `docker run --rm --network container:idser-cfc-postgres -e DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev -e ATLAS_APP_PASSWORD=atlas_app_local_dev_only -e AGENTS_BRIDGE_PASSWORD=agents_bridge_local_dev_only ces-platform-atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-planning-snapshot.integration.test.ts` — **PASS** (1 PostgreSQL integration test). | **PASS:** within-limit candidate partitions deterministically; route-prompt/context overages block; missing authenticated bounds produce `BSS_CAPACITY_CONSUMER_READ_GAP`. |
| `CK-001.b` | `PROVEN` | A later non-unfit prospective-reader failure now returns `BLOCKED` / `BSS_CAPACITY_CONSUMER_READ_GAP` with no proposal, replan, or fit trace. The existing changed-pinned-snapshot case remains the only `STRUCTURAL_REVISION_CHANGED` outcome. | `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/idser-structural-fit-corpus-partition.test.ts` — **PASS** (7 tests; includes later-reader-failure and changed-snapshot assertions). | **PASS:** transient reader failure blocks as a capacity-consumer read gap; only a changed authenticated snapshot identity requests a structural revision. |
| `CK-001.c` | `PROVEN` | Unit inventory is derived before media identity validation. Foreign, duplicate, and malformed media therefore return a typed blocked result that preserves each visual as `unexamined` / `image_accounting_unavailable`, with no batches. | `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/idser-structural-fit-corpus-partition.test.ts` — **PASS** (7 tests; includes all three malformed-media cases). | **PASS:** named malformed-media cases retain explicit visual inventory, have zero batches, and fabricate no eligible ownership. |

## Direct regression checks

- `corepack pnpm --filter @atlas/agents-bridge typecheck` — **PASS**.
- `corepack pnpm --filter @atlas/skills test` — **PASS**: 18 tests, 0 failures.
- `git diff --check -- <authorized remediation paths>` — **PASS**.

The PostgreSQL integration used the project-local `ces-platform_postgres-data`
volume in a temporary `idser-cfc-postgres` container without a host port, after
the normal Compose service could not bind port 5432. Its test transaction rolls
back its fixture writes; no canonical Perception database or runtime provider
surface was used.

Internal readiness: `READY_FOR_CK`.

Ticket state: `awaiting_review`. This is CFC readiness evidence only; CK alone
verifies the frozen clauses and may issue `PASS`.
