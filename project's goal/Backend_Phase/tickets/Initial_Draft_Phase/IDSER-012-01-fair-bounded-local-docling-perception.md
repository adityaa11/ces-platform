# IDSER-012-01: Fair bounded local Docling perception to NormalizedDocument v1

- **State:** `planned`
- **Type:** non-executable umbrella
- **Children:** `IDSER-012-01-01`, `IDSER-012-01-02`
- **Parent:** [IDSER-012](IDSER-012-staged-worker-pipeline-realignment.md)
- **Planning authority:** [Provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §21.7

## Outcome

For explicitly staged bundles, replace reconciliation-driven next-document perception with a durable bundle-fair local admission backlog, execute at most qualified two-worker Docling capacity, accept valid `NormalizedDocument v1` independently per document, persist `perceived`, and stop before semantic work.

## Hard stop

```text
PDF -> local admission -> Docling -> accepted NormalizedDocument v1 -> perceived -> STOP
```

No external-provider quota/runtime infrastructure belongs here.
