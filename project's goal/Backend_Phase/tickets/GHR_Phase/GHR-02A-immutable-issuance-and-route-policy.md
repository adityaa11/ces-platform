# GHR-02A — Immutable trusted issuance records and false-only route-policy authority

- **State:** `planned`; not GO, CFC, CK PASS, acceptance-path activation, queue publication, or authority to alter approved predecessor contracts.
- **Dependency:** GHR-01B CK PASS. Consume GHR-01A's generic contract and GHR-01B's exact registration metadata; do not reopen their raw-ingress, hashing, or registry foundations.
- **Successor:** GHR-02B alone binds this issuance seam to `PostgresPerceptionAuthority.deliver()` and sends pg-boss work.
- **Source:** [GHR v0.6 implementation context](../../atlas-generic-handoff-router-implementation-context-v0.6-review.md), §§5.1, 6, 8–10.

## Outcome

Create the Atlas-owned immutable issuance and false-only route-policy seam for the sole Test-1 transition. Given an internal, transaction-bound trusted accepted-NDV1 fact object, it derives and persists one exact false-only handoff intent or rejects it. It prepares a narrow Bridge read-only dispatch view/function for a known `handoffId`. It does not call the issuer from a production acceptance path and does not enqueue or consume a job.

## Exact scope

1. Add the Atlas-owned `atlas.generic_handoff_route_policy` and immutable `atlas.generic_handoff_intent` persistence contract. The sole enabled Test-1 policy is `perception.acceptance` / `NormalizedDocumentAccepted/v1` to `semantic/batch-plan`, policy and handler `v1`, `SemanticBatchPlanInput/v1`, and `can_continue=false`.
2. Add a transaction-required, non-client-facing issuer seam that accepts only server-constructed accepted-NDV1 facts, resolves the enabled policy, constructs the fixed header and exact five-field body using `canonicalSemanticBatchPlanInputV1()`, and persists exact wrapper bytes and SHA-256. It must reject caller-selected route authority, mismatched scope/execution facts, changed pins/body/mode, disabled or revoked policy, and same-key conflict.
3. Key immutable truth by `handoffId` and unique `idempotencyKey`. Same logical facts retain the original intent; no update, repin, mode promotion, or new intent is permitted.
4. Establish only the least-privilege dispatch read seam: `atlas_app` writes policy/intent; `agents_bridge` can retrieve a known issued `handoffId` through a narrow read-only view/function and cannot write Atlas intent/policy. Do not create `bridge.generic_handoff_delivery` here; GHR-03B owns it.
5. Keep the exact 2,048-byte payload and 2,081-byte false-wrapper limits and persisted encoding/hash parity. The generic contract remains opaque to semantic fields; the semantic parser is not imported.

## Required invariants

- The issuer requires the caller's existing transaction but does not itself establish that the supplied facts are accepted; only GHR-02B may prove live Perception provenance.
- The queue has no representation in this ticket: no pg-boss import, enqueue, worker, scheduler, retry, receipt, lease, or ACK.
- Body/hash values are integrity evidence, not message authentication. No raw payload or confidential material appears in diagnostics.

## Explicit non-goals

- No change to `PostgresPerceptionAuthority.deliver()`, accepted state, document lifecycle, pg-boss, or a production issuer call site.
- No semantic route adapter/receiver/parser invocation, dispatch consumer, Bridge delivery table, or terminal disposition.
- No outbox, poller, trigger, fallback/wildcard, direct-client issuance, reissue/manual replay, or `can_continue=true` behavior/test.

## Binary Review Contract

| ID | PASS iff / direct negative | Required evidence |
| --- | --- | --- |
| GHR-02A-RC-01 | Only the frozen policy permits an internal trusted-facts request; forged/mismatched producer, scope, execution, route, policy, handler, contract, mode, disabled/revoked policy, or unsupported contract fails before persistence. | Isolated PostgreSQL policy/issuer positive and negative tests. |
| GHR-02A-RC-02 | A persisted intent has immutable trusted header/pins, exact false-wrapper bytes/hash, and stable idempotency; byte/hash mutation or same-key divergence is rejected. | Byte-parity, immutability, and idempotency-conflict tests using the existing canonical serializer. |
| GHR-02A-RC-03 | `atlas_app` can write policy/intent; `agents_bridge` has only known-handoff read access and cannot write either Atlas record. No Bridge delivery state exists. | Database-role/view/function authorization tests and schema inspection. |
| GHR-02A-RC-04 | The focused implementation has no acceptance-path call, pg-boss, queue/job, worker, receipt, resolver, or domain side effect. | Static dependency/call-site boundary test plus focused typecheck/test. |

## Security Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** `GHR-02A-B1` Perception owns accepted-source truth; `GHR-02A-B2` GHR-01A/B own generic contract and registration foundation; `GHR-02A-B3` semantic owns payload parsing.
- **Trust boundaries:** `GHR-02A-T1` internal accepted facts enter the issuer; `GHR-02A-T2` immutable Atlas intent crosses later through read-only Bridge dispatch.
- **Sensitive assets:** `GHR-02A-A1` source identity/scope, pins, body bytes/hash, and idempotency; `GHR-02A-A2` Atlas write authority.
- **Identity context:** `GHR-02A-I1` retain producer/execution, project/workspace/bundle/document, and policy/handler pins in immutable issuance evidence.
- **Extension seams:** `GHR-02A-S1` versioned policy supports later revocation checks; `GHR-02A-S2` read-only known-handoff dispatch permits later Bridge delivery without broad Atlas writes.
- **Prohibited couplings:** `GHR-02A-C1` no sender-selected authority; `GHR-02A-C2` no queue/worker; `GHR-02A-C3` no generic semantic parser; `GHR-02A-C4` no shared write role.
- **Verification seams:** `GHR-02A-V1` policy/provenance rejection; `GHR-02A-V2` byte/idempotency proof; `GHR-02A-V3` role proof; `GHR-02A-V4` zero-activation proof.
- **Unresolved security policy:** cross-service authentication and anti-replay remain deferred in the protected PostgreSQL realm.
- **Planning findings:** none if a transaction-bound private issuer seam is available; otherwise stop.
- **Review bindings:** `GHR-02A-RB-01` verifies `T1/V1`; `GHR-02A-RB-02` verifies `A1/I1/V2`; `GHR-02A-RB-03` verifies `T2/A2/C4/V3`; `GHR-02A-RB-04` verifies `C1..C3/V4`.

## Hard stop

Stop if immutable policy/intent truth or the narrow read seam cannot be made without a public issuer, a broad Bridge write grant, a semantic parser import, or queue activation. Report the authority gap; do not emulate it with client JSON, a permissive function, or a fake queue record.
