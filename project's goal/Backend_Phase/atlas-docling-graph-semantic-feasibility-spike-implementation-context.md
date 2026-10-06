# Atlas Docling Graph Semantic Feasibility Spike - Implementation Context

Status: Authorized implementation context for a bounded feasibility spike
Suggested spike ID: DOCGRAPH-001
Repository: adityaa11/ces-platform
Target branch: codex/new-atlas-backend
Branch state inspected while authoring: 2ca2c185fb75b7bd4aa0c3e637b31f4529b148a3
Encoding: UTF-8, ASCII-safe Markdown

---

## 1. Purpose

This context authorizes one bounded experiment to determine whether Docling Graph can provide a practical local semantic-processing path for Atlas after Docling document perception has already been proven.

The experiment must answer this question:

> Can Docling Graph, using a local open-weight extraction model and Atlas-owned deterministic validation/finalization, produce useful semantic candidates and reconciliation relationships from Atlas-authorized document content without calling Gemini, Mistral, OpenAI, or another hosted inference provider, and without weakening the current Atlas semantic v1 contracts?

This is a feasibility experiment only.

It does not authorize a production provider migration, a semantic-contract rewrite, a database migration, a worker change, route activation, or a change to BSS-V2-004.

The experiment exists because two facts are now established:

1. DOCSPIKE-001 proved that local Docling can produce deterministic, Atlas-valid document perception for the required digital PRDs.
2. BSS-V2-004 live Gemini qualification is blocked at the current full Atlas semantic structured-output schemas before generation.

The spike therefore tests whether a richer local Docling ecosystem can take over more of the semantic work while Atlas remains the authority.

---

## 2. Human-provided local environment

The human has already installed:

```text
Python: 3.13.6, 64-bit
Docling: 2.132.0
OS: Windows
```

Treat those as the expected local versions for this spike.

Do not uninstall, upgrade, downgrade, or otherwise mutate the human's existing global Python or global Docling installation merely to run this experiment.

Before setup, verify the actual local state and record it:

```powershell
python --version
python -c "import docling; print(docling.__version__)"
Get-Command python
```

If the observed Python or Docling version differs from the human-provided value, record the actual value in the spike report and continue only if it remains compatible. Do not silently "fix" the global installation.

The existing DOCSPIKE-001 environment and artifacts are historical evidence and must not be damaged.

---

## 3. Isolated Docling Graph setup

Use a repo-local virtual environment for this experiment so the proven Docling setup is not contaminated.

Preferred environment:

```text
.venv-docling-graph/
```

This directory must be ignored by Git.

Create and activate it from the repository root:

```powershell
python -m venv .venv-docling-graph
.\.venv-docling-graph\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

Pin the spike to the versions verified when this context was authored:

```text
docling==2.132.0
docling-graph==1.9.1
```

Docling Graph 1.9.1 declares Python 3.13 support and accepts Docling >=2.105,<3.0, so Docling 2.132.0 is inside its declared range.

For the required local VLM experiment, install the VLM extra in the isolated environment:

```powershell
python -m pip install "docling==2.132.0" "docling-graph[vlm]==1.9.1"
```

Record the resolved versions:

```powershell
python --version
python -m pip show docling
python -m pip show docling-graph
python -c "import docling, docling_graph; print('docling', docling.__version__); print('docling_graph import OK')"
docling-graph --version
```

Create a reproducible spike-only requirements file, preferably:

```text
scripts/docling-graph-spike/requirements.txt
```

with the exact pinned dependencies needed by the successful run.

Do not add Docling Graph, Torch, Transformers, or model dependencies to the root pnpm workspace or production application dependencies.

---

## 4. Current Atlas authority that must remain unchanged

The experiment must preserve the current semantic v1 contract and authority split.

Current production skills remain:

```text
atlas.semantic.extract/v1
atlas.semantic.reconcile/v1
```

Current final extraction result remains:

```text
version
candidate_assertions[]
source_statement_inventory[]
questions[]
```

Current final reconciliation result remains:

```text
version
relationships[]
questions[]
```

Required candidate kinds remain:

```text
actor
business_object
business_property
responsibility
rule
constraint
condition
decision
workflow_step
state_transition
relationship
input
output
acceptance_expectation
exception
unresolved
```

Required reconciliation relationship types remain:

```text
new
supports
duplicates
refines
extends
contradicts
supersedes
partially_supersedes
ambiguous
requires_resolution
```

Atlas remains responsible for:

```text
scope authorization
source identity
NormalizedDocument authority
semantic contract validation
candidate ID authority
reference validation
source accounting
persistence
reconciliation persistence
review
accepted truth
publication
Master
```

Docling Graph or its local model may propose semantic structure only.

No Docling Graph ID, graph node ID, Pydantic identity, model output, or NetworkX object becomes canonical Atlas truth by itself.

---

## 5. Current evidence baseline

Use the completed DOCSPIKE-001 result as the perception baseline.

The primary Safara document demonstrated:

```text
7 pages
9 / 9 required major headings
12,383 normalized characters
220 mapped text blocks
Atlas NormalizedDocument v1 validation PASS
repeated Atlas-facing output deterministic
external inference calls: none
```

The spike should reuse this proven perception path rather than reopening it.

When a current NormalizedDocument is required and local ignored output is absent, regenerate it with the existing DOCSPIKE-001 runner or its existing extraction/normalization components. Do not rewrite the perception mapper merely for DOCGRAPH-001.

The semantic spike must distinguish clearly between:

```text
Docling perception
and
Docling Graph semantic extraction/reconciliation
```

A successful semantic experiment must not be misreported as new evidence for OCR, visual-region geometry, or document perception.

---

## 6. External package facts that define this spike

At authoring time, Docling Graph 1.9.1 provides:

```text
Pydantic template-based extraction
knowledge-graph conversion
deterministic provenance binding
LLM and VLM extraction backends
many-to-one processing
chunking for LLM extraction
direct and dense extraction contracts for LLM mode
local VLM extraction
NetworkX graph output
debug/trace artifacts
```

Important current behavior:

- Dense LLM extraction uses prompt-schema mode rather than provider API-level structured output.
- VLM extraction is local.
- Docling Graph recommends NuExtract 2.0 models for its local VLM backend.
- `numind/NuExtract-2.0-2B` is the primary model for this spike.
- The current NuExtract-2.0-2B model card declares an MIT license.

Do not silently change the model target during the spike.

Primary local model:

```text
numind/NuExtract-2.0-2B
```

Do not use NuExtract-2.0-4B in this spike.

Do not call a remote inference provider as a fallback.

A local Ollama/vLLM/LM Studio comparison is optional only when such a runtime is already available and can be used without changing the experiment's authority. It is not required for the primary result.

---

## 7. Core experiment topology

The primary experiment should prove or disprove this conceptual path:

```text
immutable PRD
    |
    v
existing local Docling perception
    |
    v
Atlas NormalizedDocument v1
    |
    v
deterministic semantic-source serialization
    |
    v
Docling Graph / local open model
    |
    +--> candidate proposal
    |
    +--> relationship proposal
    |
    v
Atlas-owned deterministic adapter/finalizer
    |
    v
existing parseSemanticExtractionResult(...)
existing parseSemanticReconciliationResult(...)
```

The full Atlas result contracts remain the output authority.

Docling Graph does not get permission to weaken or replace them.

---

## 8. Why the model-facing shape must be smaller than Atlas final v1

Do not ask the local model to emit the entire current Atlas final JSON Schema in one response merely to reproduce the Gemini failure pattern.

The experiment should deliberately separate:

```text
model-facing semantic proposal
from
Atlas final semantic contract
```

This is consistent with the proven worker1 lesson and the current BSS-V2 schema blocker.

The model-facing schema may be smaller and Pydantic-native, but it must contain enough information for Atlas to reconstruct the current final contract without inventing semantics.

A small transport schema is allowed in this spike.

A weakened final Atlas schema is not.

---

## 9. Deterministic source serialization

Create one deterministic serializer from `NormalizedDocument v1` into a model-readable semantic source representation.

Preferred file:

```text
scripts/docling-graph-spike/serialize-normalized.mts
```

The serializer must preserve every non-empty Atlas source unit with a stable explicit locator marker.

Conceptual form:

```text
# Page 1

[ATLAS_SOURCE_UNIT page=1 type=text_block id=docling-p1-text-0001-...]
Paket dan Jadwal Keberangkatan

[ATLAS_SOURCE_UNIT page=1 type=text_block id=docling-p1-text-0002-...]
...

[ATLAS_SOURCE_UNIT page=2 type=table id=...]
...
```

Requirements:

- Preserve page order.
- Preserve block/table order.
- Preserve the exact Atlas locator ID.
- Preserve source text or deterministic table representation.
- Do not add business semantics.
- Do not convert headings into facts.
- Do not remove source units simply because they appear unimportant.
- Hash the serialized representation and record it.
- Repeated serialization of the same NormalizedDocument must produce the same bytes.

This representation is spike-only unless later architecture explicitly adopts it.

---

## 10. Extraction transport template

Create an Atlas-oriented Pydantic template for Docling Graph semantic extraction.

Suggested location:

```text
scripts/docling-graph-spike/templates/atlas_extraction.py
```

The exact implementation may follow the installed Docling Graph API, but the semantic content must remain bounded to the following shape.

### 10.1 Candidate proposal

Each proposed candidate should contain:

```text
local_candidate_id
semantic_key
kind
normalized_meaning
source_wording optional
needs_resolution
source_unit_ids[]
payload optional/bounded
```

Rules:

- `kind` must use only the current Atlas sixteen-kind vocabulary.
- `source_unit_ids[]` must refer only to IDs present in the serialized authorized source.
- The model may propose a result-local ID only.
- The ID must never be treated as an Atlas canonical semantic ID.
- At least one valid source unit must ground every candidate.
- Unknown source IDs must fail deterministic finalization.
- `payload` is optional in the transport shape and must remain bounded.
- The finalizer may normalize representation but may not invent missing semantic meaning.

### 10.2 Source disposition

The experiment must preserve Atlas's complete source-accounting requirement.

The model-facing result therefore needs source disposition sufficient to distinguish:

```text
candidate
non_fact
```

Suggested fields:

```text
source_unit_id
classification
destination_local_candidate_ids[]
non_fact_reason optional
```

Rules:

- Every non-empty serialized source unit must receive exactly one disposition record after deterministic consolidation.
- A `candidate` disposition must resolve to at least one proposed candidate.
- A `non_fact` disposition must have a bounded reason and no candidate destination.
- Missing source-unit accounting is not silently repaired as `non_fact`.
- If model output omits a source unit, finalization must report incomplete accounting rather than invent a classification.

### 10.3 Questions

Use a compact question proposal:

```text
question
reason
source_unit_ids[]
```

The Atlas finalizer may convert the source IDs into existing `evidence_refs`.

---

## 11. Deterministic extraction finalizer

Create an Atlas-owned deterministic adapter/finalizer.

Preferred location:

```text
scripts/docling-graph-spike/finalize-extraction.mts
```

It must:

1. load the exact current `NormalizedDocument v1`;
2. load the Docling Graph extraction proposal;
3. reject unknown/duplicate source IDs;
4. reject unknown/duplicate local candidate IDs;
5. resolve each source ID to current Atlas page/locator identity;
6. build current Atlas `evidence_refs`;
7. build current `candidate_assertions`;
8. build complete `source_statement_inventory`;
9. preserve questions;
10. run the real current `parseSemanticExtractionResult(...)`.

Do not create a Python clone of the Atlas semantic parser.

The real TypeScript contract implementation is the acceptance boundary.

A proposal that cannot be transformed into the existing contract without semantic invention fails the relevant experiment row.

---

## 12. Reconciliation transport template

Reconciliation remains a separate capability from extraction.

Create a second bounded Pydantic template, preferably:

```text
scripts/docling-graph-spike/templates/atlas_reconciliation.py
```

Each relationship proposal should contain enough information for:

```text
source_candidate_id
target_candidate_id optional
relationship_type
requires_resolution
rationale or bounded payload
source_unit_ids[]
```

Rules:

- `relationship_type` must be one of the ten current Atlas values.
- `new` must not require a target.
- Every other relationship type requires a target.
- Source IDs and target IDs must come only from the supplied authorized reconciliation context.
- Model output never creates a canonical candidate.
- Candidate processing order never implies precedence.
- Supersession must be supported by source meaning, not ordering.
- Ambiguity is a valid result.
- Multiple relationships for one current candidate remain allowed where the current Atlas contract permits them.

---

## 13. Deterministic reconciliation finalizer

Create an Atlas-owned finalizer, preferably:

```text
scripts/docling-graph-spike/finalize-reconciliation.mts
```

It must:

1. load the exact authorized current/prior candidate manifest used by the model;
2. reject IDs outside that manifest;
3. enforce `new` target rules;
4. convert source-unit IDs to existing evidence refs;
5. verify every current candidate receives accounting;
6. preserve unresolved questions;
7. build current `semanticReconciliationResultSchema` shape;
8. run the real current `parseSemanticReconciliationResult(...)`.

Do not weaken the existing parser.

Do not treat NetworkX edge creation as sufficient Atlas reconciliation proof.

The current Atlas reconciliation result remains the acceptance boundary.

---

## 14. Required local inference path

The required inference path for DOCGRAPH-001 is local VLM execution through Docling Graph using:

```text
numind/NuExtract-2.0-2B
```

Use the current Docling Graph VLM backend API as installed, not guessed API calls copied from stale examples.

First run a tiny smoke fixture before Safara.

The smoke fixture must prove:

```text
model loads locally
no provider API key is required
one bounded Pydantic extraction completes
structured result parses
latency is recorded
model identity is recorded
```

If model weights are downloaded from Hugging Face or another model registry, record:

```text
model repository
resolved model identity/revision when discoverable
download/cache location class
license metadata observed
```

Do not commit model weights.

Do not send PRD content to a hosted inference API.

Registry downloads of model files are permitted; inference must remain local.

---

## 15. VLM input handling for the semantic-source representation

Prefer to run the local model over the deterministic Atlas semantic-source representation rather than allowing the VLM to create a second independent perception truth.

However, the installed Docling Graph VLM backend may require a renderable document/image source.

Use this bounded resolution order:

1. If the installed VLM backend can consume the serialized Markdown/text through Docling's supported input path while preserving the explicit `ATLAS_SOURCE_UNIT` markers, use it.
2. If it requires a visual document, deterministically render the serialized semantic source into a simple local PDF and process that PDF.
3. Keep the serialized text as the authoritative spike input and hash it before rendering.
4. The rendered PDF is transport for the local VLM only. It is not a new Atlas source document and must remain under ignored spike output.
5. Verify that source-unit markers survive the VLM-visible representation.

Do not replace Atlas source identity with Docling Graph's second-pass page identities.

For evidence, Atlas source IDs from the serialized authorized input remain authoritative.

---

## 16. Required real-document extraction tests

Use the same three repository-owned documents from DOCSPIKE-001:

```text
project's goal/Safara_Buyer_Business_PRD.pdf
docs/example/Safara_PRD_02_Finance_Documents.pdf
docs/example/Safara_PRD_03_Readiness_Manifest_Reporting.pdf
```

Required primary document:

```text
Safara_Buyer_Business_PRD.pdf
```

For each document, record:

```text
source-unit count
candidate count
non-fact count
question count
candidate kinds observed
unknown source references
unaccounted source units
final Atlas extraction validation
local inference latency
process CPU observation when practical
peak-memory observation when practical and method is defensible
model identity
```

The experiment is not required to find a predetermined number of semantic candidates in a real PRD.

It is required to produce source-grounded, inspectable, contract-valid output without silently dropping source accounting.

---

## 17. Required semantic sanity inspection for Safara

For the primary Safara run, manually/algorithmically inspect that extracted candidates include plausible coverage across the known major areas:

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

This is not a requirement for exactly one candidate per heading.

It is a coverage sanity check that semantic extraction did not collapse onto only one part of the document.

Record:

```text
which headings have at least one candidate grounded beneath/around them
which headings yield only non-fact content
which headings appear materially under-extracted
```

Do not hardcode these headings into extraction prompts as required facts.

They are evaluation anchors only.

---

## 18. Required controlled extraction fixture

Real-document plausibility alone is not enough.

Create one small synthetic, non-confidential semantic fixture with stable source-unit markers that contains clearly separable examples of:

```text
actor
business_object
rule
condition
workflow_step
state_transition
input
output
exception
unresolved ambiguity
non-fact prose
```

The fixture must be small enough for human inspection.

Record expected source-unit-to-concept coverage before inference.

Evaluate:

```text
missing expected concepts
invented concepts
wrong semantic kind
source-id hallucination
incorrect non-fact classification
duplicate candidate generation
```

This fixture is spike evidence only and must not become a production semantic golden contract unless separately authorized.

---

## 19. Required reconciliation fixture

Create one controlled candidate-manifest fixture covering all ten current relationship types.

The fixture must contain clear examples for:

```text
new
supports
duplicates
refines
extends
contradicts
supersedes
partially_supersedes
ambiguous
requires_resolution
```

Use stable candidate IDs and source-unit IDs.

Do not put the expected relationship label into the source prose itself.

A relationship may be made clear through ordinary business-language evidence. For example, explicit replacement language may justify `supersedes`.

Run the reconciliation proposal and deterministic finalizer.

Record per relationship type:

```text
expected label
observed label
source candidate ID validity
target candidate ID validity
evidence validity
requires_resolution validity
Atlas final parser result
```

Every current candidate must receive accounting.

The controlled fixture is the primary binary test of whether the local semantic engine can represent Atlas's reconciliation vocabulary.

---

## 20. Optional real cross-document reconciliation

If extraction succeeds for the Finance and Readiness PRDs, perform one additional real cross-document reconciliation experiment.

Use:

```text
current candidates from one document
+
bounded prior candidates from an earlier document
```

Keep the input within the current Atlas v1 candidate/context limits.

This row is qualitative unless the repository already contains authoritative expected relationships.

Inspect for:

```text
invalid IDs
unsupported target references
obvious duplicate/refinement detection
obvious contradictions
unsupported supersession claims
overuse of `new`
overuse of `requires_resolution`
```

Do not manufacture a PASS by inventing expected semantics that are not already documented.

---

## 21. Docling Graph knowledge-graph evaluation

Docling Graph's NetworkX graph is useful evidence, but it is not Atlas authority.

Record:

```text
node count
edge count
stable node identity behavior
provenance metadata availability
whether Atlas-like candidate relationships are representable
whether graph conversion loses fields needed by Atlas
whether graph fusion contributes anything useful to deterministic consolidation
```

The experiment should answer:

> Is Docling Graph's graph layer useful as an intermediate reasoning/provenance representation, or is the Pydantic extraction result more useful to Atlas than the NetworkX graph itself?

Either answer is acceptable.

Do not add Neo4j or another graph database.

---

## 22. Provenance rules

Use Docling Graph provenance as supporting evidence, not as a substitute for Atlas evidence rules.

For Atlas-facing finalization:

```text
Atlas source-unit ID
    ->
current NormalizedDocument page/locator
    ->
existing evidence_ref
```

must remain deterministic.

If Docling Graph provenance reports only approximate chunk/page grounding, preserve that distinction in diagnostics.

Do not convert approximate provenance into an exact Atlas excerpt claim.

Do not invent bounding boxes, confidence scores, or source spans.

---

## 23. Determinism experiment

Run the primary Safara semantic extraction at least twice with the same:

```text
Python version
Docling version
Docling Graph version
model identity
model revision when available
generation configuration
source serialization
template
```

Use deterministic generation controls when the installed backend supports them.

Record hashes for:

```text
serialized Atlas semantic input
raw Docling Graph extracted model
canonical intermediate proposal
final Atlas extraction result
```

Classify:

```text
IDENTICAL
STRUCTURALLY_EQUIVALENT
MATERIALLY_DIFFERENT
```

If generative output is not byte-identical, report the exact semantic differences.

Do not sort away meaningful differences merely to make hashes match.

---

## 24. Resource and execution observations

Record at minimum:

```text
wall-clock latency
model load time when separable
inference time when separable
process CPU time when practical
GPU identity if used
VRAM observation if a defensible measurement is available
system RAM observation if a defensible measurement is available
model cache size or model-download size when easily observable
```

Every metric must name its measurement method and limitation.

Do not report process CPU time as CPU utilization.

Do not report allocator estimates as actual peak machine memory.

Resource evidence is informative; it must not become an invented production SLA.

---

## 25. External-network boundary

The experiment may access the network only for dependency/model acquisition needed to run the local spike.

Permitted:

```text
PyPI package download
Hugging Face/model-registry weight download
package metadata/license lookup
```

Prohibited:

```text
Gemini inference
Mistral inference
OpenAI inference
Ollama cloud inference
hosted Hugging Face inference endpoint
hosted document processing
remote embedding
remote semantic extraction
```

Record `External inference calls: none` only if this is actually true.

Do not log or commit environment secrets.

---

## 26. Required local artifacts and Git boundary

Store generated runtime output under:

```text
.atlas-data/docling-graph-spike/
```

This directory must be ignored.

It may contain:

```text
serialized source representation
rendered VLM transport document
raw Docling Graph debug output
Pydantic extracted JSON
NetworkX/graph JSON
provenance ledger
intermediate candidate proposal
intermediate reconciliation proposal
final Atlas result JSON
hashes
metrics
summary
```

Do not commit:

```text
model weights
Hugging Face cache
raw local debug dumps containing full PRD text
global environment files
API keys
virtual environment
```

Commit only reproducible spike code, small synthetic fixtures when safe, ticket/review artifacts, and the summarized feasibility report.

---

## 27. Suggested reproducible runner structure

Prefer:

```text
scripts/docling-graph-spike/
  README.md
  requirements.txt
  run-all.ps1
  run_vlm.py
  summarize.py
  templates/
    atlas_extraction.py
    atlas_reconciliation.py
  fixtures/
    semantic-extraction-fixture.*
    semantic-reconciliation-fixture.*
  serialize-normalized.mts
  finalize-extraction.mts
  finalize-reconciliation.mts
```

Names may change only to follow an existing repository convention.

The responsibilities may not be collapsed into an opaque one-off script that prevents CK from inspecting each boundary.

---

## 28. Required run order

The runner must execute to a terminal experimental result.

Required order:

```text
A. verify Python/global Docling without mutating them
B. create/verify isolated Docling Graph venv
C. install pinned dependencies
D. import/version smoke
E. local NuExtract 2B micro-smoke
F. regenerate/reuse DOCSPIKE NormalizedDocument evidence
G. deterministic source serialization
H. controlled extraction fixture
I. Safara extraction run 1
J. Finance extraction
K. Readiness extraction
L. Safara extraction run 2
M. extraction finalization through real Atlas parser
N. controlled reconciliation fixture
O. reconciliation finalization through real Atlas parser
P. optional real cross-document reconciliation
Q. summarize determinism, quality, resource, provenance, graph usefulness
R. run directly affected Atlas contract/core tests
S. git diff --check
T. write terminal feasibility report
```

Do not stop after package installation, model download, the first successful call, or the first failed semantic case.

A recoverable local execution defect must be diagnosed and retried within the bounded spike.

---

## 29. Short-stop prevention and bounded recovery

The spike is not complete while one of the required rows is merely "still running", "partially tested", or "needs another obvious retry".

Within the frozen scope, Codex is authorized to:

```text
repair spike-only scripts
repair template mistakes
repair source serialization
repair deterministic adapters
recreate the isolated venv
clear only spike-specific caches/artifacts when corrupted
retry model download
retry a failed local model initialization
reduce only spike transport batch size
use documented local device settings
re-run all affected evidence
```

Codex is not authorized to:

```text
change Atlas semantic v1
change production routes
change BSS-V2 acceptance
install a hosted-provider fallback
silently switch to a different model
change source truth
modify production persistence
```

If the required local model cannot execute after bounded environment remediation, finish with a terminal `ENVIRONMENT_BLOCKED` classification containing the exact cause and evidence. Do not pretend that a framework failure was proven when only the local runtime failed.

---

## 30. Security and authority seams

Status: applicable.

### BOUNDARY-DOCGRAPH-001-SOURCE

Only repository-owned test PRDs and synthetic fixtures may be used.

Source-derived generated artifacts stay local/ignored.

### BOUNDARY-DOCGRAPH-001-SEMANTIC

Docling Graph/model output is an untrusted semantic proposal.

Only the existing Atlas parsers establish contract validity.

### BOUNDARY-DOCGRAPH-001-IDENTITY

Docling Graph node IDs and model-emitted candidate IDs are never canonical Atlas semantic IDs.

### BOUNDARY-DOCGRAPH-001-NETWORK

Network access may acquire packages/model weights, but PRD inference remains local.

### BOUNDARY-DOCGRAPH-001-PERSISTENCE

The spike has no production DB write authority and creates no trusted semantic state.

### PROHIBITED-COUPLING-DOCGRAPH-001-PRODUCTION

A successful spike cannot activate Docling Graph in Agents Bridge or replace a qualified route without a separately authorized integration plan.

### PROHIBITED-COUPLING-DOCGRAPH-001-CONTRACT

The spike cannot change the current extraction/reconciliation final contracts merely because the local model prefers another shape.

---

## 31. Required feasibility report

Write:

```text
project's goal/feedback/DOCGRAPH-001-docling-graph-semantic-feasibility.md
```

The report must state:

```text
DOCGRAPH-001 RESULT: <classification>

Python version
Docling version
Docling Graph version
local model and revision when available
execution device
External inference calls: none/actual
Atlas semantic v1 changed: no
Production routes changed: no
BSS-V2-004 state changed: no
```

Include these sections:

```text
Scope and method
Environment/setup
Model and license observation
Extraction transport template
Reconciliation transport template
Source-accounting behavior
Controlled extraction results
Safara/Finance/Readiness extraction results
Controlled reconciliation matrix
Optional real reconciliation observation
Atlas parser validation
Provenance behavior
Knowledge-graph usefulness
Determinism
Performance/resource observations
Failure/retry history
Limits
Conclusion
Next-planning recommendation
Review Contract Closure
```

Do not hide failed cases behind an overall PASS.

---

## 32. Result classifications

Use exactly one terminal classification.

### PASS

Use only if:

```text
local inference completed
controlled extraction is materially correct
all required real-document extraction runs complete
source accounting can be made complete without semantic invention
real parseSemanticExtractionResult(...) passes
controlled reconciliation covers all ten relationship types at an acceptable level
real parseSemanticReconciliationResult(...) passes
no unauthorized IDs survive
evidence remains source-grounded
primary rerun is identical or structurally equivalent without material semantic drift
no external inference was used
no Atlas final contract was weakened
```

### PASS_WITH_LIMITS

Use when the local path is clearly useful and Atlas-valid for a substantial part of the semantic job, but one or more non-fatal limitations remain, for example:

```text
some relationship types are weak
output is not byte-deterministic but remains materially equivalent
graph layer is not useful although Pydantic extraction is
real-document extraction works but reconciliation quality needs a stronger local model
resource usage is high but still runnable
```

A limit must not be used to excuse missing source accounting or invalid Atlas final output.

### FAIL

Use when:

```text
semantic extraction is materially unreliable
source references are routinely invented
source accounting cannot be completed honestly
Atlas final validation requires semantic invention
controlled reconciliation cannot represent the current vocabulary reliably
local output materially drifts across equivalent runs
the framework requires weakening Atlas authority
```

### ENVIRONMENT_BLOCKED

Use only when the framework/model cannot be executed locally after bounded setup/remediation because of an actual runtime/hardware/dependency incompatibility.

This classification says nothing about semantic quality.

---

## 33. Review Contract

The generated DOCGRAPH-001 ticket should freeze these rows.

| Row | Required behavior | Binary evidence |
| --- | --- | --- |
| RC-DOCGRAPH-001-01 | Isolated pinned Docling Graph environment runs without mutating the human's global Python/Docling installation. | Version/install evidence and ignored venv; PASS iff Python 3.13-compatible Docling Graph 1.9.1 and Docling 2.132.0 import/run in the isolated environment. |
| RC-DOCGRAPH-001-02 | Local open-model inference runs with no hosted inference call. | Micro-smoke and network/provider evidence; PASS iff NuExtract-2.0-2B runs locally and no hosted inference provider receives source content. |
| RC-DOCGRAPH-001-03 | Deterministic Atlas source serialization preserves every non-empty authorized source unit and locator identity. | Serializer hashes/counts and negative tests; PASS iff repeated serialization matches and no locator is invented/dropped. |
| RC-DOCGRAPH-001-04 | Controlled semantic extraction produces grounded candidate/source-disposition output that can be finalized through the real current Atlas extraction parser. | Controlled fixture matrix plus `parseSemanticExtractionResult(...)`; PASS iff required fixture concepts/source accounting validate with no unauthorized IDs. |
| RC-DOCGRAPH-001-05 | All three real PRDs complete extraction and final Atlas validation without weakening semantic v1. | Per-document metrics/results; PASS iff each reaches a terminal extraction result and current parser acceptance, with all source units accounted for. |
| RC-DOCGRAPH-001-06 | Safara semantic output demonstrates broad source coverage rather than one-section collapse. | Nine-heading coverage inspection; PASS iff no material section is silently omitted from semantic consideration and omissions/limits are explicitly reported. |
| RC-DOCGRAPH-001-07 | Controlled reconciliation exercises all ten current relationship types and finalizes through the real current Atlas reconciliation parser. | Relationship matrix plus `parseSemanticReconciliationResult(...)`; PASS iff candidate IDs/targets/evidence are valid and every current candidate is accounted for. |
| RC-DOCGRAPH-001-08 | Primary equivalent reruns characterize semantic determinism honestly. | Raw/intermediate/final hashes and semantic diff; PASS iff result is identical or structurally equivalent with no material semantic drift. |
| RC-DOCGRAPH-001-09 | Docling Graph provenance/graph output is assessed without becoming Atlas authority. | Graph/provenance report; PASS iff usefulness and limits are recorded and Atlas evidence identity remains authoritative. |
| RC-DOCGRAPH-001-10 | Final report gives a truthful adoption decision without production activation. | Feasibility report; PASS iff classification follows evidence and production/BSS-V2 state remains unchanged. |

If a row is not applicable because the required local model cannot execute, the overall result must be `ENVIRONMENT_BLOCKED`, not an artificial PASS.

---

## 34. Validation requirements

At minimum run:

```text
full spike runner
real current Atlas extraction parser over finalized outputs
real current Atlas reconciliation parser over finalized outputs
directly affected @atlas/contracts tests
directly affected @atlas/core tests if reused
Python syntax/import checks for spike code
template import/lint checks supported by installed Docling Graph
git diff --check
```

Use Docker only for existing Atlas tests that require the canonical Compose environment.

Docling Graph itself should stay in the isolated local Python environment for this spike.

Never use:

```text
docker compose down --volumes
```

---

## 35. GO / CK / CFC / HMN behavior

This spike must remain compatible with the existing Atlas review workflow.

### GO

GO executes the entire frozen experiment to one terminal classification.

Do not stop after partial evidence.

### CK

CK reviews only the frozen DOCGRAPH-001 Review Contract.

CK must not turn the spike into a production-integration review.

### CFC

CFC may repair only frozen spike implementation/evidence defects.

It must not change the semantic v1 contract, model target, or production architecture.

### HMN

HMN may authorize another bounded remediation cycle for frozen ticket-derived gaps.

It must not silently authorize production adoption.

---

## 36. Explicitly out of scope

Do not implement any of the following in DOCGRAPH-001:

```text
production Docling Graph service
Agents Bridge Docling Graph adapter
new queue
new worker
new database tables
Neo4j
production NetworkX persistence
production route activation
Gemini deletion
Mistral deletion
BSS-V2-004 rewrite
semantic v2
candidate persistence changes
reconciliation persistence changes
review UI
Main Workflow projection
Project Facts projection
CES Result projection
chat integration
publication
Master mutation
OCR qualification
visual-region qualification
```

A promising result supports later planning only.

---

## 37. Planning interpretation after the spike

If DOCGRAPH-001 returns PASS or PASS_WITH_LIMITS, the next architecture decision should compare at least these shapes:

```text
A. Docling perception + Docling Graph local semantic engine
B. Docling perception + small provider-facing semantic transport + remote model
C. hybrid: local extraction, remote fallback for difficult reconciliation
```

That later decision must consider:

```text
semantic quality
source-grounding quality
determinism
latency
hardware requirements
concurrency
privacy
operational complexity
licensing
cost
provider independence
```

Do not make that production decision inside DOCGRAPH-001.

---

## 38. Final instruction to Codex

Treat this document as the complete human-authored planning authority for the feasibility spike.

Before changing code:

1. inspect the current local branch, not only the remote branch;
2. confirm the latest DOCSPIKE-001 CK result available in the local repository;
3. inspect the installed Docling Graph 1.9.1 API instead of assuming examples match exactly;
4. derive one bounded DOCGRAPH-001 ticket from this context using the current Atlas Review Workspace workflow;
5. keep security seams local to the ticket;
6. execute GO only when the user invokes GO or otherwise explicitly authorizes execution under the repository workflow.

During GO, continue until the experiment reaches PASS, PASS_WITH_LIMITS, FAIL, or ENVIRONMENT_BLOCKED and the committed checkpoint is genuinely ready for CK.

Do not short-stop with unfinished required rows when the remaining work is an ordinary in-scope implementation, retry, validation, or evidence task.
