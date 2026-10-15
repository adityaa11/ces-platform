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

## Prospective process-agnostic runtime clarification (2026-10-16)

The planned 006-01..04 runtime is a **generic process/workload consumer**, not a semantic-specific quota manager. Registered, qualified process kinds from BSS-V2-005-05 compete by configured service class, profile, quota domain, fairness key, resource demand and active plan—not by hard-coded `semantic`, `chat` or `CES` switches. Dynamically adapt admission to actually queued eligible work through existing weighted dominant-resource borrowing/fairness, clamps, windows, restart/replay and wakeups. The hard interactive reserve remains non-lendable to background, including when no interactive work is queued. An authorized active-profile change converges to the new immutable BSS-V2-005 desired plan; an ordinary transient backlog or remaining-token change does not require plan republishing.

The Semantic Batch Planner requires a **read-only, versioned enforceable-capacity/eligibility constraint seam** as a distinct future proof obligation; it must never manipulate BSS runtime window counters or reserve provider slots just to size corpus. If 006 cannot expose this in its owned planned scope, STOP under `BSS006_CAPACITY_READ_GAP` and seek bounded amendment. The existing 006 leaf tickets remain planned and are not granted GO/CK by this clarification. [Decision ledger](../../../feedback/IDSER-SEMANTIC-PLANNER-HARD-STOP-20261016.md).
