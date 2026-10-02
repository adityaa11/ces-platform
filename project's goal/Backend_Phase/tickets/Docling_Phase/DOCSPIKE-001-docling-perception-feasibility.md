# DOCSPIKE-001: Docling perception feasibility

- **State:** `awaiting_review`
- **Review batch:** `DOCSPIKE-BATCH-01`
- **Dependencies:** existing BSS-009/BSS-009-01/BSS-009-02 perception contracts and current `normalizePerceptionResult(...)`; no BSS-V2 dependency or activation gate
- **Primary source:** [Docling perception feasibility spike implementation context](../../atlas-docling-perception-feasibility-spike-implementation-context.md), especially sections 1-25
- **Existing seams:** `apps/agents-bridge/src/provider-capabilities.ts`, `apps/agents-bridge/src/document-perception-worker.ts`, `packages/atlas-core/src/document-perception.ts`, and `packages/atlas-contracts/src/perception.ts`

## Outcome

Run one local, reproducible feasibility experiment that answers whether Docling can map repository-owned PRD PDFs into the current generic provider-result shape and pass the unchanged Atlas `NormalizedDocument v1` normalization path deterministically.

```text
required repository PDF
        |
        v
local Docling normal PDF pipeline
        |
        v
lossless diagnostic JSON + deterministic mapper
        |
        v
existing normalizePerceptionResult(...)
        |
        v
unchanged NormalizedDocument v1 + feasibility report
```

The result is evidence for a future planning decision only. It does not make Docling a production provider and does not claim to resolve Gemini structured extraction or reconciliation.

## Frozen scope

### In scope

- Create a reproducible isolated Python setup and spike implementation, preferably under `scripts/docling-spike/`, without contaminating production Node or root pnpm dependencies.
- Record Python, resolved Docling, relevant local runtime/model dependencies, and setup-time model downloads.
- Process these required repository-owned digital PDFs locally: `project's goal/Safara_Buyer_Business_PRD.pdf`, `docs/example/Safara_PRD_02_Finance_Documents.pdf`, and `docs/example/Safara_PRD_03_Readiness_Manifest_Reporting.pdf`.
- Persist local-only lossless Docling JSON, optional inspection Markdown, provider-shaped mapped JSON, normalized document JSON, and metrics under ignored `.atlas-data/docling-spike/`.
- Map actual Docling pages, ordered text items, tables, and source-grounded visual regions into the existing generic provider-result shape with stable deterministic IDs.
- Invoke the real Atlas `normalizePerceptionResult(...)` and its real `parseNormalizedDocument(...)` validation for every required digital PDF; do not replace it with a Python clone.
- Run the primary Safara PDF at least twice with the same version/configuration and compare canonical Atlas-facing provider output and normalized structural hash.
- Inspect source structure, reading order, heading preservation, table recovery, provenance, dimensions, geometry, confidence, latency, and basic resource observations.
- Run an OCR/Tesseract comparison only after baseline completion and only when a demonstrated scanned-PDF gap makes it useful. A synthetic image PDF is permitted only if no suitable non-confidential repository fixture exists.
- Produce the summarized report at `project's goal/feedback/DOCSPIKE-001-docling-perception-feasibility.md` with the required evaluation matrix, historical comparison, terminal classification, limitations, and one next-planning recommendation.

### Explicitly excluded

- Changing `NormalizedDocument v1`, `DocumentPerceptionProvider`, perception authority, semantic/reconciliation schemas, semantic chunking, workers, fencing, replay, or idempotency behavior.
- Activating/replacing production Gemini or Mistral perception; adding provider configuration, a public HTTP endpoint, a permanent Docling service, or Docling to production Compose/root dependencies.
- Calling Gemini, Mistral, a remote LLM, or a hosted document processor; sending source material outside the local execution environment.
- Changing BSS-V2-004 state, evidence, acceptance, or its independently blocked structured-output routes.
- Creating semantics, candidate truth, review decisions, a second canonical source store, customer-facing behavior, or a general OCR integration.

## Required mapping rules

- Preserve Docling-resolved page and reading order. Never sort away meaningful order; document a deterministic fallback only if Docling order is unavailable.
- Derive text/table IDs from stable page number, reading-order position, and item type, adding a content hash only for collision resistance. Random UUIDs are prohibited.
- Map only source-supported structural labels (for example heading, title, paragraph, list item); do not emit semantic labels such as `module`, `workflow_step`, `rule`, or `decision`.
- Map dimensions, bounding boxes, confidence, pictures, and `assetRef` only when actually trustworthy. Verify coordinate origin/units and top-left conversion against dimensions; omit ambiguous geometry. Never fabricate fields.
- Preserve tables separately with deterministic IDs and deterministic structural text such as Markdown where Docling supports it. Do not duplicate a table as text and a table unless the existing normalizer requires it.
- Keep raw Docling JSON diagnostic-only. The mapped provider result and current Atlas normalizer are the Atlas-facing proof.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression / guard |
| --- | --- | --- | --- |
| RC-DOCSPIKE-001-01 | Each required digital PDF is processed with Docling's normal local PDF pipeline and produces local lossless diagnostic output plus metrics. | Record per-document page/text/table/picture/header-like/provenance/geometry counts, normalized-character count, latency, setup/runtime versions, and no external call. **PASS iff** all three runs reach recorded terminal extraction status. | No remote processor or production dependency addition. |
| RC-DOCSPIKE-001-02 | The mapper produces a deterministic generic provider-shaped result that preserves actual source page and reading order and invents no optional data. | Inspect stable IDs/order/content/tables; document geometry and confidence omissions or conversions; canonicalize only dynamic execution metadata. **PASS iff** all emitted fields are source-grounded and mapper behavior is repeatable. | Existing provider-neutral perception contract remains the sole boundary. |
| RC-DOCSPIKE-001-03 | Each mapped required PDF passes the real current Atlas normalization and `NormalizedDocument v1` validation. | Execute the existing `normalizePerceptionResult(...)` path and retain local normalized JSON plus command/test evidence. **PASS iff** no Python reimplementation or contract relaxation is used. | `NormalizedDocument v1` unchanged. |
| RC-DOCSPIKE-001-04 | The primary Safara benchmark preserves all seven pages and discovers all nine known source headings with usable major-text reading order. | Report heading evidence for Paket dan Jadwal Keberangkatan, Data Jemaah, Pendaftaran Jemaah, Tagihan dan Pembayaran, Dokumen Jemaah, Status Perjalanan dan Kesiapan, Manifest Keberangkatan, Dashboard dan Laporan, and Riwayat Aktivitas. **PASS iff** all are discoverable without hardcoded parsing rules and material loss/duplication is honestly recorded. | Historical `worker1` figures are comparison-only, never production parsing rules. |
| RC-DOCSPIKE-001-05 | The primary Safara Atlas-facing output is deterministic across at least two equivalent runs. | Compare page/block/table order, IDs, text, emitted geometry, and normalized structural hash after canonical serialization. **PASS iff** material output is identical; raw Docling metadata instability is separately disclosed. | No sorting that masks reading-order changes. |
| RC-DOCSPIKE-001-06 | The final report classifies feasibility truthfully and records all required matrix observations and limits. | Report follows context section 24, includes `PASS`/`PASS_WITH_LIMITS`/`FAIL`, worker1 comparison (7 pages, 12,540 characters, 383 units, 9 headings), structural-basis assessment, and recommendation A/B/C. **PASS iff** classification matches evidence and no limitation is disguised as a pass. | Does not mark BSS-V2-004 PASS or authorize a provider migration. |

## Safara and capability acceptance

Use the required matrix in the report, preserving `PASS`, `FAIL`, or `NA` honestly for each document: PDF opens; page count; major text; usable heading/section structure; usable reading order; tables; safely usable bounding boxes; `NormalizedDocument v1` validation; primary repeatability; and no external inference call.

For the primary document, compare observed Docling values against historical `worker1`: seven pages, 12,540 normalized characters, 383 line-level source units, and nine known headings. Exact reproduction of 383 units is neither required nor desirable if Docling yields fewer, structurally superior blocks; explain the difference.

Classify as `PASS` only when the primary Safara PDF succeeds, represents all pages/headings, preserves usable major text and reading order, validates through the unchanged normalizer, is deterministic, fabricates no fields, and remains local. Use `PASS_WITH_LIMITS` only for an Atlas-valid core digital path with explicit, non-blocking limits. Use `FAIL` for material missing sections/pages, unusable order, impossible Atlas validation without invention, material nondeterminism, remote processing dependence, or a requirement to weaken authority.

## Security and authority readiness

**Status:** `applicable`.

- **Boundary:** `BOUNDARY-DOCSPIKE-001-SOURCE` — Docling receives only local source bytes for perception; diagnostic artifacts remain local/ignored and are not a second canonical store.
- **Boundary:** `BOUNDARY-DOCSPIKE-001-AUTHORITY` — Docling may supply source-grounded perception observations only; Atlas remains the normalization and document-contract authority.
- **Boundary:** `BOUNDARY-DOCSPIKE-001-SECRETS` — the spike receives no DB, user-authentication, Gemini/Mistral, workspace-truth, review, or publication credentials.
- **Prohibited coupling:** `COUPLING-DOCSPIKE-001-PRODUCTION-ACTIVATION` — a successful experiment cannot change route selection, Compose service topology, or production provider configuration.
- **Prohibited coupling:** `COUPLING-DOCSPIKE-001-SEMANTIC-INTERPRETATION` — mapper structure cannot become business semantics, candidates, or decisions.
- **Review bindings:** verify source never leaves local processing; inspect ignored-artifact handling; verify actual Atlas normalization; ensure no altered production contracts/routes/dependencies; and ensure no secrets or raw source content are committed to evidence.

If execution needs a changed contract, permanent/public service, external processing, production routing, weakened validation, semantic interpretation, or a second canonical source store, stop as `SCOPE_CHANGE` and request human/planning authority.

## Validation and handoff

Run the full experiment to terminal state, not merely installation or first-page parsing. At minimum record all required digital Docling extractions, all required Atlas-normalization results, primary Safara repeated-run determinism comparison, directly affected atlas-core perception tests, and `git diff --check`.

Run Docker only if the existing Atlas test convention requires it for directly affected TypeScript checks; Docling itself should use the isolated local environment unless a spike-only container is necessary. Never use `docker compose down --volumes`.

Before handoff, commit reproducible spike implementation and the summarized report only. Do not commit raw document exports by default. The report must state: Docling/Python versions, local-venv or spike-container mode, `External inference calls: none`, `NormalizedDocument v1 changed: no`, `Production routes changed: no`, the evaluation matrix, mapping and geometry/confidence decisions, determinism evidence, optional OCR evidence, performance observations, explicit limitations, and recommendation A/B/C.

## Review checkpoint

- **Review question:** Does the recorded complete local experiment demonstrate, without changing Atlas authority, whether Docling is a deterministic and Atlas-valid perception input for the required PRD shapes?
- **Downstream boundary:** A `PASS` or `PASS_WITH_LIMITS` supports only a separately authored, explicitly authorized provider-integration or bounded follow-up spike plan. It never authorizes implementation of that plan.
- **BSS-V2 guard:** Regardless of result, BSS-V2-004 structured extraction/reconciliation remains independently blocked until its own evidence and acceptance are resolved.
