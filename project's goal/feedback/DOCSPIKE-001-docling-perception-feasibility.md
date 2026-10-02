# DOCSPIKE-001: Docling perception feasibility

DOCSPIKE-001 RESULT: PASS_WITH_LIMITS

Docling version: 2.132.0
Python version: 3.13.16
Execution mode: local Python installation, CPU-first
External inference calls: none
NormalizedDocument v1 changed: no
Production routes changed: no

## Scope and method

The spike processed only the three repository-owned PDFs with Docling's local PDF pipeline. The frozen inputs are digital PDFs, so the baseline set `do_ocr=false`; no OCR comparison was justified by this completed digital baseline. An initial default-pipeline setup downloaded local RapidOCR 3.9.2 model files, but the recorded baseline did not invoke OCR and no PDF bytes were sent to an external processor.

`scripts/docling-spike/extract.py` writes lossless Docling JSON, optional Markdown, the provider-shaped result, metrics, and normalized JSON only under ignored `.atlas-data/docling-spike/`. It maps Docling text and tables in Docling iteration order, generates page/order/type/content-hash IDs, converts only proven bottom-left geometry to Atlas top-left geometry, and emits no confidence values. Visual regions are omitted: one Docling picture bounding box varied across equivalent runs, and v1 permits their honest omission rather than fabricating or masking variability.

## Evaluation matrix

| Capability | Safara Full | Finance PRD | Readiness PRD | Notes |
| --- | --- | --- | --- | --- |
| PDF opens successfully | PASS | PASS | PASS | All reached terminal local extraction status. |
| Page count preserved | PASS (7) | PASS (2) | PASS (2) | Provider and normalized outputs retained every Docling page. |
| Major text preserved | PASS (12,383 normalized chars) | PASS (4,242) | PASS (6,261) | 220 / 68 / 88 mapped text blocks respectively. |
| Heading/section structure usable | PASS | PASS | PASS | 24 / 12 / 13 header-like blocks respectively. |
| Reading order usable | PASS | PASS | PASS | Mapper retains Docling page and text-item iteration order; it performs no coordinate or lexical sorting. |
| Tables usable | NA | PASS (3) | PASS (1) | Safara Full emitted no Docling tables; Finance and Readiness tables use Docling Markdown. |
| Bounding boxes safely usable | PASS | PASS | PASS | 220 / 68 / 88 text boxes retained only after validated bottom-left to top-left conversion within page dimensions. |
| `NormalizedDocument v1` validation | PASS | PASS | PASS | Real `normalizePerceptionResult(...)` and `parseNormalizedDocument(...)` completed for each. |
| Repeated Atlas-facing output deterministic | PASS | NA | NA | Safara canonical provider and normalized hashes match across runs. |
| No external inference call | PASS | PASS | PASS | Local Docling pipeline only. |

## Primary Safara evidence

Historical `worker1` comparison:

| Observation | Historical worker1 | Docling spike |
| --- | ---: | ---: |
| Pages | 7 | 7 |
| Normalized characters | 12,540 | 12,383 |
| Source units / mapped text blocks | 383 | 220 |
| Known major headings | 9 | 9 / 9 |
| Tables | not a gate | 0 |
| Mapped visual regions | not a gate | 0 (intentional omission) |

All required source-worded headings are discoverable without hardcoded parsing: Paket dan Jadwal Keberangkatan; Data Jemaah; Pendaftaran Jemaah; Tagihan dan Pembayaran; Dokumen Jemaah; Status Perjalanan dan Kesiapan; Manifest Keberangkatan; Dashboard dan Laporan; and Riwayat Aktivitas. The lower block count is structurally coarser than the historical line-level extraction and is not treated as a loss. The primary output has 220 blocks distributed 27, 30, 35, 37, 34, 31, and 26 across pages 1–7; all are retained in Docling order.

## Determinism and performance

Two equivalent Safara runs produced identical canonical artifacts:

| Artifact | SHA-256 |
| --- | --- |
| Provider-shaped result, run 1 and run 2 | `920d689d548e6192bf4228736a8af36edbe3c90806e2e87d5c6f2832376b631e` |
| Normalized structural output, run 1 and run 2 | `77eca1b2c8a86009b420948b3e70dba17440dbcef46a45818beac92d05cb20ad` |

Measured local extraction latency was 27,602 ms for Safara Full run 1, 20,997 ms for Finance, 18,412 ms for Readiness, and 28,206 ms for Safara Full run 2. Raw Docling diagnostic JSON and Markdown remain local and ignored.

## Limits and conclusion

The digital-PDF core path is Atlas-valid, source-grounded, local, and deterministic. This is `PASS_WITH_LIMITS`, not a production authorization, because the spike deliberately omits visual regions after identifying unstable picture geometry, does not emit confidence values, and does not establish scanned-PDF/OCR behavior. Those limits do not affect the demonstrated text/heading/table path or future bounded semantic scoping, but visual/OCR requirements need separate evidence.

Recommendation: **C. Proceed only after a bounded OCR/table/geometry follow-up spike.** A future `DocumentPerceptionProvider` integration remains a separately authored and explicitly authorized plan. BSS-V2-004 remains independently blocked; this result neither changes it nor activates a provider route.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- |
| RC-DOCSPIKE-001-01 | Frozen ticket review contract row 01: all three local Docling extractions, lossless local diagnostics, metrics, no external call. | `.atlas-data/docling-spike/*/run-1/{docling.raw.json,metrics.json}` (ignored); `scripts/docling-spike/run-all.ps1` completed all three terminal runs. | PROVEN |
| RC-DOCSPIKE-001-02 | Row 02: deterministic source-grounded provider shape, actual order, no invented optional fields. | `scripts/docling-spike/extract.py`; identical primary canonical provider hash above; visual/confidence omissions documented. | PROVEN |
| RC-DOCSPIKE-001-03 | Row 03: real current Atlas normalization and v1 validation for every input. | `scripts/docling-spike/normalize.mts`; run-all output records three successful `normalizePerceptionResult(...)` results. | PROVEN |
| RC-DOCSPIKE-001-04 | Row 04: 7 primary pages, 9 known headings, usable major-text order, honest loss/duplication observations. | Matrix and Primary Safara evidence above; ignored normalized output has 220 page-ordered blocks and all 9 headings. | PROVEN |
| RC-DOCSPIKE-001-05 | Row 05: two equivalent primary outputs compare page/block/table order, IDs, text, emitted geometry, and normalized structure. | `scripts/docling-spike/summarize.py`; matching provider and normalized hashes above. | PROVEN |
| RC-DOCSPIKE-001-06 | Row 06: truthful matrix, historical comparison, classification, limits, and A/B/C recommendation. | This report. | PROVEN |

Validation executed: `scripts/docling-spike/run-all.ps1` (success); `pnpm --filter @atlas/core test` (17 passing tests); `git diff --check` (success).

Internal readiness: READY_FOR_CK
