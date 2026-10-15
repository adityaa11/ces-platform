# IDSER-012-02: Provider-admitted multi-batch semantic extraction to semantic_ready

- **State:** `planned`
- **Type:** non-executable umbrella
- **Dependencies:** IDSER-012-01-03-02 CK `PASS`; all BSS-V2-005/006 children CK `PASS`; BSS-V2-004-03-04/05 CK `PASS`
- **Parent:** [IDSER-012](IDSER-012-staged-worker-pipeline-realignment.md)
- **Planning authority:** [Provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §§21.5-21.7


## Frozen perception input and non-authority — 2026-10-15

**Prospective perception authority:** [PERC-RESET-008 CK PASS](../../../feedback/PERC-RESET-BATCH-08-9f31026-review.md), [CANONICAL-PERCEPTION-BASELINE-v1](../../../feedback/CANONICAL-PERCEPTION-BASELINE-v1.md), and [IDSER perception winner map](../../../feedback/IDSER-PERCEPTION-WINNER-AUTHORITY-MAP-20261015.md). This is a 2026-10-15 perception-only amendment; historical evidence/approved IDSER and BSS contracts are unchanged. The only currently qualified ordinary digital-PDF perception route is `docling-run-003-capture` / `atlas-digital-pdf-run-003-capture-v1`, which yields source-bound `NormalizedDocument v1` and verified derived assets where captured, then stops at durable `perceived`. A valid zero-visual digital PDF follows this same route. No Mistral OCR or image-disabled Docling route, qualification-only selector, or automatic fallback is an allowed future canonical staged-perception option. Scanned/OCR-only PDFs and visual semantic interpretation remain unsupported without separate qualification.

The only qualified staged semantic input is the accepted `NormalizedDocument v1` and source-scoped, Atlas-authorized derived-asset references produced by the PERC-RESET-008 normal RUN-003 baseline and approved IDSER-012-01 implementation. A visual `assetRef` proves **evidence retention**, not semantic understanding. Batching may not re-run original perception through Mistral OCR, a second Docling profile, legacy qualification overlays, or silently create/recursively admit derived assets. Exact text/table/zero-visual and captured-visual fixture cases remain mandatory; missing/foreign/tampered asset manifests fail closed. Provider request batching/qualified partial-deferred aggregation and BSS-V2-005/006 integration are **separately pending** under the semantic winner map; this amendment does not grant GO for any `IDSER-012-02` child.

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
