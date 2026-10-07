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
BSS-V2-005-04 desired-profile publication/versioning
```

Local Docling is excluded from external-provider quota semantics. Each child is a separate GO/CK target and requires predecessor CK `PASS`.
