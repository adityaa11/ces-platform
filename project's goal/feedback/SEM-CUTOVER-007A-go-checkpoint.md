# SEM-CUTOVER-007A GO checkpoint

- Ticket: `SEM-CUTOVER-007A` — Canonical stepwise extraction runtime cutover
- State: `awaiting_review`
- GO authority: explicit user `GO SEM-CUTOVER-007A`; HMN continuation `HMN-SEM-CUTOVER-007A-002` (`RETURN_TO_GO`)
- Prerequisites consumed: SEM-CUTOVER-007 CK `PASS` at `2ffda7904300f802a9dc772f6da0fe6880e72a8b`; SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE CK `PASS` at `a158cf6fe5525118749c41e5814fbc47bad14af8`.
- Candidate base: `399d0d1`; review target is this checkpoint's immutable 007A-only commit.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / command | Status |
| --- | --- | --- | --- |
| RC-007A-01 | Sole active extraction builder/profile; reject default, legacy, and unknown selection before transport. | `packages/atlas-skills/src/semantic-prompt.ts`, `semantic-source-packet.ts`, ordinary `semantic-worker.ts`; `corepack pnpm --filter @atlas/skills test` (18/18) and `corepack pnpm --filter @atlas/agents-bridge test:semantic` (worker 9/9, semantic client 1/1). The ordinary-path audit asserts no legacy packet/compiler selection. | PROVEN |
| RC-007A-02 | One promoted provider-neutral engine must serve fake and loopback adapter transports, with common prompt/schema processing and genuine adapter provenance. | `semantic-stepwise-runtime.ts`, promoted `semantic-offline-stepwise-composition.ts`, `semantic-worker.integration.test.ts`. Durable run `.codex-tools/sem-cutover-007a-production-integration-20261015-154200/` completed exit `0` (2 passed); final staged-candidate output at `.codex-tools/sem-cutover-007a-production-integration-final-20261015-171400/stdout.log` is 2/2 pass. Fake/Anoman system-prompt hash: `b99d5a99fa33e498a9cb72411ad5116c4d7d8cbb7a44bdd308bce4d50b3b7fc0`; both schema hashes: `4f6007d947e4c8f4afcc6daf1c29e31db7a50ad24a584d9cacece952f434b300`. | PROVEN |
| RC-007A-03 | Ordinary worker callback, without injected offline selection, redeems server-selected context and stages through real PostgreSQL; denied contexts have zero legacy/provider/stage effects. | `worker-main.ts`, `semantic-worker.ts`, `atlas-semantic-client.ts`, and the production worker integration's normal pg-boss scenario. `corepack pnpm --filter @atlas/agents-bridge test:semantic-integration` completed 2/2 with ordinary text and image paths. | PROVEN |
| RC-007A-04 | Exact image/source/asset/grant checks, multipart transport, and fail-closed authority negatives; provisional relationship history remains unaccepted. | `derived-image-grant.ts`, `ephemeral-derived-image-hydrator.ts`, `PostgresProvisionalRelationshipRepository`, `perception-internal.ts`; focused core grant/hydrator tests and the Anoman loopback image capture. `corepack pnpm --filter @atlas/skills exec jiti tests/stepwise-source-packet.test.ts` passed 8/8. | PROVEN |
| RC-007A-05 | One outbound adapter request; validated returned value/provenance; failure, cancellation, deadline and capability negatives remain fail-closed. | `semantic-stepwise-runtime.ts`, `semantic-worker.test.ts`, `semantic-worker.integration.test.ts`; ordinary integration records Anoman `providerCalls:1`, multipart image data, canonical prompt/schema observations, and no extra structured calls. | PROVEN |
| RC-007A-06 | Legacy replay rejects before delivery; current composite replays without another provider call; durable claim/restart/cancellation/delivery cases use real PostgreSQL. | `semantic-composite-replay.ts`, migration `0027_semantic_stepwise_delivery_handoff.sql`, `semantic-composite-replay.integration.test.ts`, `semantic-worker.integration.test.ts`. Final integration output records cancellation, crash, delivery-failure and ack-loss recovery markers with 2/2 passing. `corepack pnpm --filter @atlas/db migration:check` passed. | PROVEN |
| RC-007A-07 | Reconciliation stays supported and canonical D1 remains protected with no normal semantic scheduling. | `reconciliation-acceptance.ts` and its cleanup-safe fixture; `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/perception-integration.test.ts` passed 2/2; `corepack pnpm --filter @atlas/db test:reconciliation-acceptance` passed 1/1 in 31.2 s. The reconciliation fixture cleans staged-perception resources and uses IPC shutdown on Windows. | PROVEN |
| RC-007A-08 | Static/runtime audit blocks active legacy extraction callers while retaining archival fixtures and reconciliation; freeze provider-neutral version/hash for downstream work. | Active worker audit: `worker-main.ts` installs only `atlas.semantic.extract.stepwise_multimodal.relationship-envelope/v0.4.0`; `semantic-worker.ts` rejects an extraction lacking ordinary stepwise wiring and rejects unbound legacy delivery replay. The frozen ticket README records the downstream gate and prospective-only successor contract. | PROVEN |

## Validation evidence

All commands were run from `C:\Workspace\atlas\ces-platform` against the staged 007A implementation candidate, except that the durable `154200` directory is the retained earlier exit-code record for the same implementation evidence.

| Command | Outcome | Duration |
| --- | --- | --- |
| `corepack pnpm --filter @atlas/contracts typecheck` | PASS | 1.3 s |
| `corepack pnpm --filter @atlas/core typecheck` | PASS | 1.4 s |
| `corepack pnpm --filter @atlas/db typecheck` | PASS | 2.0 s |
| `corepack pnpm --filter @atlas/skills typecheck` | PASS | 1.5 s |
| `corepack pnpm --filter @atlas/agents-bridge typecheck` | PASS | 2.5 s |
| `corepack pnpm --filter @atlas/skills test` | PASS, 18/18 | 1.4 s |
| `corepack pnpm --filter @atlas/skills exec jiti tests/stepwise-source-packet.test.ts` | PASS, 8/8 | 1.0 s |
| `corepack pnpm --filter @atlas/agents-bridge test:semantic` | PASS, worker 9/9; semantic client 1/1 | 1.9 s |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/perception-integration.test.ts` with repository `.env` | PASS, 2/2 | 14.7 s |
| `corepack pnpm --filter @atlas/db test:reconciliation-acceptance` with repository `.env` | PASS, 1/1 | 31.2 s |
| `corepack pnpm --filter @atlas/db migration:check` with repository `.env` | PASS | 0.6 s |
| `corepack pnpm --filter @atlas/agents-bridge test:semantic-integration` | PASS, 2/2, 0 skipped | 75.6 s |
| `git diff --cached --check` | PASS | final scope check |

## Evidence notices

- The successful durable integration record is `.codex-tools/sem-cutover-007a-production-integration-20261015-154200/completion.json` with exit code `0`. The final staged-candidate rerun is complete, non-partial TAP output at `.codex-tools/sem-cutover-007a-production-integration-final-20261015-171400/stdout.log`; its helper's `exitCode` field is `null` because PowerShell does not surface the batch-wrapper child exit code, while its complete TAP result is 2/2 passed. This runner metadata defect is non-production test tooling only; the prior retained durable record supplies the explicit exit-0 observation.
- Earlier direct database checks without `.env` were discarded because they self-skipped or rejected a missing `DATABASE_URL`; they are not used as evidence.
- Unrelated staged, unstaged, and untracked worktree material remains outside this candidate.

Internal readiness: READY_FOR_CK
