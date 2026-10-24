# GHR-04A — Registered HTTP transport contract and dispatcher

- **State:** `proposed`; preparation only. This ticket does not activate HTTP worker delivery or alter GHR-03B's local receiver invocation.
- **Dependencies:** GHR-03B CK `PASS`.
- **Parent:** [GHR-04 split record](GHR-04-semantic-batch-plan-http-connector.md).
- **Source:** [GHR HTTP Delivery to Semantic Batch Plan implementation context](../../GHR-IDSER-Semantic-batch-plan-connector.md), §§2–3, 5–6, and 9.

## Outcome

Make the exact existing `semantic/batch-plan` registration the sole authority for its HTTP receiver path and provide a generic, inactive HTTP dispatch boundary that can deliver only a verified immutable handoff to such a trusted registration. The boundary freezes the protocol and trusted configuration without changing live worker behaviour.

## Exact scope

1. Extend `BranchRegistration` and `apps/agents-bridge/src/ghr/routes/semantic/branches/batch-plan.route.ts` with exactly:

   ```ts
   receiver: { transport: "http", method: "POST", path: "/internal/semantic/batch-plan" }
   ```

   Preserve producer, branch, policy, handler, body-contract pins, `canContinue: false`, and the 2,048/2,081-byte limits. No second route registry or endpoint string may be introduced.
2. Preserve `resolveMainRouteBinding()` as a pure exact-selector lookup. Its returned registration exposes the receiver metadata but it performs no HTTP, semantic parsing, or IDSER work.
3. Add a generic HTTP dispatcher contract that accepts only receiver metadata obtained from a trusted `BranchRegistration`/binding and verified serialized envelope/body bytes. It composes the registered path with a private service origin supplied only by validated deployment configuration; it never accepts a URL, host, path, or credential from a job, handoff, or body.
4. Add the narrow server-owned transport configuration seam, including origin, credential, timeout, and bounded response-size limits. Missing or invalid values fail closed when the dispatcher is composed. Reuse an already accepted configuration mechanism; this ticket does not select credential format, rotation, replay policy, or keyed message authentication.
5. Make the dispatcher preserve the original serialized bytes, send only `POST` to a registered HTTP receiver, authenticate with the server-owned credential, reject redirects and unregistered destinations, bound time and response bytes, and expose a narrowly typed response/acknowledgement-validation result. It has no authority to terminalize a delivery receipt.

## Required invariants

- `batch-plan.route.ts` is the sole owner of `/internal/semantic/batch-plan`; deployment configuration owns only the origin.
- The resolver and dispatcher do not parse semantic fields, invoke IDSER, write a delivery receipt, or perform fallback/local delivery.
- A response cannot be treated as a valid `parsed_only` acknowledgement unless it is `200`, bounded, structurally valid, and its handoff ID and body digest match the verified request. GHR-04C alone consumes that result for receipt authority.
- Configuration, request metadata, and diagnostics expose no payload, source/PDF/media, credential, or service secret.

## Explicit non-goals

- No Fastify endpoint or receiving parser registration; that is GHR-04B.
- No `delivery-worker.ts` cutover, receipt/retry classification change, Docker activation, or retirement of the local receiver call; those are GHR-04C.
- No `can_continue=true`, Better Auth/browser session identity, feature flag, new service, semantic planning, BSS/SEM work, provider call, persistence, reconciliation, projection, or downstream queue publication.

## Binary Review Contract

| ID | PASS iff / direct negative | Required evidence |
| --- | --- | --- |
| GHR-04A-RC-01 | Exact `semantic/batch-plan` resolution returns only the fully pinned registration with the one `POST /internal/semantic/batch-plan` receiver; every unknown/mismatched selector fails closed. | Route/index composition tests and exact-selector negatives. |
| GHR-04A-RC-02 | Dispatcher construction accepts only validated private-origin/server-credential configuration and a trusted registered receiver; it rejects payload-derived or unregistered destinations before I/O. | Configuration and trusted-receiver unit tests. |
| GHR-04A-RC-03 | With a local generic HTTP listener, the dispatcher sends the original verified bytes, server credential, registered path, and bounded request; redirect, oversized response, timeout, malformed response, and acknowledgement mismatch never report success. | Local transport integration tests plus negative assertions. |
| GHR-04A-RC-04 | This preparation changes neither live worker dispatch nor durable receipts and invokes no semantic/parser/downstream capability. | Static dependency/call-site check and existing GHR-03B regression evidence. |

## Security Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** `GHR-04A-B1` GHR-02A/B retain immutable issuance and pointer-only publication; `GHR-04A-B2` GHR-03B retains verification, lease, retry, and receipt authority.
- **Trust boundaries:** `GHR-04A-T1` trusted registration path plus trusted origin become the outbound destination; `GHR-04A-T2` verified bytes and server-owned credential cross the dispatcher boundary.
- **Sensitive assets:** `GHR-04A-A1` immutable envelope bytes/digest/pins; `GHR-04A-A2` service origin and credential.
- **Extension seams:** `GHR-04A-S1` receiver metadata separates registered path from deployment origin; `GHR-04A-S2` narrow credential/configuration seam permits future accepted rotation or message-authentication policy.
- **Prohibited couplings:** `GHR-04A-C1` no endpoint in handoff data or hardcoded generic endpoint; `GHR-04A-C2` no worker receipt authority or local fallback; `GHR-04A-C3` no session identity or secret diagnostics.
- **Review bindings:** `GHR-04A-RB-01` verifies `T1/A1/S1/C1` with registration/source-of-destination tests; `GHR-04A-RB-02` verifies `T2/A2/S2/C3` with configuration, authentication, and bounded-I/O tests; `GHR-04A-RB-03` verifies `B2/C2` with unchanged-worker proof.
- **Unresolved security policy:** credential format, rotation, anti-replay policy, and keyed message authentication remain unselected. If no accepted server-owned configuration mechanism exists, stop for HMN; do not invent one.

## Hard stop

Stop if the registered path cannot be the sole destination authority or no accepted server-owned configuration/credential seam exists. Report that narrow dependency; do not hardcode an endpoint, make the dispatcher accept arbitrary URLs, or activate the worker.
