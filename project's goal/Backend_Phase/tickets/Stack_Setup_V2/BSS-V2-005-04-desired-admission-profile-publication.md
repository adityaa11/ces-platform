# BSS-V2-005-04: Versioned DesiredAdmissionProfile publication and cutover

- **State:** `planned`
- **Review batch:** `BSS-V2-BATCH-05-04`
- **Dependencies:** BSS-V2-005-03 CK `PASS`; BSS-003 Bridge operational persistence boundary
- **Parent:** [BSS-V2-005](BSS-V2-005-quota-domain-capacity-foundation.md)

## Outcome

Persist/publish immutable DesiredAdmissionProfile versions as Bridge operational configuration so BSS-V2-006 can atomically resolve one active effective plan per quota domain. Changing provider limits or process policy produces a new plan version rather than rewriting active reservation history.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00504-01 | Desired profiles are immutable/versioned and bind exact input profile versions plus planner version. | PASS iff old versions remain queryable and current activation references one exact version. |
| RC-BSSV2-00504-02 | Activation is atomic per quota domain and fails closed for invalid/missing referenced capacity/process/workload profiles. | PASS iff runtime readers cannot observe a partially published plan. |
| RC-BSSV2-00504-03 | Increasing/decreasing source limits or process policy produces a new plan that can become effective without rewriting in-flight work. | PASS iff deterministic transition fixtures expose old/new versions distinctly with effective times. |
| RC-BSSV2-00504-04 | Bridge operational ownership and role boundaries remain intact. | PASS iff persistence is restricted to `bridge.*` operational state and no Atlas trusted/domain tables or customer entitlements are introduced. |

## Hard stop

A new plan can be deterministically published/activated and read. No provider work is admitted or dispatched yet.

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-BSSV2-00504-BRIDGE-SCHEMA` restricts plan persistence to Bridge operational state; `BOUNDARY-BSSV2-00504-PLANNER-OUTPUT` accepts only version-bound deterministic planner output; `BOUNDARY-BSSV2-00504-NO-RUNTIME` excludes admission/dispatch.
- **Trust boundary:** `TRUST-BSSV2-00504-ACTIVATION` atomically changes the effective plan reference for one quota domain after validating all immutable dependencies.
- **Sensitive assets:** `ASSET-BSSV2-00504-OPERATIONAL-POLICY` covers provider capacity/service-class configuration; it contains no credentials, customer entitlement, raw prompts, or source content.
- **Identity context:** `IDENTITY-BSSV2-00504-DESIRED-PROFILE` binds quota domain, immutable profile version, every input version, planner version, effective time, activation record, and activating operational identity/context when available.
- **Extension seams:** `SEAM-BSSV2-00504-IMMUTABLE-VERSION`, `SEAM-BSSV2-00504-ATOMIC-ACTIVATION`, `SEAM-BSSV2-00504-EFFECTIVE-TIME`, and `SEAM-BSSV2-00504-READER-RESOLUTION` support later authorization/audit policy.
- **Prohibited couplings:** `COUPLING-BSSV2-00504-INPLACE-MUTATION` forbids rewriting versions; `COUPLING-BSSV2-00504-PARTIAL-PUBLISH` forbids observable partial state; `COUPLING-BSSV2-00504-ATLAS-TRUTH` forbids trusted-domain writes; `COUPLING-BSSV2-00504-INFLIGHT-REWRITE` forbids relabeling existing work.
- **Verification seams:** `VERIFY-BSSV2-00504-TRANSACTION`, `VERIFY-BSSV2-00504-ROLE`, `VERIFY-BSSV2-00504-HISTORY`, and `VERIFY-BSSV2-00504-READER` cover atomicity, restricted roles, old/new traceability, and fail-closed resolution.
- **Unresolved security policy:** `SEC-GAP-BSSV2-00504-ACTIVATION-GOVERNANCE` leaves future operator approval, change-management, and audit-retention policy unresolved.
- **Review bindings:** `REV-READY-BSSV2-00504-01` verifies immutable input/version attribution and history; `REV-READY-BSSV2-00504-02` verifies atomic fail-closed activation/read behavior; `REV-READY-BSSV2-00504-03` verifies Bridge-only roles, sensitive-data exclusions, and zero admission/dispatch effects.

## Workflow evidence

Implementation must close every Review Contract row using migration/role/transition/reader tests, record exact Compose commands/counts and redacted old/new activation observations in a compact closure ledger, then reach `READY_FOR_CK`. This ticket grants no GO by itself.
