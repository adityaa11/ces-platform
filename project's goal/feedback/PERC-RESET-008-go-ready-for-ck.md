# PERC-RESET-008 GO — restart proof and canonical perception handoff

- **Ticket state:** `awaiting_review`; **HMN authority:** `HMN-PERC-RESET-008-001` (`RETURN_TO_GO`); **predecessor:** PERC-RESET-007 CK `PASS` at `06b67dd347542aa6ff2df020354c98b3764188c1`.
- **Scope:** existing canonical runtime and its two accepted projects only. No source reimport, semantic work, Master publication, qualification overlay, or successor implementation.

## Restart and live observations

Normal Compose restart:

```powershell
docker compose -p atlas-canonical-perception -f docker-compose.yml restart docling-serve atlas agents-bridge agents-bridge-worker
```

All four services reached `healthy`; PostgreSQL remained healthy. Docling `/ready` returned `200`; the required embedded-baseline fingerprint reproduced as `01ba86056ff361a5b5efb51a570ea8041e9c48acb2ed1e4107e3265a662ccf45`. Logs confirm no runtime model download. No cache volume exists or is claimed as model-preservation proof. Post-restart Docker inventory contains one Compose project, one project network, two data volumes, canonical Compose containers/images, and no unexpected residue.

Read-only Project B qualification returned the existing project/bundle, exactly three originals and hashes, three completed RUN-003 executions/distinct caches, all members `perceived`, one empty Master/Initial Draft, zero semantic executions/jobs/provider calls, and zero-visual table outputs `2/3/1`. Project A remained `perceived`; all five authorized post-restart derived-asset readbacks matched persisted manifest byte sizes and SHA-256 values. Project A has one source/execution/cache and Project B has three; both semantic counts are zero and `pgboss` has zero background-execution jobs.

## Replay/idempotency negatives

`pnpm --filter @atlas/agents-bridge exec jiti tests/document-perception-worker.test.ts` passed **12/12**. It proves lost acknowledgement replays staged normalized output without a second provider call, and a staged RUN-003 result after acceptance outage replays without another conversion or asset upload. It also covers zero-visual acceptance and missing/foreign/duplicate/colliding asset negatives. No unrelated semantic integration suite ran.

`CANONICAL-PERCEPTION-BASELINE-v1.md` records the exact manual contract, start/restart commands, hashes, RUN-003 identity, known limitations, supersession rule, retained guarantees, and the scoped future-HMN ambiguity.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- |
| RC-PERC-RESET-008-01 | Check 1; HMN-008-001: inventory, embedded image baseline/fingerprint, no false volume claim, residue reporting | Compose/Docker inventory; in-container path/count/size/fingerprint; restart logs | PROVEN |
| RC-PERC-RESET-008-02 | Check 2: normal restart/readiness and preserved accepted outputs/assets | Compose restart; health/ready; Project B read-only rerun; Project A authorized readback | PROVEN |
| RC-PERC-RESET-008-03 | Check 3: bounded lost-ack/replay/idempotency negatives | `pnpm --filter @atlas/agents-bridge exec jiti tests/document-perception-worker.test.ts` — 12/12 pass | PROVEN |
| RC-PERC-RESET-008-04 | Check 4/final oracle: two projects, four `perceived`, RUN-003 only, zero semantic/old dispatch | Live project/cache/execution evidence and focused route/worker suite | PROVEN |
| RC-PERC-RESET-008-05 | Check 5: versioned supported contract and Windows quickstart | `CANONICAL-PERCEPTION-BASELINE-v1.md` | PROVEN |
| RC-PERC-RESET-008-06 | Check 6: baseline supersession, RUN-003 examples, shared guarantees, conflict ledger | Baseline supersession and ledger | PROVEN |
| RC-PERC-RESET-008-07 | Check 7: bounded perception-only commit and independent handoff | These two new ticket-owned artifacts only; explicit-path commit; no self-issued PASS | PROVEN |

Internal readiness: `READY_FOR_CK`.

This is not a CK `PASS`; independent CK must verify the checkpoint before the supersession rule takes effect.
