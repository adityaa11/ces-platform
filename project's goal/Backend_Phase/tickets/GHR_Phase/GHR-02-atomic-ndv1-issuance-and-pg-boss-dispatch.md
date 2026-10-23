# GHR-02 — Same-transaction accepted-NDV1 issuance and pointer-only pg-boss dispatch

- **State:** `planned`; not GO, CFC, CK PASS, or authority to alter approved predecessor contracts.
- **Parent / predecessor:** [GHR-01 — generic envelope and main → branch registry](GHR-01-generic-envelope-and-main-branch-registry.md) must be complete at its approved scope.
- **Source:** [Generic Handoff Router (GHR) — Implementation Context v0.6](../../atlas-generic-handoff-router-implementation-context-v0.6-review.md), §§5.1, 6, 8–10.
- **Successor:** GHR-03 owns the real `semantic/batch-plan` receiving ingress and `parsed_only` ACK.

## Outcome

Extend the existing `staged-fair-local-v1` accepted-Perception transaction so that one eligible accepted `NormalizedDocument/v1` atomically records a trusted, immutable **false-only** Generic Handoff intent and enqueues one pointer-only `atlas-generic-handoff-v1` pg-boss job. The source acceptance, intent, and job must commit or roll back together.

This ticket establishes durable trusted issuance and publication only. It does not make the semantic receiver parse the payload, emit an ACK, redeem any source, or start domain work.

## Exact scope

1. Bind issuance to `PostgresPerceptionAuthority.deliver()` only after its accepted cache/manifests and document member/execution lifecycle facts are transactionally durable: `document_perception_execution.completed`, completion fingerprint, and terminal `perceived` state.
2. Allow exactly one Test-1 transition policy:

   | Selector | Frozen value |
   | --- | --- |
   | producer process | `perception.acceptance` |
   | producer event | `NormalizedDocumentAccepted/v1` |
   | route | `semantic/batch-plan` |
   | policy / handler version | `v1` / `v1` |
   | body contract | `SemanticBatchPlanInput/v1` |
   | continuation | `false` only |

3. Derive the header and exact five-field payload from server-known accepted facts. `producer.executionId`, scope, cache key, source SHA, normalized-document version, and completion fingerprint are never caller-supplied authority. Use the existing `canonicalSemanticBatchPlanInputV1()` serializer and create exact body bytes in the frozen order:

   ```text
   {"can_continue":false,"payload":<canonical SemanticBatchPlanInput/v1 bytes>}
   ```

   Persist the SHA-256 of these exact bytes. The semantic payload remains limited to 2,048 bytes; this false-only wrapper remains limited to 2,081 bytes.
4. Persist immutable Atlas-owned issuance truth in `atlas.generic_handoff_intent`, keyed by immutable `handoffId` and unique `idempotencyKey`, including trusted header, exact `body_bytes`, `bodySha256`, body encoding, and pinned policy/handler/contract identity. Repeating the same logical issuance preserves its original handoff; the same idempotency key with different bytes, pins, or continuation value is a conflict.
5. Persist the Atlas-owned route-policy authority in `atlas.generic_handoff_route_policy`. Test 1 has one enabled row only, matching the table above. A sender cannot self-authorize by naming a main/branch route.
6. In the same PostgreSQL transaction, enqueue a `GenericHandoffJob/v1` containing only `handoffId`, via the existing transactional pg-boss producer and a stable singleton/dedup key. No payload, source bytes, provider data, credentials, grants, or destination strings may enter the queue job.
7. Establish least-privilege persistence seams: `atlas_app` writes accepted state, intent/policy and transactional enqueue; the later `agents_bridge` delivery path receives only a narrow read-only dispatch view/function for a known `handoffId` and owns its own lease/receipt state. Do not grant either role the other's writes.

## Required invariants

- Use transactional pg-boss as the sole durable transport. No transactional outbox, NDV1 polling, SQL notification/trigger, backfill, second queue, or new scheduler.
- Failure at any point in the Perception transaction rolls back acceptance, intent, and queue publication together. A committed accepted result must not have an unissued eligible Test-1 handoff, and a job must not point to a rolled-back intent.
- Retry/restart preserves original `handoffId`, idempotency key, route pins, exact body bytes/hash, and `false` continuation mode. It never reissues or promotes to `true`.
- The generic issuer validates trusted producer/accepted-state/policy/scope facts, not semantic business fields. The later receiver remains the sole semantic-payload parser.
- No raw PDF/media, prompt, provider response, credentials, or confidential payload dump appears in queues, error records, tests, or logs.

## Explicit non-goals

- No `can_continue=true` issuance, test, mode promotion, or continuation implementation.
- No semantic receiver parser invocation, `parsed_only` receipt, `resolveBackground()`, IDSER planning, BSS admission/read, SEM execution, provider call, reconciliation, projection, or downstream handoff.
- No GHR route wildcard/fallback, direct client enqueue, manually replayable terminal handoff, reissue endpoint/CLI/SQL procedure, or alternate transport.
- No change to `SemanticBatchPlanInput/v1` fields, canonical serializer, accepted-document resolver, provider-route registry, or BSS registry.

## Binary Review Contract

| ID | PASS iff / direct negative | Required evidence |
| --- | --- | --- |
| GHR-02-RC-01 | A real `staged-fair-local-v1` accepted NDV1 commits accepted state, one immutable false-only intent, and one pointer-only pg-boss job in the same transaction; an injected failure rolls back all three. | Isolated PostgreSQL/pg-boss integration tests with commit and rollback assertions. |
| GHR-02-RC-02 | The only enabled policy produces the exact frozen producer/route/pins/body-contract/scope values. Forged producer, wrong route/scope/policy/handler, disabled/revoked policy, or unsupported contract fails closed before publication. | Positive/negative trusted-issuer and route-policy tests. |
| GHR-02-RC-03 | Issued body bytes/hashes are byte-for-byte compatible with the canonical five-field serializer and frozen false-wrapper order; altered hash/bytes or an idempotency conflict is rejected. | Byte-parity, hash mutation, and same-key conflict tests. |
| GHR-02-RC-04 | Restart/retry/repeated producer execution retains one original logical handoff and pointer-only job identity; it does not poll NDV1, create a second intent, regenerate pins, or change continuation mode. | Real pg-boss dedup/restart tests and source-boundary checks. |
| GHR-02-RC-05 | Queue metadata contains only `GenericHandoffJob/v1` and `handoffId`; privilege tests prove `agents_bridge` lacks Atlas intent/policy write access and `atlas_app` lacks Bridge receipt/lease writes. | Job inspection plus database-role/view/function authorization tests. |
| GHR-02-RC-06 | Issuance has zero semantic receiver/ACK/resolver/planner/BSS/SEM/provider/reconciliation/projection effects. | Non-inert zero-downstream-effects oracle. |

## Security Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** `GHR-02-B1` — Perception owns durable accepted-source truth; `GHR-02-B2` — GHR-01 owns generic contract/registry shape; `GHR-02-B3` — semantic owns payload parsing and future source redemption.
- **Trust boundaries:** `GHR-02-T1` — accepted Perception facts enter trusted issuer derivation; `GHR-02-T2` — issuer persists Atlas immutable intent and pointer-only job; `GHR-02-T3` — narrow cross-role read-only dispatch access is prepared for Bridge.
- **Sensitive assets:** `GHR-02-A1` — accepted scope/execution identity, exact body bytes/hash, idempotency identity and route pins; `GHR-02-A2` — database write authority and pg-boss publication capability.
- **Identity context:** `GHR-02-I1` — retain authenticated `perception.acceptance`, exact accepted execution ID, project/workspace/bundle/document scope, and policy/handler pins in immutable issuance evidence.
- **Extension seams:** `GHR-02-S1` — versioned policy rows permit later revocation checks; `GHR-02-S2` — immutable intent plus stable singleton key provides retry/dedup evidence; `GHR-02-S3` — read-only dispatch view/function permits later Bridge delivery without broad Atlas access.
- **Prohibited couplings:** `GHR-02-C1` — no sender-selected route authority; `GHR-02-C2` — no payload-bearing queue job or generic semantic parse; `GHR-02-C3` — no outbox/poller/trigger/second scheduler; `GHR-02-C4` — no shared Atlas/Bridge write role.
- **Verification seams:** `GHR-02-V1` transaction rollback/commit proof; `GHR-02-V2` body-byte/idempotency conflict proof; `GHR-02-V3` queue-content and privilege proof; `GHR-02-V4` restart/dedup and zero-downstream-effects proof.
- **Unresolved security policy:** cross-service message authentication and anti-replay remain deferred; the protected Atlas PostgreSQL transaction/worker realm is an inherited assumption, not broadened here.
- **Planning findings:** none within the frozen same-transaction pg-boss design.
- **Review bindings:** `GHR-02-RB-01` verifies `GHR-02-T1`/`GHR-02-V1`; `GHR-02-RB-02` verifies `GHR-02-I1`, `GHR-02-A1`, and `GHR-02-V2`; `GHR-02-RB-03` verifies `GHR-02-T2/T3`, `GHR-02-A2`, and `GHR-02-C3/C4` using queue and privilege evidence; `GHR-02-RB-04` verifies `GHR-02-C2`/`GHR-02-V4`.

## Hard stop

Stop if atomic accepted-state + intent + transactional pg-boss publication cannot be proven in the existing Perception transaction, if the only feasible solution adds an outbox/poller/trigger, or if Bridge requires Atlas write privilege. Report the authority/transaction gap; do not fake a job, invent an issuer policy, or widen roles.
