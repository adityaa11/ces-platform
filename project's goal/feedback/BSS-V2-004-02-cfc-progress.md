# BSS-V2-004-02 CFC checkpoint

- **Ticket:** BSS-V2-004-02 — IDSER D1 persistent-Docling perception lifecycle checkpoint
- **Source CK:** `BSS-V2-BATCH-04.02-9c31002-review.md`
- **CFC state:** `awaiting_review`
- **Review target:** the single bounded remediation commit containing this checkpoint; it addresses only `CK-001.a`, `CK-001.b`, `CK-002.a`, `CK-003.a`, and `CK-004.a`.
- **Authorized frozen clauses:** `CK-001.a`, `CK-001.b`, `CK-002.a`, `CK-003.a`, and `CK-004.a` only.

## Clause-by-clause closure

| Clause | Status | Exact evidence / command | Frozen oracle |
| --- | --- | --- | --- |
| CK-001.a | `PROVEN` | `docker compose up -d --build --wait atlas agents-bridge-worker`; `docker compose exec -T atlas node apps/atlas/scripts/perception-compose-seed.mjs docling`. Authenticated `/api/projects` kickoff recorded D1 `3152fe64-8a77-4c6f-9a7f-52cc66564d24`, one member/execution/cache, zero semantic executions. | PASS — IDSER-003 created only D1 and accepted one qualified result. |
| CK-001.b | `PROVEN` | The same named run recorded `phase=completed`, `elapsedMilliseconds=3841`. | PASS — actual D1 latency is recorded. |
| CK-002.a | `PROVEN` | `docker inspect --format '{{.Image}} {{index .Config.Image}}' ces-platform-docling-serve-1`; `docker image inspect quay.io/docling-project/docling-serve-cpu:v1.36.0@sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7 --format '{{join .RepoDigests "\\n"}}'`. Both resolved to the frozen digest. | PASS — running service matches the qualified image/runtime identity. |
| CK-003.a | `PROVEN` | `node apps/agents-bridge/tests/docling-cfc-compose.mjs`; durable output `.codex-tools/bss-v2-004-02-cfc-matrix-final-3.out`. It starts real Compose `atlas`, `pg-boss`, `agents-bridge-worker`, `docling-fault`, and `atlas-fault`, submits via authenticated `/api/projects` IDSER-003 kickoff, then drives the real worker across a Compose-private HTTP Docling adapter boundary. | PASS — all named cases preserve bounded failure/recovery; no invalid acceptance, fallback, or semantic continuation. |
| CK-004.a | `PROVEN` | Carried forward unchanged from the user-confirmed real Compose Bridge worker restart/replay scenario at continuation. The CK-003 harness does not alter replay/fencing code. | PASS — user-confirmed restart/replay preserves one logical execution/result/cache. |

## CK-003.a real Compose failure matrix

The durable JSON evidence records project/bundle-document-derived D1 execution identity, idempotency key, source hash, terminal state, cache/member/execution/semantic counts, queue retry and limit, Bridge lease, and staged-result count. Every fault row: `execution_count=1`, `member_count=1`, `cache_count=0`, `semantic_execution_count=0`, `staged_result_count=0`, `bridge_effect_state=completed`; configured qualified route only is `docling-digital-pdf`, with no remote provider or subprocess fallback.

| Injected fault | Project / execution | Actual inherited disposition | Execution result |
| --- | --- | --- | --- |
| unavailable | `compose-docling-fc680cdb-430` / `6d22a2a9-8226-4e1b-967a-c705d2d2d131` | retry exhaustion `2/2`, lease `3` | `failed`; recovery passed. |
| not-ready | `compose-docling-cca57f08-356` / `565216e8-7d92-4a57-b996-611a5b550dee` | retry exhaustion `2/2`, lease `3` | `failed`; recovery passed. |
| HTTP reset | `compose-docling-af3920ee-118` / `ccf5d99a-c6d3-49a7-bdea-bc58ae77a2fe` | retry exhaustion `2/2`, lease `3` | `failed`; recovery passed. |
| HTTP 5xx | `compose-docling-43a43adf-58b` / `2c9f8144-dfb5-43f3-8315-8366d2a87491` | retry exhaustion `2/2`, lease `3` | `failed`; recovery passed. |
| processing failure | `compose-docling-777335e0-d21` / `feb306aa-0acd-4f73-b090-d6c84973c561` | deterministic terminal, retries `0`, lease `1` | `failed`; no staged replay. |
| Bridge timeout | `compose-docling-19a6cfeb-a17` / `32acd72d-06d3-4d51-abf3-43c91e71c1fc` | retry exhaustion `2/2`, lease `3` | `failed`; recovery passed. |
| malformed response | `compose-docling-2c19ac14-3c6` / `585b16d7-ddf6-49a4-a04a-35f4b9a8096c` | deterministic terminal, retries `0`, lease `1` | `failed`; no staged replay. |
| incomplete response | `compose-docling-216ece6a-1d1` / `c5a92c3a-f19a-40dd-9180-99e349d24b39` | deterministic terminal, retries `0`, lease `1` | `failed`; no staged replay. |
| mapper rejection | `compose-docling-d13a184a-27f` / `01490634-d1e4-4825-b4e0-43829b6568e4` | deterministic terminal, retries `0`, lease `1` | `failed`; source-provenance validation prevents acceptance. |
| normalization/integrity rejection | `compose-docling-75513490-1fc` / `4a3d27cf-474f-47f3-ada1-b9c0691968ac` | deterministic terminal, retries `0`, lease `1` | `failed`; normalizer bound prevents handoff. |
| recovery after all faults | `compose-docling-bc94044e-26f` / `f4558f49-71f2-47b2-8610-2e3a1548b6f9` | normal delivery, retries `0`, lease `1` | `completed`, `cache_count=1`, zero staged/semantic rows. |

`docker-compose.cfc.yml` is test-only and opt-in: it permits only Compose-private `docling-fault` with `DOCLING_ALLOW_TEST_FAULT_PROXY=true` and shortens only its per-request deadline (`DOCLING_TIMEOUT_MS=5000`). Retry limit/backoff inherit production Compose defaults. Production still requires `http://docling-serve` and has no proxy configuration.

## Regression and readiness

- `pnpm --filter @atlas/agents-bridge typecheck` — passed.
- `pnpm --filter @atlas/agents-bridge test` — passed; relevant Docling, perception worker, queue, replay, and authority tests passed (its separately opt-in Compose rows are skipped by design).
- `git diff --check` — passed.
- Direct regression check: `CK-001.a`, `CK-001.b`, `CK-002.a`, and carried-forward `CK-004.a` remain `PROVEN`; the bounded diff adds only kickoff evidence and CFC test instrumentation.

## Internal readiness

`Internal readiness: READY_FOR_CK`.

All frozen clauses are `PROVEN`. CK must verify only the frozen clauses, this bounded remediation diff, and direct regressions.
