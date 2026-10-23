# GHR-03A GO checkpoint

- **Ticket:** GHR-03A — Semantic batch-plan receiver adapter and parse-only decision
- **State:** `awaiting_review`
- **Implementation/review target:** `f5532b5f798d77357b42a15f041ca393c6c0d17e` — `feat(ghr): add semantic batch plan receiver`
- **Authority:** [GHR-03A frozen ticket](../Backend_Phase/tickets/GHR_Phase/GHR-03A-semantic-batch-plan-receiver-adapter.md), incorporating [GHR v0.6 §§3.1–3.2, 4, 5.1, 8–10](../Backend_Phase/atlas-generic-handoff-router-implementation-context-v0.6-review.md); predecessor GHR-02B CK PASS at `dde68c56` as recorded by [GHR-02B CK verification](GHR-02B-b4279a18-verification.md).

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence / validation | Status |
| --- | --- | --- | --- |
| GHR-03A-RC-01 | Only the exact `perception.acceptance` / `semantic/batch-plan` / `v1` / `v1` / `SemanticBatchPlanInput/v1` Test-1 pins select the live semantic branch; mismatched or unknown selectors select no receiver. | `branches/batch-plan.route.ts` declares the sole frozen false-only registration, with 2,048/2,081-byte limits. `tests/ghr-03a-semantic-receiver.test.ts` resolves it and rejects each mismatched selector; `test:ghr-01b` continues to prove isolated main/domain registry composition. | PROVEN |
| GHR-03A-RC-02 | The unchanged five-field payload is handled only by the existing canonical parser; malformed, extra, noncanonical, and wrong-contract payloads reject. | `bodies/semantic-batch-plan-input.v1.ts` delegates directly to `@atlas/db` `parseSemanticBatchPlanInputV1()` and re-exports its canonical serializer only for parity. The focused test proves canonical acceptance and malformed, extra-key, invalid-field, and noncanonical rejection; its static oracle rejects a local JSON/Zod parser. | PROVEN |
| GHR-03A-RC-03 | Only an explicit `false` verified command yields a parse-only decision; missing/nonboolean/coerced/`true` modes cannot succeed. | `receiveVerifiedBatchPlan()` first requires exact pins then uses `command.canContinue !== false`. Focused negatives cover `undefined`, `null`, `0`, string `"false"`, and boolean `true`; the sole positive command is false. | PROVEN |
| GHR-03A-RC-04 | Receiver execution has no database write, queue, resolver, planner, BSS, SEM, provider, reconciliation, projection, or downstream-handoff effect. | Receiver imports only the body adapter and registry selector, returns frozen `{ disposition: "parsed_only", input }`, and contains no runtime persistence or worker operation. The focused static zero-side-effect oracle forbids `resolveBackground`, database construction/transactions, `PgBoss`, SQL execution, and GHR queue imports. | PROVEN |

## Validation record

```text
corepack pnpm --filter @atlas/agents-bridge test:ghr-03a       PASS (4 tests)
corepack pnpm --filter @atlas/agents-bridge test:ghr-01b       PASS (3 tests)
corepack pnpm --filter @atlas/agents-bridge typecheck          PASS
git diff --check                                                PASS
docker compose -p atlas-canonical-perception -f docker-compose.yml ps
  canonical PostgreSQL, Atlas, Bridge, and Bridge worker remain healthy; no service or database mutation performed
```

## Scope and handoff

This checkpoint adds only the pure semantic route declaration, canonical-parser adapter, false-only verified-command receiver, and focused proof. It introduces no generic-body parser, queue consumer, delivery authentication, handoff lookup, database access, durable ACK/receipt, `resolveBackground()` call, resolver, planner, BSS, SEM, provider, reconciliation, projection, or downstream effect. GHR-03B remains the sole owner of real pointer-job delivery, authentication, fences, and the durable `parsed_only` receipt.

Internal readiness: READY_FOR_CK
