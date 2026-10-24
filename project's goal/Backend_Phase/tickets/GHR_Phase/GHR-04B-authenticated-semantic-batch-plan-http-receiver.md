# GHR-04B — Authenticated semantic batch-plan HTTP receiver

- **State:** `awaiting_review`; receiving-boundary preparation only. This ticket does not cut GHR worker delivery over to HTTP.
- **Dependencies:** GHR-03B CK `PASS`; GHR-04A CK `PASS`.
- **Parent:** [GHR-04 split record](GHR-04-semantic-batch-plan-http-connector.md).
- **Source:** [GHR HTTP Delivery to Semantic Batch Plan implementation context](../../GHR-IDSER-Semantic-batch-plan-connector.md), §§2, 4, 7, and 9.

## Outcome

Register the authenticated, raw-byte-preserving `POST /internal/semantic/batch-plan` receiver in the existing Fastify app, using the path imported from the exact GHR branch registration. It accepts only a verified false-only GenericHandoffEnvelope/v1 and returns only the matching parse-only acknowledgement. The endpoint is not yet used by the worker.

## Exact scope

1. Register the `POST` route in the existing Fastify application. Import its path from `batch-plan.route.ts`; no independent endpoint string, second Fastify server, microservice, or route registry is permitted.
2. Implement the receiving module on the raw-body boundary. It authenticates the internal caller with the accepted server-owned configuration seam from GHR-04A, preserves original serialized bytes, and validates `GenericHandoffEnvelope/v1` header, exact pins, hash/body integrity, and `can_continue === false`.
3. Delegate only the canonical five-field false-only body to the existing `@atlas/db` parser. Reject duplicate-key/noncanonical representations before semantic parsing. Do not substitute generic validation or introduce another parser.
4. On the sole success path return exactly:

   ```json
   { "handoffId": "<request handoff id>", "bodySha256": "<verified body digest>", "disposition": "parsed_only" }
   ```

   All authentication and contract failures expose only a bounded sanitized class and cannot yield a success acknowledgement.
5. Wire only the existing Fastify application/composition needed to host and authenticate this dormant receiver. Required receiver configuration fails closed. Do not alter GHR worker composition, the local GHR-03B call, receipt state, or retry processing.

## Required invariants

- The route registration is the single authority for the Fastify path; no caller supplies a route.
- The endpoint has no local-delivery compatibility path and no Better Auth/browser-session identity.
- Every path stops after canonical parse or rejection: zero `resolveBackground()`, IDSER planner, BSS admission, SEM execution, provider call, immutable-plan persistence, reconciliation, projection, or downstream publication.
- Responses and logs contain no request payload, source/PDF/media, credential, or secret.

## Explicit non-goals

- No generic dispatcher changes, destination policy, or configuration-policy selection; those are frozen by GHR-04A.
- No `delivery-worker.ts` substitution, durable ACK, retry/fence change, Docker worker activation, or local receiver retirement; those are GHR-04C.
- No `can_continue=true`, new semantic contract/parser, feature flag, service/session identity, planning, or downstream execution.

## Binary Review Contract

| ID | PASS iff / direct negative | Required evidence |
| --- | --- | --- |
| GHR-04B-RC-01 | The existing Fastify app exposes only the registered `POST` path imported from `batch-plan.route.ts`; unknown path/method fails closed. | Application route-composition test and route/method negatives. |
| GHR-04B-RC-02 | An authenticated direct HTTP request carrying valid original bytes receives the exact matching `200 parsed_only` acknowledgement after the existing canonical five-field parser accepts it. | Real-Fastify local HTTP integration evidence. |
| GHR-04B-RC-03 | Missing/invalid credential, forged pins/hash/body, duplicate-key/noncanonical JSON, and `can_continue:true` cannot return success or invoke semantic/downstream work. | Raw-body, parser, authentication, and side-effect negative tests. |
| GHR-04B-RC-04 | GHR-03B still uses its accepted local invocation and receipt/retry/fence behaviour unchanged. | Worker call-site/static boundary check and GHR-03B regression evidence. |

## Security Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** `GHR-04B-B1` GHR-04A owns the registered-path/credential configuration contract; `GHR-04B-B2` GHR-03A remains the only canonical semantic parser; `GHR-04B-B3` Fastify is the existing receiving runtime.
- **Trust boundaries:** `GHR-04B-T1` authenticated HTTP bytes enter Fastify; `GHR-04B-T2` raw bytes cross envelope/hash/pin validation into the canonical parser.
- **Sensitive assets:** `GHR-04B-A1` service credential; `GHR-04B-A2` immutable envelope bytes/digest/pins; `GHR-04B-A3` payload confidentiality.
- **Extension seams:** `GHR-04B-S1` raw-body/authentication boundary; `GHR-04B-S2` response construction tied to verified identity/digest.
- **Prohibited couplings:** `GHR-04B-C1` no duplicate parser; `GHR-04B-C2` no session identity or fallback receiver; `GHR-04B-C3` no downstream semantic coupling or payload diagnostics.
- **Review bindings:** `GHR-04B-RB-01` verifies `B1/T1/A1` with authoritative-path and authentication evidence; `GHR-04B-RB-02` verifies `B2/T2/A2/C1` with raw-byte, digest, duplicate-key, and canonical-parser tests; `GHR-04B-RB-03` verifies `C2/C3/A3` with no-session/no-downstream/sanitized-diagnostic evidence.
- **Unresolved security policy:** GHR-04A's credential format, rotation, anti-replay, and keyed-message-authentication policy remain intentionally unselected.

## Hard stop

Stop if the existing Fastify runtime cannot preserve and validate original serialized bytes, if authentication cannot use the accepted GHR-04A seam, or if the endpoint path cannot be imported from the registration. Report the narrow gap; do not weaken raw validation, add a second parser, or change worker delivery.
