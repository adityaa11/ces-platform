# BSS-V2-005-02: Provider-dependent process and bounded workload-envelope catalogue

- **State:** `planned`
- **Review batch:** `BSS-V2-BATCH-05-02`
- **Dependencies:** BSS-V2-005-01 CK `PASS`; BSS-V2-001 capability contracts
- **Parent:** [BSS-V2-005](BSS-V2-005-quota-domain-capacity-foundation.md)

## Outcome

Define reusable process-policy and workload-envelope contracts without hard-coding guessed average token weights.

## Owned behavior

- Process kind/capability.
- Interactive/background service class.
- Generic fairness-scope identity.
- Background weight/borrow/cap policy.
- Hard interactive protection policy shape.
- Active/inactive route/workload eligibility.
- Versioned WorkloadEnvelopeProfile.
- Structural bound plus estimator/accounting/safety identities.
- Planning and per-request RequestResourceEnvelope validation.

Semantic/reconciliation/chat/CES may be represented as process identities, but remain inactive until their route/workload integration exists.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00502-01 | Process profiles express service class, fairness scope and allocation policy without customer-plan entitlement. | PASS iff planner-facing policy is execution operational metadata only and unknown process/capability fails closed. |
| RC-BSSV2-00502-02 | Workload profiles describe bounded construction and versioned estimation rather than a guessed constant average. | PASS iff structural bounds, estimator/accounting version, output reservation and safety policy are explicit and invalid/unbounded profiles cannot activate. |
| RC-BSSV2-00502-03 | RequestResourceEnvelope preserves independent request/token/day/concurrency dimensions. | PASS iff validation rejects negative/overflow/missing required resource dimensions and never collapses them to one magic scalar. |
| RC-BSSV2-00502-04 | Billing/weighted-token observations remain distinct from rate-limit resource accounting. | PASS iff no cost/weighted field affects TPM admission without explicit quota-accounting authority. |
| RC-BSSV2-00502-05 | Process/workload versions are immutable references suitable for later reservation audit. | PASS iff profile replacement creates a new identity/version and old references remain resolvable. |

## Non-authority

No provider execution, live usage statistics, runtime reservations, semantic batching implementation, or final numeric production process weights belongs here.

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-BSSV2-00502-CAPABILITY` retains provider-neutral capability contracts; `BOUNDARY-BSSV2-00502-BRIDGE-OPS` keeps process/workload policy operational rather than customer entitlement; `BOUNDARY-BSSV2-00502-CATALOGUE` consumes only valid versioned quota-domain profiles.
- **Trust boundary:** `TRUST-BSSV2-00502-PROFILE-ACTIVATION` is the transition from configured process/workload definitions to planner-eligible immutable profiles; invalid, unbounded, incompatible, or inactive definitions fail closed.
- **Sensitive assets:** `ASSET-BSSV2-00502-REQUEST-SHAPE` covers prompt/schema/compiler and structural-bound identities without storing source prompts or provider credentials.
- **Identity context:** `IDENTITY-BSSV2-00502-PROCESS-WORKLOAD` binds process kind, capability, service class, fairness scope, route compatibility, workload/compiler/estimator/accounting/safety versions, and envelope policy.
- **Extension seams:** `SEAM-BSSV2-00502-SERVICE-CLASS`, `SEAM-BSSV2-00502-FAIRNESS-SCOPE`, `SEAM-BSSV2-00502-STRUCTURAL-BOUND`, and `SEAM-BSSV2-00502-RESOURCE-VECTOR` permit later policy attachment without consumer-specific schedulers.
- **Prohibited couplings:** `COUPLING-BSSV2-00502-CUSTOMER-PLAN` forbids entitlement data; `COUPLING-BSSV2-00502-AVERAGE-AS-BOUND` forbids guessed averages as truth; `COUPLING-BSSV2-00502-SCALAR-RESOURCE` forbids collapsing RPM/TPM/RPD/concurrency; `COUPLING-BSSV2-00502-SENSITIVE-PROMPT` forbids source/prompt bodies in catalogue state.
- **Verification seams:** `VERIFY-BSSV2-00502-VALIDATION`, `VERIFY-BSSV2-00502-COMPATIBILITY`, `VERIFY-BSSV2-00502-VERSION-HISTORY`, and `VERIFY-BSSV2-00502-NO-ENTITLEMENT` cover bounds/resource validation, route compatibility, immutability, and authority isolation.
- **Unresolved security policy:** `SEC-GAP-BSSV2-00502-PRODUCTION-WEIGHTS` leaves numeric weights, caps, service targets, and future privacy/retention policy to deployment/profile decisions.
- **Review bindings:** `REV-READY-BSSV2-00502-01` verifies process authority and inactive/fail-closed eligibility; `REV-READY-BSSV2-00502-02` verifies bounded request construction and independent resource vectors; `REV-READY-BSSV2-00502-03` verifies version auditability, sensitive-content exclusion, and billing/quota separation.

## Workflow evidence

Implementation must close every Review Contract row using deterministic schema/compatibility/boundary fixtures, record exact Compose commands/counts and redacted profile evidence in a compact closure ledger, then reach `READY_FOR_CK`. This ticket grants no GO by itself.
