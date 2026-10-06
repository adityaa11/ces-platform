# DOCSPIKE-001 CK verification

- **Ticket:** DOCSPIKE-001
- **Batch:** DOCSPIKE-BATCH-01
- **Ticket state:** `awaiting_review`
- **Reviewed remediation commit:** `2ca2c185fb75b7bd4aa0c3e637b31f4529b148a3`
- **Original implementation commit:** `b1f31d32954eb275a54105f293a115bd3684187a`
- **CFC checkpoint:** [DOCSPIKE-BATCH-01-cfc-checkpoint.md](DOCSPIKE-BATCH-01-cfc-checkpoint.md)
- **Original CK artifact:** [DOCSPIKE-BATCH-01-b1f31d3-review.md](DOCSPIKE-BATCH-01-b1f31d3-review.md)
- **Review type:** Bounded post-CFC verification
- **Result:** `PASS`

## Frozen clause verification

| Original clause | Outcome | Frozen oracle evidence |
| --- | --- | --- |
| CK-001.a | **RESOLVED** | The report [DOCSPIKE-001-docling-perception-feasibility.md](DOCSPIKE-001-docling-perception-feasibility.md) records process CPU times for all four completed extractions and identifies Python `time.process_time()` as the method, its process scope, and its limits. The local `metrics.json` records `processCpuTimeMs` and the same method/limitations; `summary.json` includes the three required document metrics. The generated evidence records 60,843.750 ms (Safara Full run 1), 40,203.125 ms (Finance), 31,390.625 ms (Readiness), and 27,265.625 ms (Safara Full run 2). This satisfies the original binary oracle for a measured basic resource observation with a stated method and no unsupported precision claim. |

The original first-review rows RC-DOCSPIKE-001-01 through RC-DOCSPIKE-001-05 remain `PROVEN` as recorded. RC-DOCSPIKE-001-06 is now proven by resolution of CK-001.a. No historical finding or oracle was changed.

## Remediation and direct regression boundary

The remediation diff adds `time.process_time()` measurement to `scripts/docling-spike/extract.py` and reports it in the existing feasibility report. It does not change provider mapping or Atlas normalization. The generated `summary.json` reports identical canonical provider and normalized hashes for the two primary runs. The CFC checkpoint records successful full experiment/normalization, 17 passing directly affected core tests, Python syntax validation, and `git diff --check`. Those are recorded evidence; I did not rerun them during this bounded verification.

No direct regression in the authorized boundary was identified. No new finding or scope-change observation is added.

## Decision

`PASS`. The sole original frozen clause is resolved, the original proven clauses remain proven, and no direct remediation regression remains. This is verification of the original bounded CK review, not a new broad review or provider-integration authorization.
