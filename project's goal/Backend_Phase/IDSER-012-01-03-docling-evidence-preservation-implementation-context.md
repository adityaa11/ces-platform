# IDSER-012-01-03 - Docling RUN-003 Evidence Preservation and Semantic Handoff

**Status:** PROPOSED - planning context only; not GO authorization  
**Target branch:** `codex/new-atlas-backend` (Codex must record and recheck current HEAD)  
**Parent:** `IDSER-012-01`  
**Required predecessor:** `IDSER-012-01-02` CK `PASS`  
**Evidence baseline:** RUN-002 and RUN-003 on `Safara_Buyer_Business_PRD_Professional.pdf`  
**Terminal lifecycle state:** `perceived` - ready for downstream semantic batch planning, not `semantic_ready`  
**Requested output from Codex:** bounded ticket/planning artifacts only; no implementation without a separate human GO

> Encoding note: This file is written as UTF-8 without BOM, with LF line endings and ASCII-only text to avoid mojibake when passed between Windows, PowerShell, Git, and Codex. Preserve the file's encoding and do not introduce replacement characters during edits.

## 1. Decision and objective

Extend the currently qualified local Docling perception route to preserve source-grounded PDF text, table structures, and detected images/diagrams/charts, using the specific capture-first behavior demonstrated by RUN-003.

The desired terminal result is one accepted `NormalizedDocument V1`, backed by durable and authorized derived visual assets, for each admitted source PDF. Downstream consumers must be able to read trustworthy table content and retrieve image bytes using document-scoped pointers. No semantic provider invocation, semantic batching implementation, reconciliation, review, or UI implementation belongs to this work.

This scope deliberately addresses evidence preservation and readiness, not visual understanding. A captured workflow diagram is source evidence; its business relationships have not been inferred merely because Docling produced its pixels.

**Hard boundary:**

```text
PDF explicitly selected for project creation or a new workspace
  -> authorized original-document intake / extraction-bundle membership
  -> existing bounded perception queue and source grant
  -> pinned CPU Docling standard pipeline (RUN-003 profile)
  -> deterministic text/table/visual mapping
  -> durable Atlas-owned derived visual assets
  -> accepted NormalizedDocument V1 with resolvable evidence locators
  -> document state: perceived
  -> readable by future semantic batch planning
  -> STOP (no semantic work started)
```

The associated image/table evidence belongs logically to the selected original PDF, not as an additional PDF or independent extraction-bundle member. A semantic provider may later consume hydrated visual evidence, but derived assets must never recursively enter document perception.

## 2. Frozen empirical evidence and what it proves

### 2.1 Source identity

- PDF: `Safara_Buyer_Business_PRD_Professional.pdf`
- Source SHA-256: `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df`
- Document: 12 pages.
- Docling Serve: `1.36.0`.
- Docling runtime: `2.132.0`.
- Runtime: local CPU standard pipeline; picture description and chart interpretation disabled.

### 2.2 RUN-002 versus RUN-003

| Observation | RUN-002 | RUN-003 |
| --- | ---: | ---: |
| Text elements | 254 | 254 |
| Structured tables | 4 | 4 |
| Extracted table cells | 69 | 69 |
| Picture objects | 5 | 5 |
| Decodable embedded picture assets | 0 | 5 |
| Raw JSON response bytes | 175976 | 456494 |
| Docling-reported processing time | 7893 ms | 8061 ms |
| HTTP request latency | 8055 ms | 10065 ms |

RUN-003 pictures were detected and captured on pages 3, 5, 7, 8, and 10. They represent an operational flowchart, quota comparison chart, payment status-transition diagram, document review UI mockup, and manifest eligibility decision diagram. RUN-003 embedded PNG payloads were decoded and opened successfully.

These runs prove only the observed Safara capture behavior, not universal PDF fidelity, image interpretation, scanned-PDF/OCR support, production concurrency suitability, or a completed Atlas integration. The RUN-003 processing result is not authorization to alter the approved production Docling profile without renewed qualification.

### 2.3 Frozen comparison artifacts

Codex should find and identify, not overwrite, the laboratory evidence when accessible:

```text
C:\Workspace\atlas-perception-lab\raw Docling response\run-2-safara-professional-raw.json
C:\Workspace\atlas-perception-lab\raw Docling response\run-3-safara-professional-raw.json
C:\Workspace\atlas-perception-lab\raw Docling response\run-3-safara-professional-report.md
C:\Workspace\atlas-perception-lab\raw Docling response\run-3-images\
```

If those files are unavailable to the current Codex workspace, state the evidence-access limitation, request the existing fixtures, and do not invent their content or rerun heavyweight visual inference as a substitute.

## 3. Branch-baseline ownership and known implementation gaps

Codex MUST verify these observations against current branch HEAD before generating the ticket. They describe the previously inspected branch, not an unconditional claim about later changes.

| Current seam | Observed baseline | Consequence for this scope |
| --- | --- | --- |
| `apps/agents-bridge/src/providers/docling.ts` | Sends `include_images=false`, `image_export_mode=placeholder`; maps `json.texts` and `json.tables` but ignores `json.pictures`; expects table `markdown`/`text` on each table object. | Activate RUN-003 image settings; correctly map actual `data.grid` and `pictures[]`. |
| `packages/atlas-core/src/document-perception.ts` | Maps generic provider pages into `textBlocks[]`, `tables[].content`, and `visualRegions[].assetRef`. | Use/qualify existing normalizer without silently losing table or figure data. |
| `packages/atlas-contracts/src/perception.ts` | `NormalizedDocument V1` has text/table/visual slots and permits `assetRef` matching `^derived/`. | Prefer V1; no base64 in normalized JSON. |
| `packages/atlas-contracts/src/semantic-v1.ts` and `semantic.ts` | Semantic evidence locators permit `text_block`, `table`, and `visual_region`; semantic IDs are stricter than arbitrary Docling `self_ref`; text/table evidence require exact source excerpts. | Align locator IDs and readable table content now without changing semantic business semantics. |
| `apps/agents-bridge/src/document-perception-worker.ts` | Constructs and stages one normalized result; Bridge replay staging precedes Atlas result acceptance. | Define binary asset durability BEFORE replayable pointers. |
| `apps/agents-bridge/src/perception-result-replay.ts` | Bridge-owned outbox stores normalized JSON only, not source or binary asset bytes. | Keep outbox free of binary payloads; guarantee separately durable assets across retry/restart. |
| `apps/agents-bridge/src/atlas-perception-client.ts`, `packages/atlas-core/src/perception-internal-route.ts`, `apps/atlas/perception-internal.ts` | Authenticated handoff carries bounded JSON result; no established binary derived-asset handoff. | Define bounded authorized transfer/persistence interface, preserving existing security boundary. |
| `packages/document-store/src/local-filesystem-document-store.ts` | Source store only supports `documents/<UUID>` keys. | Add separate derived-asset interface/namespace, not weakened source-document key validation. |
| `packages/atlas-db/src/perception-authority.ts` | Records `derived_assets`/`atlas.document_perception_derived_asset` reference metadata without proving byte existence; accepts normalized results and advances staged documents to `perceived`. | Verify binary assets before accepted pointers/state transitions. |
| `packages/atlas-db/src/perception-authority.ts` | Cache key uses source SHA, contract version, capability, and Atlas `capability_identity`; cache invalidation marks derived references deleted. | Prevent cross-profile cache mixing and dangling historical evidence. |
| `apps/agents-bridge/src/route-registry.ts`, `apps/agents-bridge/src/config.ts`, `docker-compose.yml` | Qualified route/profile and runtime versions are pinned; Atlas has a distinct D1 capability-identity configuration. | Change all affected identity values coherently and requalify. |
| `packages/atlas-db/src/perception-authority.ts` | Staged admission selects eligible `atlas.document` / `atlas.extraction_bundle_document` source records. | Derived outputs must never become source records or queue jobs. |

### 3.1 Existing qualified runtime boundaries

Preserve the already approved local composition: two Atlas perception permits, two Bridge perception consumers, two Docling local conversion workers, and one Uvicorn worker, with CPU-only execution. Keep Docling Compose-private. Do not silently change resource limits, engine versions, database role privileges, admission policy, or queue framework.

Current Compose defaults include Docling timeout `20000` ms, Docling raw-response bound `10485760` bytes, and Bridge-to-Atlas perception-result bound `10485760` bytes. Verify actual effective configuration at planning/qualification time. RUN-003's successful single request does not prove the revised route will remain within the approved warm route under simultaneous calls.

### 3.2 Existing table and locator gaps

- Docling's raw table cells are available in `tables[].data.table_cells` and `tables[].data.grid`; the current mapper can drop them when top-level `text` / `markdown` are absent.
- Docling element references such as `#/texts/0`, `#/tables/0`, and `#/pictures/0` cannot be directly used as Semantic V1 `locator_id` values. Atlas must assign deterministic compliant IDs while retaining source correspondence.
- Picture-page provenance, usable geometry, and original display/caption text must not be lost when building `visualRegions[]`.
- A registered `assetRef` is not sufficient proof that binary content exists or is authorized for retrieval.

## 4. Frozen Docling RUN-003 capture-first profile

Use the effective RUN-003 option set as the intended new qualified profile:

```ini
from_formats = pdf
to_formats = json
pipeline = standard

do_ocr = false
force_ocr = false

do_table_structure = true
table_mode = accurate

include_images = true
image_export_mode = embedded
include_page_images = false

do_picture_description = false
do_picture_classification = false
do_chart_extraction = false
do_code_enrichment = false
do_formula_enrichment = false
```

- Retain Docling Serve `1.36.0`, Docling runtime `2.132.0`, and the existing CPU-only standard PDF engine.
- Do not enable OCR, full-page rendering, Granite, VLM pipeline, chart-value extraction, picture description, remote AI services, or GPU.
- Keep other unconfigured settings at the observed RUN-003 defaults; do not invent additional flags as part of this qualification.
- Register a distinct, coherent profile and qualification identity; do not claim inherited acceptance from the old image-disabled route.

## 5. Required mapping to NormalizedDocument V1

### 5.1 Text

- Map all supported, source-grounded `json.texts[]` elements to `pages[].textBlocks[]` without silent content loss.
- Preserve exact text needed for downstream excerpt checking, detected text kind, source page, and available validated geometry.
- Distinguish headings/captions/labels from inferred business meaning. No semantic classification is performed.
- Produce deterministic, unique Atlas locator IDs compatible with BOTH V1 perception and Semantic V1 evidence schemas. Preserve a trustworthy Docling-reference-to-Atlas-locator correspondence for qualification/debugging without adding unnecessary fields to V1.

### 5.2 Tables

- Map `json.tables[].data.grid` and relevant cell metadata, not merely optional top-level `markdown` or `text`.
- Qualify that the four Safara tables and all 69 recovered cells remain accounted for, including ordering, column/header relationships, cell text, and meaningful spans.
- Produce deterministic, semantic-readable `tables[].content`, maintaining exact source substrings so required Semantic V1 table excerpts are groundable.
- Preserve page, table ID, and validated bounding box; ensure table references are unique and compliant.
- Table content belongs in the accepted normalized cache. Do not create redundant PNG files for every table by default.
- If the V1 `content: string` shape cannot faithfully represent a materially complex table, reject/fail closed and record a contract or derivative-structure decision for human approval. Do not silently flatten away business-critical relationships, and do not unilaterally introduce `NormalizedDocument V2`.

### 5.3 Pictures, diagrams, and charts

- Map every supported `json.pictures[]` element to its source-grounded page `visualRegions[]` entry.
- Preserve the detected picture's page identity, valid figure locator ID, available bounding box, and any reliable labels. Do not fabricate an image description or claim that arrows/chart values have been interpreted.
- Decode the returned image data; verify declared type, actual bytes, dimensions, bounded size, and supported content format.
- Ensure geometry uses a consistent documented Atlas coordinate system, accounting for Docling's PDF coordinate origin and page dimensions. A wrong coordinate conversion must fail qualification, not be accepted as approximate provenance.
- Preserve source captions and adjacent text as their own trustworthy text evidence when available. Do not create ungrounded caption-to-image assertions.
- Put only an Atlas-issued and validated `derived/...` reference in `visualRegions[].assetRef`; no image bytes or data URLs in `NormalizedDocument`.

### 5.4 Unsupported source elements

Every relevant observed text/table/picture source element must be mapped or explicitly accounted for as unsupported with a bounded technical failure or human decision. Do not silently drop source elements while declaring complete perception. A visual object not interpreted semantically is not thereby a `non_fact`.

## 6. Atlas-owned derived visual storage

### 6.1 Storage location and ownership

- Reuse the existing development `atlas-data` volume and Atlas-owned storage authority, proposing a separate logical `derived/` namespace alongside immutable source `documents/` storage.
- Prefer a narrow derived-asset storage contract; preserve the current `LocalFilesystemDocumentStore` rules that only admit `documents/<UUID>` source keys.
- Do not introduce MinIO, another database, a new external service, or another queue solely to store these files.
- The Bridge worker must not mount or directly write Atlas's DocumentStore; Atlas owns the credentialed persistence/retrieval boundary.
- Preserve eventual portability to a production S3-compatible storage implementation without embedding local filesystem paths into document contracts.

### 6.2 Required asset identity and integrity

Each derived asset must be tied to the original authorized PDF/document, source SHA-256, qualified perception profile/version, source page, and visual locator. Persist or record the asset's verified media type, byte length, and content hash. Stable keys must prevent conflicting bytes from overwriting an already accepted identity. Avoid business names, credentials, and unsafe path traversal in storage keys.

Asset bytes should match the valid decoded Docling-returned image used for that execution. Do not imply the derived PNG is byte-identical to an object embedded in the original PDF; it is a derived representation of the PDF's picture evidence.

### 6.3 Required retrieval contract

Define a bounded Atlas-authorized internal resolver suitable for later deterministic semantic-context assembly and Sources UI read paths. It must verify caller/source scope and asset identity, reject nonexistent or tampered content, and never disclose absolute filesystem paths or general-purpose storage grants. Sources UI rendering itself remains excluded.

The normalized document stores stable `assetRef` values, while Atlas's metadata layer indexes source-to-derived relationships. PostgreSQL must not be used to hold embedded image payloads as ordinary normalized or replay JSON.

## 7. Durable handoff, acceptance, and replay

The current Bridge result replay stores JSON, and the Atlas result acceptance transaction commits PostgreSQL state; neither transaction can automatically roll back a separate filesystem/object write.

**Invariant:** Before a normalized result containing any `assetRef` becomes replayable or accepted, every referenced image must be durably persisted, re-readable, integrity-verified, and bound to the correct source/profile identity. An accepted `perceived` document with a dangling asset reference is forbidden.

Codex must identify a bounded implementation approach that preserves these stages and guarantees:

1. Validate source identity and raw Docling output.
2. Validate and safely persist derived image bytes via Atlas-controlled authority, with bounded transfer and idempotent identities.
3. Establish a verified asset manifest/binding; only then construct or stage replayable normalized JSON containing those references.
4. Validate normalized output and referenced assets at the Atlas result-acceptance boundary.
5. Commit normalized cache, derived-asset metadata, perception execution completion, and durable member `perceived` state under existing Atlas transaction semantics.
6. Acknowledge/clear Bridge replay state only under existing successful delivery rules.

Do not force this exact implementation order if the chosen transactional protocol achieves the same invariants; explicitly document its state machine and failure behavior.

Required failure/replay scenarios:

- Restart after a blob is written but before the normalized result is staged.
- Restart after staging but before Atlas acceptance.
- Acceptance succeeds but its acknowledgement is lost.
- Duplicate delivery of the same result; conflicting delivery of different bytes/identity.
- Partial/cancelled binary transfer and invalid image data.
- Atlas/database temporarily unavailable; readback/integrity failure.
- Orphaned unaccepted binary objects (safe reuse or bounded cleanup).
- Source grant expiration and rejected stale execution.
- Concurrency with existing two-permit gate; no extra perception slot consumption due to asset reads.

Do not store source PDF bytes, images, grants, service credentials, or binary-containing Base64 strings inside Bridge replay JSON, semantic job metadata, provider-admission metadata, or application logs.

## 8. Strict admission and non-recursion safeguard

**Source-admission invariant:** Only an original immutable PDF explicitly admitted through the authorized project-creation PDF selection or new-workspace document selection workflow may create document-perception work. This requirement applies to the existing backend selection/admission boundary; this ticket does not implement a new workspace UI.

Derived images, diagrams, charts, table content, table derivatives, and arbitrary crops:

- Are always descendants of an already admitted PDF, never additional source PDFs.
- Must never create `atlas.document` original-source records automatically.
- Must never become `atlas.extraction_bundle_document` members.
- Must never acquire original-PDF source-grant authority.
- Must never create new document-perception executions or pg-boss perception jobs.
- Must never re-enter Docling perception by retrieval, UI display, asset replay, cache invalidation, or semantic batch preparation.
- May be hydrated READ-ONLY for later semantic inference, which is NOT another Docling perception operation.

Enforce admission through exact Atlas source identity and authorization, not file-extension filtering alone. If future explicit reprocessing is authorized, it must start from the original PDF, not from an extracted image.

## 9. Profile identity, caching, and historical evidence safety

Codex MUST inspect together:

- `DOCLING_OPTION_PROFILE` and fixed request options in the adapter.
- `AGENTS_BRIDGE_QUALIFIED_ROUTES`, `route-registry.ts`, route extensions, adapter version, pinned image digest, and qualification reference.
- `ATLAS_D1_PERCEPTION_CAPABILITY_IDENTITY` and other Atlas capability-identity configuration.
- Atlas cache key: source SHA + perception contract version + capability + Atlas capability identity.
- Existing completion/result fingerprint behavior and replay records.

Changing a display profile string alone is not sufficient proof of new cache identity. The RUN-003 profile must not be served under old image-disabled evidence identity; existing historical results must not be overwritten or mislabeled.

The current DB authority can invalidate normalized cache rows and mark derived-asset records deleted. New derived-asset retention must not silently make previously accepted historical semantic evidence unretrievable. Define at minimum the relationship between cache invalidation, retained references, new qualified profiles, durable file deletion, and later reprocessing. Defer broad production retention/erasure policy to separately authorized work, but do not accept broken retained references.

## 10. Semantic handoff compatibility - preparation only

The scope stops at a complete, retrievable perception record. It must be compatible with the existing BSS-V2-004-03-03 deterministic source-unit builder and the planned IDSER-012-02-01 owned/context batch planning. Their approved boundaries and semantic source-ownership rules remain authoritative.

- Demonstrate offline that a deterministic, authorized consumer can retrieve the accepted normalized text/table content and each corresponding verified image using the original document, page, locator ID, and `assetRef`.
- Validate locator IDs against the actual Semantic V1 evidence-ref contract; text/table exact-excerpt grounding must remain possible.
- Do not infer that an asset pointer lets a text-only model understand image pixels.
- Preserve the distinction between visually meaningful but **uninterpreted** evidence and truly structural/decorative `non_fact` evidence. If Semantic V1 source inventory cannot represent this safely, document the downstream completeness-gate dependency instead of silently changing semantic contracts here.
- Do not implement image hydration into a provider request, model-specific multimodal messages, semantic source-slot ownership/batching, token/reservation estimates, candidate generation, semantic aggregation, reconciliation, or Sources UI rendering.
- Do not move `semantic_ready` into the perception phase. In current IDSER-012, the aggregated semantic result owns that state.

## 11. Resource, security, and operational requirements

- Preserve the approved 2 Atlas / 2 Bridge / 2 local Docling conversion-worker profile, one Uvicorn worker, CPU-only, Compose-private access, and fair admission.
- Verify effective timeouts, Docling raw-response bytes, Bridge-to-Atlas result body bounds, image content/size/dimension bounds, storage bounds, and any new authorized binary-transfer limit. Never silently loosen existing limits.
- Keep authenticated internal Atlas handoff and DB privileges; no Bridge access to Atlas tables/filesystem, no publicly callable Docling endpoint, no unrestricted fetch-by-path API.
- Require repeatability under sequential and concurrent controls. Different qualified profiles should not be mixed in one identity.
- A failed bound or performance gate is not a PASS because a concern was recorded. Halt and raise a specific human qualification/remediation decision if real evidence exceeds accepted bounds.
- Test in isolated Compose volumes and an isolated database; do not contaminate or modify shared developer DB for acceptance evidence.
- Avoid running heavyweight local VLM/Granite inference; RUN-003 explicitly captured figures without visual understanding.

## 12. Proposed review contract

The ticket generator may partition these into more granular executable review batches, but MUST preserve independent binary closure for every requirement.

| ID | Requirement | PASS condition |
| --- | --- | --- |
| RC-01 | RUN-003 effective capture profile | Runtime uses the exact frozen PDF/standard/no-OCR/image-embedded profile with newly qualified identity; pinned CPU versions and existing local capacity are verified. |
| RC-02 | Deterministic text and table mapping | All 254 Safara text elements and 4 tables / 69 cells are accounted for; rows, columns, captions and meaningful source text are not silently lost. |
| RC-03 | Figure/diagram mapping | All five RUN-003 picture objects are mapped with correct page, valid ID, useful geometry, and no invented business meaning. |
| RC-04 | Durable image storage | Five decoded image payloads are durably stored, have verified content hashes/metadata, and remain available across process/container restart. |
| RC-05 | Locator and excerpt integrity | Every emitted text/table/visual locator is unique, stable, and compatible with Semantic V1; exact text/table excerpts validate against trusted normalized content. |
| RC-06 | Source admission and authorization | Foreign source, unauthorized retrieval, malformed pointers, and derived-as-source attempts are rejected without new perception work or cross-document leakage. |
| RC-07 | Resource and qualified performance | Sequential/concurrent real-PDF checks respect existing runtime and payload/resource bounds; otherwise work stops for explicit human qualification decision (not PASS). |
| RC-08 | Offline semantic handoff readiness | A deterministic authorized consumer retrieves the accepted normalized content, table evidence, and verified image bytes with valid locators; no LLM/provider call occurs. |
| RC-09 | No recursive perception admission | Derived pictures, diagrams, charts, tables, and derivatives cannot become source-bundle members, acquire source grants, or enqueue perception jobs, including on replay/retrieval/UI-read paths. |
| RC-10 | Profile and cache isolation | New option profile, qualified route, Atlas capability identity, cache key and provenance are consistent; old and new profile results cannot be silently mixed. |
| RC-11 | Atomic logical handoff / replay safety | Partial writes, restarts, failed acknowledgements, duplicates and conflicting deliveries cannot leave accepted dangling pointers or duplicate logical effects. |
| RC-12 | Geometry, order and provenance | Page numbers, text/table/picture source correspondence, bounding-box origin and heading/caption evidence survive repeat mapping. |
| RC-13 | Historical evidence continuity | Cache/profile invalidation and later perception runs cannot silently invalidate still-retained accepted evidence; deletion/retention boundary is explicit. |
| RC-14 | Bounded asset resolution | Asset existence/hash/type/size and caller source binding are verified; nonexistent, foreign, tampered, oversized, path-traversal and unsupported payloads fail closed. |

**Review outcome rule:** All applicable rows must have concrete evidence. An open architectural decision, missing fixture, resource-bound violation, or unsupported lossless representation is a blocker/decision, not a fabricated PASS.

## 13. Required test/qualification matrix

Use RUN-002/RUN-003 frozen source artifacts for fixture-based mapping tests and separately use isolated real Compose execution for integration proof. Never substitute a fixture PASS for real source-grant, storage, replay, or concurrency proof.

| Test family | Required demonstrations |
| --- | --- |
| Mapping fixtures | Repeat deterministic text/table/visual mapping; 254/4/69/5 accounting; rejected malformed/missing page metadata; source ID collision and invalid-ID negative cases. |
| Table fidelity | Header and row association, meaningful spans, exact excerpts, unsupported-complex-table fail-closed behavior, no fabricated cell data. |
| Figure fidelity | Pages 3/5/7/8/10, image decode, content hash, geometry coordinate conversion, caption preservation, no VLM-derived meaning. |
| Storage | Save/read/restart; byte/hash verification; missing file, tampered content, oversize image, unsafe asset path, cross-document and stale source/profile. |
| Replay | Duplicate result, acknowledgement loss, crash between write/stage/accept, invalid grant, partial/cancelled transfer, orphan policy, conflicting asset identity. |
| Admission | Derived-asset read, Sources-like read, semantic-like read, cache invalidation and duplicate replay do not create `atlas.document` membership or pg-boss perception jobs. |
| Integration | Atlas-authenticated source PDF -> actual RUN-003 Docling profile -> Atlas accepted V1 -> durable `perceived`; verify zero semantic execution/job. |
| Resource/concurrency | Two actual simultaneous Docling conversions with held third, bounded response/storage, no capacity regression, deterministic material results under qualified limits. |

Use repository-approved test PDFs and current integration harnesses; do not use the shared developer DB for qualification.

## 14. Explicit exclusions

- No implementation work during ticket generation and no implicit GO.
- No OCR/scanned-PDF support, full-page imaging, GPU, Granite, VLM pipeline, picture description, picture classification, chart data interpretation, or remote inference.
- No production semantic provider integration, actual image-to-model transport, provider admission, semantic batching/token budgeting, candidate finalization, or semantic aggregation.
- No changes to semantic meaning, reconciliation, review decisioning, publication, Main Workflow/Project Facts projections, CES, or chatbot.
- No Sources UI or new workspace-selection modal implementation.
- No new infrastructure storage service, queue service or broker.
- No broad DocumentStore privilege change, unnecessary contract V2, or unapproved historical-ticket rewrite.

## 15. Exact ticket-generation instructions for Codex

1. Record the current branch, HEAD commit, and paths inspected. Check the original IDSER-012 umbrella, the approved IDSER-012-01-01/-02 tickets, the planned IDSER-012-02-01 ticket, BSS-V2-004-03-03, and relevant BSS/IDSER qualification artifacts.
2. Reconcile this context with current code. If material assumptions no longer hold, report differences and proposed decisions; do not guess or silently widen scope.
3. Produce the smallest executable review ticket or an explicit partition under proposed `IDSER-012-01-03`. If needed, partition into `IDSER-012-01-03-01` (qualified profile + deterministic mapping) and `IDSER-012-01-03-02` (asset handoff/persistence + replay/authorization/qualification). Do not claim the first is a production-complete pipeline.
4. Preserve one parent outcome, predecessor CK gate, and a terminal `perceived` stop. Each proposed child needs dependencies, exact owned behavior, forbidden behavior, binary review contracts, negative/security tests, and GO/CK evidence requirements.
5. Identify additive amendments required to the existing IDSER-012-01 umbrella and downstream IDSER-012-02 planning dependency so later semantic batch work can consume evidence without taking over this ticket's storage authority.
6. Preserve the approved historical implementation and CK evidence of IDSER-012-01-02. Do not renumber existing IDSER-012-02 tickets or silently change legacy bundles.
7. Clearly distinguish currently implemented behavior, laboratory-only evidence, newly required work, and decisions that must be raised for human authority.
8. Generate **planning documents only**; no production source edits, database migration, destructive Docker action, external model call, or shared DB mutation. Stop after planning artifacts and await explicit human authorization.

### Relevant initial code/doc checklist

```text
apps/agents-bridge/src/providers/docling.ts
apps/agents-bridge/src/document-perception-worker.ts
apps/agents-bridge/src/perception-result-replay.ts
apps/agents-bridge/src/atlas-perception-client.ts
apps/agents-bridge/src/route-registry.ts
apps/agents-bridge/src/config.ts
packages/atlas-core/src/document-perception.ts
packages/atlas-core/src/perception-internal-route.ts
packages/atlas-contracts/src/perception.ts
packages/atlas-contracts/src/semantic-v1.ts
packages/atlas-contracts/src/semantic.ts
packages/document-store/src/local-filesystem-document-store.ts
packages/atlas-db/src/perception-authority.ts
packages/atlas-db/migrations/0005_bss009_atlas_perception_authority.sql
packages/atlas-db/migrations/0021_idser012_staged_perception_admission.sql
apps/atlas/perception-internal.ts
docker-compose.yml
project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-staged-worker-pipeline-realignment.md
project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-01-fair-bounded-local-docling-perception.md
project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-01-02-two-worker-docling-perception-composition.md
project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-02-01-deterministic-semantic-batch-planning.md
project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-004-03-03-normalized-document-source-units.md
project's goal/Backend_Phase/atlas-provider-admission-staged-semantic-pipeline-implementation-context.md
```

## 16. Frozen terminal acceptance

```text
Authorized original PDF explicitly selected by user
  -> existing Atlas-controlled source admission / perception queue
  -> qualified pinned Docling RUN-003 capture-only standard pipeline
  -> complete source-grounded text + table + picture mapping
  -> verified Atlas-owned durable derived image assets
  -> valid cross-contract locators and authorized asset references
  -> one accepted NormalizedDocument V1
  -> durable perceived lifecycle state
  -> offline semantic consumer can access evidence
  -> ZERO semantic calls / jobs / aggregation
  -> STOP
```

**`semantic_ready` remains a downstream IDSER-012-02 outcome.**

**No derived image, diagram, chart, or table may recursively become a source PDF, bundle document, or perception queue item.**
