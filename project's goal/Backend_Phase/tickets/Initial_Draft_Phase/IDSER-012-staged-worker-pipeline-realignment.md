# IDSER-012: Staged perception and provider-admitted semantic pipeline realignment

- **State:** `planned`
- **Type:** non-executable umbrella
- **Review family:** `IDSER-BATCH-12`
- **Planning authority:** [Provider admission and staged semantic pipeline context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md)

## Outcome

Amend only future staged Initial Draft execution so local perception can progress independently across bundle members, external semantic work consumes the shared BSS-V2-005/006 provider-admission substrate, and extraction stops durably before reconciliation.

Historical IDSER sequencing evidence remains historical and is not rewritten.

## Future staged flow

```text
bundle manifest
 -> IDSER-012-01 fair local perception
 -> accepted NormalizedDocument v1 / perceived
 -> IDSER-012-02 provider-admitted semantic extraction
 -> semantic_ready
 -> later reconciliation redesign
```

## Explicit historical amendment

For staged-policy bundles only, supersede the procedural rules that:

```text
project commit must immediately create D1 perception work
only D1 may be perception eligible
reconciliation acceptance schedules the next document's perception
D2/D3 must wait for prior reconciliation
```

Preserve all other source, replay, failure, candidate/evidence, review, and truth boundaries unless a generated child explicitly says otherwise.

## Children and dependency gates

```text
IDSER-012-01
  -> IDSER-012-01-01
  -> IDSER-012-01-02

BSS-V2-005-01 -> -02 -> -03 -> -04
  -> BSS-V2-006-01 -> -02 -> -03 -> -04

IDSER-012-01-02 + BSS-V2-006-04 + qualified BSS-V2-004 semantic route
  -> IDSER-012-02-01
  -> IDSER-012-02-02
  -> IDSER-012-02-03
  -> semantic_ready
  -> STOP
```

The executable children are:

- `IDSER-012-01-01`
- `IDSER-012-01-02`
- the four `BSS-V2-005` children
- the four `BSS-V2-006` children
- `IDSER-012-02-01`
- `IDSER-012-02-02`
- `IDSER-012-02-03`

No reconciliation implementation belongs to this generated set. Ticket generation is not GO; each dependency must receive CK `PASS` before a dependent child may begin.
