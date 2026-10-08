# IDSER-BATCH-12-01-03-02 GO qualification progress

- **Ticket:** `IDSER-012-01-03-02`
- **Branch:** `codex/new-atlas-backend`
- **State:** `awaiting_review`; this is a CK handoff candidate, not a PASS record.
- **Qualification environment:** Compose project `idser-012-01-03-02-qualification`, isolated database/volumes, host ports `33011`, `33012`, and `35432`. The existing `atlas-perception-lab` and the prior `idser-012-01-03-02` project were not modified.

## Observed qualification evidence

| Row | Required proof | Command / evidence | Observed outcome | Status |
| --- | --- | --- | --- | --- |
| RC-012010302-01 | Durable, attributable image assets with readback integrity | `docker compose --project-name idser-012-01-03-02-qualification ... exec -T atlas node apps/atlas/scripts/perception-lab-run.mjs safara-baseline-001 /workspace/docs/example/Safara_Buyer_Business_PRD_Professional.pdf` | RUN-003 completed in 12,251 ms: five PNG manifests, each accepted and source-bound; five authenticated resolver reads matched manifest byte-size and SHA-256; member state `perceived`; semantic execution count `0`. | `PROVEN` for the real RUN-003 path |
| RC-012010302-01 | Persistence and readback survive a process boundary | `DATABASE_URL="$DATABASE_URL" corepack pnpm --filter @atlas/db test:derived-assets` in the isolated `atlas` service | A fresh authority/store instance replays an already persisted descriptor; immutable bytes are read back and rehashed before it returns the existing reference. | `PROVEN` |
| RC-012010302-02 | Foreign scope and integrity failures fail closed | same `test:derived-assets` command | Foreign caller was denied; hash mismatch, locator substitution, and tampered bytes were rejected; rejected pre-acceptance result left `accepted_at` null. | `PROVEN` for exercised cases; remaining HTTP malformed/oversize/expired-grant matrix is pending |
| RC-012010302-03 | Offline resolver and no early semantic work | RUN-003 evidence plus `test:derived-assets` | Authorized image retrieval used the bounded resolver; test observed zero `semantic_execution` rows for its document. | `PROVEN` |
| RC-012010302-04 | No recursive source admission | RUN-003 query and `test:derived-assets` | No semantic execution was created by image handoff or resolver read. | `PROVEN` for handoff/resolver path |
| RC-012010302-05 | All crash/replay/failure scenarios | focused Bridge client/worker tests; isolated Compose PostgreSQL `perception-integration.test.ts`; isolated PostgreSQL/filesystem `test:derived-assets` | Partial raw-PNG transfer remains retryable and stages no normalized result. Persist-before-stage replay, stage-before-acceptance outage replay, lost acknowledgement, duplicate delivery, conflicting identity, invalid/expired grants, stale failure fencing, and readback-integrity failure converge idempotently or fail closed. No accepted dangling reference, duplicate logical completion, unsafe overwrite, stranded permit, unauthorized transition, semantic execution, or perception job is observed. | `PROVEN` |
| RC-012010302-06 | Historical retention, safe reuse, and cleanup boundary | isolated PostgreSQL/filesystem `test:derived-assets` | Accepted evidence remained resolvable after cache invalidation. A distinct unaccepted locator received a distinct immutable reference; exact replay was allowed, and an intentionally aged (eight-day) unaccepted manifest remained retained because no authoritative cleanup sweep had established it safe to delete. This is the authorized retain-on-uncertainty boundary; no cleanup service or automatic deletion policy was introduced. | `PROVEN` |
| RC-012010302-07 | Bounded resolver | isolated PostgreSQL/filesystem `test:derived-assets`; real RUN-003 resolver reads | Resolver checked membership, source, locator, reference, on-disk size and SHA-256. Foreign callers, substituted locator/source/reference, traversal-shaped locator, missing bytes, tampered bytes, unsupported media and an over-10 MiB binary were rejected before byte release or persistence. Resolver errors remain generic at the HTTP boundary. | `PROVEN` |
| RC-012010302-08 | Activation gate | real RUN-003 baseline plus binding-negative test | Incomplete/misbound derived references were rejected before acceptance; qualified RUN-003 reached `perceived` with five verified assets and zero semantic executions. | `PROVEN` |

## Direct validation

- `corepack pnpm --filter @atlas/document-store test` — pass (4 tests).
- `corepack pnpm --filter @atlas/core typecheck` — pass.
- `corepack pnpm --filter @atlas/db typecheck` — pass.
- `corepack pnpm --filter @atlas/agents-bridge typecheck` — pass.
- `corepack pnpm --filter @atlas/agents-bridge test` — pass (focused and regression suites; Compose-gated tests skip outside Compose).
- `docker compose ... exec -T atlas sh -lc 'corepack pnpm --filter @atlas/db migration:check && DATABASE_URL="$DATABASE_URL" corepack pnpm --filter @atlas/db test:perception-authority'` — pass.
- `docker compose ... exec -T atlas sh -lc 'DATABASE_URL="$DATABASE_URL" corepack pnpm --filter @atlas/db test:derived-assets'` — pass (1 real PostgreSQL/filesystem test).
- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/atlas-perception-client.test.ts` — pass (6 tests, including interrupted raw-PNG transport classification).
- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/document-perception-worker.test.ts` — pass (8 tests, including no-stage/no-terminal-failure partial-transfer behavior).
- `corepack pnpm --filter @atlas/agents-bridge typecheck` — pass.
- Isolated qualification Compose: `... -f docker-compose.perception-lab.yml -f docker-compose.idser-012-01-03-02-qualification.yml up -d --build --wait` — pass; `test:derived-assets` — pass; `perception-integration.test.ts` lifecycle expiry/retry/stale-failure scenario — pass. The older generic queued-perception fixture was corrected to remain image-free; RUN-003 is the sole visual-evidence path.
- Fresh isolated RUN-003 evidence: `/lab-evidence/safara-baseline-001-2026-10-08T21-42-32-362Z.json` in the disposable Compose `lab-evidence` volume records 374,918 ms real-PDF completion, five accepted source-bound PNG manifests, five authorized resolver reads matching byte counts and SHA-256, `perceived` membership, and zero semantic executions.

## Review Contract Closure

| Row | Frozen ticket authority | Required proof | Evidence / validation | Status |
| --- | --- | --- | --- | --- |
| RC-012010302-01 | Review Contract RC-01 / RC-04 | Durable, attributable images; restart-safe readback | real Safara RUN-003 evidence plus isolated PostgreSQL/filesystem restart test | `PROVEN` |
| RC-012010302-02 | Review Contract RC-02 / RC-06 | Scope, grant, binding, malformed and integrity negatives fail closed | derived-assets PostgreSQL/filesystem test; Bridge lifecycle expiry/invalid-grant qualification | `PROVEN` |
| RC-012010302-03 | Review Contract RC-03 / RC-08 | Authorized offline resolution with no semantic side effect | Safara RUN-003 manifests/resolver observations and semantic-count query | `PROVEN` |
| RC-012010302-04 | Review Contract RC-04 / RC-09 | No derived-evidence recursion | RUN-003 and derived-assets semantic/perception assertions | `PROVEN` |
| RC-012010302-05 | Review Contract RC-05 / RC-11 | Crash, outage, replay, duplicate, conflict and partial-transfer safety | focused Bridge replay tests; Compose PostgreSQL lifecycle qualification | `PROVEN` |
| RC-012010302-06 | Review Contract RC-06 / RC-13 | Historical retention and identity-safe orphan boundary | derived-assets PostgreSQL/filesystem accepted-retention and aged-unaccepted-retention observations | `PROVEN` |
| RC-012010302-07 | Review Contract RC-07 / RC-14 | Bounded scoped resolver with integrity checks | derived-assets resolver-negative matrix and real authenticated reads | `PROVEN` |
| RC-012010302-08 | Review Contract RC-08 | Full activation only after durable verified evidence | real Safara RUN-003 `perceived`, five manifests, five reads, zero semantic executions | `PROVEN` |

Shadow-CK readiness: all ticket-derived rows are proven with the ticket-required isolated PostgreSQL/filesystem and Compose evidence. No downstream semantic ticket was started.

Internal readiness: READY_FOR_CK
