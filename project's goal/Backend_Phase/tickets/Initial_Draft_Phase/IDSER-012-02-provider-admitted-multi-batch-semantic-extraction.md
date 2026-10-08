# IDSER-012-02: Provider-admitted multi-batch semantic extraction to semantic_ready

- **State:** `planned`
- **Type:** non-executable umbrella
- **Dependencies:** IDSER-012-01-03-02 CK `PASS`; all BSS-V2-005/006 children CK `PASS`; BSS-V2-004-03-04/05 CK `PASS`
- **Parent:** [IDSER-012](IDSER-012-staged-worker-pipeline-realignment.md)
- **Planning authority:** [Provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §§21.5-21.7

## Outcome

Make Initial Draft semantic extraction the first production consumer of shared provider admission. One perceived document, including visual evidence available only through the Atlas-authorized derived-asset resolver, may generate multiple bounded provider requests while retaining exact owned-source accounting and bounded reference context; Atlas accepts exactly one complete document extraction result and stops at `semantic_ready`. This umbrella does not take ownership of derived-asset persistence or resolver authorization. Visual asset retrieval proves preservation only, not semantic interpretation; meaningful unexamined visuals must be accounted for honestly and cannot silently become `non_fact`.

## Children

```text
IDSER-012-02-01 owned/context batch plan + RequestResourceEnvelope
IDSER-012-02-02 concrete semantic process/workload profile activation
BSS-V2-004-03-06 exact batch-aware live qualification through BSS-V2-006
IDSER-012-02-03 provider-admitted batch execution/staging
IDSER-012-02-04 complete document aggregation + semantic_ready
```

## Historical realignment

This umbrella supersedes unimplemented BSS-V2-004-03-07 direct continuation. BSS-V2-004-03-06 remains the live qualification owner but now qualifies the exact batch-aware, provider-admitted request profile after IDSER-012-02-02. No production batch execution begins without semantic qualification `PASS`.
