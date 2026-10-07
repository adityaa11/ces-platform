# IDSER-012-01: Fair bounded local Docling perception to NormalizedDocument v1

- **State:** `planned`
- **Type:** non-executable umbrella
- **Children:** `IDSER-012-01-01`, `IDSER-012-01-02`
- **Parent:** [IDSER-012](IDSER-012-staged-worker-pipeline-realignment.md)

## Outcome

For explicitly staged bundles, replace reconciliation-driven next-document perception with a durable bundle-fair local admission backlog, execute at most the qualified two-worker Docling capacity, accept valid `NormalizedDocument v1` independently per document, persist `perceived`, and stop before any semantic work.

## Hard stop

```text
PDF -> local admission -> Docling -> accepted NormalizedDocument v1 -> perceived -> STOP
```

No external-provider quota/runtime infrastructure belongs to IDSER-012-01.
