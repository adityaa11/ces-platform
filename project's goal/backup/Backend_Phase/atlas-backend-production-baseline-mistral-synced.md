# Atlas Backend Production Baseline

## Status

This document captures the current backend architecture direction for Atlas as a **production baseline**, not a disposable prototype.

It is synchronized with the [canonical Atlas core architecture checkpoint](atlas-core-architecture-checkpoint-v2-mistral-enriched-v2.md), including the explicit separation between **Document Perception** and **Semantic Extraction**.

The central architectural rule is:

> **Atlas owns truth. PostgreSQL persists trusted Atlas state. DocumentStore preserves immutable source bytes. Atlas owns derived perception state and retrieval. Agents Bridge executes provider-backed document perception and reasoning. Skills define reasoning contracts. The queue schedules expensive work. Better Auth establishes identity.**

The local development environment should differ from production mainly in infrastructure location, provider credentials, capacity, and storage adapters—not in Atlas semantics or authority boundaries.

### Compatibility with approved BSS-001 through BSS-009-02

This baseline update is intentionally **additive**.

It must not require reopening or rewriting the approved foundations established by BSS-001 through BSS-009-02.

```text
BSS-001  runtime / workspace foundation
    |
    +-- remains valid

BSS-002  PostgreSQL Compose foundation
    |
    +-- remains valid

BSS-003  PostgreSQL / Drizzle / role boundaries
    |
    +-- remains valid
    +-- Agents Bridge still cannot mutate Atlas trusted state

BSS-004  Better Auth persistence
    |
    +-- remains valid

BSS-005  Agents Bridge service foundation
    |
    +-- remains valid
    +-- existing provider-neutral ReasoningRuntime remains valid
    +-- document perception is an additive capability, not a rewrite

BSS-006  pg-boss background runtime
    |
    +-- remains valid
    +-- the BSS-009 series uses it for document-perception work

BSS-007  DocumentStore foundation
    |
    +-- remains valid
    +-- immutable source bytes remain behind the existing storage-neutral contract

BSS-008  Mistral provider adapter
    |
    +-- approved provider capability boundary remains valid
    +-- capability aliases remain provider-neutral

BSS-009 series  Document Perception
    |
    +-- approved Atlas authority, perception, and Bridge integration boundaries remain valid
    +-- `NormalizedDocument` remains derived and rebuildable
```

The approved Stack Setup checkpoint therefore establishes:

```text
BSS-008
    Mistral provider adapter and provider capability qualification

BSS-009 / BSS-009-01 / BSS-009-02
    Document Perception pipeline, Atlas authority, and provider-neutral Bridge integration
```

Later semantic-extraction feature work may evolve the extraction skill contract, but that belongs outside the completed Stack Setup checkpoint unless explicitly ticketed.

---

## 1. System Overview

```text
                               CLIENT
                         Atlas Web Application
                                 |
                                 v
                     +----------------------+
                     |    ATLAS BACKEND     |
                     |                      |
                     | Better Auth          |
                     | Application Services |
                     | Atlas Core           |
                     | Retrieval            |
                     | Validation           |
                     | Approval / Publish   |
                     +----------+-----------+
                                |
             +------------------+-------------------+
             |                  |                   |
             v                  v                   v
        PostgreSQL        DocumentStore          pg-boss
             |                  |                   |
      +------+------+           |                   |
      |      |      |           |                   |
      v      v      v           v                   v
    auth   atlas  bridge     source.pdf       background jobs
   schema  schema  state        |                   |
                                |                   v
                                |          +----------------------+
                                +--------->|    AGENTS BRIDGE     |
                                           |                      |
                                           | Document Perception  |
                                           | Reasoning Runtime    |
                                           | Interactive Runtime  |
                                           | Background Workers   |
                                           | Provider Routing     |
                                           | Budget / Usage       |
                                           +----------+-----------+
                                                      |
                                       +--------------+--------------+
                                       |              |              |
                                       v              v              v
                                    Mistral       Provider B      Provider C
                                       |
                         +-------------+--------------+
                         |             |              |
                         v             v              v
                      OCR 4.1     reasoning models  embeddings
                         |
                         v
                  NormalizedDocument
                         |
                         v
                Atlas-owned derived
                 perception cache
                         |
                         v
                 Semantic Extraction
                         |
                         v
                 SemanticCandidates
                         |
                         v
             deterministic Atlas validation
```

Atlas remains the authoritative system for project state.

Agents Bridge is an independently deployable provider-execution service. It may perform document perception and reasoning, but it never owns accepted Atlas truth, retrieval authority, revision authority, approval authority, or publication authority.

The canonical document-processing distinction is:

```text
Document Perception
        !=
Semantic Extraction
```

Document Perception answers:

> **What is physically and structurally present in this document, and where is it located?**

Semantic Extraction answers:

> **What project meaning can Atlas defensibly derive from that normalized document representation?**

---

## 2. Proposed Technology Stack

| Area | Technology / Direction | Responsibility |
|---|---|---|
| Runtime | Node.js 24 LTS | Runtime for Atlas backend and Agents Bridge |
| Language | TypeScript | Shared contracts and type safety |
| Main database | PostgreSQL | Canonical persistent Atlas state and operational metadata |
| ORM / migrations | Drizzle ORM + Drizzle Kit | Schema, queries, migrations |
| Authentication | Better Auth | Users, sessions, accounts, authentication |
| Auth integration | Better Auth Drizzle adapter | Auth tables in PostgreSQL |
| Async queue | pg-boss | PostgreSQL-backed jobs, retries, scheduling, concurrency |
| Agents Bridge server | Fastify | Provider-neutral perception/reasoning execution boundary |
| Chat streaming | SSE initially | Stream chatbot responses without WebSocket complexity |
| Skill contracts | JSON Schema + TypeScript | Provider-neutral reasoning contracts |
| Perception contracts | JSON Schema + TypeScript | Provider-neutral perception request/result contracts |
| Deterministic validation | AJV | Contract and trusted-state validation |
| Document storage | Local filesystem initially | Immutable PRD/Addendum source bytes |
| Future object storage | S3 / R2 adapter | Replace local source storage without changing Atlas Core |
| Derived perception cache | Atlas-owned operational state | Rebuildable `NormalizedDocument` output |
| First provider qualification direction | Mistral | OCR, structured reasoning, chat, optional embeddings |
| Local infrastructure | Docker Compose | PostgreSQL and supporting services |

Redis, Kafka, Kubernetes, and a separate vector database remain intentionally deferred until they solve a proven problem.

The Mistral direction is a **provider qualification choice**, not an Atlas architecture dependency.

Clients and skills must not depend on Mistral-specific model IDs or endpoints.

---

## 3. Atlas Backend Responsibilities

The Atlas backend is the deterministic authority.

```text
Atlas Backend
|
+-- Authentication / authorization
+-- Projects
+-- Workspaces
+-- Documents
+-- Source document identity / hashes
+-- Derived perception ownership
+-- Revisions
+-- HEAD
+-- Assertions
+-- Resolved Knowledge
+-- Knowledge Index
+-- Dependencies
+-- Retrieval
+-- Review
+-- Approval
+-- Publishing
+-- CES Result state
+-- Conversation state
```

Its fundamental responsibility is:

> **Atlas determines what is allowed to become trusted project state.**

Agents Bridge may return:

```text
NormalizedDocument output
reasoning candidates
streamed explanations
tool-call proposals
usage information
provider errors
```

but it may never directly advance trusted Atlas state.

Atlas also determines which immutable source document is authorized for perception.

Agents Bridge must not independently enumerate projects, scan Atlas repositories, or discover source documents.

---

## 4. PostgreSQL as the Canonical Repository

The production baseline replaces fixture-owned runtime state with PostgreSQL-backed repositories.

Conceptually:

```text
PostgreSQL

auth.*
+-- user
+-- session
+-- account
+-- verification


atlas.*
+-- project
+-- project_member
|
+-- workspace
+-- workspace_head
+-- revision
|
+-- document
+-- document_evidence
|
+-- derived document-perception metadata / cache identity
|
+-- semantic_candidate
+-- assertion
+-- assertion_evidence
|
+-- resolved_knowledge
+-- knowledge_dependency
+-- knowledge_index
|
+-- reconciliation_proposal
|
+-- approval
+-- publication
|
+-- ces_assessment
+-- ces_assessment_support


bridge.*
+-- execution
+-- execution_attempt
+-- model_usage
+-- budget_reservation
+-- provider_usage


pgboss.*
+-- queue infrastructure
```

These are **responsibility boundaries, not a final schema**.

BSS-003 remains authoritative for the established PostgreSQL/Drizzle boundary:

- `packages/atlas-db` owns Drizzle and migrations;
- Atlas Core remains persistence-neutral;
- `auth`, `atlas`, and `bridge` remain separate namespaces;
- the `agents_bridge` database role remains denied write access to trusted Atlas state;
- final domain tables remain subject to later domain design.

The BSS-009 series defines the minimum persistence needed for derived perception identity/cache metadata within these existing boundaries rather than changing them.

Better Auth continues to own authentication-related tables.

Atlas continues to own Atlas domain and derived operational state.

---

## 5. Repository Boundary

Atlas Core should not depend directly on Drizzle queries.

```text
Atlas Core
    |
    v
Repository Interfaces
    |
    v
PostgreSQL / Drizzle Implementations
```

Representative existing direction:

```ts
interface WorkspaceRepository {
  get(workspaceId: string): Promise<Workspace | null>;
  create(workspace: Workspace): Promise<void>;
}

interface RevisionRepository {
  get(revisionId: string): Promise<Revision | null>;
  getHead(workspaceId: string): Promise<RevisionId>;
  commit(input: CommitRevisionInput): Promise<Revision>;
}

interface KnowledgeRepository {
  getResolved(input: KnowledgeQuery): Promise<ResolvedKnowledge[]>;
  saveAssertions(input: SaveAssertionsInput): Promise<void>;
}
```

A later BSS-009 implementation may introduce a persistence-neutral derived-perception repository/cache abstraction if one is required.

That must not make Atlas Core depend on Drizzle or a Mistral SDK.

This preserves BSS-003 without reopening it.

---

## 6. Transactions and Authority

Database persistence is part of the deterministic authority boundary.

Publishing should be transactional.

```text
BEGIN TRANSACTION

verify workspace is reviewable
verify approval
verify captured base revision
verify Master HEAD has not unexpectedly moved

create revision
persist accepted assertions
update resolved state
update dependencies/indexes
advance Master HEAD
record publication event

COMMIT
```

On failure:

```text
ROLLBACK
```

The same principle applies to accepted corrections and Addenda.

```text
Preview Addendum
      +
preview hash
      +
reconciliation result
      +
user approval
      |
      v
transaction
      |
      +-- immutable document metadata
      +-- assertions
      +-- revision
      +-- resolved knowledge
      +-- HEAD movement
```

Derived perception output is different.

It is operational/rebuildable state and does **not** itself move HEAD, create accepted assertions, approve a revision, or publish project truth.

---

## 7. Agents Bridge as a Separate Service

Agents Bridge remains the one provider-execution service currently justified as independently deployable.

```text
apps/
+-- atlas/
|
+-- agents-bridge/
```

BSS-005 established the service foundation and provider-neutral reasoning envelope.

That approved foundation remains valid.

### 7.1 Existing reasoning runtime

The existing conceptual reasoning boundary remains:

```ts
interface ReasoningRuntime {
  execute<I, O>(
    skill: SkillDefinition<I, O>,
    input: I,
    context: ExecutionContext
  ): Promise<O>;
}
```

The implementation currently uses a versioned provider-neutral execution envelope shared by interactive and background callers.

BSS-009 must **not require BSS-005 to be rewritten**.

### 7.2 Additive provider capability families

The Bridge should evolve additively into two provider-facing capability families:

```text
                         AGENTS BRIDGE
                              |
              +---------------+---------------+
              |                               |
              v                               v
     Document Perception              Reasoning Runtime
              |                               |
              v                               v
       provider OCR /                  Atlas reasoning
      document parsing                     skills
              |                               |
              v                               +-- semantic extraction
     NormalizedDocument                      +-- reconciliation
                                              +-- CES assessment
                                              +-- chatbot mediation
                                              +-- Addendum composition
```

The exact BSS-009 API shape is not locked here.

It may use:

```text
a separate perception runtime
a typed provider-capability request
a dedicated Bridge route/job envelope
```

provided that it remains provider-neutral and does not break the existing BSS-005 `ReasoningRuntime`.

### 7.3 Bridge operational responsibilities

```text
Agents Bridge
|
+-- Skill / capability registry
|
+-- Interactive Executor
|   +-- chatbot
|
+-- Background Worker
|   +-- pg-boss
|
+-- Document Perception execution
|
+-- Provider Router
|
+-- Rate Limiter
+-- Concurrency Manager
+-- Retry Manager
+-- Timeout / Cancellation
|
+-- Usage Manager
+-- Budget Manager
|
+-- Provider Adapters
    +-- Mistral first qualification direction
    +-- future providers
```

Provider adapters live beneath provider-neutral contracts.

### 7.4 Document source access boundary

Agents Bridge must **not** directly open Atlas local paths or independently read DocumentStore.

The production-shaped flow is:

```text
Atlas
  |
  +-- authorize project/workspace/document
  |
  +-- resolve immutable document metadata
  |
  +-- read source bytes through DocumentStore
  |
  v
submit authorized perception request
  |
  v
Agents Bridge
```

The BSS-009 perception contract must define how the authorized document content reaches the Bridge without exposing machine-specific DocumentStore paths.

Possible transport mechanisms may include a bounded binary upload/stream or another explicit provider-neutral file payload contract.

The exact transport is a BSS-009 implementation decision.

This preserves:

```text
BSS-003
    Bridge has no Atlas trusted-state authority

BSS-005
    Bridge receives explicit bounded input

BSS-007
    DocumentStore paths remain private to the storage adapter
```

---

## 8. Dual Execution Modes

Agents Bridge should continue to support both interactive and background execution.

BSS-006 already established the reusable pg-boss background runtime, retries, idempotency, concurrency, timeout/cancellation, and restricted Bridge database role.

That infrastructure remains unchanged.

### 8.1 Interactive

Used when a human is waiting for a response.

```text
Atlas
  |
  v
HTTP
  |
  v
Agents Bridge
  |
  v
reasoning provider
  |
  v
SSE streamed response
  |
  v
Atlas / Client
```

Typical interactive operations:

```text
semantic mediator
chatbot query
chatbot exploration
Addendum drafting
clarification
small bounded reasoning
```

Document perception should normally be treated as a background operation unless a later product requirement demonstrates that an interactive path is necessary and sufficiently bounded.

### 8.2 Background

Used for expensive or non-interactive work.

```text
Atlas
  |
  v
enqueue
  |
  v
PostgreSQL / pg-boss
  |
  v
Agents Bridge worker
  |
  +---------------------------+
  |                           |
  v                           v
document perception       reasoning execution
  |                           |
  v                           v
NormalizedDocument       candidate result
  |                           |
  +-------------+-------------+
                |
                v
        Atlas processing
```

Typical background operations now include:

```text
document perception
semantic extraction
large reconciliation
CES assessment
rebuild
reindex
assurance-source ingestion
large dependency refresh
```

The phrase **PRD extraction** should not be used when precision matters because it can incorrectly collapse document perception and semantic extraction into one step.

Jobs must remain idempotent even when queue retries are available.

The BSS-009 series adds the real document-perception job on top of BSS-006 rather than redesigning the queue runtime.

---

## 9. Chatbot Architecture

### 9.1 Query

```text
User
 |
 | "What's the current quota?"
 v
Atlas API
 |
 +-- authorize user
 +-- resolve workspace
 +-- targeted retrieval
        |
        v
Relevant Resolved Knowledge
        |
        v
Agents Bridge
semantic-mediator
        |
        v
stream explanation
        |
        v
User
```

Agents Bridge should not independently scan the entire project database to decide what knowledge matters.

Atlas owns retrieval and passes bounded context to the reasoning layer.

### 9.2 Explore

Hypothetical reasoning remains non-mutating.

```text
User question
    |
    v
Atlas targeted retrieval
    |
    v
bounded context
    |
    v
Agents Bridge
    |
    v
hypothetical explanation
```

### 9.3 Correction

```text
"Special departure quota should be 45."
                |
                v
          Atlas Backend
                |
                v
         targeted context
                |
                v
       Agents Bridge - sync
                |
         Semantic Mediator
                |
                v
         Addendum Author
                |
                v
       Preview Addendum
                |
                v
              USER
             confirms
                |
                v
         Atlas processing
                |
       +--------+--------+
       |                 |
 small change        larger change
       |                 |
      sync             queue
       |                 |
       +--------+--------+
                |
                v
          Reconciliation
                |
                v
       Deterministic Validation
                |
                v
              Review
                |
                v
             Approval
                |
                v
              Commit
```

This preserves the key boundary:

> **Chatbot owns human -> document. Atlas owns document -> knowledge.**

Atlas owns conversation state.

Provider-side conversation/agent state must not become required for Atlas correctness or reconstruction.

---

## 10. Paid Model and Perception Usage / Budget Management

The operational concern should be broader than token counting.

Use a **Usage & Budget Manager** for both reasoning and provider-backed document perception.

Conceptually:

```text
execution
+-- capability / skill
+-- provider
+-- model / endpoint class
+-- requested_by
+-- project/workspace
+-- source document when applicable
+-- estimated usage
+-- actual usage
+-- OCR pages when applicable
+-- input tokens when applicable
+-- output tokens when applicable
+-- estimated cost
+-- actual cost
+-- latency
+-- attempt count
+-- status
```

Lifecycle:

```text
Provider-backed request
       |
       v
estimate cost / usage
       |
       v
budget check
       |
       v
reserve
       |
       v
execute
       |
       v
receive provider usage
       |
       v
calculate actual cost
       |
       v
reconcile reservation
```

Skills and Atlas Core must remain unaware of provider pricing.

For example, `atlas.ces-assessment` should not know:

```text
provider pricing
remaining account credit
provider rate limits
token pricing
OCR page pricing
```

Those remain Agents Bridge operational concerns.

BSS-006's existing rule that usage/budget concerns remain Bridge-owned continues to hold.

---

## 11. Provider Capacity Management

Agents Bridge should manage provider-specific operational limits across capability types.

```text
Provider A
+-- max concurrent reasoning jobs
+-- max concurrent OCR jobs
+-- requests/minute
+-- tokens/minute
+-- page/document limits

Provider B
+-- different limits
```

The execution decision may consider:

```text
Queued job
   |
   v
capability requirement
   |
   v
provider capability
   |
   v
remaining provider capacity
   |
   v
remaining project/user budget
   |
   v
privacy / retention policy
   |
   v
execute
```

This becomes more important as Atlas uses multiple provider capabilities and vendors.

---

## 12. Security Boundary

Separate database roles continue to reinforce the architecture established by BSS-003.

```text
atlas_app
|
+-- auth.*
+-- atlas.*
+-- enqueue jobs


agents_bridge
|
+-- bridge.*
+-- pgboss.*
+-- explicitly granted operational access only
```

Agents Bridge must not have permission to directly perform operations such as:

```sql
UPDATE atlas.resolved_knowledge;
UPDATE atlas.workspace_head;
UPDATE atlas.revision;
UPDATE atlas.publication;
```

The existing BSS-003 denial of Atlas trusted-state writes from the Bridge role remains valid and should not be weakened for document perception.

### 12.1 Source-document security boundary

Agents Bridge does not need direct database authority or direct DocumentStore path access in order to run OCR.

Instead:

```text
Atlas authorization
      |
      v
DocumentStore.read(authorized key)
      |
      v
bounded perception request
      |
      v
Agents Bridge
```

This prevents provider-execution code from becoming a document-discovery authority.

### 12.2 Provider secret boundary

Provider credentials such as Mistral API keys belong only to Agents Bridge configuration / deployment secret handling.

They must not appear in:

```text
Atlas skill contracts
NormalizedDocument
Atlas database business records
client responses
ordinary logs
test snapshots
```

### 12.3 Privacy policy boundary

Agents Bridge should eventually be able to express a provider execution policy such as:

```text
training: deny
retention: standard | zero
```

The adapter must select a provider endpoint/configuration compatible with the requested policy.

Atlas remains responsible for its own intentional persistent storage.

---

## 13. Immutable Document Storage

Document bytes remain separate from canonical database state.

BSS-007 remains valid and authoritative for the source-byte storage boundary.

Initial architecture:

```text
Atlas
   |
   v
DocumentStore
   |
   v
LocalFilesystemDocumentStore
```

Example conceptual local layout:

```text
.atlas-data/
└── documents/
    └── <generated-storage-key>
```

The exact physical path remains private to the adapter.

PostgreSQL stores metadata such as:

```text
document_id
content_hash
storage_key
mime_type
byte_size
source_kind
created_by
created_at
```

The database must not store machine-specific local paths as business meaning.

Later:

```text
LocalFilesystemDocumentStore
             |
             v
      S3DocumentStore
```

Atlas Core should not need to change when source storage moves from local disk to S3/R2.

### 13.1 Three-layer document model

Atlas should distinguish:

```text
1. IMMUTABLE SOURCE

source.pdf
|
+-- authoritative document bytes
+-- content hash
+-- source identity
+-- durable / reconstructable


2. DERIVED DOCUMENT PERCEPTION

NormalizedDocument
|
+-- page text
+-- structural blocks
+-- tables
+-- images / image references
+-- page geometry
+-- bounding boxes
+-- OCR confidence / extraction metadata
+-- replaceable / rebuildable


3. DERIVED SEMANTICS

SemanticCandidates
|
+-- actors
+-- rules
+-- constraints
+-- workflow relationships
+-- normalized meaning
+-- evidence links
+-- candidate-only until deterministic validation
```

Only the immutable source document is durable human-authored source material.

Derived perception is operational state.

Derived semantic candidates are reasoning output and remain untrusted until deterministic validation.

### 13.2 Canonical document-processing pipeline

```text
                      ATLAS
                        |
                        v
                 DocumentStore
                        |
                    source.pdf
                        |
                        v
              Atlas authorization
                  and source read
                        |
                        v
             document-perception job
                        |
                        v
                 Agents Bridge
                        |
                        v
                Mistral OCR 4.1
                        |
                        v
              NormalizedDocument
                        |
            +-----------+-----------+
            |                       |
            v                       v
       textual blocks          visual blocks
       tables                  image regions
       page positions          bounding boxes
            |                       |
            +-----------+-----------+
                        |
                        v
              derived-perception cache
                        |
                        v
               semantic extraction
                        |
                        v
                 Agents Bridge
                        |
                        v
             qualified reasoning model
                        |
                        v
              SemanticCandidates
                        |
                        v
          deterministic Atlas validation
```

### 13.3 `NormalizedDocument`

The provider-neutral perception result should conceptually contain:

```text
NormalizedDocument
|
+-- artifact identity
+-- source SHA-256
+-- perception contract/version
+-- pages[]
    |
    +-- page number
    +-- dimensions
    +-- text blocks
    +-- tables
    +-- visual regions
    +-- image references
    +-- bounding boxes
    +-- confidence / provider metadata
```

The exact schema is owned by BSS-009 and is **not locked by this baseline**.

Required properties are:

```text
provider-neutral
source-linked
page-local
visual-capable
rebuildable
suitable for deterministic evidence validation
```

### 13.4 Derived-perception cache

Atlas may persist/cache a `NormalizedDocument` because repeating OCR and page perception for every semantic operation would be wasteful.

The cache must remain rebuildable from:

```text
immutable source bytes
+
perception capability/version
```

It may be invalidated when:

```text
perception implementation changes
provider/version changes
normalization contract changes
integrity verification requires rebuild
explicit reprocessing is requested
```

The cache is not accepted project truth.

---

## 14. Package Structure

The existing package boundaries established by BSS-001 remain valid.

Recommended direction:

```text
apps/
+-- atlas/
|   +-- web
|   +-- API
|
+-- agents-bridge/
    +-- api/
    +-- workers/
    +-- providers/
    +-- execution/
    +-- perception/
    +-- usage/


packages/
+-- atlas-core/
|   +-- project/
|   +-- workspace/
|   +-- document/
|   +-- revision/
|   +-- knowledge/
|   +-- reconciliation/
|   +-- approval/
|   +-- publishing/
|
+-- atlas-db/
|   +-- schema/
|   +-- repositories/
|   +-- migrations/
|
+-- atlas-contracts/
|   +-- reasoning/
|   +-- perception/
|   +-- execution/
|   +-- events/
|
+-- atlas-skills/
|   +-- document-extraction/     # existing skill; semantic role clarified later
|   +-- semantic-reconciliation/
|   +-- semantic-mediator/
|   +-- addendum-author/
|   +-- ces-assessment/
|
+-- document-store/
|
└-- atlas-fixtures/
    └-- golden/test data only
```

This is an additive organization inside existing package ownership.

It does **not** require a new root package merely to support BSS-009.

`@atlas/fixtures` remains:

```text
test scenarios
golden fixtures
regression fixtures
architecture verification
```

It must not own application runtime truth.

---

## 15. Reasoning Skills and Provider Capabilities

The baseline now distinguishes provider capabilities from Atlas reasoning skills.

### 15.1 Provider capability: Document Perception

Document Perception is not itself required to be an Atlas reasoning skill.

Conceptually:

```text
atlas.document.perceive
    |
    v
source document payload
    |
    v
NormalizedDocument
```

The capability alias is server-controlled.

For the first Mistral qualification:

```text
atlas.document.perceive
    -> Mistral OCR 4.1
```

The alias is architectural; the exact provider/model may change.

### 15.2 Reasoning skills

Expected reasoning capabilities remain conceptually:

| Skill / capability | Responsibility |
|---|---|
| existing `atlas.document-extraction` / future semantic-extraction contract | `NormalizedDocument` -> semantic candidates |
| `atlas.semantic-reconciliation` | Incoming candidates + retrieved knowledge -> semantic relationship proposals |
| `atlas.semantic-mediator` | User language -> query/explore/correct intent |
| `atlas.addendum-author` | Accepted correction intent -> standalone Preview Addendum |
| `atlas.ces-assessment` | Relevant project semantics + assurance knowledge -> CES assessment candidates |
| `atlas.workspace-review-projections` | Trusted resolved knowledge + validated CES assessments -> review projection |

The existing `atlas.document-extraction` name is **not renamed by this baseline**.

A later SFE/document-extraction ticket may decide whether to:

```text
keep atlas.document-extraction
or
rename/evolve it to atlas.semantic-extraction
```

What is canonical now is the responsibility separation:

```text
Document Perception
    -> NormalizedDocument

Semantic Extraction
    -> SemanticCandidates
```

Skills produce candidate reasoning.

They do not directly mutate trusted Atlas state.

### 15.3 Current Mistral qualification map

The current qualification direction is:

```text
atlas.document.perceive
    -> Mistral OCR 4.1

semantic extraction
    -> Mistral Large 3 initially
       Medium 3.5 as qualification challenger

semantic reconciliation
    -> Large 3 vs Medium 3.5 benchmark

CES assessment
    -> Medium 3.5 vs Large 3 benchmark

chat default
    -> Mistral Small 4

retrieval embedding, if needed
    -> mistral-embed
```

These are implementation/qualification candidates, not permanent Atlas contracts.

---

## 16. Deterministic vs Provider / Model Responsibilities

### Provider-backed Document Perception

```text
parse document representation
OCR text
identify structural blocks
extract tables
locate images / visual regions
provide page geometry / bounding boxes
return provider usage / confidence metadata when available
```

### Model / Agents Bridge Reasoning

```text
interpret normalized document semantics
discover semantic relationships
propose reconciliation
reason about CES concerns
mediate user language
compose Addenda
semantic grouping
produce candidate explanations
```

### Deterministic Atlas Core

```text
authorize document access
own DocumentStore interaction
own derived-perception cache identity
validate schemas
enforce immutability
create revisions
move HEAD
maintain indexes
perform retrieval
enforce approval
perform atomic commit
validate references
maintain provenance
maintain dependency state
publish
```

Invariant:

> **Providers perceive and models reason. Atlas decides whether derived output satisfies the contract and may enter trusted state.**

Provider output alone never grants mutation authority.

---

## 17. Local Production-Shaped Environment

The local environment should already mirror production architecture.

BSS-001, BSS-002, BSS-005, BSS-006, and BSS-007 remain valid.

### Local

```text
Atlas
Agents Bridge
Agents Bridge worker
PostgreSQL
LocalFilesystemDocumentStore
Mistral development credentials when explicitly configured
```

`docker compose up` remains the canonical supported stack boot path for runnable stack components introduced by BSS tickets.

The local filesystem adapter remains development-only document persistence as recorded by BSS-007.

### Production later

```text
Atlas
Agents Bridge x N
Agents Bridge workers x N
Managed PostgreSQL
S3 / R2 compatible DocumentStore
qualified provider configuration
production privacy / retention policy
```

Avoid:

```text
local architecture A
        |
        v
rewrite
        |
        v
production architecture B
```

The same repository contracts, revision rules, skill contracts, perception contracts, validation, and authority boundaries should exist in both environments.

---

## 18. Initial Deployment Philosophy

Atlas should remain mostly a modular application.

Do not split every capability into a service.

Avoid creating services such as:

```text
atlas-document-perception-service
atlas-semantic-extraction-service
atlas-reconciliation-service
atlas-ces-service
atlas-addendum-service
atlas-retrieval-service
atlas-publish-service
```

Those are internal capabilities.

The initial service boundary remains approximately:

```text
1. Atlas App / API
2. Agents Bridge
3. PostgreSQL
4. DocumentStore
```

Document Perception does **not** justify another independently deployed service.

It runs through Agents Bridge because provider credentials, rate limits, retries, timeout/cancellation, usage, privacy policy, and cost management already belong there.

This does not turn Agents Bridge into project authority.

---

## 19. Queue Strategy

Use the PostgreSQL-backed queueing established by BSS-006.

```text
PostgreSQL
+-- Atlas state
+-- Auth state
+-- Bridge execution state
+-- pg-boss jobs
```

Benefits remain:

- fewer infrastructure components
- transactional enqueueing
- retry/backoff
- scheduling
- concurrency controls
- failed-job visibility
- idempotent processing
- simpler local development

Redis may be introduced later only if PostgreSQL queueing becomes a proven bottleneck.

### 19.1 Document-perception job

The BSS-009 series introduces a real document-perception job on top of the existing queue infrastructure.

Conceptually:

```text
Atlas accepts/stores source document
        |
        v
transactionally record source operation
and enqueue perception work when appropriate
        |
        v
pg-boss
        |
        v
Agents Bridge worker
        |
        v
provider document perception
        |
        v
NormalizedDocument result
        |
        v
Atlas-owned derived cache / validation
```

The job must be idempotent.

A retry must not:

```text
create duplicate accepted truth
move HEAD
duplicate source documents
silently replace immutable source bytes
```

The exact job payload and result contract belong to BSS-009.

---

## 20. Targeted Retrieval Boundary

Retrieval belongs to Atlas, not Agents Bridge.

```text
Incoming semantic request
        |
        v
Atlas retrieval/index
        |
        v
Relevant knowledge neighborhood
        |
        v
Agents Bridge reasoning
```

Rule:

> **Retrieval finds candidates for comparison; it does not decide truth.**

Agents Bridge reasons over bounded context.

Atlas Core decides what can become trusted state.

If `mistral-embed` or another provider embedding capability is used, the embedding remains only one retrieval signal.

Atlas owns:

```text
embedding storage
workspace scoping
semantic identity
dependency signals
retrieval policy
truth decisions
```

The provider never becomes retrieval authority.

---

## 21. Production Baseline Invariants

1. **Atlas owns accepted truth.**
2. **PostgreSQL remains the canonical persistent store for Atlas state and Atlas-owned operational metadata.**
3. **Immutable project document bytes remain behind the BSS-007 `DocumentStore` abstraction.**
4. **Document Perception and Semantic Extraction are separate capabilities.**
5. **Document Perception produces a provider-neutral, rebuildable `NormalizedDocument`; it does not produce accepted project truth.**
6. **Derived perception is Atlas-owned operational/cache state and can be rebuilt from immutable source bytes.**
7. **Agents Bridge executes provider-backed document perception and reasoning but cannot directly commit trusted Atlas state.**
8. **Agents Bridge does not independently discover or read Atlas documents; Atlas authorizes and supplies bounded source input.**
9. **The existing BSS-005 provider-neutral `ReasoningRuntime` remains valid; BSS-009 extends capability without requiring BSS-005 to be rewritten.**
10. **The existing BSS-006 pg-boss runtime remains valid; BSS-009 adds document-perception work on top of it.**
11. **Skills remain provider-neutral reasoning contracts.**
12. **Provider capability aliases are server-controlled; clients and skills do not select arbitrary provider models/endpoints.**
13. **Interactive and background reasoning continue to use the established Bridge execution boundary.**
14. **Expensive perception/reasoning is queued; bounded chatbot reasoning may run synchronously.**
15. **The database continues to enforce Atlas/Bridge authority boundaries established by BSS-003.**
16. **Better Auth continues to own authentication persistence; Atlas owns project authorization.**
17. **Fixtures remain tests and golden scenarios, not production truth.**
18. **Local and production environments use the same architecture and semantics.**
19. **Provider usage, pricing, retries, capacity, and privacy/retention policy belong to Agents Bridge, not individual skills.**
20. **Atlas Core owns validation, retrieval, revisions, HEAD movement, approval, commit, provenance, dependency state, and publication.**
21. **BSS-001 through BSS-009-02 remain approved foundations and are not reopened by this architecture baseline.**
22. **BSS-008 establishes the Mistral provider boundary, and the BSS-009 series establishes the Document Perception, Atlas authority, and Bridge integration boundaries.**

---

## 22. Final Architecture Principle

> **Atlas owns truth. PostgreSQL persists trusted Atlas state. DocumentStore preserves immutable source bytes. Atlas authorizes source access, owns derived perception and retrieval, and validates all candidates. Agents Bridge executes provider-backed perception and reasoning under bounded contracts. The queue schedules expensive work. Skills remain provider-neutral. Better Auth establishes identity.**

The canonical production-shaped document path is:

```text
Immutable Source
      |
      v
Document Perception
      |
      v
NormalizedDocument
      |
      v
Semantic Extraction
      |
      v
SemanticCandidates
      |
      v
Deterministic Validation
      |
      v
Trusted Atlas lifecycle
```

This architecture remains consistent with the approved BSS-001 through BSS-009-02 foundations. Later semantic/domain work may consume these provider and document-processing capabilities without rewriting the accepted stack.
