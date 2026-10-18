# BSS-V2-006-05-03 — Authenticated effective-capacity snapshot

- **State:** `planned`; executable leaf, not GO/CFC/HMN authority or CK PASS.
- **Review batch:** `BSS-V2-BATCH-06-05-03`.
- **Parent:** [BSS-V2-006-05 split map](BSS-V2-006-05-policy-driven-optional-capacity-dimensions-anoman.md).
- **Dependencies:** parent predecessors and `BSS-V2-006-05-02` CK `PASS`; no runtime admission dependency.

## Outcome

BSS-V2-005 exposes provider-state provenance and effective-enforcement metadata through its authenticated, versioned, read-only planning interface. An Anoman prospective/inactive workload can be sized without qualification or activation; the returned data cannot reserve, enqueue, send, mutate quota or promote a route.

## Authorized scope

Evolve only the BSS-V2-005 planning reader/public schema, typed status and authorization checks needed to represent source + enforcement + structural/estimator versions and exact policy/profile/plan identity. Consume the policy from `-05-01`; do not introduce direct Bridge table access, consumer-owned policy derivation, a fake snapshot, plan publication or BSS-V2-006 operational reads.

## Review contract

`RC-00605-08` is discharged only with an authenticated planning-only reader that returns exact Anoman source/enforcement/structural/estimator versions and has exact zero work attempts, reservations, jobs, sends and quota mutations. Foreign scope, stale/unknown policy and unauthenticated access fail closed. If a production-callable snapshot cannot be supplied by BSS-V2-005, record its explicit ownership blocker; a fixture cannot stand in for completion.

## SecurityReadiness

- `SR-0503-T1`: consumer identity crosses to BSS-V2-005 read authority; a prospective read must not cross into activation or admission.
- `SR-0503-A1`: versioned source/enforcement and structural metadata are authoritative planning assets.
- `SR-0503-C1`: prohibit direct table access, returned admission permits and side-effecting reads.
- `SR-0503-R1`: CK verifies authenticated/foreign/stale cases and non-inert zero-side-effect counters.

## Hard stop

No reader may be claimed complete without the BSS-V2-005-owned production-facing authority and its authentication contract.
