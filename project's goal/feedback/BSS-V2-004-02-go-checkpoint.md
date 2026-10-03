# BSS-V2-004-02 GO checkpoint

- **Ticket:** BSS-V2-004-02 — IDSER D1 persistent-Docling perception lifecycle checkpoint
- **Batch:** BSS-V2-BATCH-04.02
- **State:** `awaiting_review`
- **Review target:** this bounded implementation commit
- **Predecessor:** BSS-V2-004-01 CK `PASS` (`BSS-V2-BATCH-04.01-1a71828-verification.md`)

## Bounded implementation

Compose now activates only the approved `docling-digital-pdf` qualified route
for `atlas.document.perceive`. The worker performs its existing private
health/ready/version/profile/warm-up gate before advertising readiness. Atlas
uses the route identity as the explicitly terminal D1 checkpoint: it accepts
the normalized perception result/cache but creates no semantic execution,
candidate, or truth advancement.

The implementation retains BSS-006 pg-boss ownership, BSS-009 source grants,
authenticated result delivery, replay staging, completion fencing, and the
Bridge restricted role. No Docling persistence credentials, second queue,
Redis/RQ, subprocess fallback, or semantic provider was introduced.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence and outcome | Status |
| --- | --- | --- | --- |
| RC-BSSV2-004-02-01 | Real D1 lifecycle: exact redeemed bytes through resident qualified service, mapper/normalizer, authenticated one-result handoff; metadata-only queue. | Recreated Compose Atlas/Bridge/worker/Docling stack; scoped D1 seed completed through the real service. `perception-integration.test.ts` passed against Compose PostgreSQL and asserts opaque queue payload plus one logical completion. | PROVEN |
| RC-BSSV2-004-02-02 | Explicit active 004-01 route, runtime/profile/readiness/warm gate, restart recovery. | `docker compose config`; worker-ready gate; `docling-provider.test.ts` (health, ready, version/profile mismatch fail-closed); real stop/restart of `docling-serve`, followed by Compose health/warm recovery and successful scoped D1 run. | PROVEN |
| RC-BSSV2-004-02-03 | Expired/tampered grant; hash/size/MIME mismatch fail before conversion with no cache/result. | Compose PostgreSQL `perception-negative.integration.test.ts` passed after repairing its evidence fixture to bind each case to a real D1 bundle/member. Source authority cases assert no completed execution, cache, or staged replay output. | PROVEN |
| RC-BSSV2-004-02-04 | Service/network/processing/timeout/cancellation/malformed/mapper/normalization failures retain inherited bounded disposition and remain perception-only. | `docling-provider.test.ts` covers unavailable/not-ready/network/timeout/cancellation/malformed/mapper failures. Compose negative matrix covers terminal failure handoff and no trusted completion. Evidence repair preserves retryable transport errors and treats final timeout/unavailability separately from terminal malformed/integrity failures. | PROVEN |
| RC-BSSV2-004-02-05 | Delivery outage and acknowledgement loss replay one logical result/cache without fresh source/provider work. | `document-perception-worker.test.ts` and Compose `perception-integration.test.ts` passed: staged normalized output is replayed after acknowledgement loss; cache/result completion is idempotent. | PROVEN |
| RC-BSSV2-004-02-06 | Duplicate, stale/conflicting, Bridge restart/replay, and service restart preserve exactly one accepted state. | Compose `perception-integration.test.ts` passed duplicate/fence/retry lifecycle assertions. Compose PostgreSQL `perception-authority.integration.test.ts` passed idempotent replay and conflicting completion rejection. Resident Docling stop/restart proves unavailable-until-recovered behavior. | PROVEN |
| RC-BSSV2-004-02-07 | Preserve source/truth/role/queue boundaries; no semantic continuation. | `perception-authority.integration.test.ts` passed Bridge-role denial. Queue/client tests prove raw source, grants, storage keys, and credentials do not enter queue/ordinary transport. Scoped real D1 state query observed `semantic_execution_count = 0`; terminal D1 gate is covered by the bounded implementation. | PROVEN |

Required commands recorded as passing:

```text
docker compose config
docker compose up -d --build --wait atlas agents-bridge-worker
pnpm --filter @atlas/agents-bridge test
DATABASE_URL=... jiti tests/perception-integration.test.ts
DATABASE_URL=... jiti tests/perception-negative.integration.test.ts
DATABASE_URL=... pnpm --filter @atlas/db exec jiti tests/perception-authority.integration.test.ts
pnpm --filter @atlas/agents-bridge exec jiti tests/docling-provider.test.ts
pnpm --filter @atlas/db typecheck
pnpm --filter @atlas/agents-bridge typecheck
git diff --check
```

Diagnostic only: manually enabling the legacy `worker.integration.test.ts`
reveals its pre-existing Drizzle transaction-proxy `unsafe` incompatibility.
The ticket-required pg-boss behavior is proven by the passing Compose
perception integration and is not broadened by that unrelated harness defect.

Internal readiness: READY_FOR_CK
