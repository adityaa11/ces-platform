# Atlas Initial Draft Semantic Extraction and Reconciliation Implementation Context

Status: Authorized implementation context for downstream ticket decomposition
Phase name: Initial Draft Semantic Extraction and Reconciliation
Ticket-set prefix: IDSER
Repository: adityaa11/ces-platform
Branch inspected: codex/new-atlas-backend
Reviewed branch HEAD: efc4f997fc883cb9d7b2e9617516aabda6a7686b
Encoding: UTF-8, ASCII-safe Markdown

---

## 1. Purpose

This implementation context authorizes the first production semantic-processing phase after the completed Project Cards and PRD Intake phase.

The completed PCC ticket set already creates a real Atlas project from the authenticated production flow. It stores immutable PRD PDF bytes through the approved DocumentStore, creates Atlas project metadata in PostgreSQL, creates the creator membership, creates an empty Master workspace, creates the system bootstrap `initial_draft` workspace, persists document metadata, and renders the production project card in `Waiting for extraction` state.

PCC intentionally stops before Document Perception and before any semantic work.

This phase extends that frozen handoff into a real background semantic pipeline. It must:

1. group the PRDs selected in one project-creation submission into one durable extraction bundle;
2. use the existing BSS-006 pg-boss and Agents Bridge worker foundation;
3. process the bundle procedurally, one PRD at a time;
4. reuse the approved BSS-009 Document Perception pipeline for each PRD;
5. perform production semantic extraction with Mistral structured reasoning through Agents Bridge;
6. validate and persist Atlas-owned semantic candidate state;
7. reconcile each processed PRD against relevant incoming semantic state already produced inside the same bundle;
8. detect same-document and cross-document semantic disagreement without silently selecting a winner;
9. persist validated reconciliation relationships and reviewable unresolved state;
10. create the first production semantic retrieval/index foundation required by later review projections, PRD Lens filtering, chatbot retrieval, CES reasoning, and dependency expansion;
11. update the production project-card lifecycle and progress from persisted bundle state; and
12. stop at `Validated Reviewable State` / `Ready for review`.

This phase must prepare clean downstream contracts for the next implementation phase without implementing the next phase itself.

---

## 2. Authoritative source baseline

The implementation and generated ticket set must use the following sources together.

### 2.1 Primary architecture sources

- `project's goal/Backend_Phase/atlas-core-architecture-checkpoint-v2-mistral-enriched-v2.md`
- `project's goal/Backend_Phase/atlas-backend-production-baseline-mistral-synced.md`

The following architecture rules from those documents are authoritative:

- immutable human-readable project documents are the reconstructable source;
- Document Perception and Semantic Extraction are separate capabilities;
- semantic output is candidate meaning, not accepted truth;
- provider output must pass Atlas schema and reference/evidence validation;
- retrieval discovers relevant context but does not decide truth;
- reconciliation proposes semantic relationships and may remain unresolved;
- `Validated Reviewable State` is distinct from `Resolved Workspace Knowledge`;
- Main Workflow, Project Facts, CES, review projection, and chatbot must operate over shared stable Atlas semantic identities;
- review/chat operations must be bounded and incremental by default;
- PostgreSQL is the canonical persistent store for Atlas-owned semantic/review state and indexes;
- DocumentStore remains the immutable source-byte boundary;
- Agents Bridge receives bounded Atlas-authorized context and never becomes Atlas truth authority;
- Mistral is the first provider qualification direction, not permanent architecture authority;
- pg-boss remains the approved expensive-work queue; and
- no new service boundary is required for semantic/review/chat capabilities.

### 2.2 Frozen predecessor application source

The entire latest PCC ticket set is frozen and inherited:

- `project's goal/Backend_Phase/tickets/Project_Cards_Phase/README.md`
- `PCC-001-atlas-project-domain-and-persistence.md`
- `PCC-002-document-store-backed-project-creation.md`
- `PCC-003-production-project-http-boundary.md`
- `PCC-004-authorized-home-project-read-and-card-projection.md`
- `PCC-005-production-project-library-and-create-ui.md`
- `PCC-005-cfc-ck004-validation.md`
- `PCC-006-project-card-creation-e2e-and-regression-checkpoint.md`

PCC-006 is the hard predecessor checkpoint. It proves that a real authenticated production project can be created with:

- one project;
- creator owner membership;
- one empty Master workspace;
- one system `initial_draft` workspace;
- one or more immutable PRD documents in DocumentStore;
- matching Atlas document metadata; and
- zero perception, semantic, review, CES, revision, or publication state.

This phase is allowed to extend that state. It is not allowed to rewrite the reason PCC stopped there or invalidate the PCC authority boundaries.

### 2.3 Frozen Stack Setup dependencies

The following approved BSS foundations are inherited and must be reused rather than reopened:

- `BSS-005-agents-bridge-service-foundation.md`
- `BSS-006-pg-boss-background-runtime.md`
- `BSS-007-document-store-foundation.md`
- `BSS-008-mistral-provider-adapter.md`
- `BSS-009-document-perception-pipeline.md`
- `BSS-009-01-atlas-perception-authority.md`
- `BSS-009-02-bridge-perception-integration.md`

Key inherited implementation facts at the reviewed HEAD:

- `apps/agents-bridge` already exists as the provider-neutral reasoning service;
- `agents-bridge-worker` already exists as a Compose-managed worker process;
- pg-boss already owns queue delivery, retry/backoff, concurrency, acknowledgement, and worker coordination;
- Bridge-owned idempotency/lease state already exists under the `bridge` authority boundary;
- `atlas-document-perception-v1` already exists as the BSS-009 perception queue;
- `MistralProvider.structured(...)` already supports JSON-Schema-constrained Mistral structured reasoning and Bridge-side schema revalidation;
- `MistralProvider.perceive(...)` already supports the BSS-009 OCR capability;
- `NormalizedDocument` already exists as the provider-neutral perception contract;
- `worker-main.ts` currently injects `TestRuntime` into the generic BSS-006 background reasoning worker while separately wiring the BSS-009 perception handler; and
- no production semantic skill registry/dispatcher currently replaces that placeholder generic reasoning path.

### 2.4 Prototype skill references

The following fixture/prototype-era skills may be inspected for semantic intent only:

- `.agents/skills/atlas-prd-extraction`
- `.agents/skills/atlas-fixture-repository`
- `.agents/skills/atlas-fixture-changes`
- `.agents/skills/atlas-fixture-projections`
- `.agents/skills/atlas-fixture-verification`

They are not production runtime authorities.

Their useful invariants may be carried forward, especially source-grounded candidate extraction, source accounting, candidate-vs-accepted separation, conflict preservation, and evidence fidelity.

Their fixture repositories, fixture change objects, fixture projection runtime, and model-verifier authority must not become production dependencies.

---

## 3. Starting state

At the start of this phase a successfully created production project has this logical state:

```text
Project P
|
+-- Master workspace M
|   +-- kind = master
|   +-- state = empty
|   +-- no accepted revision
|   +-- no HEAD advancement
|
+-- Bootstrap workspace W
    +-- kind = initial_draft
    +-- state = draft
    +-- D1
    +-- D2
    +-- ...
    +-- DN

Project card:
    Waiting for extraction
    0 of N PRDs processed
    0 percent
```

The PRD bytes are already immutable DocumentStore objects.

The document rows already retain:

- stable document ID;
- project ID;
- workspace ID;
- original filename metadata;
- Atlas-only storage key;
- source SHA-256;
- byte size;
- media type;
- creator identity; and
- creation time.

There is no extraction bundle yet at the PCC checkpoint.

There is no requirement to recreate or re-upload the PDFs.

---

## 4. Required end state

This phase is complete only when the production system can reach this state through the real background pipeline:

```text
Project P
|
+-- Master M
|   +-- still empty
|   +-- no accepted revision
|   +-- no publication
|
+-- Bootstrap workspace W
    +-- kind = initial_draft
    +-- one durable extraction bundle B
    +-- bundle membership D1..DN
    +-- every document perception completed
    +-- every document semantic extraction validated
    +-- every document incremental reconciliation validated
    +-- complete semantic candidate store
    +-- complete evidence links
    +-- complete reconciliation relationship state
    +-- initial deterministic semantic retrieval/index state
    +-- unresolved semantic conflicts/ambiguities preserved
    +-- state = ready_for_review

Project card:
    Ready for review
    N of N PRDs processed
    100 percent
```

No candidate becomes accepted truth merely because the bundle completed.

No Main Workflow, Project Facts, CES Result, human review decision, resolved knowledge, revision, approval, publication, or Master HEAD movement is created by this phase.

---

## 5. Canonical pipeline

The production pipeline for this phase is frozen as:

```text
PCC project creation
        |
        v
Atlas extraction bundle
        |
        v
ordered bundle document D1
        |
        v
BSS-009 Document Perception
        |
        v
NormalizedDocument
        |
        v
atlas.semantic.extract
        |
        v
Atlas deterministic validation
        |
        v
persist semantic extraction result
persist semantic candidates
evidence links
retrieval/index anchors
        |
        v
atlas.semantic.reconcile
        |
        v
Atlas deterministic validation
        |
        v
persist reconciliation result
persist reconciliation relationships
        |
        v
mark D1 processed
        |
        v
schedule D2
        |
        v
repeat until DN
        |
        v
bundle completion validation
        |
        v
Validated Reviewable State
        |
        v
workspace/card = Ready for review
        |
        v
STOP
```

The bundle is processed sequentially inside the bundle but different bundles may execute concurrently.

---

## 6. Identity model

Runtime identity and authorization must use stable IDs.

The authoritative scope chain is:

```text
project_id
workspace_id
bundle_id
document_id
execution_id
semantic_id
```

Human-readable names must never establish runtime identity.

The display wording `Initial Draft` is not reserved.

The system classification `kind = initial_draft` remains valid and means only that the workspace is the system-created bootstrap workspace for a project that does not yet have accepted Master work.

A future user-created workspace may legally have the display name `Initial Draft` and must remain a different workspace because its `workspace_id` is different.

No queue key, reconciliation scope, bundle lookup, PRD Lens filter, publication lineage, or authorization rule may depend on a workspace display name.

---

## 7. Workspace-model preparation for future branching and Pull from

This phase must correct the current workspace model only where required so it does not block the later Git-like workspace lifecycle.

The future invariant is:

```text
bootstrap initial_draft
    may have no accepted base

all later user-created workspaces
    must have a base lineage
    whose ancestry reaches Master
```

The later publication invariant is:

```text
workspace current Master baseline revision
    must equal
current project Master HEAD revision

before publication can commit
```

If Master advances, another workspace must remain stale until an explicit future `Pull from` operation incorporates the new Master state. Atlas must never silently advance the workspace baseline.

This phase must therefore implement the following preparation now:

1. workspace identity must remain independent from display name;
2. the production schema must not reserve the display text `Initial Draft`;
3. the current `(project_id, kind)` uniqueness rule must not become the future mechanism that prevents multiple ordinary user workspaces;
4. exactly one system Master and exactly one bootstrap `initial_draft` must remain enforceable for the current project lifecycle;
5. the domain model must be extensible to a future ordinary workspace kind without replacing existing workspace IDs; and
6. no fake revision, fake Master HEAD, or incomplete baseline revision is created merely to pre-seed future Pull-from support.

The revision/base fields themselves are not persisted in this phase because the revision/publication model does not exist yet. They must be introduced together with the real revision authority later rather than storing fake or non-FK revision identities now.

The future design must remain able to represent, without changing existing workspace identities:

```text
origin_base_workspace_id
origin_base_revision_id
initial_master_baseline_revision_id
current_master_baseline_revision_id
```

This preparation is architectural compatibility, not implementation of workspace creation, branching, Pull from, or publication.

---

## 8. Extraction bundle contract

The PRDs submitted together by the project-creation modal belong to one durable Atlas extraction bundle.

For the PCC bootstrap creation flow there is exactly one bundle created for the initial PRD cohort.

The canonical logical records are:

```text
atlas.extraction_bundle
atlas.extraction_bundle_document
```

Equivalent physical naming is allowed only if the generated ticket explicitly documents why it follows an existing repository naming convention. The responsibilities and invariants are not optional.

### 8.1 Bundle fields

The bundle must persist at minimum:

```text
id
project_id
workspace_id
state
semantic_contract_version
reconciliation_contract_version
expected_document_count
completed_document_count
created_at
started_at
completed_at
last_failure_code
last_failure_at
```

`last_failure_code` and `last_failure_at` may be null when no technical failure exists.

The bundle must not store accepted truth.

### 8.2 Bundle document fields

Each bundle member must persist at minimum:

```text
bundle_id
document_id
sequence
state
perception_execution_id
semantic_extraction_execution_id
semantic_reconciliation_execution_id
started_at
completed_at
last_failure_code
last_failure_at
```

Execution IDs may be null until that stage is created.

### 8.3 Bundle manifest rules

The bundle manifest is immutable once processing begins.

The sequence is the source-upload order from the creation command.

A document may not be inserted into or removed from an active bundle.

The bundle is a provenance and cohort identity. It is not semantic truth and it does not establish document precedence.

The schema must allow future workspaces to own different bundle IDs even when the files are identical.

The schema must not prohibit future multiple bundles in one workspace, because later Addendum or other bounded document-intake cycles may require their own cohort identities.

### 8.4 PRD Lens preparation

The following provenance chain must remain queryable without semantic re-extraction:

```text
project
 -> workspace
 -> bundle
 -> document
 -> semantic candidate
 -> evidence
 -> reconciliation relationship
 -> future projection reference
```

This is the storage basis for the later PRD Lens.

No PRD Lens UI is implemented here.

---

## 9. Project creation extension and reliable pipeline kickoff

PCC's source-storage safety remains frozen:

```text
validate upload
 -> DocumentStore.put all PRDs
 -> one Atlas PostgreSQL transaction
```

This phase extends the PostgreSQL transaction after source storage succeeds.

The successful transaction must atomically create:

```text
project
owner membership
Master workspace
initial_draft workspace
document metadata
extraction bundle
ordered bundle membership
first document perception execution/source grant
first atlas-document-perception-v1 pg-boss job
```

The first perception job must become visible only if the project/bundle transaction commits.

A committed project must not depend on a best-effort in-memory callback to start its first job.

A process crash between database commit and a separate enqueue call must not be able to leave a newly created project permanently orphaned in `Waiting for extraction` merely because the kickoff was lost.

Use the approved BSS-006 PostgreSQL/pg-boss transactional enqueue capability or an equivalent transactionally coupled implementation over the same PostgreSQL queue.

Do not introduce a polling service, Redis, Kafka, a second queue framework, or a second worker to solve kickoff reliability.

If the existing repository/authority interfaces cannot compose the Atlas transaction and first perception enqueue, add a bounded persistence/application seam that allows the existing responsibilities to participate in one transaction. Do not weaken atomicity and do not reopen BSS-007 or BSS-009 architecture.

PCC's rule still applies: raw source bytes are written before the Atlas metadata transaction. DocumentStore rollback/delete authority must not be invented.

---

## 10. Procedural processing invariant

Documents inside one bundle are processed strictly by `sequence`.

For bundle B with D1, D2, D3:

```text
D1
 -> perception
 -> extraction
 -> validation
 -> reconciliation
 -> complete

D2
 -> perception
 -> extraction
 -> validation
 -> reconciliation against bounded relevant D1 + D2 semantic state
 -> complete

D3
 -> perception
 -> extraction
 -> validation
 -> reconciliation against bounded relevant D1 + D2 + D3 semantic state
 -> complete
```

The next document must not begin semantic processing before the previous document has reached validated reconciliation completion.

Different bundles may be processed concurrently according to the existing worker concurrency settings.

Therefore the concurrency rule is:

```text
parallel across bundles
sequential within one bundle
```

Processing order is never truth priority.

D2 does not supersede D1 merely because D2 was processed later.

D1 does not become base truth merely because it was processed first.

All bundle documents are incoming candidate sources until later governed review.

---

## 11. Atlas-owned orchestration

Atlas owns the semantic lifecycle.

Agents Bridge executes bounded provider reasoning but does not decide which document runs next.

Every stage transition must be driven by durable Atlas state.

The canonical orchestration is:

```text
Atlas transaction creates/schedules stage
        |
        v
pg-boss delivers job
        |
        v
Agents Bridge worker executes bounded provider capability
        |
        v
Bridge delivers typed result to Atlas internal boundary
        |
        v
Atlas validates result
        |
        v
Atlas transaction persists trusted/reviewable derived state
and transactionally schedules the next stage
```

The result-delivery transaction is the stage boundary.

If result validation fails, the next stage must not be scheduled.

If persistence or next-stage enqueue fails, the result delivery must fail so the Bridge replay path can safely redeliver the same result.

No in-memory queue callback may be the only source of lifecycle advancement.

---

## 12. Queue and worker implementation

### 12.1 Reuse existing worker

This phase must use the existing Compose-managed `agents-bridge-worker` created by BSS-006.

Do not create:

- another worker service;
- another Fastify service;
- another Mistral service;
- Redis;
- Kafka;
- RabbitMQ; or
- any other queue technology.

### 12.2 Existing perception queue

Continue using:

```text
atlas-document-perception-v1
```

for BSS-009 Document Perception.

Do not redesign the BSS-009 source grant, OCR, NormalizedDocument, cache, or result-delivery authority.

### 12.3 Semantic background transport

Production semantic reasoning must use the existing BSS-006 generic background queue:

```text
bridge-background-execution-v1
```

with versioned skill identities:

```text
atlas.semantic.extract / v1
atlas.semantic.reconcile / v1
```

Do not add separate queue technologies or duplicate the BSS-006 generic reasoning transport merely to name extraction and reconciliation differently.

The job envelope remains provider-neutral and must be validated through `@atlas/contracts`.

### 12.4 Replace placeholder runtime for production semantic jobs

`worker-main.ts` currently supplies `TestRuntime` to the generic background worker.

This phase must add a real production semantic skill dispatcher/runtime for the two authorized semantic skill IDs above.

`TestRuntime` may remain only where explicitly needed by BSS foundation tests. It must not execute real production semantic jobs.

For production semantic execution, the dispatcher must invoke the existing BSS-008 `MistralProvider.structured(...)` capability. `atlas.semantic.extract / v1` and `atlas.semantic.reconcile / v1` must therefore execute through the real Mistral structured-reasoning adapter rather than through a test runtime, fixture runtime, local pseudo-model, or alternate provider path.

Unknown skill IDs must fail closed.

Client/job payloads must not select arbitrary provider names, Mistral model IDs, endpoints, or provider-specific parameters.

Capability/model selection remains Bridge-owned through the BSS-008 provider adapter.

### 12.5 Real Mistral credential and Compose requirement

This phase must be implemented and accepted with the real BSS-008 Mistral adapter enabled in the Compose-managed production path.

The existing configuration boundary is authoritative:

```text
MISTRAL_API_KEY
MISTRAL_API_BASE_URL
MISTRAL_STRUCTURED_MODEL
MISTRAL_OCR_MODEL
MISTRAL_ZDR_APPROVED
MISTRAL_* limit/retry configuration
```

`MISTRAL_API_KEY` is a required secret for the live IDSER acceptance checkpoint.

The key must be supplied through environment/deployment secret configuration already consumed by `agents-bridge` and `agents-bridge-worker`. It must never be:

- written into this implementation context;
- committed to the repository;
- copied into a skill definition;
- persisted in Atlas or Bridge business records;
- returned to the browser;
- printed in logs, snapshots, test evidence, or review artifacts.

The Compose-managed `agents-bridge-worker` must instantiate the existing `MistralProvider` with the configured real key and use:

```text
MistralProvider.perceive(...)
    for the existing BSS-009 OCR path

MistralProvider.structured(...)
    for atlas.semantic.extract / v1
    for atlas.semantic.reconcile / v1
```

The production semantic path must not silently fall back to `TestRuntime` or mocked provider behavior when the real credential is absent. Missing or invalid credentials must produce a bounded provider/configuration failure for live semantic execution.

Deterministic mocked provider tests remain required for repeatable CI and contract coverage, but they are not sufficient to complete this implementation phase. The final IDSER acceptance checkpoint must also pass the required live Mistral validation defined later in this context.

---

## 13. Production skill package

Create the production reasoning-skill package boundary described by the architecture baseline.

The new workspace package is:

```text
packages/atlas-skills
```

This phase adds only:

```text
semantic-extraction
semantic-reconciliation
```

Each production skill must define:

- stable skill ID;
- skill version;
- bounded input contract;
- JSON Schema structured output contract;
- prompt/instruction template;
- model-neutral semantic rules;
- evidence/reference requirements; and
- explicit authority exclusions.

Provider-specific model names must not live in the skill definition.

The following future skills are not implemented in this phase:

```text
workspace-review-projections
semantic-mediator
addendum-author
ces-assessment
```

The package structure must allow those capabilities to be added later without moving or renaming the semantic IDs persisted by this phase.

---

## 14. Semantic execution context handoff

Semantic queue jobs must not contain raw PDFs, DocumentStore paths, storage keys, arbitrary database snapshots, or the entire project history.

The queue job contains execution identity and an Atlas-issued bounded context capability.

This phase must add an authenticated Bridge-to-Atlas semantic context handoff analogous in authority style to the existing BSS-009 perception handoff.

The context handoff must be execution-bound and scope-bound.

### 14.1 Extraction context

For `atlas.semantic.extract`, Atlas supplies exactly the authorized normalized representation for one document plus the identities required to bind the result:

```text
project_id
workspace_id
bundle_id
document_id
semantic_execution_id
NormalizedDocument
semantic contract version
```

The Bridge must not select another project, workspace, bundle, or document.

### 14.2 Reconciliation context

For `atlas.semantic.reconcile`, Atlas supplies exactly:

```text
project_id
workspace_id
bundle_id
current_document_id
reconciliation_execution_id
validated semantic candidates from the current document
bounded relevant incoming candidates already present in the same bundle
relevant evidence/reference metadata
reconciliation contract version
```

For the bootstrap Initial Draft there is no accepted base knowledge because Master is empty.

The context contract must already be able to evolve later to include bounded accepted base semantics without changing the meaning of the current fields.

### 14.3 Context access authority

The internal semantic context route must:

- require the Bridge service credential;
- validate the execution-bound context capability;
- verify project/workspace/bundle/document binding;
- enforce bounded response size;
- return no storage key;
- return no raw PDF bytes;
- return no unrelated project state; and
- reject stale, completed, cancelled, mismatched, or unauthorized execution requests.

Agents Bridge must not query Atlas PostgreSQL directly to discover semantic context.

---

## 15. Semantic result handoff and replay

The generic BSS-006 worker currently has no production trusted-state result sink for structured semantic output.

This phase must add a typed semantic result-delivery boundary from Agents Bridge back to Atlas.

The result envelope must bind:

```text
execution_id
skill_id
skill_version
project_id
workspace_id
bundle_id
document_id
structured result
provider provenance
```

Atlas must validate the persisted execution before trusting the envelope identities.

Bridge-delivered IDs never override Atlas-owned execution scope.

### 15.1 Result replay

Semantic provider output must be staged in a short-lived Bridge-owned replay/outbox record before trusted Atlas delivery, following the reliability principle already used by BSS-009 perception result delivery.

The replay record may contain the validated structured semantic result and provider provenance.

It must not contain:

- raw PDF bytes;
- DocumentStore keys;
- service credentials; or
- accepted project truth.

If Atlas successfully accepts the result but the acknowledgement is lost, replay must redeliver the same staged result rather than call Mistral again.

Atlas result acceptance must be idempotent by semantic execution identity plus completion fingerprint.

A second different result for an already completed execution must fail as a conflict rather than overwrite trusted/reviewable state.

---

## 16. Semantic Extraction contract

The production extraction capability is:

```text
atlas.semantic.extract / v1
```

It consumes one Atlas-authorized `NormalizedDocument`.

It must identify evidence-grounded candidate project meaning across at least these semantic kinds:

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

A candidate must represent one independently meaningful project statement rather than an arbitrary paragraph dump.

### 16.1 Structured extraction output

The v1 extraction result must contain:

```text
version
candidate_assertions[]
source_statement_inventory[]
questions[]
```

Each `candidate_assertion` must contain:

```text
local_candidate_id
semantic_key
kind
payload
normalized_meaning
source_wording when text wording exists
needs_resolution
evidence_refs[]
```

`local_candidate_id` is scoped to one extraction result and is not the canonical Atlas semantic ID.

Atlas owns canonical semantic identity after validation/persistence.

`payload` remains structured JSON and must not be flattened into a fixed business-domain SQL schema.

### 16.2 Evidence reference

Each extraction evidence reference must identify a real `NormalizedDocument` locator:

```text
page_number
locator_type
locator_id
excerpt when text-based evidence is used
```

Allowed locator types are:

```text
text_block
table
visual_region
```

Atlas must verify:

- the page exists;
- the locator exists on that page;
- the locator type matches the normalized source;
- the candidate belongs to the same document execution; and
- a text excerpt, when provided, is consistent with the referenced text/table source.

A provider may not invent page numbers or block/table/visual IDs.

### 16.3 Source accounting

Every non-empty normalized text block and table, and every labeled/meaningful visual region supplied to semantic extraction, must be represented by source accounting.

Each source-statement inventory entry must identify:

```text
source_unit_id
page_number
locator_type
locator_id
classification
destination_local_candidate_ids[]
non_fact_reason when classification is non_fact
```

Allowed classifications are:

```text
candidate
non_fact
```

A `candidate` inventory item must point to one or more candidate local IDs.

A `non_fact` item must include a bounded reason explaining why the normalized source unit does not establish project meaning.

Missing locators, nonexistent destinations, duplicate conflicting inventory identities, or dangling candidate references are deterministic validation failures.

This accounting exists to prevent silent source omission. It does not make the model an accepted-truth authority.

### 16.4 Extraction questions and ambiguity

The model may emit unresolved questions when actor, value, condition, scope, relationship, timing, or modality cannot safely be determined from the source.

Uncertainty is a valid semantic result.

The model must not fill missing source meaning with assumptions merely to produce a complete-looking workflow.

---

## 17. Atlas extraction validation and persistence

Provider structured output is not trusted merely because Mistral used constrained JSON output.

The required path is:

```text
Mistral structured result
 -> Bridge schema validation
 -> Atlas result-envelope validation
 -> Atlas semantic schema validation
 -> source/evidence reference validation
 -> source-accounting validation
 -> scope/identity validation
 -> idempotency/completion validation
 -> persistence
```

Atlas assigns or derives stable canonical semantic IDs only after the result is valid.

Retries/replays of the same completed extraction execution must resolve to the same persisted semantic identities rather than duplicating candidates.

The persistence layer must retain:

```text
semantic extraction execution/result
semantic candidate
semantic evidence/reference
knowledge-index anchors
```

---

## 18. Semantic storage model

This phase implements a hybrid semantic store.

The canonical rule is:

```text
JSON/JSONB carries semantic payload and complete model output.
Relational records carry identity, scope, lifecycle, provenance, evidence links,
relationships, and retrieval/index structure.
```

Do not convert every possible business fact into a dedicated SQL column.

Do not store only one opaque JSON blob and force every future consumer to reinterpret it.

### 18.1 Complete extraction result

Persist the complete validated extraction result as rebuildable Atlas derived state.

Canonical logical responsibility:

```text
atlas.semantic_extraction_result
```

It must retain at minimum:

```text
id
execution_id
project_id
workspace_id
bundle_id
document_id
contract_version
source_sha256
provider provenance
result_json JSONB
completion_fingerprint
created_at
```

The exact provider usage fields may be normalized according to the existing Bridge usage/provenance boundary.

### 18.2 Semantic candidate

Canonical logical responsibility:

```text
atlas.semantic_candidate
```

Each candidate must retain at minimum:

```text
id
extraction_result_id
project_id
workspace_id
bundle_id
document_id
semantic_key
kind
payload JSONB
normalized_meaning
source_wording when present
needs_resolution
state
created_at
```

Candidate `state` in this phase must represent candidate/reviewable lifecycle only. It must not imply accepted or resolved truth.

### 18.3 Semantic evidence

Canonical logical responsibility:

```text
atlas.semantic_evidence
```

Each evidence row must retain at minimum:

```text
id
semantic_candidate_id
document_id
page_number
locator_type
locator_id
excerpt when present
created_at
```

Evidence rows must never point to another document outside the extraction execution.

### 18.4 Full result as rebuild source

The complete extraction result is retained for:

- audit;
- debugging;
- provider qualification;
- deterministic revalidation;
- schema/contract migration;
- reindexing;
- integrity verification; and
- explicit rebuild.

Normal review/projection/chat serving must use addressable semantic records and indexes rather than repeatedly parsing the entire result JSON.

---

## 19. Initial knowledge-index and retrieval foundation

The architecture requires targeted retrieval before ordinary projection/chat/CES reasoning.

This phase must implement the first deterministic semantic index.

Canonical logical responsibility:

```text
atlas.knowledge_index
```

The v1 index must support efficient scoping/filtering by at least:

```text
project_id
workspace_id
bundle_id
document_id
semantic_id
semantic_key
kind
```

It must also support relationship/evidence traversal through their dedicated tables.

The index design must be extensible later toward:

```text
business object
property
actor
condition
workflow neighborhood
project terminology
dependency
revision
optional vector similarity
```

Vector embeddings are not required in this phase.

`mistral-embed` is not required in this phase.

Do not create an embedding dependency as a blocker for semantic extraction/reconciliation.

Retrieval always remains Atlas-owned.

---

## 20. Semantic Reconciliation contract

The production reconciliation capability is:

```text
atlas.semantic.reconcile / v1
```

It reasons over the current document's validated candidates plus a bounded relevant incoming semantic neighborhood from the same bundle.

For the bootstrap Initial Draft, Master is empty, so this phase primarily performs incoming-vs-incoming reconciliation.

The design must remain able to add accepted base semantics later without changing existing semantic IDs.

### 20.1 Required relationship vocabulary

The v1 relationship vocabulary is:

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

No later document automatically receives `supersedes` because it was processed later.

Supersession must be evidence-grounded.

If source material does not establish precedence or scope distinction, the relationship must remain ambiguous or require resolution.

### 20.2 Same-document reconciliation

Reconciliation must be capable of identifying conflict or relationship between two candidates extracted from the same PDF.

Example:

```text
page 3: quota = 40
page 8: quota = 45
```

Atlas must not select one value merely because one statement appears later in the PDF.

### 20.3 Cross-document reconciliation

Reconciliation must be capable of relating a current-document candidate to relevant prior incoming candidates already persisted from earlier documents in the same bundle.

Example:

```text
D1: manager approval threshold = 250m
D2: manager approval threshold = 200m
```

The result may be `contradicts` and `requires_resolution`.

It must not become `D2 overrides D1` unless the evidence itself establishes supersession.

### 20.4 Reconciliation output coverage

Every current-document semantic candidate must receive reconciliation accounting.

A candidate with no relevant relation to prior/same-document candidates is represented as `new`.

A reconciliation result may include multiple relationships for one incoming candidate where the semantic neighborhood requires it.

Every referenced semantic ID must already exist in the Atlas-authorized reconciliation context.

Provider-invented semantic IDs are validation failures.

---

## 21. Reconciliation storage

Persist the complete validated reconciliation result as rebuildable derived state and persist queryable relationship rows.

Canonical logical responsibilities:

```text
atlas.semantic_reconciliation_result
atlas.reconciliation_relationship
```

### 21.1 Reconciliation result

The complete result must retain at minimum:

```text
id
execution_id
project_id
workspace_id
bundle_id
current_document_id
contract_version
provider provenance
result_json JSONB
completion_fingerprint
created_at
```

### 21.2 Reconciliation relationship

Each relationship must retain at minimum:

```text
id
reconciliation_result_id
project_id
workspace_id
bundle_id
source_semantic_id
target_semantic_id when applicable
relationship_type
payload JSONB
requires_resolution
created_at
```

`new` may have no target semantic ID.

Every non-null target must belong to the same authorized project/workspace/bundle semantic scope for this bootstrap phase.

The relationship is a validated reconciliation proposal/reviewable relationship, not accepted truth.

---

## 22. Incremental neighborhood selection

The architecture forbids normal full-history scans.

This phase must not send the entire project corpus to reconciliation.

Atlas must construct a bounded relevant incoming neighborhood using deterministic semantic anchors available in v1, including at minimum:

```text
semantic_key
kind
workspace_id
bundle_id
current document scope
```

Relationship/dependency anchors may be added where available.

The initial implementation may use deterministic exact/structured anchors without vector embeddings.

If no prior candidate matches the bounded retrieval rules, the current candidate may be classified as `new`.

The ticket set must define explicit bounds for candidate count and serialized context size so reconciliation cannot silently become an unbounded all-project prompt.

---

## 23. Procedural stage advancement

After a perception result is accepted, Atlas must transactionally schedule semantic extraction for that document.

After an extraction result is accepted, Atlas must:

1. persist the complete extraction result;
2. persist canonical semantic candidates;
3. persist evidence references;
4. update the initial knowledge index;
5. create the reconciliation execution/context capability; and
6. enqueue `atlas.semantic.reconcile / v1` through `bridge-background-execution-v1` in the same trusted-state transaction.

After a reconciliation result is accepted, Atlas must:

1. persist the complete reconciliation result;
2. persist validated relationship rows;
3. mark the current bundle document complete;
4. increment/recompute the bundle's completed-document count deterministically;
5. if another document exists, create and enqueue the next document's BSS-009 perception operation; or
6. if no document remains, execute bundle completion validation and transition the workspace/bundle to review-ready state.

A stage result and its next-stage enqueue must not be split into two unrelated best-effort operations.

---

## 24. Failure semantics

Semantic uncertainty and technical processing failure are different states.

### 24.1 Valid reviewable semantic outcomes

The following are valid results and do not mark the bundle as technically failed:

```text
contradiction
ambiguity
source-internal inconsistency
possible supersession
partial supersession
unclear scope
unclear actor
unresolved condition
requires human resolution
```

These are exactly the kinds of states the next review phase must present.

A bundle containing such states may still reach `Ready for review`.

### 24.2 Technical/integrity failures

The following block stage advancement and result in `Needs attention` after the approved retry policy is exhausted or deterministic validation fails:

```text
perception failure
provider unavailable after retry budget
malformed structured output
schema validation failure
invalid evidence locator
invalid source-accounting destination
provider-invented semantic ID
wrong project/workspace/bundle/document binding
stale execution
completion-fingerprint conflict
reconciliation reference outside authorized context
persistence failure
transactionally coupled enqueue failure that cannot commit
corrupted bundle state transition
```

Do not convert these failures into semantic ambiguity.

Do not mark a failed document processed.

---

## 25. Idempotency, replay, and exactly-once logical effects

The BSS-006 narrow atomic-idempotency amendment remains authoritative.

Provider calls and queue delivery are at-least-once.

Atlas/Bridge logical completion must be exactly-once per stage idempotency identity.

Stage idempotency must be derived from stable runtime identity and contract version, never workspace names or filenames.

The logical key must distinguish at least:

```text
bundle_id
document_id
stage
contract_version
```

Replaying the same semantic execution must not duplicate:

- extraction result rows;
- semantic candidates;
- evidence rows;
- knowledge-index rows;
- reconciliation relationships;
- bundle progress; or
- next-stage jobs.

A different execution/result attempting to reuse a completed logical identity must fail closed.

---

## 26. Bundle and workspace lifecycle

The bundle state vocabulary for this phase is:

```text
waiting
processing
ready_for_review
needs_attention
```

The bundle-document state vocabulary is:

```text
pending
perception_queued
perceiving
extracting
reconciling
completed
needs_attention
```

The implementation may represent transient provider internals in execution tables, but the Atlas bundle/document lifecycle above is the application-level truth exposed to project-card reads.

The bootstrap workspace remains `draft` while processing and becomes `ready_for_review` only after bundle completion validation succeeds.

`ready_for_review` is not accepted, resolved, approved, or published.

Master remains `empty` throughout this phase.

---

## 27. Project-card read model and UI state

The PCC production card currently supports only:

```text
waiting-for-extraction
```

This phase extends the production card state vocabulary to exactly:

```text
waiting-for-extraction
extracting
needs-attention
ready-for-review
```

The state must be derived from persisted Atlas bundle/workspace/execution state, not timers, fixture state, browser inference, or queue length.

### 27.1 Progress definition

A PRD counts as processed only after all of these are complete for that document:

```text
valid NormalizedDocument
valid semantic extraction result
persisted semantic candidates/evidence/index anchors
valid incremental reconciliation result
persisted reconciliation relationships
```

OCR/perception completion alone does not count as a processed PRD.

The label is derived as:

```text
X of N PRDs processed
```

where X is the number of bundle documents in `completed` state and N is the bundle manifest count.

The progress percentage is derived from X/N.

### 27.2 Card-state rules

`waiting-for-extraction`:

- bundle exists;
- no document has begun active processing yet; and
- no technical failure exists.

`extracting`:

- bundle is processing; and
- at least one document/stage is in progress or queued as part of the active pipeline.

`needs-attention`:

- a technical/integrity failure blocks bundle advancement after the supported automatic retry behavior or deterministic validation failure.

`ready-for-review`:

- every bundle document is complete;
- bundle completion validation passed; and
- unresolved semantic conflicts/ambiguities, if any, are preserved as reviewable state rather than technical failures.

### 27.3 Production action boundary

This phase does not implement the review surface or Main Workflow/Project Facts/CES population.

If the production project action cannot navigate to a truthful review surface without implementing those out-of-scope features, keep the action unavailable and provide a truthful unavailable reason.

Do not route a production project to `/demo`.

---

## 28. Bundle completion validation

Before a bundle may become `ready_for_review`, Atlas must verify:

1. bundle manifest has not changed;
2. `completed_document_count == expected_document_count`;
3. every bundle document is `completed`;
4. every document has a completed perception execution;
5. every document has exactly one accepted logical extraction execution for the active contract version;
6. every document has exactly one accepted logical reconciliation execution for the active contract version;
7. all persisted candidate IDs resolve to their extraction result and scope;
8. all evidence references resolve to the correct document and normalized locator;
9. all reconciliation references resolve to authorized semantic IDs;
10. no stage is left queued/running/failed for the active bundle version;
11. no candidate/reconciliation result has been promoted to accepted/resolved knowledge; and
12. Master remains unchanged.

Only then may the bundle and bootstrap workspace become review-ready.

---

## 29. Validated Reviewable State produced by this phase

The reviewable state available at the phase boundary is:

```text
validated semantic candidates
+
validated reconciliation relationships
+
unresolved conflicts / ambiguities
+
evidence references
+
initial knowledge-index anchors
+
bundle/workspace/document provenance
```

This state must be queryable through persistence-neutral Atlas Core repository/application contracts.

It must not require direct Drizzle use from the UI or Agents Bridge.

It must remain distinguishable from:

```text
accepted project truth
resolved workspace knowledge
Master state
hypothetical state
future projection JSON
```

---

## 30. Preparation for the next projection implementation

The direct downstream projection implementation must be able to start from this phase's persisted semantic state without rereading source PDFs or redesigning storage.

The next production projection capability will reason through Agents Bridge/Mistral over bounded Atlas-selected semantic state.

The future production skill is expected to be:

```text
atlas.workspace-review-projections
```

Its inputs will be assembled from:

```text
validated incoming candidates
validated reconciliation relationships
evidence references
retrieval/index references
dependency references when available
current/base resolved knowledge when future workspaces have a base
validated CES references when CES assessment exists
review metadata
```

Mistral projection reasoning will organize relevant grouped information for human-facing surfaces.

Main Workflow and Project Facts must ultimately be derived from shared Atlas semantics and must not independently reinterpret PRDs.

CES remains a separate semantic reasoning capability. The CES Result projection may present validated CES assessment data, but projection must not silently perform CES discovery or turn unvalidated CES reasoning into project truth.

No projection skill or projection persistence is implemented in this phase.

---

## 31. Preparation for chatbot usage

The semantic store must support the later Conversational Semantic Mediator without loading the complete project history.

Future chatbot context must be retrievable by stable Atlas semantic IDs and bounded neighborhoods.

The current phase must make later calls possible for concepts equivalent to:

```text
get_semantic_item
get_evidence
get_reconciliation_relationship
search relevant workspace semantics
filter by bundle/document
```

The chatbot must later receive Atlas-selected context such as:

```text
workspace identity
selected semantic identity
current/incoming semantic state
bounded related semantic neighborhood
bounded evidence
bounded dependency context
```

No chatbot route, conversation persistence, model tools, semantic mediator skill, or correction flow is implemented here.

---

## 32. Deterministic Atlas vs Agents Bridge responsibilities

### 32.1 Atlas owns

Atlas is responsible for:

```text
project/workspace/bundle/document authority
bundle manifest
procedural sequence
queue scheduling decisions
semantic execution identity
context authorization
schema validation
scope validation
evidence validation
source-accounting validation
candidate identity
candidate persistence
reconciliation persistence
retrieval/index storage
progress calculation
bundle completion validation
project-card state
future review authority
future revision/HEAD/publication authority
```

### 32.2 Agents Bridge owns

Agents Bridge is responsible for:

```text
provider capability/model mapping
Mistral credentials
structured provider invocation
provider retry/cancellation within approved bounds
semantic extraction reasoning
semantic relationship reasoning
provider provenance/usage normalization
short-lived semantic result replay before Atlas acknowledgement
```

### 32.3 Agents Bridge explicitly does not own

Agents Bridge must not:

```text
query Atlas DB to discover work
scan project history
read DocumentStore
select documents
change bundle sequence
create canonical semantic IDs
persist Atlas semantic state directly
mark project-card progress directly
choose accepted truth
resolve human conflicts
create revisions
move HEAD
approve
publish
```

---

## 33. PostgreSQL and role boundaries

All new Atlas-owned semantic/bundle records belong under the Atlas authority namespace.

Bridge-owned operational replay/idempotency state remains under the Bridge authority namespace.

The `agents_bridge` database role must continue to be denied direct mutation of Atlas trusted/reviewable semantic tables.

Semantic result persistence occurs through authenticated Atlas internal result delivery, not direct Bridge SQL.

Migrations must be additive and ordered after the approved BSS/PCC migrations.

Do not rewrite or squash approved migrations.

---

## 34. Security requirements

The implementation must preserve these security boundaries:

- Better Auth establishes user identity at public application boundaries.
- Atlas membership remains the project authorization source.
- Background semantic jobs are created only from already authorized Atlas project/workspace state.
- Internal Bridge-to-Atlas context/result routes require the existing service-credential trust model or an equally strong scoped extension of it.
- Context grants/capabilities must be execution-bound and must not allow arbitrary project enumeration.
- Raw PRD bytes must not enter semantic reasoning queue payloads.
- DocumentStore storage keys must not enter semantic reasoning queue payloads, provider prompts, browser responses, or ordinary logs.
- Mistral API credentials remain Bridge-only.
- Provider error bodies that may contain prompts/document material must not be leaked.
- Full semantic payloads must not be logged as ordinary operational messages.
- Browser-facing project-card reads must expose only bounded safe lifecycle/progress data.
- Cross-project or cross-workspace semantic references must fail validation.

---

## 35. Data retention and rebuildability

The storage hierarchy is:

```text
Immutable PDF
    durable human-authored source

NormalizedDocument
    Atlas-owned rebuildable perception cache

semantic extraction result
semantic candidates/evidence/index
    Atlas-owned rebuildable derived semantic state

reconciliation result/relationships
    Atlas-owned rebuildable reviewable derived state
```

The semantic result is important operational state but does not replace the immutable source document as durable project evidence.

Explicit rebuild may recreate derived perception/semantic/index state from immutable documents under a later bounded rebuild operation.

Normal review/chat/projection operations must not require rebuild or full historical source scans.

---

## 36. Required repository/application seams

The ticket set must introduce persistence-neutral Atlas Core/application seams sufficient for:

```text
create/read extraction bundle
list ordered bundle documents
read bundle lifecycle/progress
create/read semantic execution identity
accept semantic extraction result idempotently
read semantic candidate by stable ID
list candidates by workspace/bundle/document
retrieve by semantic key/kind within scope
read candidate evidence
accept reconciliation result idempotently
read reconciliation relationships by semantic/workspace/bundle scope
perform bundle completion validation
advance to next document transactionally
project production card state from bundle/workspace persistence
```

Drizzle/PostgreSQL details remain under `packages/atlas-db`.

Agents Bridge must consume contracts rather than import Atlas DB adapters.

---

## 37. Current code seams that must be extended, not bypassed

The ticket generator must inspect the current implementation before assigning edits. At minimum the current seams include:

```text
packages/atlas-core/src/project.ts
packages/atlas-core/src/project-creation.ts
packages/atlas-core/src/perception-authority.ts
packages/atlas-core/src/perception-internal-route.ts
packages/atlas-core/src/document-perception.ts
packages/atlas-contracts/src/execution.ts
packages/atlas-contracts/src/perception.ts
packages/atlas-db/src/schema.ts
packages/atlas-db/src/project-repository.ts
packages/atlas-db/src/perception-authority.ts
apps/atlas/perception-internal.ts
apps/atlas/lib/home-project-read-service.ts
apps/atlas/components/project-card-view-model.ts
apps/atlas/components/ProductionProjectCard.tsx
apps/agents-bridge/src/worker-main.ts
apps/agents-bridge/src/worker.ts
apps/agents-bridge/src/queue.ts
apps/agents-bridge/src/perception-job.ts
apps/agents-bridge/src/document-perception-worker.ts
apps/agents-bridge/src/atlas-perception-client.ts
apps/agents-bridge/src/perception-result-replay.ts
apps/agents-bridge/src/runtime.ts
apps/agents-bridge/src/providers/mistral.ts
```

The exact edit list belongs to the ticket set after repository inspection.

Do not bypass these seams with duplicate infrastructure merely because a new semantic capability is being added.

---

## 38. Explicitly out of scope

This implementation context does not authorize:

```text
Main Workflow projection
Project Facts projection
CES Result projection
workspace review projection UI
attention queue UI
semantic group UI
human review decisions
review progress persistence
accepted workspace resolution
resolved workspace knowledge
approval
revision publication
Master HEAD advancement
Pull from
Master synchronization
new-workspace creation UI
workspace base selection UI
workspace ancestry validation for real user-created workspaces
PRD Lens UI
chatbot UI
conversation persistence
semantic mediator skill
Addendum authoring
correction flow
CES assessment reasoning
vector embedding integration
Mistral embed integration
new object-storage adapters
Cloudflare R2
S3 migration
Redis
Kafka
RabbitMQ
new worker service
new reasoning service
replacement queue framework
fixture repository as production authority
```

Do not add these as prerequisites or mandatory blockers.

---

## 39. Scope-drift prohibition

The ticket generator and implementation agent must not invent infrastructure work outside this context.

In particular:

- BSS-007 DocumentStore is the required source-storage abstraction. Do not require R2/S3.
- BSS-006 pg-boss is the required queue. Do not require Redis or another broker.
- BSS-005 Agents Bridge and its existing worker are the required reasoning execution boundary. Do not create another worker/service.
- BSS-008 Mistral structured reasoning is already the qualified provider path. Do not add another provider as a prerequisite.
- BSS-009 is the required perception path. Do not rebuild OCR/perception.
- PCC is the required project/document creation baseline. Do not replace it with a second intake flow.

If implementation discovers a concrete incompatibility with a frozen BSS/PCC contract that prevents this scope from being implemented, the ticket must stop and mark the issue as `SCOPE_CHANGE` with exact evidence.

It must not silently solve the problem by introducing unrelated infrastructure or broad architectural refactors.

---

## 40. Ticket decomposition constraints

The generated IDSER ticket set may split work into reviewable batches, but collectively it must cover every responsibility below in dependency order:

1. additive domain/schema foundation for workspace compatibility, extraction bundle, bundle membership, semantic/reconciliation storage, index, and Bridge semantic replay state;
2. production semantic contracts and `packages/atlas-skills` extraction/reconciliation definitions;
3. project-creation extension that creates the bundle and transactionally schedules the first BSS-009 perception job;
4. Atlas semantic context/result internal boundaries and idempotent result acceptance;
5. production Agents Bridge semantic dispatcher/runtime replacing TestRuntime for authorized production semantic jobs;
6. semantic extraction persistence, evidence/source-accounting validation, and index materialization;
7. incremental reconciliation retrieval, relationship persistence, and procedural next-document advancement;
8. bundle completion validation plus production project-card progress/state updates; and
9. Compose-backed end-to-end/regression proof.

Tickets may be split more finely for reviewability.

Tickets must not merge future projection/chat/publication work into this set.

Every dependent ticket begins only after its required predecessor review checkpoint passes under the repository's governed review workflow.

---

## 41. Required automated validation

The ticket set must add directly affected unit, integration, database, queue, worker, and application tests.

At minimum the completed phase must prove all of the following.

### 41.1 Bundle/domain tests

- project creation creates exactly one bootstrap bundle for the submitted PRD cohort;
- bundle membership preserves upload order;
- manifest cannot mutate after processing begins;
- bundle/document IDs, not workspace names, drive identity;
- duplicate display wording does not become an authority key;
- current Master/initial_draft uniqueness remains enforced while the schema no longer blocks future ordinary workspaces by global kind uniqueness.

### 41.2 Transaction/kickoff tests

- successful project creation commits project + bundle + first perception execution/job together;
- transaction rollback leaves none of them visible;
- no committed project depends on a lost post-commit enqueue callback;
- DocumentStore failure still exposes no Atlas project;
- PostgreSQL/queue transaction failure exposes no partial project graph.

### 41.3 Worker/contract tests

- only `atlas.semantic.extract/v1` and `atlas.semantic.reconcile/v1` are accepted by the production semantic dispatcher;
- unknown skill fails closed;
- arbitrary provider/model selection is rejected/not representable;
- semantic structured output is schema validated;
- provider failure, timeout, cancellation, malformed output, missing credentials, and invalid credentials map to bounded failures;
- deterministic CI/provider-contract tests may use mocked Mistral behavior and must not require secrets;
- mocked tests must prove the production dispatcher still calls the same BSS-008 provider-neutral Mistral capability boundary used by the live runtime;
- no production semantic job may execute through `TestRuntime`.

### 41.4 Extraction tests

Use synthetic normalized documents and/or synthetic PDFs through the real perception path to prove:

- one PDF with non-conflicting rules produces candidates/evidence/index rows;
- one PDF with two contradictory statements preserves both candidates and an unresolved relationship path;
- evidence pointing to a nonexistent page/block/table/visual region is rejected;
- dangling source-accounting destination is rejected;
- malformed provider JSON is rejected;
- replay of the same extraction result does not duplicate semantic IDs/rows;
- a conflicting second result for a completed execution is rejected.

### 41.5 Reconciliation tests

Prove:

- two PDFs that support the same meaning can be related as `supports`;
- duplicate meaning can be related as `duplicates`;
- refinement/extension can be represented without false supersession;
- contradictory values can be related as `contradicts` and remain unresolved;
- possible partial supersession remains reviewable;
- current document order does not force supersession;
- reconciliation cannot reference semantic IDs outside the authorized bundle context;
- every current-document candidate receives reconciliation accounting, including `new` when no related candidate exists.

### 41.6 Procedural/concurrency tests

Prove:

- D2 is not scheduled before D1 reconciliation completes;
- D3 is not scheduled before D2 reconciliation completes;
- two bundles may progress concurrently;
- semantic state from bundle B1 never appears in B2 reconciliation context;
- two workspaces with the same display name remain isolated by workspace/bundle IDs;
- worker restart/retry can resume from durable stage state without double effects.

### 41.7 Result-handoff replay tests

Prove:

- Bridge stages structured semantic result before trusted delivery;
- acknowledgement loss causes the same staged result to be redelivered;
- acknowledgement loss does not require another Mistral call;
- Atlas accepts identical replay idempotently;
- Atlas rejects different completion fingerprints for one completed execution.

### 41.8 Project-card tests

Prove exact persisted-state projections for:

```text
Waiting for extraction
Extracting
Needs attention
Ready for review
```

Prove that:

- processed count increments only after reconciliation completion;
- semantic conflict does not produce `Needs attention`;
- technical failure does produce `Needs attention`;
- `Ready for review` requires full bundle completion validation;
- published fact count remains zero;
- Master still reports no published work;
- no production route falls back to `/demo`.

### 41.9 Negative authority tests

Prove absence of:

```text
resolved_knowledge
approval
publication
Master HEAD movement
review decisions
CES assessment
projection state
conversation state
```

and prove Agents Bridge DB permissions still deny direct Atlas semantic mutation.

---

## 42. Required end-to-end scenarios

The final checkpoint has two mandatory layers:

1. a deterministic Compose-backed end-to-end suite using controlled/mock Mistral responses for repeatable semantic assertions; and
2. a live Compose-backed Mistral acceptance run using a real `MISTRAL_API_KEY` and the existing BSS-008 adapter.

The deterministic suite remains the authority for exact semantic classification assertions. The live run proves that the real production Agents Bridge, worker, BSS-009 OCR adapter, structured extraction adapter, structured reconciliation adapter, result handoff, Atlas validation/persistence, and bundle lifecycle operate together against the actual Mistral API.

At minimum, the deterministic suite must cover:

### Scenario A - one PRD, no conflict

```text
create project
 -> bundle created
 -> perception
 -> extraction
 -> reconciliation
 -> 1 of 1 processed
 -> Ready for review
```

### Scenario B - one PRD, internal conflict

```text
same PDF contains conflicting statements
 -> both semantic candidates persist
 -> conflict relationship persists
 -> bundle still reaches Ready for review
```

### Scenario C - multiple PRDs, support/duplicate

```text
D1 -> complete
D2 -> reconciles against D1
 -> support/duplicate relation persists
 -> procedural progress is correct
```

### Scenario D - multiple PRDs, contradiction

```text
D1 states value A
D2 states value B
 -> contradiction/requires-resolution persists
 -> no automatic winner
 -> Ready for review
```

### Scenario E - three-document order

Prove the worker/orchestrator never advances D2 or D3 before the prior document's reconciliation checkpoint.

### Scenario F - concurrent users/bundles

Two authorized users/projects or two independent bundles progress concurrently and never share context, results, progress, or semantic IDs.

### Scenario G - invalid semantic output

Invalid schema/evidence/reference fails the document stage and surfaces `Needs attention`; it does not mark the PRD processed.

### Scenario H - replay/restart

Simulate worker/result-delivery interruption and prove idempotent resume without duplicate semantic state.

### Scenario I - required live Mistral production run

Using the real Compose stack and a real `MISTRAL_API_KEY`, create a synthetic/non-confidential project containing at least two PDFs in one bundle and execute the complete production path:

```text
production project creation
 -> bundle creation
 -> real BSS-009 Mistral OCR
 -> NormalizedDocument persistence/cache
 -> real Mistral structured semantic extraction for D1
 -> Atlas validation/persistence
 -> real Mistral structured reconciliation for D1
 -> D1 processed
 -> real Mistral structured semantic extraction for D2
 -> Atlas validation/persistence
 -> real Mistral structured reconciliation for D2 against bounded D1 state
 -> D2 processed
 -> bundle completion validation
 -> Ready for review
```

The live checkpoint must prove from persisted/provider provenance and execution evidence that:

- OCR used the configured real Mistral OCR model through `MistralProvider.perceive(...)`;
- semantic extraction used the configured real Mistral structured model through `MistralProvider.structured(...)`;
- semantic reconciliation used the configured real Mistral structured model through `MistralProvider.structured(...)`;
- the worker did not use `TestRuntime` for either semantic skill;
- provider output passed the real structured JSON contract and Atlas deterministic validation;
- evidence references resolve to the real `NormalizedDocument` produced for each synthetic PDF;
- D2 did not begin semantic processing before D1 reached validated reconciliation completion;
- D2 reconciliation received only the bounded authorized prior semantic state from the same bundle;
- result delivery and Atlas persistence completed through the authenticated internal handoff rather than direct Bridge writes;
- provider/model/endpoint provenance is persisted or recorded through the approved provenance boundary without exposing the API key;
- the bundle reaches `Ready for review`; and
- no review decision, resolved knowledge, projection, publication, or Master HEAD movement is created.

The live scenario must not assert brittle natural-language phrasing from the model. Exact relationship semantics remain covered by the deterministic suite. The live scenario must assert contract-valid candidate/reconciliation output, valid evidence/reference accounting, real provider provenance, successful procedural advancement, and the final bounded lifecycle state.

---

## 43. Compose and provider validation rules

Docker Compose remains the authoritative execution environment for database, queue, Atlas app, Agents Bridge, Agents Bridge worker, migrations, and integration evidence.

The final checkpoint must record:

- reviewed HEAD;
- service health;
- exact commands;
- migration results;
- deterministic test counts;
- intentional skips unrelated to this phase;
- environment limitations;
- the configured Mistral model identities used for OCR and structured reasoning;
- proof that the live run used the real Mistral provider path; and
- secret-safe live execution provenance/results.

Deterministic CI and contract/integration tests may use mocked provider behavior and must remain runnable without `MISTRAL_API_KEY`.

IDSER phase acceptance itself additionally requires a live provider checkpoint. Before that checkpoint, the operator must provide a real `MISTRAL_API_KEY` to the Compose environment consumed by `agents-bridge` and `agents-bridge-worker`.

If `MISTRAL_API_KEY` is unavailable, invalid, rejected, or cannot reach the configured Mistral endpoints, the live checkpoint is `BLOCKED` or `FAIL` as appropriate. It must not be recorded as skipped while the phase is marked complete.

The live checkpoint must use synthetic/non-confidential PDFs unless deployment privacy controls have been explicitly approved for other material.

A live provider run does not replace deterministic contract/integration tests. Both layers are mandatory:

```text
deterministic mocked tests
    prove exact contracts, failures, ordering, and semantic edge cases

real Mistral Compose run
    proves the production adapter, credentials, network/provider boundary,
    worker, OCR, structured extraction, structured reconciliation,
    Atlas handoff, persistence, and lifecycle work together
```

No test command or evidence artifact may print `MISTRAL_API_KEY`.

---

## 44. Acceptance criteria

The IDSER phase is accepted only if all of the following are true.

### AC-01
The latest frozen PCC project-creation flow remains valid and `/demo` remains fixture-only authority.

### AC-02
Every newly created production project's submitted PRDs are assigned to one durable bootstrap extraction bundle in the same Atlas metadata transaction as the project graph.

### AC-03
The bundle uses stable project/workspace/bundle/document IDs; workspace display names are never identity or routing keys.

### AC-04
`kind = initial_draft` remains the system bootstrap classification, while the schema no longer makes the display text `Initial Draft` reserved or makes future ordinary workspaces impossible through global kind uniqueness.

### AC-05
The successful project transaction also creates and transactionally enqueues the first document's BSS-009 perception operation so kickoff cannot be lost after commit.

### AC-06
BSS-009 perception is reused unchanged as the PDF-to-NormalizedDocument boundary; no second OCR/document pipeline is introduced.

### AC-07
The existing BSS-006 `agents-bridge-worker` executes production semantic background reasoning; no second worker service or queue technology is introduced.

### AC-08
The existing `bridge-background-execution-v1` queue carries production semantic work using `atlas.semantic.extract/v1` and `atlas.semantic.reconcile/v1`.

### AC-09
A production semantic dispatcher replaces `TestRuntime` for those production skill IDs and unknown skills fail closed.

### AC-10
`packages/atlas-skills` contains production semantic-extraction and semantic-reconciliation skill definitions without provider-specific model IDs.

### AC-11
Semantic queue payloads contain bounded identities/capabilities and never raw PDF bytes, DocumentStore paths, or storage keys.

### AC-12
Agents Bridge obtains only Atlas-authorized execution-bound semantic context and cannot scan Atlas state independently.

### AC-13
Semantic extraction produces schema-valid evidence-grounded candidates, source accounting, and unresolved questions where meaning cannot safely be determined.

### AC-14
Atlas validates semantic schema, scope, evidence locators, source accounting, and idempotency before candidate persistence.

### AC-15
Atlas persists both the complete validated extraction JSON and independently addressable semantic candidate/evidence rows.

### AC-16
Semantic payload remains JSON/JSONB while relational structures carry identity, scope, provenance, evidence, relationships, lifecycle, and retrieval/index data.

### AC-17
The initial knowledge index supports project/workspace/bundle/document/semantic-key/kind scoping without requiring vector embeddings.

### AC-18
Reconciliation supports same-PDF and cross-PDF incoming-vs-incoming reasoning within the bundle.

### AC-19
The relationship vocabulary supports `new`, `supports`, `duplicates`, `refines`, `extends`, `contradicts`, `supersedes`, `partially_supersedes`, `ambiguous`, and `requires_resolution`.

### AC-20
Processing order never silently establishes truth priority or supersession.

### AC-21
Every current-document candidate receives reconciliation accounting and every referenced semantic ID is validated against the authorized context.

### AC-22
Atlas persists the complete reconciliation JSON and independently addressable relationship rows without promoting them to accepted truth.

### AC-23
One bundle advances documents sequentially; multiple bundles may run concurrently without semantic-context leakage.

### AC-24
Each accepted stage result and next-stage enqueue are transactionally coupled so a process crash cannot create a durable half-transition.

### AC-25
Bridge semantic result replay prevents acknowledgement loss from requiring duplicate provider reasoning and Atlas acceptance is idempotent.

### AC-26
A PRD counts as processed only after perception, semantic extraction, extraction validation/persistence, reconciliation, and reconciliation validation/persistence complete.

### AC-27
Semantic contradictions and ambiguities are valid reviewable results and do not produce a technical `Needs attention` state.

### AC-28
Technical/schema/reference/identity/persistence failures do not mark the PRD processed and surface a bounded `Needs attention` lifecycle after supported retry behavior.

### AC-29
Bundle completion validation proves all N documents have completed the required stages before transitioning the bootstrap workspace/bundle to `Ready for review`.

### AC-30
The production project card truthfully supports `Waiting for extraction`, `Extracting`, `Needs attention`, and `Ready for review` from persisted Atlas state.

### AC-31
The phase creates no resolved knowledge, review decision, approval, revision, publication, Master HEAD movement, Main Workflow projection, Project Facts projection, CES Result projection, conversation state, or Addendum.

### AC-32
Master remains empty throughout the phase.

### AC-33
The semantic store preserves bundle/document provenance sufficient for later PRD Lens filtering without semantic re-extraction.

### AC-34
The semantic store and retrieval interfaces are sufficient for the next Mistral-backed review-projection phase to consume bounded semantic state without rereading PDFs or redesigning semantic persistence.

### AC-35
The semantic store exposes stable IDs/evidence/relationships sufficient for later targeted chatbot context without full-project scans.

### AC-36
Agents Bridge remains denied direct trusted Atlas semantic-state mutation.

### AC-37
DocumentStore remains the approved BSS-007 abstraction and no R2/S3 adapter is introduced as a requirement.

### AC-38
pg-boss remains the approved BSS-006 queue and no replacement queue infrastructure is introduced.

### AC-39
Existing auth, PCC, BSS-007, BSS-008, BSS-009, `/demo`, CSP, and directly affected regression boundaries remain green or any pre-existing unrelated failure is explicitly documented without being misrepresented as passing.

### AC-40
The deterministic Compose-backed end-to-end checkpoint proves the procedural bundle pipeline, concurrent-bundle isolation, semantic conflict preservation, replay/idempotency, card progress, and hard stop before review/projection/publication.

### AC-41
A real `MISTRAL_API_KEY` is supplied through the existing secret/environment boundary for the final live checkpoint; the key is available to the Compose-managed Mistral runtime that performs OCR and semantic worker reasoning and is never committed, persisted as business data, returned, or logged.

### AC-42
The live Compose-backed checkpoint proves BSS-009 OCR executes through `MistralProvider.perceive(...)` and both `atlas.semantic.extract/v1` and `atlas.semantic.reconcile/v1` execute through the existing BSS-008 `MistralProvider.structured(...)` path using configured real Mistral models.

### AC-43
The live run processes at least two synthetic/non-confidential PRDs in one bundle through perception, extraction, incremental reconciliation, Atlas result acceptance/persistence, procedural advancement, bundle completion validation, and `Ready for review`, with real provider provenance and without `TestRuntime` handling production semantic jobs.

### AC-44
The IDSER ticket set cannot be marked complete if the required live Mistral checkpoint is skipped because credentials are absent. Missing credentials are a credential gate for final acceptance, not permission to substitute mocks for production proof.

---

## 45. Final Definition of Done

This implementation context is complete when Codex can decompose and implement a ticket set that delivers this exact production boundary:

```text
Authenticated production project creation
        |
        v
DocumentStore-backed immutable PRDs
        |
        v
Atlas project + Master + initial_draft + bundle
        |
        v
transactionally scheduled first perception
        |
        v
existing agents-bridge-worker / pg-boss
        |
        v
D1 perception
        |
        v
D1 semantic extraction
        |
        v
Atlas candidate/evidence/index persistence
        |
        v
D1 reconciliation
        |
        v
Atlas relationship persistence
        |
        v
D1 complete
        |
        v
D2 ... DN procedurally
        |
        v
bundle completion validation
        |
        v
Validated Reviewable State
        |
        v
Ready for review
        |
        v
STOP
```

The phase must leave Atlas ready for the next implementation to add bounded Mistral-backed human review projections over the persisted semantic identities.

The phase is not complete until the real Compose-managed production path has also been proven with a real `MISTRAL_API_KEY`: Mistral OCR for perception, Mistral structured reasoning for semantic extraction, Mistral structured reasoning for reconciliation, authenticated Bridge-to-Atlas result delivery, Atlas validation/persistence, and procedural bundle completion to `Ready for review`.

It must not implement that projection phase early.

It must not silently advance project truth.

It must not introduce new infrastructure merely because semantic processing is now real.

The intended authority remains:

```text
Documents provide evidence.
Mistral reasons.
Agents Bridge executes bounded reasoning.
pg-boss schedules expensive work.
Atlas validates, persists, indexes, and controls lifecycle.
Humans decide unresolved meaning later.
Master remains untouched until governed publication.
```
