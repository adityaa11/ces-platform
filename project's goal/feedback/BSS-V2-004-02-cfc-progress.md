# BSS-V2-004-02 CFC checkpoint — CK-004.a evidence remediation

- **Ticket:** BSS-V2-004-02 — IDSER D1 persistent-Docling perception lifecycle checkpoint
- **Source CK:** `project's goal/feedback/BSS-V2-BATCH-04.02-88925e0-verification.md`
- **Consumed HMN authorization:** `HMN-BSS-V2-004-02-001`
- **CFC state:** `awaiting_review`
- **Review target:** this single bounded remediation commit
- **Authorized frozen clause:** `CK-004.a` only

`CK-001.a`, `CK-001.b`, `CK-002.a`, and `CK-003.a` remain resolved and frozen
closed. This remediation changes neither production lifecycle behavior nor
their evidence requirements.

## CK-004.a closure evidence

The real Compose scenario was executed through the production-shaped path:

```text
authenticated IDSER-003 kickoff -> pg-boss -> agents-bridge-worker
-> qualified private Docling -> staged normalized result
-> controlled authenticated result-delivery outage -> worker recreation
-> replay -> Atlas acceptance
```

- **Stable evidence artifact:** `.codex-tools/bss-v2-004-02-cfc-restart-replay-final-2.out`
- **Harness:** `apps/agents-bridge/tests/docling-cfc-compose.mjs`
- **Exact scenario invocation:**
  `CFC_RESTART_REPLAY_ONLY=true node apps/agents-bridge/tests/docling-cfc-compose.mjs`
- **Recorded worker recreation command:**
  `docker compose -f docker-compose.yml -f docker-compose.cfc.yml kill -s SIGKILL agents-bridge-worker && docker compose -f docker-compose.yml -f docker-compose.cfc.yml up -d --force-recreate --wait agents-bridge-worker`

The harness enables only its existing opt-in `atlas-fault` result-delivery
outage. It performs the authenticated kickoff and actual Docling conversion
before the fault; it neither replaces the worker path nor changes production
retry, replay, fencing, queue, or service configuration.

| Observation | Before recreation | After restarted-worker replay |
| --- | --- | --- |
| D1 identity | execution `43628712-f642-46fb-abe7-8f3c5ea436d2`; idempotency key `perception:e5e860a5-d390-42e4-b6f5-f2091a4948c0:af655b5b-a235-45dd-b891-a1b144cd1789:v1` | Same execution and idempotency key |
| Perception state / scoped execution count | `fetching_source` / `1` | `completed` / `1` |
| Active normalized cache / semantic executions | `0` / `0` | `1` / `0` |
| Replay staging | `staged_result_count=1`, scoped staged execution count `1` | both `0` after acknowledgement |
| Queue / effect fence | `queue_state=retry`, retry `0/2`, effect `pending`, original execution identity, lease generation `1` | `queue_state=completed`, retry `1/2`, effect `completed`, same execution identity, lease generation `2` |
| Actual Compose worker | container `59ba4f5f…`, running | stopped at `2026-10-03T17:55:53.11115222Z`; recreated as distinct container `0c70f2f6…`, running at `2026-10-03T17:55:56.508724697Z` |

The persisted staged normalized result therefore survived termination of the
actual worker container. Its recreated successor claimed a higher fenced lease,
replayed the same D1 identity, accepted exactly one cache/result, and cleared
the staged row only after acknowledgement. The one scoped effect row remains
bound to the original execution identity; no conflicting or stale replacement
was accepted. `semantic_execution_count=0` both before and after recovery.

**Frozen-oracle conclusion:** `CK-004.a` is `PROVEN`. The artifact directly
records a Compose Bridge worker restart/replay and the required scoped
exactly-once state before and after it.

## Direct regressions and readiness

- `node --check apps/agents-bridge/tests/docling-cfc-compose.mjs` — passed.
- `pnpm --filter @atlas/agents-bridge test` — passed (including Docling,
  document-perception replay, queue, and authority coverage; opt-in Compose
  rows remain skipped by design).
- `pnpm --filter @atlas/agents-bridge typecheck` — passed.
- `git diff --check` — passed.

`Internal readiness: READY_FOR_CK`.

CK verification must inspect only `CK-004.a`, this bounded evidence-remediation
diff, the evidence artifact above, and direct regressions introduced by it.
