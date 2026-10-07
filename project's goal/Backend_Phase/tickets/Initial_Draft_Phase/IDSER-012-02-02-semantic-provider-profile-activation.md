# IDSER-012-02-02: Semantic provider-process/workload profile activation

- **State:** `planned`
- **Review batch:** `IDSER-BATCH-12-02-02`
- **Dependencies:** IDSER-012-02-01 CK `PASS`; BSS-V2-005-04 and BSS-V2-006-04 CK `PASS`
- **Parent:** [IDSER-012-02](IDSER-012-02-provider-admitted-multi-batch-semantic-extraction.md)
- **Planning authority:** [Provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §§21.4, 21.6-21.7

## Outcome

Materialize and activate the concrete semantic extraction consumer profile against BSS-V2-005/006. Publish immutable semantic process/workload versions derived from IDSER-012-02-01 and atomically activate a new DesiredAdmissionProfile. No provider call.

## Frozen consumer identity

```text
process kind: atlas.semantic.extract
service class: background
fairness scope/key: stable bundle ID
workload profile: exact IDSER-012-02-01 batch/context/envelope profile
quota domain: server-controlled qualified-route mapping
```

No provider limits, weights, headroom or interactive reserve are invented here; they come from valid BSS-V2-005 inputs.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-0120202-01 | Semantic process profile is immutable background consumer with stable bundle-ID fairness scope. | PASS iff user/display names never key fairness and inactive placeholders cannot dispatch. |
| RC-0120202-02 | Workload profile binds exact batch/context/compiler/schema/estimator/accounting/output/safety versions from 012-02-01. | PASS iff stale/incompatible/missing references fail activation. |
| RC-0120202-03 | Planner creates and BSS-V2-005-04 atomically activates a new DesiredAdmissionProfile containing semantic lane without weakening hard interactive protection. | PASS iff old/new profiles remain attributable and background cannot consume protected reserve. |
| RC-0120202-04 | Plan activation wakes BSS-V2-006 through shared deduplicated change seam but creates no semantic provider work. | PASS iff runtime observes new profile without restart/polling and provider-work/transport count is zero. |
| RC-0120202-05 | No provider-specific lifecycle branch is introduced. | PASS iff route/quota-domain resolution stays server-controlled/provider-neutral. |

## Hard stop

Semantic capacity policy is active/observable; no live semantic call. BSS-V2-004-03-06 owns next live qualification.

## Security Refactor Readiness

**Status:** `applicable`.

- **Trust boundary:** immutable semantic consumer activation -> shared planner/runtime policy.
- **Identity context:** process/workload versions, stable bundle fairness scope, quota domain, desired-profile activation revision.
- **Prohibited couplings:** customer entitlement, user/display-name fairness, provider-specific lifecycle, invented limits, early provider work.
- **Verification seams:** compatibility, bundle identity, atomic activation, hard reserve, plan-change wakeup, zero transport.
- **Review bindings:** CK verifies activation without bypassing/specializing shared BSS authority.

## Workflow evidence

Use deterministic planner/activation fixtures and zero-transport inspection; `READY_FOR_CK`.
