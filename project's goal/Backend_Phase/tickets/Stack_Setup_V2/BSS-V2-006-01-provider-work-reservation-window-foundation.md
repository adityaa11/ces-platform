# BSS-V2-006-01: Provider-work, reservation, quota-window and attempt foundation

- **State:** `planned`
- **Review batch:** `BSS-V2-BATCH-06-01`
- **Dependencies:** BSS-V2-005-04 CK `PASS`; BSS-006; BSS-003 Bridge persistence/role boundary
- **Parent:** [BSS-V2-006](BSS-V2-006-capability-admission-interactive-protection.md)
- **Planning authority:** [Provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §§21.1-21.4

## Outcome

Create Bridge-owned durable state for waiting provider work, explicit logical attempts, per-attempt RequestResourceEnvelope reservations, exact quota-window/refill state and deduplicated wakeups. No fairness or real provider call yet.

## Required attempt/window state

```text
logical work
  -> attempt N
      -> waiting
      -> reserved
      -> dispatched / transport-may-have-started
      -> terminal
      -> reconciled
```

Window state derives only from the active DesiredAdmissionProfile's exact capacity/window-policy versions. Unknown reset semantics never become guessed refill behavior.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00601-01 | Work registration is idempotent by logical-work/attempt identity and persists process/quota/fairness/resource references without prompt/source bodies. | PASS iff duplicate registration yields one waiting attempt and secrets/content are absent. |
| RC-BSSV2-00601-02 | Runtime state tracks active plan, exact per-dimension window/refill identity/state, in-flight concurrency and cooldown. | PASS iff restart preserves it, rollover/refill uses only referenced policy, and missing/unknown-required policy fails closed. |
| RC-BSSV2-00601-03 | Reservation binds attempt, RequestResourceEnvelope and authorizing DesiredAdmissionProfile version. | PASS iff one attempt cannot hold duplicate live reservations and history remains attributable after plan change. |
| RC-BSSV2-00601-04 | Attempt fencing distinguishes waiting/reserved/transport-may-have-started/terminal/reconciled. | PASS iff restart/replay cannot make uncertain transmitted work look definitely untransmitted or silently authorize a second attempt. |
| RC-BSSV2-00601-05 | Waiting/admitted execution uses pg-boss only and supports deduplicated future/domain wakeup, including later plan-change attachment. | PASS iff no second broker/process-local timer is durable authority and duplicate wakeups collapse. |
| RC-BSSV2-00601-06 | Operational persistence remains Bridge-owned and cannot mutate Atlas trusted state. | PASS iff role tests deny trusted Atlas writes. |

## Hard stop

Persistence/state only. No fair admission or provider transport.

## Security Refactor Readiness

**Status:** `applicable`.

- **Trust boundary:** provider-work registration accepts only logical identity + validated profile/resource references.
- **Sensitive assets:** credentials, prompts, source bodies, authorization headers stay out of work/reservation/window state.
- **Identity context:** logical work, explicit attempt, process, quota domain, fairness key, envelope, plan/window versions, reservation, wakeup, state version.
- **Extension seams:** work state, attempt fence, reservation, quota-window policy, wakeup, state transition.
- **Prohibited couplings:** raw content, duplicate reservation, hidden attempt duplication, guessed refill, second broker, polling authority, Atlas write.
- **Verification seams:** idempotency, restart/window rollover, attempt uncertainty, roles/redaction, wakeup dedupe.
- **Review bindings:** CK verifies identity, restart-safe quota state and broker/role isolation.

## Workflow evidence

Close all rows with migration/window/restart/idempotency/attempt-fence/redaction/wakeup tests and `READY_FOR_CK`.
