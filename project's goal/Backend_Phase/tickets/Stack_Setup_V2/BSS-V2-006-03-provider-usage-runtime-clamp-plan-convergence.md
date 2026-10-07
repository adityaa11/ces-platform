# BSS-V2-006-03: Provider usage reconciliation, runtime pressure clamp, and plan convergence

- **State:** `planned`
- **Review batch:** `BSS-V2-BATCH-06-03`
- **Dependencies:** BSS-V2-006-02 CK `PASS`; normalized provider usage/failure metadata from qualified capability adapters
- **Parent:** [BSS-V2-006](BSS-V2-006-capability-admission-interactive-protection.md)

## Outcome

Close the runtime feedback loop: reconcile reservations against actual usage, durably react to provider capacity pressure, schedule safe wakeups, and adopt new DesiredAdmissionProfile versions without preempting in-flight calls.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00603-01 | Actual normalized provider usage reconciles reserved quota resources exactly once. | PASS iff under-use refunds bounded capacity, over-use records debt/deficit, duplicate result/replay cannot double-refund, and transmitted request/RPD units remain conservatively counted. |
| RC-BSSV2-00603-02 | Retry-After and explicit lower provider-limit observations produce durable temporary cooldown/clamps that never exceed the active plan. | PASS iff new calls stop/defer until permitted, waiting work is retained, and restart preserves the clamp. |
| RC-BSSV2-00603-03 | 429 without usable limit metadata enters bounded conservative cooldown/probe behavior rather than provider hammering. | PASS iff repeated pressure cannot create a busy retry loop or unlimited pg-boss churn. |
| RC-BSSV2-00603-04 | Plan decrease converges by blocking new admissions, not killing/relabeling existing reservations; plan increase becomes available on the next admission boundary. | PASS iff in-flight work remains bound to its authorizing version and new reservations use the new effective profile only. |
| RC-BSSV2-00603-05 | Runtime observations cannot permanently raise configured capacity and do not become the historical analytics/cost ledger. | PASS iff a higher observed limit is ignored above plan ceiling and BSS-V2-007 ownership remains intact. |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-BSSV2-00603-ADAPTER-METADATA` consumes only normalized usage/failure metadata from qualified adapters; `BOUNDARY-BSSV2-00603-PLAN-CEILING` forbids runtime from exceeding the active desired plan; `BOUNDARY-BSSV2-00603-LEDGER` leaves historical analytics/cost to BSS-V2-007.
- **Trust boundary:** `TRUST-BSSV2-00603-PROVIDER-FEEDBACK` converts provider-reported usage, Retry-After, and limit pressure into bounded reservation reconciliation and conservative runtime state; malformed/unattributable feedback fails closed.
- **Sensitive assets:** `ASSET-BSSV2-00603-USAGE-METADATA` is normalized operational usage/failure data, stripped of authorization headers, raw prompts, source bodies, and full provider responses.
- **Identity context:** `IDENTITY-BSSV2-00603-RECONCILIATION` binds work/attempt, reservation, provider call/outcome, normalized usage/failure identity, authorizing plan version, reconciliation fence, clamp/cooldown, and wakeup.
- **Extension seams:** `SEAM-BSSV2-00603-USAGE-NORMALIZATION`, `SEAM-BSSV2-00603-RECONCILE-FENCE`, `SEAM-BSSV2-00603-RUNTIME-CLAMP`, `SEAM-BSSV2-00603-PROBE`, and `SEAM-BSSV2-00603-PLAN-CONVERGENCE` preserve future provider/security policy attachment.
- **Prohibited couplings:** `COUPLING-BSSV2-00603-DOUBLE-REFUND`, `COUPLING-BSSV2-00603-PRESSURE-RAISE`, `COUPLING-BSSV2-00603-BUSY-RETRY`, `COUPLING-BSSV2-00603-INFLIGHT-RELABEL`, and `COUPLING-BSSV2-00603-ANALYTICS-LEDGER` are forbidden.
- **Verification seams:** `VERIFY-BSSV2-00603-USAGE-REPLAY`, `VERIFY-BSSV2-00603-RESTART-CLAMP`, `VERIFY-BSSV2-00603-BOUNDED-PROBE`, `VERIFY-BSSV2-00603-PLAN-TRANSITION`, and `VERIFY-BSSV2-00603-REDACTION` cover the feedback loop.
- **Unresolved security policy:** `SEC-GAP-BSSV2-00603-PRESSURE-GOVERNANCE` leaves permanent limit confirmation, long-term telemetry retention, incident policy, and provider-specific escalation outside scope.
- **Review bindings:** `REV-READY-BSSV2-00603-01` verifies exactly-once usage attribution/refund/debt and redaction; `REV-READY-BSSV2-00603-02` verifies durable conservative clamp/probe/wakeup under pressure; `REV-READY-BSSV2-00603-03` verifies version-safe plan convergence, no runtime capacity raise, and BSS-V2-007 separation.

## Workflow evidence

Implementation must close every Review Contract row using deterministic normalized-usage, pressure, restart, replay, and plan-transition fixtures, record exact Compose commands/counts in a compact closure ledger, then reach `READY_FOR_CK`. This ticket grants no GO by itself.
