# BSS-V2-014-03 — Authenticated calculated-capacity handoff

- **State:** `frozen`; contract freeze: [BSS-V2-014-03 contract freeze 001](../../../feedback/BSS-V2-014-03-contract-freeze-001.md). BSS-V2-005 successor. No GO, implementation, migration, activation, admission, or provider operation is authorized without a separate explicit GO.
- **Parent:** [BSS-V2-014 ticket set](BSS-V2-014-weighted-capacity-ticket-set.md).
- **Dependencies:** BSS-V2-014-02-02 CK `PASS`; BSS-V2-014-05's IDSER consumer contract frozen; approved BSS-V2-005-05-02 read-boundary security properties. This ticket can qualify v2 in isolation, but production activation is solely the parent-owned coordinated `-03/-05` cutover gate.

## Exact scope

Evolve the existing authenticated `CapacityPlanningSnapshot` reader/SQL projection and existing endpoint into the single calculated-capacity contract, `CapacityPlanningSnapshot/v2`. No endpoint, service principal class, direct-table consumer access, or second read pipeline is added. V2 may be qualified in isolation before release, but the existing production reader changes active version only in the same parent-coordinated cutover that replaces the active `-05` consumer.

For a server-bound principal, a `qualified` v2 response contains exactly:

- identity: quota domain, process/profile/class/capability, route/provider/model, adapter and qualification identities;
- revisions: provider capacity, effective enforcement policy, class allocation policy, process registry, desired plan, activation, workload, estimator, and route authority;
- allocation: effective numeric dimensions, class baseline, process baseline, exact normalized rational weight, and explicit cap when present;
- sizing: `maxEligibleCompleteRequestTokens`, `maxEligibleInputTokens`, qualified request-byte/context/output limits, and pinned estimator/safety identities;
- borrowing metadata: `mayBorrowIdleCapacity`, `same-background-class`, `runtimeOnly`; and
- policy provenance including a nonnumeric approved unknown RPD decision when applicable, canonical fingerprint, typed status/reason, and `readIsNotAdmissionPermit=true`.

Only mutually consistent active plan, process, route/model authority, policy, allocation, and required structural bounds may return `qualified`. Exact structural authority is the immutable `bridge.workload_envelope_profile` structural-bound, estimator, output-reservation, and safety identities selected through the versioned `bridge.provider_process_profile`/desired-plan input, joined with the exact `-02-01` qualified route/model authority version. Every required request-byte, input, context, and output bound must be present in that versioned tuple; a generic model-name default, TPM-derived context size, or consumer-private profile is prohibited. `unknown`, `stale`, `unfit`, or `inactive` is never numeric fallback. The pre-existing v1 prospective inactive response remains an historical fact, but may not be relabeled or adapted into v2. `-05` owns the sole consumer replacement; this ticket creates no IDSER code.

## Affected existing interfaces and required change

| Existing interface | Required successor change |
| --- | --- |
| `capacity-planning-snapshot.ts` and app endpoint | Keep the authenticated server-owned request path; qualify `CapacityPlanningSnapshot/v2` in isolation, then activate it only at the parent-coordinated consumer cutover, without a v1/v2 adapter or parallel reader. |
| `bridge.read_capacity_planning_snapshot` | Evolve the existing SQL projection to join the `-02` model-route binding, versioned workload envelope/profile, and calculated allocation; return the v2 fingerprint/status data without counters or side effects. |
| Snapshot principal binding | Continue to bind domain/process/profile/route/class server-side; derive provider/model and activation from durable authority rather than accepting client selection. |
| `RuntimeCapacityConstraint/v1` | Remains a separate transient eligibility read and is not used as a planning-budget substitute. |

## Binary Review Contract

| ID | PASS iff / direct negative | Required validation and evidence |
| --- | --- | --- |
| `RC-01403-01` | The existing authenticated read seam returns a qualified v2 response whose route/model authority version, workload/profile version, allocation, every required structural bound, effective mask, and fingerprint exactly match one active immutable plan. Read counters show zero attempts, reservations, window mutations, jobs, and transports. | Isolated Bridge PostgreSQL plus existing HTTP reader integration harness. |
| `RC-01403-02` | Foreign principal, mismatched process/class/route/model, stale authority/plan, missing allocation, revoked policy, absent required structural/model bound, or route-to-workload version mismatch returns typed non-qualified status with no numeric fallback. | Negative principal/plan/model fixtures and zero-effect counters. |
| `RC-01403-03` | The Anoman positive fixture returns `rpm,tpm,concurrency` allocations and carries approved unknown-RPD provenance without numeric RPD. Missing/revoked/mismatched approval fails closed. | WCA-15 read-only positive/negative fixture. |
| `RC-01403-04` | A v2 maximum eligible request is bounded by full request demand, process TPM/RPM baseline, request bytes, model context/input/output, reservation, and estimator identity; it never derives a per-slot token ceiling. | Complete-request text/image/output fixture and too-large typed `unfit` assertion. |
| `RC-01403-05` | The current endpoint/reader remains the sole BSS planning reader. `-03` qualifies v2 only in isolation and rejects any attempt to production-activate it before the parent gate has the later `-05` replacement and `-04` readiness evidence. No duplicate reader, dual read/write, v1→v2 shim, prospective-to-active relabeling, or IDSER implementation is introduced by this ticket. | Isolated v2 reader fixture, premature-activation negative with zero active-reader change, entrypoint inventory, contract-reference check, and static source-boundary test. No implemented IDSER consumer or positive production-cutover evidence is required for this CK. |

## Freeze-time validation commands

```text
pnpm --filter @atlas/db migration:check
pnpm --filter @atlas/db exec jiti tests/calculated-capacity-snapshot-v2.integration.test.ts
pnpm --filter @atlas/agents-bridge exec jiti tests/calculated-capacity-snapshot-v2.integration.test.ts
pnpm --filter @atlas/agents-bridge typecheck
```

## SecurityReadiness

- **Status:** `applicable`.
- `SR-01403-T1`: authenticated principal → server-bound domain/process/route/model projection.
- `SR-01403-A1`: calculated capacity, model bounds, policy provenance, and canonical fingerprint are planning authority; request content, credentials, and live counters are excluded.
- `SR-01403-C1`: prohibit foreign-scope selection, direct SQL, admission implication, runtime-counter leakage, fallback to prospective/v1, and a new endpoint.
- `SR-01403-R1`: `RC-01403-01..05` require principal negatives, exact plan/structural equality, zero-effect counters, reader-entrypoint inventory, and pre-cutover activation rejection.

## Hard stop

Stop if a safe consumer cutover requires a v1/v2 compatibility adapter, dual active reader, client-selected model/domain, or a new endpoint. Do not make a structural-only prospective read an active calculated allocation, and do not make the isolated IDSER environment repair a dependency.
