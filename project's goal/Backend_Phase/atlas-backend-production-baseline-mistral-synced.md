# Atlas Backend Production Baseline

## Status

This document captures the current backend architecture direction for Atlas as a **production baseline**, not a disposable prototype.

It is synchronized with the canonical:

- `atlas-core-architecture-checkpoint-v2-mistral-enriched-v2.md`

including the clarified downstream architecture for:

```text
Semantic Extraction
Targeted Retrieval
Semantic Reconciliation
Validated Reviewable State
Human Review
Review Projection
Resolved Knowledge
Conversational Semantic Mediator
Correction / Addendum
CES
Publication
```

The central production rule remains:

> **Atlas owns truth. PostgreSQL persists Atlas-owned trusted and reviewable state. DocumentStore preserves immutable source bytes. Atlas owns derived perception state, retrieval, review state, review decisions, and publication authority. Agents Bridge executes provider-backed document perception and reasoning. Skills define reasoning contracts. The queue schedules expensive work. Better Auth establishes identity.**

The local development environment should differ from production mainly in infrastructure location, provider credentials, capacity, and storage adapters—not in Atlas semantics or authority boundaries.

---

# Compatibility With Approved BSS-001 Through BSS-009-02

This baseline update is **additive downstream of the completed Stack Setup phase**.

It does **not** reopen or rewrite the approved BSS foundations.

```text
BSS-001  Runtime / workspace foundation
    |
    +-- remains valid

BSS-002  PostgreSQL Compose foundation
    |
    +-- remains valid

BSS-003  PostgreSQL / Drizzle / role boundaries
    |
    +-- remains valid
    +-- Agents Bridge still cannot mutate Atlas-owned semantic state

BSS-004  Better Auth persistence
    |
    +-- remains valid

BSS-005  Agents Bridge service foundation
    |
    +-- remains valid
    +-- existing provider-neutral ReasoningRuntime remains valid

BSS-006  pg-boss background runtime
    |
    +-- remains valid
    +-- later semantic/domain jobs may reuse it

BSS-007  DocumentStore foundation
    |
    +-- remains valid
    +-- immutable source bytes remain behind the storage-neutral contract

BSS-008  Mistral provider adapter
    |
    +-- remains valid
    +-- structured reasoning, streaming chat/tool events,
        and perception primitives remain usable downstream

BSS-009 / BSS-009-01 / BSS-009-02
    |
    +-- remain valid
    +-- Document Perception remains Atlas-authorized
    +-- NormalizedDocument remains derived and rebuildable
    +-- Bridge result delivery / replay boundaries remain valid
```

The completed Stack Setup phase therefore provides the production-shaped platform foundation.

The new review/chatbot architecture belongs to **later Backend Phase semantic/domain implementation**, not to new BSS tickets.

Prototype/fixture-era skills may be rewritten against the production contracts established by this Backend Phase.

---

# 1. System Overview

```text
                               CLIENT
                         Atlas Web Application
                                 |
                                 v
                     +--------------------------+
                     |      ATLAS BACKEND       |
                     |                          |
                     | Better Auth              |
                     | Application Services     |
                     | Atlas Core               |
                     | Retrieval                |
                     | Validation               |
                     | Review State             |
                     | Review Projection        |
                     | Approval / Publish       |
                     +-------------+------------+
                                   |
              +--------------------+--------------------+
              |                    |                    |
              v                    v                    v
         PostgreSQL          DocumentStore           pg-boss
              |                    |                    |
       +------+------+             |                    |
       |      |      |             v                    v
       v      v      v          source.pdf       background jobs
     auth   atlas  bridge             |
    schema  schema  state             |
                                      v
                           +----------------------+
                           |    AGENTS BRIDGE     |
                           |                      |
                           | Document Perception  |
                           | Reasoning Runtime    |
                           | Interactive Runtime  |
                           | Background Workers   |
                           | Provider Routing     |
                           | Budget / Usage       |
                           +----------+-----------+
                                      |
                        +-------------+--------------+
                        |             |              |
                        v             v              v
                     Mistral      Provider B      Provider C
                        |
             +----------+-----------+----------+
             |                      |          |
             v                      v          v
          OCR 4.1              reasoning    embeddings
             |
             v
      NormalizedDocument
             |
             v
  Atlas-owned derived cache
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
    Targeted Retrieval
             |
             v
      Reconciliation
             |
             v
 Deterministic Validation
             |
             v
 Validated Reviewable State
      /               \
     v                 v
Review Projection   Contextual Chat
      \               /
       \             /
        v           v
         Human Review
              |
              v
 Accepted Workspace Resolution
              |
              v
    Resolved Knowledge
```

Atlas remains the authoritative system for project state.

Agents Bridge remains a provider-execution boundary. It may perform perception and reasoning, but it never owns:

```text
accepted Atlas truth
review state
review decisions
retrieval authority
revision authority
approval authority
publication authority
conversation authority
```

---

# 2. Current Technology Baseline

| Area | Technology / Direction | Responsibility |
|---|---|---|
| Runtime | Node.js 24 LTS | Atlas backend and Agents Bridge runtime |
| Language | TypeScript | Shared contracts and type safety |
| Main database | PostgreSQL | Canonical Atlas state and operational metadata |
| ORM / migrations | Drizzle ORM + Drizzle Kit | Schema and migrations |
| Authentication | Better Auth | Identity/session persistence |
| Auth integration | Better Auth Drizzle adapter | Better Auth tables in PostgreSQL |
| Async queue | pg-boss | PostgreSQL-backed jobs, retries, concurrency |
| Agents Bridge server | Fastify | Provider-neutral reasoning/perception execution |
| Chat streaming | SSE initially | Stream bounded interactive responses |
| Skill contracts | JSON Schema + TypeScript | Provider-neutral reasoning contracts |
| Perception contracts | JSON Schema + TypeScript | Provider-neutral perception contracts |
| Deterministic validation | AJV + Atlas reference validation | Contract and authority checks |
| Document storage | Local filesystem initially | Immutable PRD/Addendum bytes |
| Future object storage | S3/R2 adapter | Replace local storage without changing Atlas Core |
| Derived perception cache | Atlas-owned | Rebuildable `NormalizedDocument` state |
| Review state | PostgreSQL / Atlas-owned | Validated reviewable semantic state and decisions |
| Review projection | Atlas-owned downstream projection | Bounded human-facing review model |
| First provider qualification direction | Mistral | OCR, structured reasoning, chat, optional embeddings |
| Local infrastructure | Docker Compose | Production-shaped local runtime |

Redis, Kafka, Kubernetes, and a separate vector database remain deferred until a proven requirement justifies them.

Mistral remains a provider qualification direction, not an architecture dependency.

---

# 3. Atlas Backend Responsibilities

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
+-- Semantic candidates
+-- Retrieval
+-- Reconciliation state
+-- Reviewable state
+-- Review decisions
+-- Review progress
+-- Review projections
+-- Assertions
+-- Resolved Knowledge
+-- Knowledge Index
+-- Dependencies
+-- Approval
+-- Publishing
+-- CES Result state
+-- Conversation state
+-- Chat context assembly
```

Its fundamental responsibility remains:

> **Atlas determines what is allowed to become trusted project state.**

Agents Bridge may return:

```text
NormalizedDocument output
reasoning candidates
reconciliation proposals
semantic grouping proposals
streamed explanations
tool-call proposals
Addendum proposals
usage information
provider errors
```

but it may never directly advance trusted or review-authoritative Atlas state.

Atlas also determines which immutable source documents, semantic records, review objects, dependencies, and evidence references are authorized for provider-backed reasoning.

Agents Bridge must not independently enumerate projects or scan Atlas repositories to construct context.

---

# 4. PostgreSQL as the Canonical Repository

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
+-- document_perception_execution
+-- normalized_document_cache
|
+-- semantic_candidate
+-- assertion
+-- assertion_evidence
|
+-- reconciliation_proposal
+-- reconciliation_relationship
|
+-- review
+-- review_item / review relationship state
+-- review_decision
+-- review_progress
|
+-- resolved_knowledge
+-- knowledge_dependency
+-- knowledge_index
|
+-- approval
+-- publication
|
+-- conversation
+-- conversation_message
|
+-- ces_assessment
+-- ces_assessment_support


bridge.*
+-- execution / operational state
+-- background effects
+-- provider delivery replay
+-- model usage / budget state


pgboss.*
+-- queue infrastructure
```

These are **responsibility boundaries, not a locked final schema**.

The exact table names, cardinalities, enums, and normalization choices belong to later domain tickets.

BSS-003 remains authoritative for the existing PostgreSQL/Drizzle boundary:

```text
packages/atlas-db owns migrations and Drizzle
Atlas Core remains persistence-neutral
auth / atlas / bridge remain separate authority namespaces
agents_bridge remains denied direct Atlas semantic-state mutation
```

## Review state persistence is Atlas-owned

The production architecture now requires a persistence boundary for reviewable state.

Atlas must be able to represent that a semantic relationship is:

```text
validated
reviewable
possibly unresolved
not yet accepted truth
```

without forcing it into `resolved_knowledge`.

Review persistence must also support resumable human review.

The exact contract for:

```text
per-workspace review state
per-user review progress
shared review decisions
multi-reviewer coordination
```

is intentionally deferred to the domain ticket that owns review persistence.

No BSS ticket needs to be reopened to add these Atlas-owned domain tables.

---

# 5. Repository Boundary

Atlas Core should remain independent of Drizzle-specific queries.

```text
Atlas Core
    |
    v
Repository Interfaces
    |
    v
PostgreSQL / Drizzle Implementations
```

Representative future repository responsibilities may include:

```text
WorkspaceRepository
RevisionRepository
DocumentRepository
CandidateRepository
ReconciliationRepository
ReviewRepository
KnowledgeRepository
DependencyRepository
ConversationRepository
CesRepository
```

The exact interface shapes are not locked by this baseline.

The important boundary is:

> **Domain semantics belong in Atlas Core/application services. Drizzle remains an implementation detail beneath repositories.**

---

# 6. Transactions and Authority

Database persistence is part of the deterministic authority boundary.

## 6.1 Publication

Publishing should remain transactional.

```text
BEGIN TRANSACTION

verify workspace is reviewable
verify unresolved blockers are satisfied
verify approval
verify captured base revision
verify Master HEAD has not unexpectedly moved

create revision
persist accepted assertions
persist accepted review decisions where required
update resolved state
update dependencies / indexes
advance Master HEAD
record publication event

COMMIT
```

On failure:

```text
ROLLBACK
```

## 6.2 Accepted correction / Addendum

The same principle applies to accepted corrections.

```text
Preview Addendum
      +
preview hash
      +
extraction result
      +
reconciliation result
      +
user approval
      |
      v
transaction
      |
      +-- immutable document metadata
      +-- accepted semantic result
      +-- assertions
      +-- revision
      +-- resolved knowledge
      +-- dependency/index updates
      +-- HEAD movement where applicable
```

## 6.3 Review resolution without Addendum

A human may sometimes correct Atlas's interpretation without introducing new project meaning.

If existing immutable evidence already supports the intended interpretation:

```text
validated review relationship
       +
human review decision
       +
evidence references
       |
       v
governed review resolution
```

This may be accepted without creating a new Addendum, subject to the final review/approval contract.

This path must **not** be used when the human is introducing project meaning not already supported by immutable source documents.

In that case an Addendum is required.

## 6.4 Derived perception remains non-authoritative

Derived perception output remains rebuildable operational state.

It does not itself:

```text
move HEAD
create accepted assertions
approve review decisions
publish project truth
```

---

# 7. Agents Bridge as a Separate Service

Agents Bridge remains the single provider-execution service justified as independently deployable.

```text
apps/
+-- atlas/
+-- agents-bridge/
```

BSS-005 remains valid.

## 7.1 Reasoning runtime

The provider-neutral reasoning runtime remains the execution boundary for interactive and background reasoning.

The approved runtime should be extended through bounded contracts rather than replaced.

## 7.2 Provider capability families

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

Review state and review projection ownership remain outside Bridge.

## 7.3 Bridge operational responsibilities

```text
Agents Bridge
|
+-- Capability / skill registry
+-- Interactive Executor
+-- Background Worker
+-- Document Perception execution
+-- Provider Router
+-- Rate Limiter
+-- Concurrency Manager
+-- Retry Manager
+-- Timeout / Cancellation
+-- Usage Manager
+-- Budget Manager
+-- Provider Adapters
```

Provider adapters remain below provider-neutral contracts.

## 7.4 Source and semantic-context access boundary

Agents Bridge must not directly discover:

```text
DocumentStore paths
projects
workspaces
review items
resolved knowledge
dependency graph
conversation authority
```

Atlas authorizes and supplies bounded input.

For perception, that means source bytes through the approved BSS-009 authority flow.

For semantic reasoning/chat, that means bounded Atlas-selected semantic/evidence context.

---

# 8. Dual Execution Modes

Agents Bridge continues to support interactive and background execution.

## 8.1 Interactive

Used when a human is waiting.

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

Typical interactive work:

```text
chatbot query
chatbot exploration
selected-review-item explanation
clarification
review-resolution assistance
Addendum drafting
small bounded hypothetical reasoning
```

## 8.2 Background

Used for expensive or non-interactive work.

```text
Atlas
  |
  v
enqueue
  |
  v
pg-boss
  |
  v
Agents Bridge worker
  |
  +----------------------------+
  |                            |
  v                            v
document perception        reasoning execution
```

Typical background work may include:

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

Jobs remain idempotent even when queue retries exist.

The completed BSS-006 worker lifecycle should be reused.

No review/chatbot requirement currently justifies a second queue framework.

---

# 9. Semantic Extraction, Reconciliation & Reviewable State

The production semantic pipeline downstream of BSS is:

```text
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
Targeted Retrieval
      |
      v
Semantic Reconciliation
      |
      v
Deterministic Validation
      |
      v
Validated Reviewable State
```

## 9.1 Reconciliation scope

Reconciliation must support:

```text
incoming candidate
vs
relevant existing knowledge
```

and:

```text
incoming candidate
vs
relevant incoming candidates
```

This allows Atlas to surface:

```text
new
supports
duplicates
refines
extends
contradicts
supersedes
partially supersedes
ambiguous
requires resolution
```

including source-internal conflicts.

## 9.2 Reviewable does not mean accepted

A reconciliation result may be valid but still unresolved.

For example:

```text
Current:
quota = 40

Incoming:
quota = 45

Relationship:
contradiction

State:
requires human decision
```

Atlas must be able to persist and serve this state without forcing either side into accepted truth.

Therefore:

```text
validated reconciliation
    !=
accepted resolution

reviewable
    !=
published
```

## 9.3 Accepted resolution

After governed human review, Atlas may produce an accepted workspace resolution.

Only then should the relevant semantic state participate in ordinary resolved-knowledge reads.

---

# 10. Review Projection and Scalable Serving

The existing `atlas.workspace-review-projections` concept evolves into a production review projection downstream of validated candidates and reconciliation.

Conceptually:

```text
Base / Current Resolved Knowledge --------+
                                         |
Validated Incoming Candidates -----------+
                                         |
Validated Reconciliation Relationships --+--> Review Projection
                                         |
Dependency References -------------------+
                                         |
Evidence References ---------------------+
                                         |
Validated CES References when relevant --+
```

The projection may organize:

```text
summary
attention queue
semantic groups
workflow deltas
fact deltas
current-vs-incoming comparisons
conflicts
ambiguities
dependency impact
evidence references
review progress
```

The projection must not decide:

```text
semantic truth
reconciliation
supersession
conflict resolution
approval
publication
CES discovery
```

## 10.1 Candidate/review-only invariant

The useful prototype-era invariant should remain:

> **A review projection is review data, not accepted project truth.**

The existing fixture implementation may be rewritten, but the authority distinction remains valuable.

## 10.2 Progressive serving

Review data should be served progressively.

Conceptually:

```text
review summary
      |
      v
attention queue
      |
      v
semantic-group list
      |
      v
selected group
      |
      v
selected item
      |
      v
evidence / dependencies
```

Opening a review must not require serializing:

```text
all historical PRDs
all Addenda
all candidates
all resolved semantics
all evidence
all CES assessments
```

The backend should support bounded fetching through appropriate repository/API patterns such as:

```text
pagination
cursor-based retrieval
group-scoped retrieval
item-scoped retrieval
evidence-on-demand
dependency-on-demand
```

Exact routes are not locked here.

## 10.3 Attention queue

Items that require a human decision should be surfaced explicitly.

Examples:

```text
contradiction
ambiguity
possible partial supersession
source-internal inconsistency
unresolved correction target
missing semantic relationship
```

Triage should favor explainable Atlas signals:

```text
requires user decision
blocks publication
affects N workflow nodes
affects N project facts
affects N CES assessments
```

Opaque model-generated importance scores should not be required.

## 10.4 Review progress

Review progress should be resumable.

The exact production enum is not locked, but the backend must eventually support state sufficient to express things such as:

```text
unreviewed
reviewed
needs-correction
needs-clarification
resolved
```

The domain ticket must decide whether progress is:

```text
per workspace
per user
or both
```

before schema values are frozen.

---

# 11. Conversational Semantic Mediator

The chatbot remains Atlas's **Conversational Semantic Mediator**.

It is **not** the primary post-extraction surface.

The primary surface is the review projection that shows what Atlas extracted and where human attention is needed.

Chat is contextual to that surface.

## 11.1 Query

```text
User
 |
 | "Why does Atlas think this step rejects registration?"
 v
Atlas API
 |
 +-- authorize user
 +-- resolve project/workspace
 +-- resolve review identity
 +-- resolve selected semantic item
 +-- targeted retrieval
 +-- bounded evidence
        |
        v
Agents Bridge
semantic mediator
        |
        v
stream grounded explanation
```

No mutation occurs.

## 11.2 Explore

Hypothetical reasoning remains non-mutating.

```text
selected semantic context
       +
hypothetical change
       |
       v
bounded reasoning
       |
       v
hypothetical explanation
```

Hypothetical state must remain distinct from:

```text
current accepted truth
incoming candidate
reconciliation proposal
unresolved review state
```

## 11.3 Correct / Resolve

A user correction inside the review experience may lead to two different governed paths.

```text
User correction
      |
      v
resolve target and evidence
      |
      v
Does immutable evidence already
support the intended meaning?
      |
   +--+--+
   |     |
  yes    no
   |     |
   v     v
Review  Preview
Resolution Addendum
```

### Review Resolution

If the user's intended interpretation is already supported by immutable evidence, Atlas may record a governed review decision.

The chatbot may assist with:

```text
target resolution
ambiguity explanation
evidence comparison
review-decision proposal
```

but does not itself mutate accepted truth.

### Preview Addendum

If the user introduces new or clarifying project meaning that existing documents do not establish, the chatbot becomes an assisted Addendum author.

The architectural boundary remains:

> **Chatbot owns human -> document. Atlas owns document -> knowledge.**

## 11.4 Chat context assembly

Atlas owns context assembly.

A bounded chat request may include:

```text
conversation state
workspace identity
review identity
selected semantic identity
current/base semantic item
incoming candidate when relevant
reconciliation relationship when relevant
bounded evidence
affected dependencies
bounded CES references when relevant
permissions
output contract
```

Agents Bridge does not discover this context independently.

## 11.5 Stable semantic references

Review UI and chat should reference the same stable Atlas identities.

```text
center selection
   -> chat context

chat references semantic entity
   -> UI can focus/highlight entity
```

This must use semantic/reference IDs rather than free-text matching.

## 11.6 Conversation ownership

Atlas stores conversation history.

Provider conversation/agent state must not become required for:

```text
correctness
review state
project truth
correction state
approval
reconstruction
```

---

# 12. Correction / Addendum Processing

The existing Addendum architecture remains valid.

Use it when human meaning is not already defensibly supported by immutable project sources.

```text
User Correction
      |
      v
Semantic Mediator
      |
      v
resolve correction target
      |
      v
clarification if required
      |
      v
Preview Addendum
      |
      v
incremental Semantic Extraction
      |
      v
Targeted Retrieval
      |
      v
Reconciliation Simulation
      |
      v
Atlas Change Preview
      |
      v
User Confirmation
      |
      v
Atomic Correction Revision
```

The exact Preview Addendum processed by Atlas is the document being accepted.

Atlas should not immediately re-extract that accepted preview after confirmation.

If the Preview Addendum changes semantically after simulation, the previous simulation is invalid and must be rerun.

The accepted document and accepted semantic result must correspond.

---

# 13. Provider Usage, Budget and Capacity

Provider usage/budget concerns remain Agents Bridge responsibilities.

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
+-- pages/tokens
+-- estimated cost
+-- actual cost
+-- latency
+-- attempt count
+-- status
```

Skills and Atlas Core must remain unaware of provider pricing.

Agents Bridge also owns provider-specific operational constraints such as:

```text
concurrency
requests/minute
tokens/minute
document/page limits
retry limits
privacy policy
```

---

# 14. Security Boundary

The database-role boundary established by BSS-003 remains unchanged.

```text
atlas_app
|
+-- auth.*
+-- atlas.*
+-- authorized enqueue operations


agents_bridge
|
+-- bridge.*
+-- pgboss.*
+-- explicitly granted operational access only
```

Agents Bridge must not directly execute operations such as:

```sql
UPDATE atlas.resolved_knowledge;
UPDATE atlas.review_decision;
UPDATE atlas.workspace_head;
UPDATE atlas.revision;
UPDATE atlas.publication;
```

## 14.1 Document security

Agents Bridge receives document bytes only through the existing Atlas-authorized perception handoff.

## 14.2 Semantic/review security

Agents Bridge receives only Atlas-authorized semantic/review context for reasoning.

It must not be granted broad repository access simply to make chatbot or reconciliation implementation convenient.

## 14.3 Provider secrets

Provider credentials remain Bridge deployment secrets.

They must not appear in:

```text
skill contracts
review projections
NormalizedDocument business fields
ordinary client responses
business database records
test snapshots
```

## 14.4 Privacy policy

Provider execution policy may include:

```text
training: deny
retention: standard | zero
```

Atlas remains responsible for its own intentional persistent storage.

---

# 15. Immutable Document Storage

BSS-007 remains authoritative for immutable source-byte storage.

```text
Atlas
   |
   v
DocumentStore
   |
   v
LocalFilesystemDocumentStore
```

Later:

```text
LocalFilesystemDocumentStore
             |
             v
      S3 / R2 DocumentStore
```

Atlas Core should not change when storage adapters change.

## 15.1 Three-layer document model

```text
1. IMMUTABLE SOURCE
   source.pdf

2. DERIVED DOCUMENT PERCEPTION
   NormalizedDocument

3. DERIVED SEMANTICS
   SemanticCandidates
```

Only layer 1 is durable human-authored source material.

Reviewable and resolved semantic states remain reconstructable Atlas state derived from immutable documents plus governed human decisions.

---

# 16. Canonical Production Processing Pipeline

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
                        |
                        v
             document-perception job
                        |
                        v
                 Agents Bridge
                        |
                        v
              provider perception
                        |
                        v
              NormalizedDocument
                        |
                        v
             derived-perception cache
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
               Targeted Retrieval
                        |
                        v
                 Reconciliation
                        |
                        v
          Deterministic Validation
                        |
                        v
           Validated Reviewable State
                        |
             +----------+----------+
             |                     |
             v                     v
       Review Projection     Contextual Chat
             |                     |
             +----------+----------+
                        |
                        v
                   Human Review
                        |
                        v
          Accepted Workspace Resolution
                        |
                        v
             Resolved Knowledge
                        |
              +---------+---------+
              |         |         |
              v         v         v
           Workflow    Facts      CES
```

The core production boundaries are therefore:

```text
DocumentStore
    owns immutable source bytes

Document Perception
    derives provider-neutral document structure

Semantic Extraction
    derives candidate project meaning

Retrieval
    finds relevant context

Reconciliation
    proposes semantic relationships

Reviewable State
    stores validated, potentially unresolved semantic state

Review Projection
    organizes reviewable state for humans

Human Review
    produces governed semantic decisions

Resolved Knowledge
    represents accepted current workspace semantics

Chat
    mediates human interaction with bounded Atlas context
```

---

# 17. Package Structure Direction

The existing workspace/package boundaries remain valid.

Recommended downstream direction:

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
|   +-- semantic/
|   +-- retrieval/
|   +-- reconciliation/
|   +-- review/
|   +-- conversation/
|   +-- revision/
|   +-- knowledge/
|   +-- approval/
|   +-- publishing/
|
+-- atlas-db/
|   +-- schema/
|   +-- repositories/
|   +-- migrations/
|
+-- atlas-contracts/
|   +-- perception/
|   +-- reasoning/
|   +-- semantic/
|   +-- reconciliation/
|   +-- review/
|   +-- conversation/
|   +-- execution/
|
+-- atlas-skills/
|   +-- semantic-extraction/
|   +-- semantic-reconciliation/
|   +-- workspace-review-projections/
|   +-- semantic-mediator/
|   +-- addendum-author/
|   +-- ces-assessment/
|
+-- document-store/
|
+-- atlas-fixtures/
    +-- golden/test/regression only
```

These paths are directional, not locked filenames.

`@atlas/fixtures` remains:

```text
tests
golden scenarios
regression fixtures
architecture verification
```

It must never become runtime authority.

---

# 18. Reasoning Skills and Provider Capabilities

The baseline distinguishes provider capabilities from Atlas reasoning responsibilities.

## 18.1 Document Perception

```text
atlas.document.perceive
    |
    v
authorized source document
    |
    v
NormalizedDocument
```

The approved BSS-008/BSS-009 implementation remains the foundation.

## 18.2 Production skill direction

Prototype-era skills may be rewritten.

The production responsibilities are conceptually:

| Skill / capability | Production responsibility |
|---|---|
| semantic extraction | `NormalizedDocument` -> evidence-grounded semantic candidates |
| semantic reconciliation | incoming candidates + bounded existing/incoming context -> relationship proposals |
| workspace review projections | validated reviewable Atlas state -> bounded human-review model |
| semantic mediator | user language + bounded Atlas context -> query/explore/resolve/correct assistance |
| Addendum author | correction intent requiring new meaning -> standalone Preview Addendum |
| CES assessment | relevant resolved project semantics + governed assurance knowledge -> CES candidates |

## 18.3 `atlas.workspace-review-projections`

The old prototype/fixture contract is not production-canonical.

Useful invariants to preserve:

```text
candidate/review-only
source-grounded
non-publishing
non-authoritative
shared semantic references
```

Its production input should evolve toward:

```text
validated incoming candidates
+
current/base resolved knowledge
+
validated reconciliation relationships
+
dependency references
+
evidence references
+
review metadata
+
validated CES references where relevant
```

Its output should remain a review projection.

It must not become the reconciliation authority.

## 18.4 `atlas.semantic-mediator`

The production mediator receives bounded Atlas context.

It should not:

```text
scan the database directly
discover project state independently
mutate truth
decide approval
invent review relationships
```

It assists humans over state Atlas already owns.

---

# 19. Deterministic vs Provider / Model Responsibilities

## Provider-backed perception

```text
OCR
document parsing
structural blocks
tables
visual regions
page geometry
provider usage metadata
```

## Model / Agents Bridge reasoning

```text
interpret normalized semantics
discover semantic relationships
propose reconciliation
semantic grouping
reason about CES concerns
mediate user language
explain selected review state
compose Addenda
produce candidate explanations
```

## Deterministic Atlas

```text
authorize document access
own DocumentStore interaction
own derived-perception identity/cache
validate schemas
validate references
validate evidence identity
persist semantic candidates
perform retrieval
persist reconciliation proposals
persist review state
preserve current-vs-incoming identity
calculate dependency impact
calculate review progress
page/filter review items
enforce review-decision authority
maintain revisions
maintain HEAD
maintain indexes
maintain provenance
enforce approval
perform atomic commit
publish
```

Invariant:

> **Providers perceive and models reason. Atlas owns state, authority, validation, review, acceptance, and publication.**

---

# 20. Local Production-Shaped Environment

The local environment remains production-shaped.

```text
Atlas
Agents Bridge
Agents Bridge worker
PostgreSQL
LocalFilesystemDocumentStore
qualified provider credentials when configured
```

`docker compose up` remains the supported stack path established by BSS.

Production may later use:

```text
Atlas
Agents Bridge x N
Workers x N
Managed PostgreSQL
S3/R2-compatible DocumentStore
production-qualified provider configuration
```

No new service is required merely because review/chatbot domain capabilities are being added.

---

# 21. Initial Deployment Philosophy

Atlas should remain mostly modular.

Do not create separate deployable services for:

```text
semantic extraction
reconciliation
review projection
chat context assembly
CES
Addendum composition
retrieval
publication
```

unless operational evidence later justifies a service split.

The initial service boundary remains approximately:

```text
1. Atlas App / API
2. Agents Bridge
3. PostgreSQL
4. DocumentStore
```

---

# 22. Queue Strategy

Continue using the BSS-006 PostgreSQL-backed queue.

Benefits remain:

```text
transactional enqueue
retry / backoff
scheduling
concurrency control
failed-job visibility
idempotency
simpler local environment
```

Document Perception already uses this foundation.

Later semantic-domain jobs may reuse it.

Redis should only be introduced when PostgreSQL queueing becomes a demonstrated bottleneck.

---

# 23. Targeted Retrieval Boundary

Retrieval remains an Atlas responsibility.

```text
semantic request
     |
     v
Atlas retrieval/index
     |
     v
relevant semantic neighborhood
     |
     v
Agents Bridge reasoning
```

The rule remains:

> **Retrieval finds candidates for reasoning; it does not decide truth.**

Embeddings may be one retrieval signal.

Atlas owns:

```text
embedding storage
workspace scope
revision scope
semantic identity
dependency signals
retrieval policy
truth decisions
```

---

# 24. Incremental-by-Default Production Behavior

Interactive operations must remain bounded.

## Review

```text
open review
   -> summary

open attention queue
   -> bounded issue list

open group
   -> bounded group items

select item
   -> item + dependency neighborhood

inspect evidence
   -> specific evidence
```

## Chat

```text
current request
+
selected review/semantic context
+
bounded relevant semantic neighborhood
+
bounded evidence
+
bounded assurance context when required
+
output contract
```

## Correction

```text
small Preview Addendum
      |
      v
incremental extraction
      |
      v
targeted retrieval
      |
      v
local reconciliation
      |
      v
affected dependency lookup
```

Full reconstruction is reserved for:

```text
recovery
audit/integrity verification
major reconciliation
baseline migration
explicit rebuild
```

If ordinary review/chat operations repeatedly require the complete project history, that should be treated as a retrieval/indexing/serving design problem.

---

# 25. Production Baseline Invariants

1. **Atlas owns accepted truth.**
2. **Atlas also owns validated reviewable state and human review decisions.**
3. **PostgreSQL remains the canonical persistent store for Atlas state and Atlas-owned operational metadata.**
4. **Immutable project document bytes remain behind the BSS-007 `DocumentStore` abstraction.**
5. **Document Perception and Semantic Extraction remain separate capabilities.**
6. **Document Perception produces a provider-neutral, rebuildable `NormalizedDocument`; it does not produce accepted project truth.**
7. **Derived perception is Atlas-owned rebuildable operational state.**
8. **Agents Bridge executes provider-backed perception and reasoning but cannot directly commit trusted or review-authoritative Atlas state.**
9. **Agents Bridge does not independently discover Atlas documents, semantic state, review items, or conversation authority.**
10. **The BSS-005 provider-neutral `ReasoningRuntime` remains valid.**
11. **The BSS-006 pg-boss runtime remains valid and reusable for later expensive semantic-domain work.**
12. **The BSS-008 provider adapter remains the provider boundary for structured reasoning, chat/tool streaming, and perception capability.**
13. **The BSS-009 series remains the authoritative Document Perception and Atlas/Bridge handoff foundation.**
14. **Skills remain provider-neutral reasoning contracts.**
15. **Provider capability aliases remain server-controlled.**
16. **Interactive and background reasoning continue through the established Bridge execution boundary.**
17. **Better Auth owns authentication persistence; Atlas owns project authorization.**
18. **Fixtures remain tests/golden/regression scenarios, not production truth.**
19. **Prototype/fixture-era skills may be rewritten to satisfy production contracts.**
20. **Retrieval discovers relevant context; it does not decide truth.**
21. **Reconciliation proposals may be valid and reviewable without being accepted truth.**
22. **Reconciliation must be able to reason over incoming-vs-existing and relevant incoming-vs-incoming relationships.**
23. **Validated Reviewable State is distinct from Resolved Workspace Knowledge.**
24. **Review projections organize Atlas-produced state but do not decide reconciliation, truth, approval, CES discovery, or publication.**
25. **Atlas owns review state, review progress, and review-decision authority.**
26. **A human may resolve an evidence-supported interpretation without necessarily creating an Addendum.**
27. **New or clarifying human project meaning not already supported by immutable documents must enter through an immutable source document such as an Addendum.**
28. **The chatbot is a contextual mediator over bounded Atlas state, not a source of truth.**
29. **Current accepted truth, incoming candidate state, reconciliation proposals, unresolved review state, and hypothetical state must remain distinguishable.**
30. **Review and chatbot operations are incremental and bounded by default.**
31. **Provider usage, pricing, retries, capacity, and privacy/retention policy remain Agents Bridge concerns.**
32. **Atlas Core owns validation, retrieval, review state, revisions, HEAD movement, approval, commit, provenance, dependency state, and publication.**
33. **BSS-001 through BSS-009-02 remain approved foundations and are not reopened by this baseline update.**

---

# 26. Final Architecture Principle

> **Atlas owns truth and review authority. PostgreSQL persists trusted and reviewable Atlas state. DocumentStore preserves immutable source bytes. Atlas authorizes source and semantic context access, owns derived perception, retrieval, reconciliation state, review state, review projection, conversation state, and publication. Agents Bridge executes provider-backed perception and reasoning under bounded contracts. The queue schedules expensive work. Skills remain provider-neutral. Better Auth establishes identity.**

The production-shaped downstream path is:

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
Targeted Retrieval
      |
      v
Reconciliation
      |
      v
Deterministic Validation
      |
      v
Validated Reviewable State
      |
      +------------------+
      |                  |
      v                  v
Review Projection    Contextual Chat
      |                  |
      +---------+--------+
                |
                v
           Human Review
                |
                v
 Accepted Workspace Resolution
                |
                v
       Resolved Knowledge
                |
                v
     Approval / Publish / Master
```

This remains consistent with the approved BSS-001 through BSS-009-02 implementation.

The next work belongs in bounded downstream Backend Phase semantic/domain ticket sets rather than extending the completed Stack Setup ticket set.
