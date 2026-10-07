# BSS-V2-005-03: Deterministic multi-resource provider capacity planner

- **State:** `planned`
- **Review batch:** `BSS-V2-BATCH-05-03`
- **Dependencies:** BSS-V2-005-01 and -02 CK `PASS`
- **Parent:** [BSS-V2-005](BSS-V2-005-quota-domain-capacity-foundation.md)
- **Post-generation planning amendment:** [Provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §21

## Outcome

Implement a pure/deterministic planner that turns one quota-domain capacity profile plus active process/workload policies into a DesiredAdmissionProfile. It calculates hard interactive protection and the remaining weighted background pool but performs no runtime admission.

## Planner rules

```text
provider ceiling
 -> safety/headroom policy
 -> usable global capacity
 -> validate/derive hard interactive reserve vector
 -> background capacity = global - hard reserve
 -> normalize background lane weights/caps
 -> emit versionable deterministic desired profile
```

Hard interactive reserve is non-lendable to background work. Interactive may later borrow unused background capacity at runtime.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00503-01 | Same catalogue/profile inputs produce byte-equivalent/canonically equivalent DesiredAdmissionProfile output. | PASS iff repeat planning is deterministic and independent of wall-clock/random/provider calls except explicit effective metadata. |
| RC-BSSV2-00503-02 | Planner never allocates beyond usable provider capacity in any RPM/TPM/RPD/concurrency dimension. | PASS iff boundary fixtures reject oversubscribed protection/headroom and unknown/zero dimensions fail according to policy rather than being invented. |
| RC-BSSV2-00503-03 | Hard interactive reserve is explicitly separated from background capacity. | PASS iff a saturated background plan cannot consume protected interactive resource units in the generated profile. |
| RC-BSSV2-00503-04 | Background allocation is expressed as weighted multi-resource policy/caps, not fixed FIFO or provider-specific workers. | PASS iff different workload envelopes produce different dominant-resource costs while idle background capacity remains borrowable within policy. |
| RC-BSSV2-00503-05 | Planner does not infer guaranteed concurrency from RPM/TPM alone. | PASS iff hard concurrency seats require explicit known/conservative concurrency capacity and invalid service targets fail closed. |

## Validation and hard stop

Use synthetic capacity/process/workload matrices only. Include token-heavy vs request-heavy workloads, hard chat protection, unknown/zero limits, oversubscribed protection, and deterministic repeat-build tests. No network call and no runtime DB counter mutation.

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-BSSV2-00503-CATALOGUE` consumes immutable validated capacity/process/workload profiles; `BOUNDARY-BSSV2-00503-PLANNER` is pure planning with no transport or runtime-counter authority.
- **Trust boundary:** `TRUST-BSSV2-00503-PLAN-DERIVATION` converts versioned configuration into the policy ceiling later enforced by runtime admission; invalid or oversubscribed input must fail closed.
- **Sensitive assets:** `ASSET-BSSV2-00503-CAPACITY-POLICY` is operational provider-capacity and service-class policy, not credential or customer-entitlement data.
- **Identity context:** `IDENTITY-BSSV2-00503-PLAN-INPUT` binds quota-domain/capacity, process/workload, estimator/accounting/safety, planner, and explicit effective-metadata versions.
- **Extension seams:** `SEAM-BSSV2-00503-HEADROOM`, `SEAM-BSSV2-00503-INTERACTIVE-RESERVE`, `SEAM-BSSV2-00503-BACKGROUND-WEIGHTS`, and `SEAM-BSSV2-00503-CANONICAL-OUTPUT` preserve later policy variation without runtime/provider coupling.
- **Prohibited couplings:** `COUPLING-BSSV2-00503-RUNTIME-STATE` forbids current remaining quota/usage in planning; `COUPLING-BSSV2-00503-INFERRED-CONCURRENCY` forbids deriving hard seats from RPM/TPM; `COUPLING-BSSV2-00503-PROVIDER-WORKERS` forbids fixed vendor worker counts; `COUPLING-BSSV2-00503-BACKGROUND-RESERVE` forbids lending protected interactive capacity.
- **Verification seams:** `VERIFY-BSSV2-00503-CANONICAL`, `VERIFY-BSSV2-00503-DIMENSION-CEILINGS`, `VERIFY-BSSV2-00503-PROTECTION`, and `VERIFY-BSSV2-00503-NO-SIDE-EFFECTS` cover determinism, oversubscription, hard reserve, and pure execution.
- **Unresolved security policy:** `SEC-GAP-BSSV2-00503-NUMERIC-POLICY` leaves final headroom, service targets, weights, and caps unspecified; no value is invented by this ticket.
- **Review bindings:** `REV-READY-BSSV2-00503-01` verifies deterministic version-bound derivation; `REV-READY-BSSV2-00503-02` verifies all resource ceilings, unknown/zero handling, and explicit concurrency; `REV-READY-BSSV2-00503-03` verifies hard interactive separation, multi-resource background policy, and absence of runtime/network side effects.

## Workflow evidence

Implementation must close every Review Contract row using synthetic deterministic matrices, record exact Compose commands/counts and canonical output comparisons in a compact closure ledger, then reach `READY_FOR_CK`. This ticket grants no GO by itself.
