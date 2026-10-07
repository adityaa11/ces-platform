# BSS-V2-006-04: Integrated durable provider-admission runtime checkpoint

- **State:** `planned`
- **Review batch:** `BSS-V2-BATCH-06-04`
- **Dependencies:** BSS-V2-006-01 through -03 CK `PASS`
- **Parent:** [BSS-V2-006](BSS-V2-006-capability-admission-interactive-protection.md)
- **Planning authority:** [Provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §21

## Outcome

Prove one reusable external-provider admission authority before semantic extraction becomes a client.

## Required deterministic scenario

Use one shared synthetic quota domain with hard interactive work, request-heavy/token-heavy background lanes, multiple fairness keys, explicit RPM/TPM/RPD/concurrency window policies and a single-attempt fake transport. Exercise saturation, borrowing, a late lane, interactive arrival, plan increase/decrease, weight-change rebase, actual under/over usage, unknown usage after possible transport, 429/Retry-After, restart, ack loss and deduplicated wakeup.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00604-01 | Every fake outbound transport has one prior durable reservation + explicit attempt. | PASS iff denied work has zero transport and no reservation authorizes two outbound attempts. |
| RC-BSSV2-00604-02 | Background cannot block protected interactive work and fairness is work-conserving/debt-free. | PASS iff reserve survives saturation and a late lane does not monopolize because another borrowed idle capacity earlier. |
| RC-BSSV2-00604-03 | Quota windows, exact/unknown usage, restart/replay/ack-loss preserve once-only capacity effects. | PASS iff no double-spend/refund, optimistic unknown-usage release, duplicate job or stale release occurs. |
| RC-BSSV2-00604-04 | Plan/provider-pressure changes alter future admissions dynamically. | PASS iff activation itself wakes sleeping backlog, vN -> vN+1 changes admissions without preemption, weight change rebases fairness and clamp survives restart. |
| RC-BSSV2-00604-05 | Runtime observations never exceed active plan and analytics stay BSS-V2-007-owned. | PASS iff higher observed limits cannot raise capacity and only operational-minimum metadata is persisted. |
| RC-BSSV2-00604-06 | Local Docling and Atlas trusted state remain outside this authority. | PASS iff no local perception route needs quota metadata and Bridge roles cannot mutate Atlas truth. |

## Hard stop

After PASS, BSS-V2-006 is shared infrastructure. No semantic/reconciliation/CES/chat product behavior here.

## Security Refactor Readiness

**Status:** `applicable`.

- **Trust boundary:** secret-free waiting -> reservation -> one fake transport -> exactly-once feedback reconciliation.
- **Identity context:** logical work/attempt, lane/key, quota domain/window, active plan/fairness epoch, envelope, reservation, job, outcome, wakeup.
- **Prohibited couplings:** consumer-local limiter, bypass, hidden retry, sensitive evidence, Docling quota, Atlas truth.
- **Verification seams:** transport gate, protection/debt-free fairness, windows/unknown usage, restart/replay, plan-pressure convergence, role exclusion.
- **Review bindings:** CK verifies the complete deterministic scenario.

## Workflow evidence

Close all rows in one harness with exact commands/counts/redacted observations; `READY_FOR_CK`; stop.
