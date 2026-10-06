# DOCSPIKE-001 CK review

- **Ticket:** DOCSPIKE-001
- **Batch:** DOCSPIKE-BATCH-01
- **Ticket state:** `awaiting_review`
- **Reviewed commit:** `b1f31d32954eb275a54105f293a115bd3684187a`
- **Frozen ticket:** [DOCSPIKE-001-docling-perception-feasibility.md](../Backend_Phase/tickets/Docling_Phase/DOCSPIKE-001-docling-perception-feasibility.md)
- **Review type:** First review
- **Result:** `CHANGES_REQUIRED`

## Review Contract

| Row | Ticket authority | Required proof | Evidence and status |
| --- | --- | --- | --- |
| RC-DOCSPIKE-001-01 | Frozen ticket, In Scope: required PDFs, local diagnostics/metrics, versions and downloads; Review Contract row 01 | Three terminal local extractions with recorded metrics and no external calls | All four extraction runs are present under ignored `.atlas-data/docling-spike/`; metrics record success, versions, counts, latencies, and no external inference. **PROVEN** |
| RC-DOCSPIKE-001-02 | Frozen ticket, Required mapping rules; Review Contract row 02 | Source-grounded deterministic provider shape preserving Docling order and omitting untrustworthy optional fields | `scripts/docling-spike/extract.py`; matching canonical provider hashes; documented picture/confidence omissions. **PROVEN** |
| RC-DOCSPIKE-001-03 | Frozen ticket, In Scope; Review Contract row 03 | Real Atlas normalization and `NormalizedDocument v1` validation for each required PDF | `scripts/docling-spike/normalize.mts`; recorded outputs and successful run-all normalization invocations. **PROVEN** |
| RC-DOCSPIKE-001-04 | Frozen ticket, Safara and capability acceptance; Review Contract row 04 | Seven pages, nine headings, usable major-text order and honest loss/duplication observations | Report matrix and primary comparison; ignored summary confirms all headings. **PROVEN** |
| RC-DOCSPIKE-001-05 | Frozen ticket, In Scope; Review Contract row 05 | Repeat primary output and compare Atlas-facing structure | `summary.json` records matching provider and normalized hashes. **PROVEN** |
| RC-DOCSPIKE-001-06 | Frozen ticket, Report and Validation/Handoff; Review Contract row 06 | Complete truthful report including performance and basic resource observations, matrix, historical comparison, limits, and recommendation | Report contains matrix, historical comparison, latency, limitations, recommendation and terminal classification, but neither the report nor `metrics.json`/`summary.json` records a basic resource observation such as CPU or memory use. **UNRESOLVED (CK-001.a)** |

Evidence inspected: the frozen ticket and cited implementation context; committed spike scripts and report; ignored `metrics.json`, `summary.json`, `run-all.out`, and `run-all.err`; commit contents; and `git diff --check b1f31d3^ b1f31d3` (clean). I did not rerun the experiment or test suite. The unrelated dirty worktree paths do not overlap this checkpoint and do not make the committed review target ambiguous.

## Frozen Finding Closure Matrix

### CK-001 — Basic resource observation is absent

**Ticket authority:** DOCSPIKE-001 Frozen scope, “Inspect source structure, reading order, heading preservation, table recovery, provenance, dimensions, geometry, confidence, latency, and basic resource observations”; Review Contract rows 01 and 06 require the resulting metrics/report evidence.

**Unsatisfied evidence:** The committed report [DOCSPIKE-001-docling-perception-feasibility.md](DOCSPIKE-001-docling-perception-feasibility.md) provides extraction latency but no basic resource observation. The ignored per-run `metrics.json` files and generated `summary.json` likewise contain no CPU or memory observation. The report's completeness claim therefore does not satisfy this explicit ticket obligation.

#### CK-001.a

- **Authority:** The frozen scope requires inspection and reporting of basic resource observations for the local experiment.
- **Unsatisfied evidence:** No resource observation is recorded in the summarized report or generated metrics for the three required PDFs.
- **Observable correction:** Add a basic, clearly qualified resource observation from the completed local runs to the report and reproducible metrics (for example, process peak memory or CPU time), or document a concrete observed resource measure already captured by the experiment. Do not imply precision or comparability that the measurement does not support.
- **Binary closure oracle:** **Resolved** iff the committed report records at least one measured basic resource observation tied to the local Docling runs and its measurement method, with corresponding evidence in the generated metrics or a reproducible run log; otherwise **unresolved**. Evidence location: the report's performance section plus `.atlas-data/docling-spike/summary.json` or per-run `metrics.json`. Direct-regression boundary: only regressions in the ticket's local-only processing, Atlas normalization, and repeated primary determinism behavior necessary to add/assess this observation.

## Decision

`CHANGES_REQUIRED`. CK-001.a is the sole implementation/evidence-repairable ticket-bound deficiency identified. No scope-change observation is required. The existing `PASS_WITH_LIMITS` classification is not accepted until the frozen closure oracle is met. Control returns to human/planning authority for the next workflow decision.
