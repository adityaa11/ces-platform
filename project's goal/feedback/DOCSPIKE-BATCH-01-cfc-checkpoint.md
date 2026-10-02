# CFC Checkpoint — DOCSPIKE-BATCH-01 — CK-001.a

- Ticket: `DOCSPIKE-001` — [frozen ticket](../Backend_Phase/tickets/Docling_Phase/DOCSPIKE-001-docling-perception-feasibility.md)
- Batch: `DOCSPIKE-BATCH-01`
- Original CK artifact: [b1f31d3 review](DOCSPIKE-BATCH-01-b1f31d3-review.md)
- Reviewed implementation checkpoint: `b1f31d32954eb275a54105f293a115bd3684187a`
- Remediation base: `b1f31d32954eb275a54105f293a115bd3684187a`
- Authorized scope: the original frozen clause CK-001.a only. Its ticket trace, closure oracle, and direct-regression boundary remain defined by the cited CK artifact.

## Closure evidence

| Clause | Status | Evidence and exact validation | Frozen oracle |
| --- | --- | --- | --- |
| CK-001.a | PROVEN | `scripts/docling-spike/extract.py` records `processCpuTimeMs` and a `resourceMeasurement` describing Python `time.process_time()` around `converter.convert(...)`. `scripts/docling-spike/run-all.ps1` — **success**: generated `.atlas-data/docling-spike/summary.json` and all four per-run `metrics.json` files, each with the qualified resource measure. Observed CPU times: Safara Full run 1 60,843.750 ms; Finance 40,203.125 ms; Readiness 31,390.625 ms; Safara Full run 2 27,265.625 ms. `project's goal/feedback/DOCSPIKE-001-docling-perception-feasibility.md` records the measure, method, values, and limitations. | PASS — report and reproducible local metrics contain a measured basic resource observation tied to the completed Docling runs, with a method that does not overclaim precision or comparability. |

## Direct regressions checked

- Frozen local-only processing and Atlas normalization: `scripts/docling-spike/run-all.ps1` — **passed**; all three required PDFs extracted and normalized, and the repeat primary run completed.
- Frozen primary determinism: generated `summary.json` reports `primaryDeterminism.identical: true`, with unchanged matching provider and normalized structural hashes.
- Directly affected Atlas perception tests: `pnpm --filter @atlas/core test` — **17 passed, 0 failed**.
- Python syntax: `C:\Users\ASUS\AppData\Local\Programs\Python\Python313\python.exe -m py_compile scripts/docling-spike/extract.py` — **passed**.
- `git diff --check` — **passed** (only Git line-ending notices for unrelated existing workspace changes).

The original review's RC-DOCSPIKE-001-01 through RC-DOCSPIKE-001-05 rows remain `PROVEN`. RC-DOCSPIKE-001-06 is proven only by the frozen CK-001.a correction above; no ticket scope or production boundary changed.

Internal readiness: READY_FOR_CK

- Checkpoint state: `awaiting_review`
- Ticket state: `awaiting_review`
- CFC result: complete bounded remediation; ready for CK verification.
