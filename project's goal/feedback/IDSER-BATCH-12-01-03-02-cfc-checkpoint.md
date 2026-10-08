# CFC checkpoint: IDSER-012-01-03-02 / IDSER-BATCH-12-01-03-02

- **Remediation source:** `IDSER-BATCH-12-01-03-02-d7399b2-review.md`, first CK review at `d7399b24405e9de82a8fb1a8ca31b15ccc0f243d`.
- **Authorized scope:** the original frozen clauses `CK-001.a` through `CK-001.e`; no predecessor, provider, deployment, storage-backend, UI, or semantic scope was added.
- **Authorization:** the user's explicit `cfc IDSER-012-01-03-02 ...` invocation starts this first remediation pass. No post-CFC HMN authorization is consumed.
- **Worktree isolation:** pre-existing unrelated untracked RUN-004 and other feedback material was preserved. The stale original qualification Compose project's volumes were stopped but not deleted; a fresh disposable Compose project was used for the capacity control.

## Authorized closure progress

| Clause | Status | Closure evidence | Required command and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| CK-001.a | `PROVEN` | `apps/atlas/scripts/derived-asset-cfc-qualification.mjs restart-readback` queried the retained `safara-baseline-2f1a8525227c` RUN-003 project after an Atlas-service restart. It resolved all five accepted locators under the owning document scope, verified each persisted length and SHA-256, and observed member state `perceived`. | `docker compose ... --project-name idser-012-01-03-02-qualification restart atlas`; then `docker compose ... exec -T atlas node apps/atlas/scripts/derived-asset-cfc-qualification.mjs restart-readback safara-baseline-2f1a8525227c` — pass. | Pass: five post-restart matching readbacks and `perceived` state. |
| CK-001.b | `PROVEN` | The route-level Compose qualification sends malformed metadata, a >10 MiB transfer, and an expired grant to `/internal/perception/derived`. Every request returned `400`; the execution had zero derived manifests and no additional document/member/grant/execution/perception-job/semantic effect. | `docker compose ... --project-name idser-012-01-03-02-qualification exec -T atlas node apps/atlas/scripts/derived-asset-cfc-qualification.mjs route-negatives` — pass: `malformed:400`, `oversized:400`, `expired:400`. | Pass: named HTTP cases reject before persistence with no released reference or job. |
| CK-001.c | `PROVEN` | The offline fixture delivers accepted normalized text and table content plus a verified image reference. The authorized offline reader obtains the cached text/table content and resolves the image by original document scope and locator; semantic count remains zero. | `docker compose ... --project-name idser-012-01-03-02-qualification exec -T atlas node apps/atlas/scripts/derived-asset-cfc-qualification.mjs offline-fixtures` — pass. | Pass: accepted text/table and corresponding verified image read with zero semantic provider/call/job. |
| CK-001.d | `PROVEN` | The same isolated fixture executes named read, replay, UI-like read, cache-invalidation, and semantic-like context-read fixtures. Before/after counts are unchanged for document, bundle member, source grant, perception execution, pg-boss perception job, and semantic execution. | `docker compose ... --project-name idser-012-01-03-02-qualification exec -T atlas node apps/atlas/scripts/derived-asset-cfc-qualification.mjs offline-fixtures` — pass: all five fixtures and zero recursive effects. | Pass: every frozen fixture has no prohibited source/membership/grant/execution/perception-job effect. |
| CK-001.e | `PROVEN` | A fresh disposable `idser-012-01-03-02-cfc-capacity` Compose project admitted three real source-PDF requests. The recorded held snapshot has exactly two `perception_queued/queued` conversions and a third `pending/held`; all three later completed as `perceived`. The final check found 15 accepted assets and zero semantic executions. | `ATLAS_DATABASE_URL=... ATLAS_LAB_ORIGIN=http://127.0.0.1:33011 ATLAS_LAB_URL=http://127.0.0.1:33011 node apps/atlas/scripts/perception-capacity-qualification.mjs docs/example/Safara_Buyer_Business_PRD_Professional.pdf` — pass. | Pass: two under the existing capacity, third held, all admitted durable results, zero semantic execution/job/provider work. |

## Direct regressions checked

- `corepack pnpm --filter @atlas/core typecheck` — pass.
- `corepack pnpm --filter @atlas/db typecheck` — pass.
- `docker compose ... --project-name idser-012-01-03-02-cfc-capacity exec -T atlas sh -lc 'DATABASE_URL="$ATLAS_DATABASE_URL" corepack pnpm --filter @atlas/db test:derived-assets'` — pass (1 test).
- `node --check apps/atlas/scripts/derived-asset-cfc-qualification.mjs` — pass.
- `node --check apps/atlas/scripts/perception-capacity-qualification.mjs` — pass.
- `git diff --check` — pass.

## Handoff

The two qualification scripts add only deterministic evidence harnesses; they do not alter the production handoff, resolver, scheduler, admission-capacity, storage, or semantic implementation. Every authorized frozen oracle is `PROVEN` by its named command and observation.

Internal readiness: `READY_FOR_CK`.

Ticket state: `awaiting_review` for CK verification.
