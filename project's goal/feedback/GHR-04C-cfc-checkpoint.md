# GHR-04C CFC checkpoint — awaiting CK verification

- **Ticket:** `GHR-04C` — Worker HTTP cutover and durable receipt fencing
- **CK source:** [GHR-04C CK review](GHR-04C-8089b773-review.md)
- **Reviewed implementation:** `8089b773b69e7094dc964daba144e8eb7063b3ae`
- **Remediation base:** `16b94f00` (`docs(ghr): record GHR-04C GO checkpoint`)
- **Remediation commit:** the bounded commit containing this checkpoint — `test(ghr): prove HTTP receipt recovery`
- **Checkpoint state:** `awaiting_review`
- **CFC result:** `READY_FOR_CK`; CFC does not issue `PASS`

This is the single initial CFC pass for the review's frozen open clauses
`CK-001.a`, `CK-002.a`, and `CK-002.b`. It changes only the real GHR worker
integration evidence in `ghr-03b-real-e2e.integration.test.ts`; production
delivery, receiver, route, configuration, receipt, and downstream behavior are
unchanged. Previously proven `GHR-04C-RC-01` is preserved.

## Authorized closure progress

| CK clause | Frozen oracle / required evidence | Remediation evidence | Required command and outcome | Status |
| --- | --- | --- | --- | --- |
| `CK-001.a` | A real receiver-accepted first request loses its acknowledgement; its retry or restart leaves one `parsed_only` receipt with unchanged handoff identity, idempotency key, digest, one logical receipt, and no downstream effect. | `apps/agents-bridge/tests/ghr-03b-real-e2e.integration.test.ts`, `GHR-04C retries a receiver-accepted acknowledgement loss...`, delays the existing Fastify listener's first completed `200` beyond the dispatcher's 25 ms timeout. It queries the pending first receipt, expires its lease, retries through the same listener, and asserts identity, lease generation `2`, one terminal receipt, two HTTP acceptances, and unchanged semantic/BSS counts. | `corepack pnpm --filter @atlas/agents-bridge test:ghr-03b` with `GHR03B_REAL_E2E=1` and the local Compose PostgreSQL `DATABASE_URL` — **PASS** (6/6). | `PROVEN` — frozen lost-acknowledgement oracle passed. |
| `CK-002.a` | Real HTTP worker delivery maps `422` to sanitized `quarantined`; `403`, `404`, and `405` fail closed, with exact durable disposition/error class, bounded pointer-job result, no `parsed_only`, and no fallback. | The same real pg-boss/PostgreSQL harness now drives a real Fastify listener returning each named status and asserts the durable receipt for each: `422 → quarantined/receiver_rejected`; `403/404/405 → blocked/invalid_route`. The existing authenticated-listener invalid-credential assertion covers its existing `401` response. | `corepack pnpm --filter @atlas/agents-bridge test:ghr-03b` with `GHR03B_REAL_E2E=1` and the local Compose PostgreSQL `DATABASE_URL` — **PASS** (6/6). | `PROVEN` — each frozen status disposition and receipt oracle passed. |
| `CK-002.b` | For redirect, malformed/mismatched acknowledgement, timeout, and `5xx`, the real worker records no `parsed_only`, follows the frozen blocked/quarantined/retry-exhausted outcome, does not use fallback, leaves downstream counts unchanged, and keeps diagnostics bounded. | The real harness now routes worker delivery through Fastify faults for redirect, malformed acknowledgement, mismatched acknowledgement, oversized acknowledgement, timeout, and `503`. It asserts `blocked/invalid_route`, `quarantined/corrupt_envelope`, or retry followed by fenced `retry_exhausted/transient_delivery`, respectively; every case checks zero `parsed_only` and unchanged semantic/BSS counters. | `corepack pnpm --filter @atlas/agents-bridge test:ghr-03b` with `GHR03B_REAL_E2E=1` and the local Compose PostgreSQL `DATABASE_URL` — **PASS** (6/6). | `PROVEN` — each frozen transport-negative oracle passed. |

## Direct-regression validation

```text
corepack pnpm --filter @atlas/agents-bridge typecheck
# PASS

corepack pnpm --filter @atlas/agents-bridge test:ghr-01b
# PASS (3/3)

corepack pnpm --filter @atlas/agents-bridge test:ghr-03a
# PASS (4/4)

corepack pnpm --filter @atlas/agents-bridge test:ghr-03b
# with GHR03B_REAL_E2E=1 and the local Compose PostgreSQL DATABASE_URL
# PASS (6/6)

corepack pnpm --filter @atlas/agents-bridge test:ghr-04a
# PASS (4/4)

corepack pnpm --filter @atlas/agents-bridge test:ghr-04b
# PASS (4/4)

docker compose config --quiet
# PASS

git diff --check
# PASS
```

## Shadow-CK evidence check

All authorized frozen clauses are `PROVEN` using their unchanged closure
oracles. The repair adds no production behavior and retains the existing
GHR-03B fence/retry classifications, GHR-04A registered-destination boundary,
and GHR-04B authenticated raw-byte receiver. No direct regression remains.

**Internal readiness: READY_FOR_CK**

## Handoff

State: `awaiting_review`.

CK must verify only `CK-001.a`, `CK-002.a`, and `CK-002.b`, this bounded
evidence remediation diff, and direct regressions. This checkpoint does not
issue `PASS` or authorize another CFC cycle.
