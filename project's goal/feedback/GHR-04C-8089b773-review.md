# GHR-04C CK review

- **Ticket:** `GHR-04C` — Worker HTTP cutover and durable receipt fencing
- **Batch:** `GHR-04C`
- **Ticket state at review:** `awaiting_review`
- **Reviewed implementation commit:** `8089b773b69e7094dc964daba144e8eb7063b3ae` — `feat(ghr): cut worker delivery over to HTTP`
- **Frozen ticket:** [GHR-04C worker HTTP cutover and durable receipt fencing](../Backend_Phase/tickets/GHR_Phase/GHR-04C-worker-http-cutover-and-durable-receipt-fencing.md)
- **GO checkpoint:** [GHR-04C GO checkpoint](GHR-04C-go-checkpoint.md)
- **Predecessor authority:** GHR-03B `PASS` at `c84b9dfac8cf04ad8bfdc8901b3fa3ad2134a67a`, GHR-04A `PASS` at `e919b672b7295a584acc902f20ef5d8c756508e7`, and GHR-04B `PASS` at `2e6579caf5f99790629d1852228ead8aa5a0df60`
- **Result:** `CHANGES_REQUIRED`

## Review preconditions

The ticket is `awaiting_review`, and the GO checkpoint records the same full
implementation commit reviewed here. The target commit exists and is an
ancestor of the current `HEAD`. No tracked GHR-04C implementation or test
file differs after the target; the remaining dirty and untracked worktree paths
are unrelated to the reviewed target and do not make it ambiguous.

## Review Contract

| Row | Ticket authority / required proof | Evidence and validation | Status |
| --- | --- | --- | --- |
| `GHR-04C-RC-01` | A real GHR worker POSTs verified immutable bytes to the existing Fastify listener using only the registered destination/origin/credential seams and receives the matching authenticated `parsed_only` acknowledgement. | `delivery-worker.ts` composes the dispatcher from `resolveMainRouteBinding()` and deployment transport configuration. The real pg-boss/Fastify integration in `ghr-03b-real-e2e.integration.test.ts` passed and asserted the matching receipt. | `PROVEN` |
| `GHR-04C-RC-02` | One receipt terminalizes only after a valid matching `200`; duplicate delivery, lost acknowledgement, restart, lease recovery, stale/expired lease, and concurrent claim retain identity and one terminal receipt. | The real harness passed duplicate, restart, expired-generation, concurrent-claim, and receipt-fault cases. The duplicate after the first successful receipt does not simulate a receiver-accepted request whose acknowledgement is lost before worker terminalization. | `IMPLEMENTED_UNPROVEN — CK-001` |
| `GHR-04C-RC-03` | Invalid credential, receiver `400/422`, forged/changed request, unmatched acknowledgement, unknown path, redirect, timeout, and `5xx` follow the stated no-success/quarantine/transient rules with no local fallback. | Real tests prove 400, invalid credential, network unavailability, malformed/mismatched/oversized acknowledgement, redirect, timeout, and 5xx classification in separate seams. The committed evidence does not exercise 422 or 403/404/405 through the worker, and the dispatcher-only cases do not assert the resulting durable receipt and downstream invariants. | `IMPLEMENTED_UNPROVEN — CK-002` |
| `GHR-04C-RC-04` | The former direct receiver path has no production caller/export/injection or active composition wiring; reusable receiver code is HTTP-only, with zero downstream effects and sanitized diagnostics for cutover outcomes. | Static absence checks, the real receipt matrix, receipt-schema boundary checks, typecheck, focused tests, real 5/5 integration, Compose validation, and diff check passed. Runtime zero-downstream proof is incomplete for the unexercised RC-03 transport outcomes. | `IMPLEMENTED_UNPROVEN — CK-002` |

## Validation and evidence

Executed against the reviewed target-equivalent tracked files:

- `corepack pnpm --filter @atlas/agents-bridge typecheck` — PASS.
- `corepack pnpm --filter @atlas/agents-bridge test:ghr-01b` — PASS, 3/3.
- `corepack pnpm --filter @atlas/agents-bridge test:ghr-03a` — PASS, 4/4.
- `corepack pnpm --filter @atlas/agents-bridge test:ghr-03b` with the local PostgreSQL database and `GHR03B_REAL_E2E=1` — PASS, 5/5.
- `corepack pnpm --filter @atlas/agents-bridge test:ghr-04a` — PASS, 4/4.
- `corepack pnpm --filter @atlas/agents-bridge test:ghr-04b` — PASS, 4/4.
- `docker compose config --quiet` — PASS.
- `git diff --check 8089b773b69e7094dc964daba144e8eb7063b3ae^ 8089b773b69e7094dc964daba144e8eb7063b3ae` — PASS.

The real integration asserted one `parsed_only` receipt, immutable body hash,
lease generation, unchanged semantic/BSS/downstream counters, invalid
credential fail-closed behavior, receiver rejection quarantine, unreachable
endpoint retry/exhaustion, restart, stale lease reclamation, concurrent claim,
and sanitized receipt boundaries. The focused dispatcher test asserted the
registered `POST` path, original bytes, credential, redirect rejection,
bounded/malformed/mismatched acknowledgements, timeout, and 5xx result.

## Findings

### CK-001 — Lost-acknowledgement recovery is not proven

The frozen **GHR-04C-RC-02** contract and exact scope item 5 require one
receipt identity across a lost acknowledgement as well as duplicate delivery,
restart, lease recovery, stale/expired lease, and concurrent claim. In
`apps/agents-bridge/tests/ghr-03b-real-e2e.integration.test.ts:167-170`, the
first delivery receives and terminalizes a successful acknowledgement; the
second call only observes the already-terminal `parsed_only` row. The restart
case at `:247-264` likewise replays after a successful receipt. Neither case
proves that Fastify accepted the request, the acknowledgement was lost before
worker terminalization, and a retry/restart preserved the same identity and
single terminal receipt.

### CK-002 — Named transport negatives are not proven at the worker receipt boundary

The frozen **GHR-04C-RC-03** evidence requirement is real-HTTP negative testing
with receipt and retry assertions, and **GHR-04C-RC-04** requires zero
downstream effects for every cutover outcome. The focused dispatcher test
(`ghr-04a-http-dispatcher.test.ts:81-87`) covers only dispatcher result values;
it has no `422`, `403`, `404`, or `405` response modes and does not invoke the
worker or inspect a durable receipt. The Fastify test's unknown-path and
authentication checks (`ghr-04b-authenticated-http-receiver.test.ts:63-75`)
are direct endpoint requests, not dispatcher/worker delivery assertions. The
real worker matrix covers `400`, `401`, and network unavailability, but not the
remaining named transport outcomes through receipt terminalization and the
zero-downstream oracle.

## Frozen Finding Closure Matrix

| Finding / clause | Ticket authority | Unsatisfied evidence | Binary closure oracle | Direct-regression boundary | Status |
| --- | --- | --- | --- | --- | --- |
| `CK-001.a` | GHR-04C exact scope item 5; `GHR-04C-RC-02` lost-acknowledgement requirement | No committed real worker/Fastify/pg-boss observation loses the first acknowledgement after receiver acceptance and then retries or restarts the pointer. | A real receiver-accepted request whose first acknowledgement is lost must be followed by a retry/restart; the final state must contain one terminal `parsed_only` receipt for the original handoff with unchanged handoff identity, idempotency key, body digest, and one logical receipt count, with no downstream effect. Evidence must identify the executed scenario and receipt queries. | Lost-acknowledgement/retry/restart behavior in the GHR worker and its real HTTP harness only; do not broaden to downstream semantic execution. | `OPEN` |
| `CK-002.a` | `GHR-04C-RC-03` receiver `400/422`, authentication, and unknown-path failure table; required real-HTTP negative evidence | `422` and `403/404/405` are not exercised through the dispatcher/worker with the required disposition and receipt assertions. Direct Fastify 404/401 checks and the source branch are not a substitute for the worker boundary. | Through the real HTTP delivery path, a receiver `422` must terminalize as sanitized `quarantined` with no `parsed_only`; receiver `403`, `404`, and `405` must fail closed with no successful receipt or local fallback. The test must assert the exact durable disposition/error class and the bounded pointer-job outcome for each exercised status. | HTTP status classification, durable receipt terminalization, and no-fallback behavior only; no route redesign or new receiver capability. | `OPEN` |
| `CK-002.b` | `GHR-04C-RC-03` unmatched acknowledgement, redirect, timeout, and `5xx` scenarios; `GHR-04C-RC-04` zero-downstream requirement | Dispatcher-only assertions prove result values for redirect, malformed/mismatched/oversized acknowledgement, timeout, and 5xx, but no worker-level receipt/no-fallback/downstream observation is recorded for those outcomes. | For each named dispatcher negative, the real worker harness must show no `parsed_only` receipt, the required `blocked`/`quarantined`/transient retry or final exhaustion outcome, no local receiver fallback, unchanged semantic/BSS/downstream counts, and sanitized diagnostics. | Only the cutover's HTTP failure-to-receipt boundary and direct downstream effects needed to evaluate it; preserve existing GHR-03B behavior. | `OPEN` |

## Scope-change observations

None. The findings are evidence/implementation-repairable within GHR-04C.
No predecessor contract, deployment provider, route redesign, downstream
semantic execution, or `can_continue=true` behavior is requested.

## Decision

**CHANGES_REQUIRED** — `CK-001.a`, `CK-002.a`, and `CK-002.b` remain open
against the frozen GHR-04C contract. The next bounded workflow is CFC; this
review does not authorize downstream semantic work, a local compatibility
receiver, or any predecessor-contract change.
