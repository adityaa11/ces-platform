# BSS-V2-006: Durable fair external-provider runtime admission authority

- **State:** `planned`
- **Type:** non-executable umbrella
- **Dependencies:** all BSS-V2-005 children CK `PASS`; BSS-006; BSS-V2-001/002
- **Planning authority:** [Provider admission and staged semantic pipeline context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md), including §21 amendments

## Outcome

Provide one reusable Bridge-owned durable authority for external-provider work admission across semantic extraction, reconciliation, CES, chat and future capabilities. Enforce DesiredAdmissionProfile plus exact quota-window semantics, live reservations/provider pressure, hard interactive protection and epoch-safe background fairness before network transmission while preserving pg-boss as the only broker.

One reservation authorizes at most one outbound provider attempt. Provider retries must be explicit new attempts/reservations.

## Children

```text
BSS-V2-006-01 durable provider work + reservation/window/attempt foundation
BSS-V2-006-02 fair admission + hard interactive protection + atomic single-attempt dispatch
BSS-V2-006-03 usage/unknown-usage reconciliation + runtime clamp + plan/fairness convergence
BSS-V2-006-04 integrated deterministic runtime checkpoint
```

Local Docling continues to use its separate local-capacity seam. Each child is a separate GO/CK target and requires predecessor CK `PASS`.
