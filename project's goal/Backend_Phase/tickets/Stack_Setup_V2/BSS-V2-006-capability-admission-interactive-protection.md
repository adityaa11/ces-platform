# BSS-V2-006: Durable fair external-provider runtime admission authority

- **State:** `planned`
- **Type:** non-executable umbrella
- **Dependencies (staged, non-cyclic):** BSS-V2-006-01/02 consume approved BSS-V2-005-04 CK `PASS` plus BSS-006 and BSS-V2-001/002; **BSS-V2-006-04** additionally requires BSS-V2-005-05 CK `PASS` and every BSS-V2-006-03A-01..06 CK `PASS`. No 006-01/02 predecessor may require -005-05 CK.
- **Planning authority:** [Provider admission and staged semantic pipeline context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md), including §21 amendments

## Outcome

Provide one reusable Bridge-owned durable authority for external-provider work admission across semantic extraction, reconciliation, CES, chat and future capabilities. Enforce DesiredAdmissionProfile plus exact quota-window semantics, live reservations/provider pressure, hard interactive protection and epoch-safe background fairness before network transmission while preserving pg-boss as the only broker.

One reservation authorizes at most one outbound provider attempt. Provider retries must be explicit new attempts/reservations.

## Children

```text
BSS-V2-006-01 durable provider work + reservation/window/attempt foundation
BSS-V2-006-02 fair admission + hard interactive protection + atomic single-attempt dispatch
BSS-V2-006-03 WITHDRAWN; 03A parent is traceability-only, with 03A-01 through 03A-06 as connected, individually GO/CK-gated replacements
BSS-V2-006-04 integrated deterministic runtime checkpoint
```

Local Docling continues to use its separate local-capacity seam. Each child is a separate GO/CK target and requires predecessor CK `PASS`.

## Prospective process-agnostic runtime clarification (2026-10-16)

The planned 006-01/02/04 runtime is a **generic process/workload consumer**, not a semantic-specific quota manager. Registered, qualified process kinds from BSS-V2-005-05 compete by configured service class, profile, quota domain, fairness key, resource demand and active plan—not by hard-coded `semantic`, `chat` or `CES` switches. Dynamically adapt admission to actually queued eligible work through existing weighted dominant-resource borrowing/fairness, clamps, windows, restart/replay and wakeups. The hard interactive reserve remains non-lendable to background, including when no interactive work is queued. An authorized active-profile change converges to the new immutable BSS-V2-005 desired plan; an ordinary transient backlog or remaining-token change does not require plan republishing. The withdrawn 006-03 scope is not authority for any of these planned children.

The Semantic Batch Planner requires a **read-only, versioned enforceable-capacity/eligibility constraint seam** as a distinct future proof obligation; it must never manipulate BSS runtime window counters or reserve provider slots just to size corpus. If 006 cannot expose this in its owned planned scope, STOP under `BSS006_CAPACITY_READ_GAP` and seek bounded amendment. BSS-V2-006-01/02/04 remain planned and are not granted GO/CK by this clarification; BSS-V2-006-03 remains withdrawn; 03A is a traceability parent and 03A-01..06 each require their own GO and independent CK. [Decision ledger](../../../feedback/IDSER-SEMANTIC-PLANNER-HARD-STOP-20261016.md).

## Consumer-facing hard stop qualification (2026-10-16 prospective)

[Two distinct generic consumer contracts](../../bss-provider-consumer-contract-checkpoint-20261016.md) are mandatory for integrated BSS-V2-006-04: (1) versioned **read-only** effective eligibility/pressure snapshot, with zero reservations; (2) work/attempt admission/feedback API with one atomic BSS reservation per outbound transport. They must be demonstrated through independent synthetic background and interactive consumers, not inspection of internal schedulers alone. BSS-V2-006-01/02 depend only on the already approved BSS-V2-005-04 active plan; BSS-V2-005-05 and BSS-V2-006-04 require every BSS-V2-006-03A-01..06 CK PASS, plus the stated CK gates. This prevents circular approval and does not prematurely claim runtime implementation. Consumer failures in semantic meaning or chat UX stay outside BSS.
