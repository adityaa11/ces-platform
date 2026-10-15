# IDSER-012: Staged perception and provider-admitted semantic pipeline realignment

- **State:** `planned-semantic-remainder` (non-executable; local perception coverage complete)
- **Type:** non-executable umbrella
- **Review family:** `IDSER-BATCH-12`
- **Planning authority:** [Provider admission and staged semantic pipeline context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md), including §21 amendments


## Binding perception predecessor — 2026-10-15

**Prospective perception authority:** [PERC-RESET-008 CK PASS](../../../feedback/PERC-RESET-BATCH-08-9f31026-review.md), [CANONICAL-PERCEPTION-BASELINE-v1](../../../feedback/CANONICAL-PERCEPTION-BASELINE-v1.md), and [IDSER perception winner map](../../../feedback/IDSER-PERCEPTION-WINNER-AUTHORITY-MAP-20261015.md). This is a 2026-10-15 perception-only amendment; historical evidence/approved IDSER and BSS contracts are unchanged. The only currently qualified ordinary digital-PDF perception route is `docling-run-003-capture` / `atlas-digital-pdf-run-003-capture-v1`, which yields source-bound `NormalizedDocument v1` and verified derived assets where captured, then stops at durable `perceived`. A valid zero-visual digital PDF follows this same route. No Mistral OCR or image-disabled Docling route, qualification-only selector, or automatic fallback is an allowed future canonical staged-perception option. Scanned/OCR-only PDFs and visual semantic interpretation remain unsupported without separate qualification.

The `IDSER-012-01` sequence remains the approved local staged-admission and evidence-ownership implementation, and PERC-RESET-008 is its **current normal-route and regression winner**. Do not treat the RUN-003 choice as configurable between old/new pipelines, automatically fall back to image-disabled Docling, or make D2/D3 local perception wait on D1 semantic reconciliation. Perception success terminates at `perceived`; semantic provider work and any downstream stage require their **separate** explicit authority. The current semantic successor and its unresolved acceptance/lifecycle questions are tracked in [the semantic winner map](../../../feedback/IDSER-SEMANTIC-SUCCESSOR-AUTHORITY-MAP-20261015.md), not resolved by this perception-only edit.

## Implementation-worthiness disposition (2026-10-15)

PERC-RESET-008 and approved IDSER-012-01 children close normal perception through `perceived`. Retired IDSER-011 child batches are no longer upstream gates. The four `IDSER-012-02-01..04` semantic children remain planned, legitimately unfinished, and blocked from GO pending their semantic-successor contract realignment; this umbrella is not an implementation ticket. See [the disposition register](../../../feedback/IDSER-PERCEPTION-TICKET-DISPOSITION-20261015.md).

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
IDSER-012-01-01 -> IDSER-012-01-02 -> IDSER-012-01-03-01 -> IDSER-012-01-03-02

BSS-V2-005-01 -> -02 -> -03 -> -04
BSS-V2-006-01 -> -02 -> -03 -> -04

BSS-V2-004-03-04 -> -05
IDSER-012-01-03-02 + BSS-V2-006-04 + 004-03-05
  -> IDSER-012-02-01
  -> IDSER-012-02-02
  -> BSS-V2-004-03-06 qualification PASS
  -> IDSER-012-02-03
  -> IDSER-012-02-04
  -> semantic_ready
  -> STOP
```

`-03-01` is profile/mapping qualification only and may not activate image-enabled normal staging before `-03-02` qualifies durable asset acceptance. `-02-01` must preserve truthful accounting for uninterpreted visuals without premature comprehension or `non_fact` status.

No reconciliation implementation belongs here. Planning is not GO.
