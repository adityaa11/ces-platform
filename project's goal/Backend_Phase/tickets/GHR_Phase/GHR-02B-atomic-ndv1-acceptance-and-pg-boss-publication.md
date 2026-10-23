# GHR-02B — Atomic NDV1 acceptance integration and pointer-only pg-boss publication

- **State:** `awaiting_review`; not CK PASS, Bridge consumption, receipt/lease implementation, or authority to alter approved predecessor contracts.
- **Dependency:** GHR-02A CK PASS; consume its immutable issuer and dispatch-read seam without widening them.
- **Successor:** GHR-03B owns Bridge consumption, delivery retry, lease fencing, and durable receipt.
- **Source:** [GHR v0.6 implementation context](../../atlas-generic-handoff-router-implementation-context-v0.6-review.md), §§5.1, 6, 8–10.

## Outcome

Bind the GHR-02A issuer to the real `staged-fair-local-v1` branch of `PostgresPerceptionAuthority.deliver()`. After the accepted cache/manifests and document member/execution lifecycle facts are transactionally established and verified within the still-open PostgreSQL transaction, the trusted issuer persists the handoff intent and transactionally publishes the pg-boss job before the same transaction commits. Acceptance, intent, and publication commit or roll back together.

## Exact scope

1. Derive GHR-02A's trusted fact object only from authoritative accepted Perception records after `document_perception_execution.completed`, completion fingerprint, terminal `perceived` state, and accepted cache/manifests are transactionally durable.
2. In that same transaction invoke GHR-02A and the existing transactional pg-boss producer. The sole job is `GenericHandoffJob/v1` with `handoffId`; use a stable singleton/dedup identity. It contains no body, source bytes, grant, provider data, credential, route string, or destination.
3. Preserve the original handoff/idempotency/pins/body/hash/mode over a repeated completed producer execution or restart. Producer-side dedup does not consume, retry, reclaim, or ACK delivery; those are GHR-03B concerns.
4. Make no consumer registration or semantic invocation. Pending jobs are not evidence of delivery and must not create Bridge-owned state in this ticket.

## Required invariants

- Existing same-transaction pg-boss is the sole transport. No outbox, NDV1 poller, trigger, notification, backfill, alternate queue, or scheduler.
- An injected failure anywhere in the Perception transaction rolls back accepted state, intent, and job. A job never references rolled-back intent; a committed eligible acceptance never lacks its one issued intent/job.
- Only GHR-02A determines policy/header/body authority. This integration does not parse semantic fields or create a second payload serializer.

## Explicit non-goals

- No Bridge worker, receipt/lease/fence state, job delivery retry, terminal disposition, route activation, semantic parser/receiver, ACK, or downstream effect.
- No `can_continue=true`, reissue/manual replay/promotion, provider/BSS/IDSER/SEM/reconciliation/projection work, or cross-role write grant.

## Required real-source validation environment

- The source of real accepted-NDV1 evidence is the running Docker Compose project `atlas-canonical-perception`, not a fixture. Inspect its actual Postgres container and mounted `postgres-data` volume read-only to identify an eligible accepted record and its exact project/workspace/bundle/document/execution/fingerprint facts. `DATABASE_URL` or `ATLAS_DATABASE_URL` is a connection string to that running database; it is not obtained from, or a replacement for, the Docker volume identity.
- Do not delete, reset, recreate, prune, migrate, or write to the canonical Compose volumes. Before exercising the issuer, transactional pg-boss publication, or a new acceptance flow, make a PostgreSQL-supported logical snapshot and restore it into an explicitly named isolated writable qualification database/volume. Atlas and Bridge test processes must use that isolated database URL.
- A pre-existing completed NDV1 may be inspected to establish the real source facts, but it must never be reissued or replayed merely to make GHR run; it cannot prove a new atomic acceptance-to-issuance invocation. Create a new project through the normal project-card creation flow in the isolated environment, using a PDF from `docs/example/`, whenever fresh acceptance proof is required; let the normal Perception flow create the project, workspace, bundle, document, execution, and accepted NDV1. Seeding rows, copying a JSON fixture, or invoking the issuer directly is not substitute evidence.
- Record the source/clone identities and prove that the observed intent and pointer-only job came from this normal acceptance path. The runtime behavior under review must be the same behavior reachable by a manual project-card/PDF run, not a test-only wiring path.

## Binary Review Contract

| ID | PASS iff / direct negative | Required evidence |
| --- | --- | --- |
| GHR-02B-RC-01 | A real eligible accepted NDV1 commits accepted state, exactly one GHR-02A intent, and exactly one pointer-only job in one transaction; injected failure rolls back all three. | Isolated real PostgreSQL/pg-boss commit and rollback integration run on the protected logical clone, through the normal project-card/PDF acceptance path; record canonical-source and clone identities. |
| GHR-02B-RC-02 | Live Perception-derived facts produce the sole frozen producer/route/pins/scope/body contract and exact false-only bytes; producer- or fact-shape tampering cannot alter the issued intent. | Source-boundary plus actual-issuance parity/negative tests. |
| GHR-02B-RC-03 | Repeated completed execution or producer restart preserves the original logical handoff and singleton job identity, with no second intent, regenerated pins, polling, or mode change. | Real pg-boss producer-dedup/restart tests and source-boundary assertions. |
| GHR-02B-RC-04 | Queue metadata contains only `GenericHandoffJob/v1` and `handoffId`; no consumer/receipt/lease state is created. | Queue inspection and static no-consumer/no-Bridge-write oracle. |
| GHR-02B-RC-05 | Positive and failure paths produce zero receiver/ACK/resolver/planner/BSS/SEM/provider/reconciliation/projection effects. | Database/queue spies and static dependency boundary test. |

## Security Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** `GHR-02B-B1` GHR-02A owns policy/intent authority; `GHR-02B-B2` Perception owns accepted truth; `GHR-02B-B3` GHR-03B owns delivery runtime.
- **Trust boundaries:** `GHR-02B-T1` accepted lifecycle facts cross into the private issuer; `GHR-02B-T2` atomic publication exposes only a handoff pointer to the queue.
- **Sensitive assets:** `GHR-02B-A1` accepted scope/execution and completion facts; `GHR-02B-A2` transactional publication capability.
- **Identity context:** `GHR-02B-I1` derives, never accepts from a caller, the exact accepted execution and scope bound into GHR-02A's immutable intent.
- **Extension seams:** `GHR-02B-S1` same transaction gives future delivery a stable handoff pointer; `GHR-02B-S2` singleton identity isolates producer dedup from receiver idempotency.
- **Prohibited couplings:** `GHR-02B-C1` no payload-bearing job; `GHR-02B-C2` no outbox/poller/trigger/second scheduler; `GHR-02B-C3` no Bridge receipt/lease ownership; `GHR-02B-C4` no semantic work.
- **Verification seams:** `GHR-02B-V1` atomic rollback/commit; `GHR-02B-V2` live provenance/parity; `GHR-02B-V3` producer dedup; `GHR-02B-V4` queue content/zero downstream effects.
- **Unresolved security policy:** cross-service authentication and anti-replay remain deferred.
- **Planning findings:** none if existing transactional pg-boss is available in the Perception transaction.
- **Review bindings:** `GHR-02B-RB-01` verifies `T1/A1/V1`; `GHR-02B-RB-02` verifies `I1/V2`; `GHR-02B-RB-03` verifies `S2/V3`; `GHR-02B-RB-04` verifies `T2/A2/C1..C4/V4`.

## Hard stop

Stop if the existing Perception transaction cannot atomically call the private issuer and transactional pg-boss producer, or if completion requires a consumer, an outbox/poller/trigger, or Bridge write authority. Report the transaction gap; do not fake publication or broaden the ticket.
