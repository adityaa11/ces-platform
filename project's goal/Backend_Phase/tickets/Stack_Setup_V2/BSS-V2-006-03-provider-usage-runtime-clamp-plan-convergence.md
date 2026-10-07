# BSS-V2-006-03: Provider feedback, usage reconciliation, runtime clamp and plan convergence

- **State:** `planned`
- **Review batch:** `BSS-V2-BATCH-06-03`
- **Dependencies:** BSS-V2-006-02 CK `PASS`; BSS-V2-001 provider-neutral capability boundary
- **Parent:** [BSS-V2-006](BSS-V2-006-capability-admission-interactive-protection.md)
- **Planning authority:** [Provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §§21.2-21.4

## Outcome

Close the generic runtime feedback loop without a live provider: define additive provider-neutral operational feedback, reconcile trustworthy actual usage, handle unknown usage conservatively, durably react to provider pressure, wake existing backlog on plan changes, and rebase fairness epochs when policy changes.

## Provider-neutral feedback seam

The Bridge capability/error boundary may be extended additively with normalized operational metadata:

```text
transportMayHaveStarted
trustworthy usage when available
Retry-After when exposed
limit / remaining / reset observations when exposed
```

Raw headers/provider bodies remain adapter-local. Existing legacy paths may retain old behavior, but a BSS-V2-006-admitted call must guarantee single-transport attempt semantics.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00603-01 | Trustworthy actual usage reconciles reserved quota exactly once. | PASS iff under-use refunds only refundable capacity, over-use records deficit, duplicate outcome cannot double-refund, transmitted request/RPD remain counted. |
| RC-BSSV2-00603-02 | Unknown usage has deterministic fail-safe accounting. | PASS iff definitely-untransmitted releases all; transport-may-have-started releases concurrency at terminal but retains request/RPD and reserved TPM until safe window boundary; missing usage is never zero. |
| RC-BSSV2-00603-03 | Retry-After/lower-limit observations create durable temporary cooldown/clamps bounded by active plan. | PASS iff waiting work survives, restart preserves pressure state, malformed feedback fails closed and higher observations cannot raise configured capacity. |
| RC-BSSV2-00603-04 | 429 without usable metadata uses bounded conservative cooldown/probe. | PASS iff no busy retry/unlimited job churn and any retry is a new explicit attempt/reservation. |
| RC-BSSV2-00603-05 | Plan activation wakes waiting work and converges without preemption. | PASS iff vN -> vN+1 creates one deduplicated domain wakeup, decrease blocks only new admissions, increase is consumable without unrelated activity, in-flight work keeps its authorizing version. |
| RC-BSSV2-00603-06 | Weight/cap change creates a new/rebased fairness epoch and feedback remains separate from BSS-V2-007 analytics. | PASS iff old virtual usage cannot become debt under new weights and runtime-minimum metadata is not the historical cost/provenance ledger. |

## Security Refactor Readiness

**Status:** `applicable`.

- **Trust boundary:** normalized provider feedback -> bounded reconciliation/clamp; malformed/unattributable feedback fails closed.
- **Sensitive assets:** operational feedback excludes credentials/raw prompts/source/full response.
- **Identity context:** work/attempt, reservation, transport uncertainty, outcome, plan/window, reconcile fence, clamp, fairness epoch, wakeup.
- **Extension seams:** feedback normalization, reconcile fence, unknown-usage accounting, clamp/probe, plan-change wakeup, fairness rebase.
- **Prohibited couplings:** double refund, missing-usage-as-zero, pressure capacity raise, hidden retry, busy retry, in-flight relabel, analytics takeover.
- **Verification seams:** usage replay, unknown-usage cases, restart clamp, bounded probe, plan wakeup/transition, fairness rebase, redaction.
- **Review bindings:** CK verifies exact/unknown usage, pressure handling, explicit-attempt retry, version-safe wakeup/convergence and fairness rebase.

## Workflow evidence

Use deterministic fake-adapter feedback/pressure/restart/replay/plan-transition fixtures; record exact state/counts and `READY_FOR_CK`.
