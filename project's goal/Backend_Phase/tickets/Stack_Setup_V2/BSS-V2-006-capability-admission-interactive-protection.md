# BSS-V2-006: Capability-aware admission and interactive protection

- **State:** `planned`; **Review batch:** `BSS-V2-BATCH-06`
- **Dependencies:** BSS-V2-005 at CK `PASS`
- **References:** V3 §§15, 18, 24, 31–33; Baseline V2 §§17–19, 22–23, 36, 48; implementation context §§11, 24, 29–30

## Outcome and current seam

Apply external-provider quota-domain-aware admission before external calls and retain distinct bounded local-processor controls, preserving pg-boss. Local Docling must not be modeled as a provider quota domain.

## Scope and forbidden work

Use the accepted route/profile and capacity primitive to classify work, admit/reject/defer before network transmission, provide protected interactive capacity or an equivalent priority rule, and apply bounded cooldown for eligible transient capacity failures. Reuse pg-boss queues/workers and current transaction, retry, idempotency, replay, fencing, and graceful shutdown behavior. Do not choose final numeric limits, add queue technology, create plan priority/billing, add telemetry persistence, or change semantic/perception lifecycle.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-006-01 | Every external-provider call on an integrated path passes capability/route/quota admission first; local processor calls use their own bounded concurrency/resource seam. | Instrumented deterministic integration tests. **PASS iff** denied external requests never reach adapter transport and no fictitious Docling quota metadata is required. | semantic worker; local perception worker |
| RC-BSSV2-006-02 | Background capacity cannot monopolize configured protected interactive capacity. | Controlled concurrent workload test. **PASS iff** interactive request is admitted by its protection rule while background saturation is bounded/deferred. | BSS-005 interactive runtime |
| RC-BSSV2-006-03 | Temporary capacity exhaustion follows bounded cooldown/defer behavior; zero entitlement does not retry. | Queue/admission tests. **PASS iff** cooldown is finite and classifications drive the correct distinct path. | BSS-006 retry/idempotency |
| RC-BSSV2-006-04 | Existing queue transactional, replay/fencing, cancellation, and graceful-shutdown guarantees remain intact. | Existing focused pg-boss/worker suite plus integration scenario. **PASS iff** no duplicate logical completion or trusted-state change results from admission behavior. | BSS-006; IDSER replay |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-BSSV2-006-PGBOSS` — pg-boss remains queue; `BOUNDARY-BSSV2-006-ATLAS` — Bridge cannot mutate trusted truth.
- **Trust transitions:** `SEAM-BSSV2-006-ADMISSION` — capacity checked before transport; `SEAM-BSSV2-006-INTERACTIVE` — protected interactive lane/rule stays available.
- **Prohibited coupling:** `COUPLING-BSSV2-006-ADMISSION-BYPASS` — worker or runtime cannot bypass route capacity; no customer-plan logic enters Bridge.
- **Unresolved policy:** `SEC-GAP-BSSV2-006-NUMERIC-LIMITS` — deployment profiles, not code, determine limits.
- **Review bindings:** `REV-READY-BSSV2-006-01` verifies pre-network admission; `REV-READY-BSSV2-006-02` verifies interactive protection; `REV-READY-BSSV2-006-03` verifies restricted role/replay preservation.

## Validation, Docker, and handoff

Run deterministic concurrency/admission tests, focused pg-boss transaction/retry/replay/fencing/shutdown regressions, interactive SSE regression, and Compose worker smoke with scoped jobs. Rebuild affected Bridge API/worker only. Hard stop: a required semantic result-envelope change is scope change. On PASS, BSS-V2-009 may consume admission with cost prerequisites.
