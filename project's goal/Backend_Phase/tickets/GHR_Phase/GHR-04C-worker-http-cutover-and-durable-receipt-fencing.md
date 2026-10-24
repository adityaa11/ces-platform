# GHR-04C — Worker HTTP cutover and durable receipt fencing

- **State:** `approved`; GHR-04C CK `PASS` is recorded in [the post-CFC verification](../../../feedback/GHR-04C-ca996894-verification.md). This is the sole GHR-04 activation/cutover ticket; it is not authority to change predecessor contracts or activate `can_continue=true`/downstream semantic work.
- **Dependencies:** GHR-03B, GHR-04A, and GHR-04B CK `PASS`.
- **Parent:** [GHR-04 split record](GHR-04-semantic-batch-plan-http-connector.md).
- **Source:** [GHR HTTP Delivery to Semantic Batch Plan implementation context](../../GHR-IDSER-Semantic-batch-plan-connector.md), §§5–11.

## Outcome

Replace GHR-03B's direct local `receiveVerifiedBatchPlan()` invocation with the accepted GHR-04A dispatcher and GHR-04B Fastify receiver. The existing worker persists `parsed_only` only after a matching valid HTTP `200` acknowledgement, while retaining its immutable identity, bounded retry, lease fencing, terminal classifications, and duplicate-delivery behaviour.

## Exact scope

1. Wire the existing application and worker composition, Docker Compose environments, and GHR-04A validated private-origin/credential configuration. Missing or invalid transport configuration fails closed; no feature flag, second server, or new service is allowed.
2. In `apps/agents-bridge/src/ghr/delivery-worker.ts`, after existing GHR-03B verification and exact `resolveMainRouteBinding()`, dispatch the original verified serialized envelope through only `registration.receiver`. Delete the direct `receiveVerifiedBatchPlan()` delivery invocation and its obsolete production export/wiring once the HTTP call is live; it is not sufficient to leave that path dormant, injectable, or available as a compatibility fallback.
3. Preserve the GHR-03B receipt/fence authority. Terminalize `parsed_only` only when the dispatcher reports a bounded valid `200` acknowledgement with exactly the active handoff ID and verified body digest. Do not let the dispatcher or endpoint write delivery receipts.
4. Retain GHR-03B's classifications and bounded retry authority: receiver `400/422` contract rejection is quarantined; `408/429/5xx`, timeout, and network failure are transient attempts under pg-boss retry/fence handling; `401/403`, `404/405`, redirect, or unregistered destination fail closed with no success receipt; malformed/mismatched acknowledgement is never success and uses the established permanent corruption/contract classification. No local fallback is permitted.
5. Prove the cutover through the real GHR worker and the existing Fastify listener. Cover one receipt identity across duplicate delivery, lost acknowledgement, worker restart, lease recovery, and stale/concurrent claim scenarios; remove the old direct-delivery proof rather than retaining a compatibility execution path.

## Required invariants

- Handoff/job data never supplies a URL, host, path, credential, or destination; the worker consumes only GHR-04A's registered receiver and configuration seam.
- Original immutable envelope/body bytes, header/pins, digest, handoff ID, and active lease generation survive the HTTP acknowledgement boundary.
- No bad/oversized response, redirect, authentication failure, unknown destination, timeout, network failure, or acknowledgement mismatch creates a `parsed_only` receipt or local execution.
- After cutover, no production caller or active composition path imports, invokes, injects, or exposes the former direct-local delivery entry point. Any reusable receiving code is reachable only behind GHR-04B's authenticated HTTP boundary, never as an alternate worker target.
- Every success and failure path remains false-only: zero resolver, IDSER, BSS, SEM, provider, immutable-plan persistence, reconciliation, projection, or downstream-queue effects; diagnostics stay bounded and sanitized.

## Explicit non-goals

- No route redesign, wildcard/fallback/latest-handler selection, credential-policy invention, local compatibility path, manual replay/reissue/promotion, or delivery-identity migration.
- No `can_continue=true`, source redemption, grant/lifecycle validation, issuance/policy/handler/body-contract change, Better Auth session, semantic parser change, planning/provider work, or downstream delivery.

## Binary Review Contract

| ID | PASS iff / direct negative | Required evidence |
| --- | --- | --- |
| GHR-04C-RC-01 | A real GHR worker POSTs verified immutable bytes to GHR-04B's existing Fastify listener using only the GHR-04A registered destination/origin/credential seams, and receives the matching authenticated `parsed_only` acknowledgement. | Local real-HTTP worker-to-Fastify integration evidence. |
| GHR-04C-RC-02 | One logical `parsed_only` receipt is written only after the valid matching `200`; duplicate deliveries, lost acknowledgement, restart, lease recovery, stale/expired lease, and concurrent claim retain original identity and one terminal receipt. | Extended GHR-03B retry/fence integration tests through the real listener. |
| GHR-04C-RC-03 | Invalid credential, receiver `400/422`, forged/changed request, unmatched acknowledgement, unknown path, redirect, timeout, and 5xx follow the stated no-success/quarantine/transient rules with no local fallback. | Real-HTTP negative tests with receipt and retry assertions. |
| GHR-04C-RC-04 | `receiveVerifiedBatchPlan()` has no production delivery caller, export, injection seam, or active composition wiring; reusable receiver code is reachable only through GHR-04B's authenticated HTTP route, and every cutover outcome has zero downstream effects or sensitive diagnostics. | Call-graph/export/composition absence check plus database/queue and diagnostic oracles. |

## Security Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** `GHR-04C-B1` GHR-03B owns verified handoff, retries, lease fencing, and receipt authority; `GHR-04C-B2` GHR-04A owns destination/configuration/dispatcher validation; `GHR-04C-B3` GHR-04B owns authenticated raw-byte parsing.
- **Trust boundaries:** `GHR-04C-T1` a verified handoff crosses from worker to private HTTP; `GHR-04C-T2` acknowledgement returns before receipt terminalization.
- **Sensitive assets:** `GHR-04C-A1` immutable handoff bytes/digest/pins/identity; `GHR-04C-A2` server-owned credential/origin; `GHR-04C-A3` lease and terminal-receipt authority.
- **Extension seams:** `GHR-04C-S1` acknowledgement validation isolates receipt authority behind the dispatcher protocol result; `GHR-04C-S2` retained fence generation supports future recovery policy without route migration.
- **Prohibited couplings:** `GHR-04C-C1` no payload destination or hardcoded endpoint; `GHR-04C-C2` no local fallback or compatibility receiver; `GHR-04C-C3` no session identity, duplicate parser, downstream coupling, or secret diagnostics.
- **Review bindings:** `GHR-04C-RB-01` verifies `T1/A1/A2/B2` with real worker-to-Fastify source-of-destination/authentication proof; `GHR-04C-RB-02` verifies `T2/A3/S1/B1` with acknowledgement/restart/fence/retry proof; `GHR-04C-RB-03` verifies `C1..C3/B3` with malformed/transient/no-fallback/no-downstream evidence.
- **Unresolved security policy:** this ticket consumes, but does not choose or broaden, GHR-04A's credential/rotation/anti-replay policy.

## Hard stop

Stop if GHR-03B receipt/fence semantics cannot be retained across the HTTP acknowledgement, the cutover requires retaining a direct-local compatibility path, or composition cannot use only the accepted GHR-04A/B seams. Report the narrow gap; do not fake an acknowledgement, broaden identity authority, or activate downstream work.
