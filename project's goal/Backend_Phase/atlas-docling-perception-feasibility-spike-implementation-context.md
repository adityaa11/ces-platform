# Atlas Docling Perception Feasibility Spike - Implementation Context

Status: Authorized experimental implementation context  
Scope type: Feasibility spike only; not a production provider migration  
Suggested spike ID: `DOCSPIKE-001`  
Repository: `adityaa11/ces-platform`  
Target branch: `codex/new-atlas-backend`  
Encoding: UTF-8, ASCII-safe Markdown where practical

---

## 1. Purpose

This spike exists to answer one bounded question:

> Can Docling process Atlas PRD PDFs locally and be mapped deterministically into the existing Atlas `NormalizedDocument v1` perception contract with sufficient source fidelity for later semantic extraction?

This is a perception experiment only.

It does **not** attempt to solve the current Gemini structured extraction/reconciliation incompatibility.

Current live evidence has already established:

```text
minimal Gemini inference           PASS
Gemini structured extraction       FAIL / invalid_request before generation
Gemini structured reconciliation   FAIL / invalid_request before generation
Gemini PDF perception              PASS
```

The Docling spike must therefore remain independent from the blocked structured-reasoning route.

Do not claim that Docling fixes Gemini structured output.

---

## 2. Current Atlas seams that must be preserved

The current provider-neutral perception boundary already exists.

Relevant contracts:

```text
DocumentPerceptionProvider
    |
    v
provider.perceive(...)
    |
    v
Bridge-owned provider result
    |
    v
normalizePerceptionResult(...)
    |
    v
NormalizedDocument v1
```

Relevant current files include:

```text
apps/agents-bridge/src/provider-capabilities.ts
apps/agents-bridge/src/document-perception-worker.ts
packages/atlas-core/src/document-perception.ts
packages/atlas-contracts/src/perception.ts
```

The spike must reuse these concepts rather than inventing a second Atlas document contract.

`NormalizedDocument v1` remains unchanged.

The current contract contains:

```text
pages[]
  number
  width?
  height?

  textBlocks[]
    id
    text
    kind?
    boundingBox?
    confidence?

  tables[]
    id
    content
    boundingBox?

  visualRegions[]
    id
    label?
    boundingBox?
    assetRef?
```

Optional fields remain optional.

No missing field may be fabricated merely to make Docling resemble Gemini or Mistral output.

---

## 3. Historical evidence that may be used as a benchmark

The `worker1` branch previously processed:

```text
project's goal/Safara_Buyer_Business_PRD.pdf
```

Historical diagnostic evidence recorded:

```text
7 pages
12,540 normalized characters
383 line-level source units
all nine expected major module headings present
```

The historical implementation also exposed weaknesses in overly fine line-level splitting and later moved toward reconstructed sections and bounded semantic scopes.

This evidence is a comparison baseline only.

Do not copy `worker1` implementation blindly and do not reintroduce its old semantic contracts.

For the full Safara document, the known source-worded major headings are:

```text
Paket dan Jadwal Keberangkatan
Data Jemaah
Pendaftaran Jemaah
Tagihan dan Pembayaran
Dokumen Jemaah
Status Perjalanan dan Kesiapan
Manifest Keberangkatan
Dashboard dan Laporan
Riwayat Aktivitas
```

These headings may be used to evaluate whether Docling preserved important source structure.

They must not become production hardcoded Atlas semantics.

---

## 4. Spike boundaries

### 4.1 In scope

The spike may:

- install Docling in an isolated Python environment;
- process repository-owned, non-confidential PDF fixtures;
- export raw Docling lossless JSON for local diagnostic use;
- inspect page structure, reading order, headings, text items, tables, pictures and provenance;
- create a temporary deterministic Docling-to-Atlas-provider-result mapper;
- feed that mapped provider result into the existing Atlas `normalizePerceptionResult(...)`;
- validate the resulting `NormalizedDocument v1`;
- measure deterministic repeatability of the mapped result;
- collect local processing latency and basic resource observations;
- create a bounded feasibility report;
- optionally test Docling's Tesseract OCR backend only after the baseline Docling test is complete and only if an OCR-specific gap is demonstrated.

### 4.2 Explicitly out of scope

The spike must not:

- activate Docling as a production Atlas route;
- modify the BSS-V2-004 ticket state;
- rewrite BSS-V2-004 evidence;
- begin BSS-V2-005;
- change `NormalizedDocument v1`;
- change `DocumentPerceptionProvider`;
- change semantic extraction or reconciliation schemas;
- add semantic chunking;
- redesign `semantic-worker`;
- change replay/fencing/idempotency behavior;
- replace Gemini perception in production;
- delete the existing Gemini or Mistral adapters;
- add customer-facing configuration;
- add a public Docling HTTP endpoint;
- create a permanent new service boundary before feasibility is proven;
- call Gemini, Mistral or another external inference provider as part of the Docling spike;
- send PRD contents to a remote LLM or hosted document processor.

This spike is not a provider migration ticket.

---

## 5. Environment strategy

Docling is a Python library and does not require Docker.

For this spike, prefer the smallest isolated environment that does not contaminate Atlas production dependencies.

Preferred order:

```text
1. isolated Python virtual environment for the spike
2. one-off spike-only container if dependency isolation requires it
```

Do not add Docling to the main Node runtime or root `pnpm` dependencies.

Do not add a permanent `docling` service to `docker-compose.yml` during this spike.

If a temporary container is used, it must remain clearly spike-only.

The initial test should be CPU-first.

GPU acceleration must not be required to prove basic feasibility.

Record:

```text
Python version
resolved Docling version
major local model/runtime dependencies
whether model files were downloaded during setup
```

Dependency/model downloads during setup are acceptable.

Document processing itself must remain local; no PRD content should be uploaded to an external inference service.

---

## 6. Suggested spike location

Keep the experiment isolated from production packages.

Suggested location:

```text
scripts/docling-spike/
```

A reasonable shape is:

```text
scripts/docling-spike/
  README.md
  extract.py
  map_docling.py
  requirements.txt or equivalent isolated dependency declaration
```

Use repository conventions if inspection finds a clearly better existing experimental location.

Generated document artifacts should not be committed by default.

Prefer an ignored/local path such as:

```text
.atlas-data/docling-spike/
```

Example generated structure:

```text
.atlas-data/docling-spike/
  safara-full/
    docling.raw.json
    docling.provider-result.json
    atlas.normalized-document.json
    metrics.json

  safara-finance/
    ...

  safara-readiness/
    ...
```

Only the summarized feasibility report and implementation needed to reproduce the spike should be committed unless human authority explicitly requests raw artifacts.

---

## 7. Required test documents

Run the baseline spike against these repository documents:

### Primary benchmark

```text
project's goal/Safara_Buyer_Business_PRD.pdf
```

This is the most important comparison document because historical `worker1` evidence exists.

### Additional document-shape coverage

Use at least:

```text
docs/example/Safara_PRD_02_Finance_Documents.pdf
docs/example/Safara_PRD_03_Readiness_Manifest_Reporting.pdf
```

The additional PDFs are intended to expose different structure/table/layout behavior.

Do not use these documents as hardcoded parsing rules.

### OCR-specific document

Do not block the baseline spike on a scanned PDF.

After baseline digital-PDF evaluation, inspect the repository for a suitable non-confidential scanned/image PDF.

If none exists, a tiny synthetic image-based PDF may be generated solely for OCR testing.

Do not create a synthetic OCR fixture unless the baseline Docling result makes OCR evaluation useful.

---

## 8. Stage A - Raw Docling extraction

Process each selected PDF with Docling using its normal PDF pipeline.

Persist locally:

```text
lossless Docling JSON
optional Markdown export for human inspection
processing metrics
```

The lossless Docling JSON is the diagnostic authority.

Markdown is only a convenience view.

Record at minimum:

```text
page count
text item count
table count
picture/visual count
section/header-like item count
normalized text character count
items with provenance
items with bounding boxes
elapsed processing time
```

For the full Safara benchmark, explicitly report:

```text
whether all 7 pages are represented
whether each of the nine known source headings is present
whether major paragraphs remain in usable reading order
whether duplicated or missing text is observed
whether tables are structurally recoverable
```

Do not interpret business meaning during this stage.

---

## 9. Stage B - Deterministic Docling-to-provider-result mapping

Do not map Docling directly into a new Atlas contract.

Instead, adapt Docling into the existing generic provider-result shape consumed by:

```text
normalizePerceptionResult(...)
```

Target conceptually:

```json
{
  "pages": [
    {
      "page_number": 1,
      "dimensions": {
        "width": 0,
        "height": 0
      },
      "blocks": [],
      "tables": [],
      "images": []
    }
  ]
}
```

Actual optional fields must be omitted when not trustworthy.

### 9.1 Page mapping

Map:

```text
Docling page identity
    ->
page_number
```

Preserve actual source page order.

If trustworthy page dimensions are available, map them.

Otherwise omit dimensions.

### 9.2 Text block mapping

Map Docling textual document items into ordered provider `blocks`.

Each mapped block should contain only information actually supported by Docling:

```text
id
text
type/kind when source structure supports it
bbox only when safely converted
confidence only when a real applicable confidence exists
```

Use deterministic IDs.

Prefer stable identities derived from:

```text
page number
stable reading-order position
item type
```

A content hash may be added if required for collision resistance.

Do not use random UUIDs.

Do not create semantic labels such as:

```text
module
workflow_step
rule
decision
```

during perception.

Structural labels such as heading/title/paragraph/list-item are acceptable when they originate from Docling document structure.

### 9.3 Reading order

Preserve Docling's resolved document reading order.

Do not reorder items alphabetically, by identifier, or merely by raw coordinate unless Docling's own order is unavailable and a deterministic fallback is explicitly documented.

### 9.4 Bounding boxes

Docling provenance may carry page number and bounding boxes with an explicit coordinate origin.

Atlas's current normalized bounding box contract does not encode coordinate origin.

Therefore:

- inspect Docling coordinate origin and units;
- convert only when the conversion into Atlas's expected top-left-style page coordinate representation is proven;
- validate coordinates against page dimensions;
- omit the bounding box if conversion is ambiguous.

Never relabel bottom-left coordinates as top-left without conversion.

Never invent coordinates.

### 9.5 Confidence

Map confidence only if Docling or its OCR backend exposes a confidence that applies to the exact mapped block.

Do not invent confidence values.

Do not convert an unrelated document-level score into a block confidence.

### 9.6 Tables

Map Docling tables separately into provider `tables`.

Use deterministic table IDs.

Content should preserve table structure using a deterministic textual representation such as Markdown when available.

Do not duplicate the same table as both a normal text block and a table unless the existing Atlas normalization explicitly requires that behavior.

If Docling provides a trustworthy table bounding box, map it under the same coordinate rules.

### 9.7 Visual regions

Map pictures/visual regions only when Docling exposes a source-grounded page region.

Do not create external provider URLs.

Do not create `assetRef` unless the spike actually writes a derived local asset under an Atlas-compatible `derived/...` identity.

For the initial feasibility spike it is acceptable to omit `assetRef`.

---

## 10. Stage C - Atlas normalization

The mapped provider result must be passed through the existing Atlas implementation:

```text
packages/atlas-core/src/document-perception.ts
    normalizePerceptionResult(...)
```

Do not reimplement the `NormalizedDocument` validator in Python.

The spike must exercise the real current Atlas normalizer and therefore the real:

```text
parseNormalizedDocument(...)
```

contract.

Produce locally:

```text
atlas.normalized-document.json
```

A PDF does not pass this stage merely because Docling parsed it.

It passes only if the mapped result is accepted by the current Atlas normalization path.

---

## 11. Stage D - Determinism test

Run the primary Safara PDF through the same Docling version and configuration at least twice.

Compare the mapped provider result after canonical serialization.

Dynamic execution metadata such as wall-clock timestamps may be excluded from the deterministic comparison.

Required observations:

```text
same page count
same block ordering
same deterministic block IDs
same block text
same table ordering/IDs/content
same optional geometry when emitted
same normalized structural output hash
```

If raw Docling JSON contains nondeterministic internal metadata, report that separately.

The important gate is whether Atlas-facing mapped perception can be made deterministic.

Do not hide material Docling instability by sorting away meaningful reading order.

---

## 12. Stage E - OCR follow-up, only if justified

Do not start with raw Tesseract integration.

First test Docling's normal pipeline.

If a scanned/image PDF demonstrates an OCR gap, test a second configuration using Docling's supported Tesseract OCR backend.

The intended comparison is:

```text
Docling baseline OCR/configuration
        vs
Docling + Tesseract OCR backend
```

not:

```text
Docling
        vs
a completely separate hand-built Tesseract perception stack
```

If Tesseract is tested, record:

```text
Tesseract version
installed language data
OCR language configuration
text coverage difference
reading-order difference
confidence availability
latency difference
```

For Indonesian scanned documents, install/use the appropriate Indonesian language data if the environment supports it.

Do not make Tesseract a production dependency during this spike.

---

## 13. Required evaluation matrix

Produce one final matrix similar to:

| Capability | Safara Full | Finance PRD | Readiness PRD | Notes |
| --- | --- | --- | --- | --- |
| PDF opens successfully | PASS/FAIL | PASS/FAIL | PASS/FAIL | |
| Page count preserved | PASS/FAIL | PASS/FAIL | PASS/FAIL | |
| Major text preserved | PASS/FAIL | PASS/FAIL | PASS/FAIL | |
| Heading/section structure usable | PASS/FAIL | PASS/FAIL | PASS/FAIL | |
| Reading order usable | PASS/FAIL | PASS/FAIL | PASS/FAIL | |
| Tables usable | PASS/FAIL/NA | PASS/FAIL/NA | PASS/FAIL/NA | |
| Bounding boxes safely usable | PASS/FAIL/NA | PASS/FAIL/NA | PASS/FAIL/NA | |
| `NormalizedDocument v1` validation | PASS/FAIL | PASS/FAIL | PASS/FAIL | |
| Repeated Atlas-facing output deterministic | PASS/FAIL | optional | optional | |
| No external inference call | PASS/FAIL | PASS/FAIL | PASS/FAIL | |

Do not convert qualitative limitations into a fake PASS.

Record exact limitations.

---

## 14. Primary acceptance criteria

Classify the spike as `PASS`, `PASS_WITH_LIMITS`, or `FAIL`.

### PASS

`PASS` requires all of the following:

- primary Safara PDF processes successfully;
- all source pages are represented;
- all nine known major Safara headings remain discoverable in extracted source text/structure;
- major source text is not materially lost;
- reading order is usable for later bounded semantic scoping;
- mapped provider output passes the unchanged Atlas `normalizePerceptionResult(...)` and `NormalizedDocument v1` validation;
- the Atlas-facing mapped result is deterministic across repeated runs;
- no geometry/confidence/visual data is fabricated;
- no external inference provider receives document content.

### PASS_WITH_LIMITS

Use `PASS_WITH_LIMITS` when the core digital-PDF path is viable and Atlas-valid but one or more non-blocking limitations remain, for example:

```text
scanned OCR requires a different Docling OCR backend
table fidelity needs a bounded mapper improvement
some geometry must remain absent
visual regions are not yet useful
CPU latency is high but workable
```

Every limitation must be explicit and must identify whether it affects later semantic scoping.

### FAIL

Use `FAIL` when any of these are true:

- important Safara pages/sections are missing;
- source reading order is materially unusable;
- the mapped representation cannot satisfy `NormalizedDocument v1` without inventing information;
- Atlas-facing output cannot be made sufficiently deterministic;
- Docling requires a remote document-processing service for the tested path;
- the integration would require weakening existing perception authority.

---

## 15. Comparison to historical worker1

For the primary Safara document, include a comparison section:

```text
worker1 historical:
  page count = 7
  normalized characters = 12,540
  source units = 383
  known major headings = 9

Docling spike:
  page count = ?
  normalized characters = ?
  mapped text blocks = ?
  mapped tables = ?
  mapped visual regions = ?
  known major headings found = ?/9
```

Do not require Docling to reproduce exactly 383 source units.

The historical 383 line-level units were themselves known to be excessively fragmented.

A lower number of better structural blocks may be preferable.

Explain the difference instead of forcing equality.

---

## 16. Relationship to future semantic chunking

This spike must collect information useful for a later planning decision.

Specifically report whether Docling gives stable enough structure to construct future bounded semantic scopes from:

```text
section headings
paragraph groups
tables
page-local source regions
reading-order ranges
```

Do not implement those semantic scopes in this spike.

The report should answer:

> Would Docling provide a better deterministic structural basis for a future bounded extraction planner than the old worker1 line-level reconstruction?

Answer from observed data only.

---

## 17. Relationship to BSS-V2-004

BSS-V2-004 remains blocked on Gemini structured extraction/reconciliation compatibility.

This Docling spike does not unblock that row by itself.

The current observed capability matrix remains conceptually:

```text
minimal inference              PASS
structured extraction          FAIL
structured reconciliation      FAIL
Gemini PDF perception          PASS
Docling perception             UNKNOWN until this spike completes
```

After the spike:

- if Docling fails, leave the existing Gemini perception capability unchanged;
- if Docling passes, planning may consider Docling as an additional local perception route;
- regardless of the Docling result, the structured extraction/reconciliation provider-transport redesign remains a separate planning concern.

Do not mark BSS-V2-004 `PASS` from Docling evidence.

---

## 18. Security and authority rules

Docling receives source bytes for perception only.

It does not receive:

```text
Atlas DB credentials
user authentication secrets
Gemini/Mistral credentials
workspace truth state
review decisions
semantic candidate authority
publication authority
```

If a temporary local Docling service/container is used, expose it only on loopback or the local Compose network.

Do not create an internet-facing port.

Do not persist source bytes in a second long-lived store.

Temporary files must be scoped to the spike and cleaned safely.

Generated diagnostic output may contain source text.

Keep it local/ignored unless explicitly authorized for commit.

Do not record secrets in the report.

---

## 19. Docker discipline

Docker is optional for this feasibility spike.

If Docker is used:

- use an isolated spike container or optional Compose profile;
- do not alter production service routing;
- do not replace the current `agents-bridge-worker` perception provider;
- rebuild/recreate only the spike service when its dependencies change;
- do not use `docker compose down --volumes`;
- do not destroy PostgreSQL or DocumentStore state.

If Docker is not needed, do not add it merely for appearance.

---

## 20. Required deliverables

The spike is complete only when all of the following exist:

1. reproducible isolated Docling setup;
2. reproducible extraction command;
3. raw Docling diagnostic export for local inspection;
4. deterministic Docling-to-current-provider-result mapper;
5. execution through the real Atlas `normalizePerceptionResult(...)`;
6. `NormalizedDocument v1` output for each required digital PDF;
7. repeated-run determinism evidence for the primary Safara document;
8. explicit heading/text/table/geometry observations;
9. optional OCR/Tesseract comparison only if justified;
10. one summarized feasibility report;
11. a final `PASS`, `PASS_WITH_LIMITS`, or `FAIL` decision;
12. no production route activation or unrelated architecture modification.

Suggested report path:

```text
project's goal/feedback/DOCSPIKE-001-docling-perception-feasibility.md
```

---

## 21. Validation requirements

Run to terminal state.

Do not stop after:

```text
Docling installed
PDF opened
Markdown generated
first page parsed
mapper started
one document passed
```

The spike is not complete until the required document matrix and Atlas normalization evidence are finished.

At minimum validate:

```text
Docling extraction for all required digital PDFs
Atlas normalization for all required digital PDFs
primary Safara deterministic rerun
existing directly affected atlas-core perception tests
git diff --check
```

Do not run unrelated broad IDSER suites unless the spike unexpectedly changes production code.

Ideally the spike should not change production code at all.

---

## 22. Workflow behavior

If repository governance requires a ticket before implementation, create exactly one experimental ticket:

```text
DOCSPIKE-001 - Docling perception feasibility
```

Keep it outside the BSS-V2 dependency graph.

The ticket should freeze only the scope in this implementation context.

GO behavior:

```text
execute the entire spike to terminal feasibility result
do not short-stop between installation, parsing, mapping and validation
```

CK behavior:

```text
review whether the recorded evidence actually supports PASS/PASS_WITH_LIMITS/FAIL
do not convert the spike into a production integration review
```

CFC behavior:

```text
repair only bounded spike implementation/evidence defects
```

HMN behavior:

```text
required only if the spike encounters a genuine authority decision,
for example a proposed change to NormalizedDocument v1 or production routing
```

Such an authority decision is a hard stop.

---

## 23. Hard-stop conditions

Stop and return to human/planning authority if the experiment appears to require:

- changing `NormalizedDocument v1`;
- changing existing Atlas perception authority;
- creating a permanent public Docling service;
- altering BSS-V2-004 acceptance criteria;
- weakening source/evidence validation;
- adding semantic interpretation to the perception mapper;
- modifying production route activation;
- storing a second canonical copy of source documents;
- sending confidential/source material to a hosted service;
- a broad refactor unrelated to proving Docling feasibility.

Do not solve these implicitly.

---

## 24. Expected final report format

The final report should begin with:

```text
DOCSPIKE-001 RESULT: PASS | PASS_WITH_LIMITS | FAIL

Docling version:
Python version:
Execution mode: local venv | spike-only container
External inference calls: none
NormalizedDocument v1 changed: no
Production routes changed: no
```

Then include:

```text
document matrix
Safara historical comparison
mapping decisions
geometry/confidence decisions
determinism evidence
OCR/Tesseract evidence if run
performance observations
limitations
recommended next planning action
```

The recommendation must be one of:

```text
A. Do not adopt Docling.
B. Proceed to a separate Docling DocumentPerceptionProvider integration plan.
C. Proceed only after a bounded OCR/table/geometry follow-up spike.
```

Do not implement recommendation B or C inside this spike.

---

## 25. Final instruction to Codex

Execute this as a bounded feasibility experiment, not as a production migration.

The central proof is:

```text
repository PDF
    |
    v
local Docling
    |
    v
deterministic provider-shaped result
    |
    v
existing Atlas normalizePerceptionResult(...)
    |
    v
UNCHANGED NormalizedDocument v1
```

Preserve Atlas authority.

Do not change semantic contracts.

Do not activate Docling.

Do not spend Gemini/Mistral credits.

Do not short-stop before the feasibility matrix is complete.

Return a committed spike implementation plus the final feasibility report only when the full bounded experiment has reached a terminal result.
