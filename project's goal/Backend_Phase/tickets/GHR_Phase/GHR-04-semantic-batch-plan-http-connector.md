# GHR-04 — Semantic batch-plan HTTP connector

- **State:** `proposed`; this ticket is a bounded transport cutover candidate. It is not a GO, CK PASS, route activation beyond the existing Test-1 pins, or authority to change predecessor contracts.
- **Dependency:** GHR-03B CK PASS. Preserve its immutable handoff verification, pg-boss retry authority, lease fencing, and terminal-receipt semantics while retiring its in-process receiver call.
- **Source:** [GHR HTTP Delivery to Semantic Batch Plan implementation context](../../GHR-IDSER-Semantic-batch-plan-connector.md), §§1–11.

## Outcome

Replace GHR's direct local invocation of `receiveVerifiedBatchPlan()` with a real authenticated HTTP delivery to the existing Fastify application. The exact `semantic/batch-plan` branch registration is the sole owner of the receiving path, and the worker may persist `parsed_only` only after a matching `200` acknowledgement from `POST /internal/semantic/batch-plan`.

The Test-1 outcome remains deliberately false-only: the receiver validates and canonically parses the existing five-field `SemanticBatchPlanInput/v1` body, acknowledges `parsed_only`, and stops. This is a transport cutover, not semantic planning or downstream execution.

## Exact scope

1. Extend `BranchRegistration` and `apps/agents-bridge/src/ghr/routes/semantic/branches/batch-plan.route.ts` so the exact existing Test-1 registration owns the receiver destination:

   ```ts
   receiver: {
     transport: "http",
     method: "POST",
     path: "/internal/semantic/batch-plan"
   }
   ```

   Preserve the fixed producer, branch, policy, handler, body-contract pins, `canContinue: false`, and the 2,048/2,081-byte limits. There is no second route registry or independent endpoint string.
2. Preserve pure exact-selector resolution through `resolveMainRouteBinding()`. Its returned registration exposes the receiver metadata, but resolution performs neither HTTP, semantic parsing, nor IDSER work.
3. Replace the local receiver call in `apps/agents-bridge/src/ghr/delivery-worker.ts` with a generic HTTP dispatcher that accepts only a receiver obtained from a trusted registration. It must combine the configured private service origin with the registered path, preserve the verified original serialized envelope/body bytes, authenticate with a server-owned credential, enforce request timeout and bounded response size, reject redirects and unregistered destinations, and validate the acknowledgement before terminalizing.
4. Register `POST /internal/semantic/batch-plan` in the existing Fastify app. The registration imports the path from `batch-plan.route.ts`; its receiving module authenticates the internal caller, preserves a raw-body boundary, validates the `GenericHandoffEnvelope/v1` header/pins/hash/body integrity, requires `can_continue === false`, and delegates the canonical five-field body to the existing `@atlas/db` parser. It returns only:

   ```json
   {
     "handoffId": "<request handoff id>",
     "bodySha256": "<verified body digest>",
     "disposition": "parsed_only"
   }
   ```

5. Wire the existing application and worker composition, trusted origin/credential configuration, and Docker Compose environments. Missing or invalid transport configuration fails closed. Reuse the current Fastify server; do not add a microservice, second server, feature flag, or Better Auth session path.
6. Retire the direct local receiver-delivery invocation and its obsolete export/wiring once the HTTP endpoint is live. Preserve GHR-03B's persisted handoff identity, lease generation, bounded retry, terminal classification, and duplicate-delivery behavior.

## Required invariants

- The registered `batch-plan.route.ts` path is the only authority for this receiver endpoint; the service origin comes only from trusted deployment configuration. Handoff/job data never supplies a URL, host, path, credential, or destination.
- Only a valid `200` acknowledgement whose handoff ID and body digest exactly match the verified request may terminalize `parsed_only`. A bad or oversized response, mismatched acknowledgement, redirect, `401/403`, `404/405`, or network error never has local fallback.
- `400/422` receiver contract rejections retain GHR-03B's quarantine semantics; `408/429/5xx`, timeout, and network failures remain classified transient attempts under its bounded retry/fence authority. Authentication failures fail closed; they do not produce a success receipt.
- The raw HTTP boundary preserves original serialized JSON bytes and rejects duplicate-key or noncanonical representations before semantic parsing. No generic validation substitutes for the existing canonical parser.
- False-only behavior is unchanged: no `resolveBackground()`, IDSER planner, BSS admission, SEM execution, provider call, persistence of an immutable semantic plan, reconciliation, projection, or downstream queue publication.
- Diagnostics, retry records, and acknowledgements expose only bounded identifiers, digest, disposition, and sanitized error class—never payloads, source/PDF/media, credentials, or service secrets.

## Explicit non-goals

- No `can_continue=true`, source redemption, grant/lifecycle validation for continuation, or alteration of GHR issuance, policy versions, handler versions, persisted handoffs, or body contracts.
- No route redesign, wildcard/fallback/latest-handler selection, local-delivery compatibility path, manual replay/reissue/promotion, or delivery-identity migration.
- No new semantic parser, new service, Better Auth session, planning/provider capability, BSS/SEM work, or downstream delivery.

## Binary Review Contract

| ID | PASS iff / direct negative | Required evidence |
| --- | --- | --- |
| GHR-04-RC-01 | Exact `semantic/batch-plan` resolution returns only the pinned registration with `POST /internal/semantic/batch-plan`; every unknown/mismatched selector fails closed. | Unit tests for route/index composition and exact selector negatives. |
| GHR-04-RC-02 | A real GHR worker POSTs the verified immutable envelope to the existing Fastify listener using only the registered destination and trusted origin; the endpoint authenticates, preserves raw bytes, canonically parses the five-field false-only body, and returns the matching `parsed_only` acknowledgement. | Local real-HTTP integration test plus authenticated positive worker-to-Fastify evidence. |
| GHR-04-RC-03 | The worker persists one logical `parsed_only` receipt only after a matching valid `200`; duplicate deliveries, lost acknowledgements, worker restart, and lease recovery preserve the original identity and one terminal receipt. | Existing GHR-03B retry/fence integration tests extended through a real listener. |
| GHR-04-RC-04 | Invalid credential, forged/changed hash/body, duplicate-key/noncanonical payload, `can_continue:true`, unmatched acknowledgement, unknown path, redirect, timeout, and 5xx cannot result in a success receipt or local fallback; invalid contract is quarantined and transient faults use bounded retry. | Receiver, dispatcher, and real-HTTP negative tests with receipt/retry assertions. |
| GHR-04-RC-05 | Every success and failure path has zero resolver, IDSER, BSS, SEM, provider, immutable-plan persistence, reconciliation, projection, and downstream-queue effects. | Static dependency boundary check and database/queue side-effect oracle. |

## Security Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** `GHR-04-B1` GHR-02A/B retain immutable issuance and pointer-only publication; `GHR-04-B2` GHR-03B retains verification, retries, lease fencing, and receipt authority; `GHR-04-B3` GHR-03A's existing canonical semantic parser remains the only body parser; `GHR-04-B4` Fastify is the existing receiving runtime.
- **Trust boundaries:** `GHR-04-T1` a verified GHR handoff crosses the worker-to-private-HTTP boundary; `GHR-04-T2` trusted deployment origin plus route-registration path become the outbound destination; `GHR-04-T3` raw HTTP bytes cross into envelope/hash and canonical-parser validation; `GHR-04-T4` HTTP acknowledgement crosses back before a durable terminal receipt.
- **Sensitive assets:** `GHR-04-A1` immutable envelope bytes, digest, pins, and handoff identity; `GHR-04-A2` server-owned internal-service credential and configured origin; `GHR-04-A3` GHR lease/terminal-receipt authority; `GHR-04-A4` payload and diagnostic confidentiality.
- **Identity context:** `GHR-04-I1` retain authenticated service identity, immutable handoff/pins/digest, and active lease generation across request and acknowledgement; never derive authority from the job payload, handoff body, endpoint response, or user session.
- **Extension seams:** `GHR-04-S1` receiver metadata separates trusted path registration from deployment origin; `GHR-04-S2` the dispatcher/receiver authentication seam can accept future approved credential-rotation or message-authentication policy; `GHR-04-S3` acknowledgement validation keeps receipt authority behind a narrow protocol boundary.
- **Prohibited couplings:** `GHR-04-C1` no endpoint in handoff data or hardcoded worker/generic-dispatch endpoint; `GHR-04-C2` no local fallback/compatibility receiver; `GHR-04-C3` no Better Auth or browser-session identity; `GHR-04-C4` no duplicate parser or downstream semantic coupling; `GHR-04-C5` no payload/secret diagnostics.
- **Verification seams:** `GHR-04-V1` exact registration-to-Fastify path binding; `GHR-04-V2` authenticated raw-body/hash/parser HTTP proof; `GHR-04-V3` acknowledgement/lease/retry correctness; `GHR-04-V4` malformed/forged/transient failure classification; `GHR-04-V5` zero downstream effects and sanitized diagnostics.
- **Unresolved security policy:** the exact internal credential format, rotation process, anti-replay policy, and keyed message authentication are not selected by this ticket. Use an already accepted server-owned configuration mechanism; if no such mechanism exists, stop and report that narrow policy dependency rather than inventing one.
- **Planning findings:** none if the existing Fastify raw-body facility can preserve the verified serialized representation and an accepted internal credential/configuration mechanism is available. Otherwise this ticket requires planning resolution before GO.
- **Review bindings:** `GHR-04-RB-01` verifies `T1/T2/A1/A2/V1/V2` with source-of-destination, authentication, and real-HTTP evidence; `GHR-04-RB-02` verifies `T4/A3/S3/V3` with acknowledgement, restart, fence, and retry evidence; `GHR-04-RB-03` verifies `T3/B3/C4/V2/V4` with raw-byte, duplicate-key, digest, and canonical-parser negatives; `GHR-04-RB-04` verifies `C1..C3/V4` with no-fallback, no-session, and failure-classification evidence; `GHR-04-RB-05` verifies `B2/C4/C5/V5` with static dependency and diagnostic/side-effect tests.

## Hard stop

Stop if the registered path cannot be the sole endpoint authority, the existing Fastify runtime cannot validate raw original bytes, no accepted server-owned internal credential/configuration seam exists, or the GHR worker cannot retain GHR-03B receipt/fence semantics across the HTTP acknowledgement. Report the narrow boundary gap; do not hardcode a destination, use a local fallback, weaken validation, fake an acknowledgement, broaden identity authority, or activate downstream work.
