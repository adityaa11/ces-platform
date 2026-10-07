# BSS-V2-005: External provider capacity catalogue and deterministic admission planning

- **State:** `planned`
- **Type:** non-executable umbrella
- **Dependencies:** accepted BSS-005/006, BSS-V2-001/002; external semantic adapter/qualification may remain independently in progress
- **Planning authority:** [Provider admission and staged semantic pipeline context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md)

## Outcome

Create the reusable, provider-neutral planning substrate that describes real external quota domains, Atlas provider-dependent process policy, bounded workload envelopes, and a deterministic versioned DesiredAdmissionProfile. Do not perform runtime admission or provider calls.

## Children

```text
BSS-V2-005-01 provider capacity catalogue
BSS-V2-005-02 process/workload-envelope catalogue
BSS-V2-005-03 deterministic planner
BSS-V2-005-04 desired-profile publication/versioning
```

Local Docling is excluded from external-provider quota semantics. Each child is a separate GO/CK target and requires predecessor CK `PASS`.
