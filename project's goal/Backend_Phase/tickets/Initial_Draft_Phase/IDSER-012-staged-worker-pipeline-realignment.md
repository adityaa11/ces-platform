# IDSER-012: Staged perception and provider-admitted semantic pipeline realignment

- **State:** `planned`
- **Type:** non-executable umbrella
- **Review family:** `IDSER-BATCH-12`
- **Planning authority:** [Provider admission and staged semantic pipeline context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md), including §21 amendments

## Outcome

Amend only future staged Initial Draft execution so local perception progresses independently across bundle members, external semantic work consumes shared BSS-V2-005/006 admission, and extraction stops durably before reconciliation. Historical IDSER sequencing evidence remains historical.

## Future staged flow

```text
bundle manifest
 -> IDSER-012-01 fair local perception
 -> accepted NormalizedDocument v1 / perceived
 -> IDSER-012-02 deterministic owned/context batches
 -> activate semantic provider process/workload profile
 -> BSS-V2-004-03-06 live qualification through BSS-V2-006
 -> provider-admitted batch execution
 -> complete document aggregation
 -> semantic_ready
 -> later reconciliation redesign
```

## Historical amendment

For staged-policy bundles only, supersede immediate-D1 kickoff, D1-only perception eligibility, reconciliation-driven next-perception scheduling and D2/D3 waiting for prior reconciliation. Preserve every other source/replay/failure/candidate/evidence/review/truth boundary unless a child explicitly amends it.

## Children and gates

```text
IDSER-012-01-01 -> IDSER-012-01-02

BSS-V2-005-01 -> -02 -> -03 -> -04
BSS-V2-006-01 -> -02 -> -03 -> -04

BSS-V2-004-03-04 -> -05
IDSER-012-01-02 + BSS-V2-006-04 + 004-03-05
  -> IDSER-012-02-01
  -> IDSER-012-02-02
  -> BSS-V2-004-03-06 qualification PASS
  -> IDSER-012-02-03
  -> IDSER-012-02-04
  -> semantic_ready
  -> STOP
```

No reconciliation implementation belongs here. Planning is not GO.
