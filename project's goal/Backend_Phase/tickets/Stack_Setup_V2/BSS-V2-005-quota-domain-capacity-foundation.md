# BSS-V2-005: External provider capacity catalogue and deterministic admission planning

- **State:** `planned`
- **Type:** non-executable umbrella
- **Dependencies:** accepted BSS-005/006, BSS-V2-001/002; external semantic adapter/qualification may remain independently in progress
- **Planning authority:** [Provider admission and staged semantic pipeline context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md), including §21 amendments

## Outcome

Create the reusable, provider-neutral planning substrate that describes external quota domains, per-dimension limit/window semantics, Atlas provider-dependent process policy, bounded workload envelopes, and a deterministic versioned DesiredAdmissionProfile. No runtime admission or provider call.

## Children

```text
BSS-V2-005-01 provider capacity + quota-window catalogue
BSS-V2-005-02 process/workload-envelope catalogue
BSS-V2-005-03 deterministic planner
BSS-V2-005-04 desired-profile publication/versioning (approved)
BSS-V2-005-05 process-agnostic registered kinds + automatic immutable desired-plan convergence (planned; own GO/CK)
```

Local Docling is excluded from external-provider quota semantics. Each child is a separate GO/CK target and requires predecessor CK `PASS`.

## Prospective process-agnostic extension (2026-10-16)

The approved 005-01..04 implementation already plans from configured active generic process/workload profiles. Its `ProcessKind` registry is currently a hard-coded finite list and it does not prove automatic active-process registration-to-plan convergence. [BSS-V2-005-05](BSS-V2-005-05-process-agnostic-registry-and-plan-convergence.md) owns that **new, separately qualified** registry/automatic republish extension. No previously approved child/CK is retroactively reopened. Dynamic backlog/pressure/unused-capacity borrowing belongs exclusively to BSS-V2-006; neither BSS-V2-005 nor a semantic batch planner may invent runtime quota, implicit protection or provider admission. [Decision ledger](../../../feedback/IDSER-SEMANTIC-PLANNER-HARD-STOP-20261016.md).
