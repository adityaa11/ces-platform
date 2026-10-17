# BSS-V2-006-04-05 — Constraint convergence and structural-replan projection

- **State:** `planned`
- **Review batch:** `BSS-V2-BATCH-06-04-05`
- **Parent:** [BSS-V2-006-04 split map](BSS-V2-006-04-integrated-provider-admission-runtime-checkpoint.md)
- **Dependencies:** `BSS-V2-006-04-04` CK `PASS` and parent family dependencies.

## Outcome

Prove the public read/command outcomes observe approved plan activation, transient pressure and qualified structural incompatibility correctly without creating a second BSS-005 policy authority.

## Authorized scope

Project existing 03A effective clamp/pressure and 005-05 plan activation into `RuntimeCapacityConstraint/v1` and admission outcomes. A credible enduring limit still requires its own BSS-005 authority and published revision; ambiguous 429 remains BSS-006 pressure only. A new structural/per-request maximum returns a versioned consumer-replan-required/unfit outcome for immutable consumer work; it never truncates/splits a corpus or runs consumer replan. Old in-flight reservations retain their historical identity/liability.

## Review contract

| ID | PASS iff / direct negative |
| --- | --- |
| `RC-BSSV2-00604-04` | Activation, plan increase/decrease and weight change alter future public eligibility/admission without preemption; activation wakes backlog once, rebases fairness, and conservative clamps survive restart. |
| `RC-BSSV2-00604-05` | Public runtime observations never exceed the active BSS-005 plan; higher observations cannot raise capacity and only operational-minimum metadata persists. |
| `RC-BSSV2-00604-07` | Credible dimension-specific provider downgrade immediately clamps future admission; ambiguous 429 creates conservative hold/probe only; stale/wrong-domain feedback cannot affect another domain. |
| `RC-BSSV2-00604-08` | A separately qualified BSS-005 lower-profile revision produces one converged plan/wakeup; stale/high observations cannot publish or raise policy. Eligible old work resumes fairly; structurally unfit immutable work is returned for versioned consumer replan, never truncated or spun. |

## Required evidence

Use versioned synthetic plan inputs and 03A feedback through real activation/wakeup and the public read/admit entrypoints. Exercise increase/decrease, fairness rebase, trusted RPM/TPM/RPD downgrade, ambiguous 429, wrong-domain/stale feedback, recovery, restart, and a separately injected authorized BSS-005 revision. Assert effective revision, wakeup count, future send count and domain isolation; do not test policy publication by direct runtime mutation.

## Security Readiness

`SR-0405-T1`: trusted versioned policy/feedback transition to public eligibility. `SR-0405-C1`: prohibit runtime pressure from minting BSS-005 authority and prohibit silent corpus alteration. `SR-0405-R1`: CK verifies revision attribution, conservative clamp and exact deduplicated wakeup evidence.
