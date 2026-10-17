# CFC checkpoint — BSS-V2-006-04-02

- **Ticket:** `BSS-V2-006-04-02` — Provider work admission and exclusive send boundary
- **Batch / state:** `BSS-V2-BATCH-06-04-02` / `awaiting_review`
- **Remediation base:** `ca605aee60463defb9d5a5472f188ce968e41889`
- **Remediation commit:** this bounded CFC checkpoint commit, `test(admission): prove external consumer boundary`
- **Frozen CK artifact:** `project's goal/feedback/BSS-V2-BATCH-06-04-02-ca605ae-review.md`
- **Authority:** first CFC pass after that artifact's consolidated `CHANGES_REQUIRED` result. No HMN authorization was required or consumed.

## Bounded remediation

Only `apps/agents-bridge/tests/provider-work-admission.integration.test.ts` was
changed. The independent semantic-like background fixture now makes its fresh
positive registration exclusively through authenticated
`POST /v1/provider-work-admissions`; it does not call the internal admission
service for that logical work. It captures the typed `ProviderWorkAdmission/v1`
outcome and proves its exact work, attempt, reservation, pg-boss job, claim,
and one fake-send identity chain. The same fixture records a direct-adapter
counter and asserts it is zero for the positive, replay/hash-conflict, stale,
and cancelled paths. No production sender, provider adapter, semantic parsing,
result projection, retry, or deployment behavior was changed.

## CFC progress matrix

| Frozen clause | Status | Exact evidence and frozen oracle result | Required command and outcome |
| --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | The fresh positive logical work first enters at the actual authenticated Bridge HTTP admission route through an independently implemented semantic-like background consumer. It receives a typed `ProviderWorkAdmission/v1` response, then the fixture observes its one reservation, pg-boss dispatch, 03A claim, and permitted generic fake send. No internal `admission.admit(...)` pre-registration remains. | `DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-work-admission.integration.test.ts` — PASS (1 test). Oracle: PASS. |
| `CK-001.b` | `PROVEN` | The response `logicalWorkId`, `attemptNumber`, `reservationId`, and `jobId` are matched exactly against one durable work/attempt, reservation, dispatch, `pgboss.job`, 03A claim, and fake send. Replay and payload-hash conflict leave the original work at one attempt/reservation/dispatch/claim; stale admission has zero of all four; pre-send cancellation has one authorized attempt/reservation/dispatch and zero claim/send. | Same focused command — PASS (1 test). Oracle: PASS. |
| `CK-001.c` | `PROVEN` | The fake consumer has an explicit prohibited direct-adapter-send counter. It is asserted zero for the permitted positive path and remains zero across replay, conflict, stale, and cancelled paths, while the generic outbound transport counter and captured payload show exactly one allowed send after claim. | Same focused command — PASS (1 test). Oracle: PASS. |

## Direct regressions checked

```text
corepack pnpm --filter @atlas/agents-bridge typecheck                                                                                                        PASS
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.test.ts              PASS (1 test)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts  PASS (1 test)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/agents-bridge exec jiti tests/runtime-capacity-constraint.integration.test.ts PASS (1 test)
DATABASE_URL=postgresql://atlas:atlas_local_dev_only@localhost:5432/atlas_dev corepack pnpm --filter @atlas/db migration:check                                                   PASS
git diff --check                                                                                                                                               PASS
```

Unrelated modified and untracked workspace paths were left untouched and will
not be staged. Every authorized frozen clause is `PROVEN`; no direct regression
was observed.

Internal readiness: READY_FOR_CK
