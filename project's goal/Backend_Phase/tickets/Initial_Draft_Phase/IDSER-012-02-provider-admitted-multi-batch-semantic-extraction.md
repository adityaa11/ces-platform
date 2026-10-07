# IDSER-012-02: Provider-admitted multi-batch semantic extraction to semantic_ready

- **State:** `planned`
- **Type:** non-executable umbrella
- **Dependencies:** IDSER-012-01-02 CK `PASS`; all BSS-V2-005/006 children CK `PASS`; BSS-V2-004-03-04/05 CK `PASS`; BSS-V2-004-03-06 CK `PASS` with semantic qualification result `PASS`
- **Parent:** [IDSER-012](IDSER-012-staged-worker-pipeline-realignment.md)

## Outcome

Make Initial Draft semantic extraction the first production consumer of the shared provider admission runtime. One perceived document may generate one or more bounded provider batches, but Atlas accepts exactly one complete document extraction result and then stops durably at `semantic_ready` with no reconciliation job.

## Children

```text
IDSER-012-02-01 bounded semantic batch plan + RequestResourceEnvelope
IDSER-012-02-02 BSS-V2-006-admitted batch execution/staging
IDSER-012-02-03 complete document aggregation + semantic_ready stop
```

## Explicit predecessor realignment

This umbrella supersedes the unimplemented old `BSS-V2-004-03-07` direct D1 semantic continuation. Provider route qualification remains BSS-V2-004 authority; lifecycle/provider-work admission belongs here plus BSS-V2-006.
