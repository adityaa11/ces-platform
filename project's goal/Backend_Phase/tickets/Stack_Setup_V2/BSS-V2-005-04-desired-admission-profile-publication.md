# BSS-V2-005-04: Versioned DesiredAdmissionProfile publication and cutover

- **State:** `planned`
- **Review batch:** `BSS-V2-BATCH-05-04`
- **Dependencies:** BSS-V2-005-03 CK `PASS`; BSS-003 Bridge operational persistence boundary
- **Parent:** [BSS-V2-005](BSS-V2-005-quota-domain-capacity-foundation.md)
- **Planning authority:** [Provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §21.4

## Outcome

Persist immutable DesiredAdmissionProfile versions so BSS-V2-006 can atomically resolve one active plan per quota domain. Limit/policy changes create new versions. Publication also exposes a monotonic active-plan revision/change seam for later durable admission wakeup wiring.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00504-01 | Profiles are immutable and bind exact capacity/window/process/workload/planner input versions. | PASS iff old versions remain queryable and active resolution references one complete version. |
| RC-BSSV2-00504-02 | Activation is atomic per quota domain and fails closed for invalid/missing referenced inputs. | PASS iff readers cannot observe partial publication. |
| RC-BSSV2-00504-03 | Increase/decrease creates a new plan and monotonic activation revision without rewriting history/in-flight references. | PASS iff old/new versions/revisions/effective times remain distinct. |
| RC-BSSV2-00504-04 | Publication exposes a transaction-capable plan-change seam but performs no admission/dispatch. | PASS iff BSS-V2-006 can later attach a deduplicated wakeup without polling/second broker and provider-job count stays zero. |
| RC-BSSV2-00504-05 | Bridge operational ownership/roles remain intact. | PASS iff no Atlas trusted/domain/customer-entitlement state is introduced. |

## Hard stop

Plan publication/activation/read only; no provider work admitted or dispatched.

## Security Refactor Readiness

**Status:** `applicable`.

- **Trust boundary:** atomic activation validates every immutable dependency before changing active profile.
- **Identity context:** quota domain, desired profile/input versions, planner, effective time and activation revision.
- **Extension seams:** immutable version, atomic activation, effective time, reader resolution and plan-change seam.
- **Prohibited couplings:** in-place mutation, partial publish, Atlas-truth write, in-flight relabel and provider dispatch.
- **Verification seams:** transaction, role, history, reader and activation-revision tests.
- **Unresolved policy:** operator approval/change-management/audit retention.
- **Review bindings:** CK verifies immutable history, atomic fail-closed activation/read, Bridge roles and no-runtime change seam.

## Workflow evidence

Close all rows with migration/role/transition/reader/activation-revision tests; then `READY_FOR_CK`.
