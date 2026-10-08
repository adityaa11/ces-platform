# CFC checkpoint: IDSER-012-01-03-02 / IDSER-BATCH-12-01-03-02 (cycle 2)

- **Remediation source:** original frozen CK matrix `IDSER-BATCH-12-01-03-02-d7399b2-review.md`, clause `CK-001.e`; residual mismatch recorded in `IDSER-BATCH-12-01-03-02-f6ec9cd-verification.md`.
- **Authorized scope:** only unresolved original clause `CK-001.e`. Historical clauses `CK-001.a`–`CK-001.d` remain resolved and were not reopened.
- **HMN authorization consumed:** `HMN-IDSER-012-01-03-02-001` (`AUTHORIZE_EVIDENCE_REMEDIATION`).
- **Remediation:** `apps/atlas/scripts/perception-capacity-qualification.mjs` now queries and asserts scoped semantic pg-boss jobs, derives the zero provider-call observation from that queue boundary, and emits both observations with the existing zero semantic-execution result.

## Authorized closure progress

| Clause | Status | Closure evidence | Required command and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| CK-001.e | `PROVEN` | Fresh isolated Compose project `idser-012-01-03-02-cfc-semantic-evidence` admitted `safara-capacity-8b4b2c5793d8` and `safara-capacity-8f82e6d85496` together as `perception_queued/queued`; `safara-capacity-d49ae98ec748` was `pending/held`. All three then reached `perceived/completed`, with 15 accepted assets. The scoped output recorded `semanticExecutions: 0`, `semanticJobs: 0`, and `semanticProviderCalls: 0`. A semantic provider can run only from the asserted `bridge-background-execution-v1` semantic-job boundary. | `ATLAS_DATABASE_URL=<isolated Atlas app URL> ATLAS_LAB_ORIGIN=http://127.0.0.1:34011 ATLAS_LAB_URL=http://127.0.0.1:34011 node apps/atlas/scripts/perception-capacity-qualification.mjs docs/example/Safara_Buyer_Business_PRD_Professional.pdf` — pass. | Pass: two conversions under the existing two-permit gate, one held third, all three durable verified results, and zero semantic executions/jobs/provider calls. |

## Direct regressions checked

- `docker compose -f docker-compose.yml -f docker-compose.idser-012-01-03-02-qualification.yml -f <ephemeral isolated-port override> --project-name idser-012-01-03-02-cfc-semantic-evidence exec -T atlas sh -lc 'DATABASE_URL="$ATLAS_DATABASE_URL" corepack pnpm --filter @atlas/db test:derived-assets'` — pass (1 test).
- `node --check apps/atlas/scripts/perception-capacity-qualification.mjs` — pass.
- `git diff --check` — pass.

The isolated Compose volume and its qualified results are retained. No production handoff, resolver, admission-capacity, storage, authorization, provider, or semantic implementation changed.

Internal readiness: `READY_FOR_CK`.

Ticket state: `awaiting_review` for bounded CK verification of `CK-001.e`.
