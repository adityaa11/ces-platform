# Atlas Backend Production Baseline

## Status

This document captures the current backend architecture direction for Atlas as a **production baseline**, not a disposable prototype.

The central architectural rule is:

> **Atlas owns truth. PostgreSQL persists truth. Agents Bridge performs reasoning. Skills define reasoning contracts. The queue schedules expensive reasoning. Better Auth establishes identity. DocumentStore preserves immutable source bytes.**

The local development environment should differ from production mainly in infrastructure location, not in Atlas semantics.

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
                  +-------------+-------------+
                  |                           |
                  v                           v
           PostgreSQL                  DocumentStore
                  |                           |
       +----------+----------+                v
       |          |          |        Local Filesystem
       v          v          v              initially
     auth       atlas      bridge              |
    schema      schema      jobs               v
       |          |          |              S3/R2
       |          |          |              later
       |          |          |
       |          |          v
       |          |    +----------------------+
       |          |    |    AGENTS BRIDGE     |
       |          |    |                      |
       |          |    | Interactive Runtime  |
       |          |    | Background Workers   |
       |          |    | Queue Processing     |
       |          |    | Provider Routing     |
       |          |    | Budget / Usage       |
       |          |    +----------+-----------+
       |          |               |
       |          |        +------+------+------+
       |          |        |             |      |
       |          |        v             v      v
       |          |      OpenAI        Groq   Vendor X
       |          |
       +----------+
          trusted
        Atlas state
```

Atlas remains the authoritative system for project state. Agents Bridge is an independently deployable reasoning service that never owns accepted Atlas truth.

---

## 2. Proposed Technology Stack

| Area | Technology | Responsibility |
|---|---|---|
| Runtime | Node.js 24 LTS | Runtime for Atlas backend and Agents Bridge |
| Language | TypeScript | Shared contracts and type safety |
| Main database | PostgreSQL | Canonical persistent Atlas state |
| ORM / migrations | Drizzle ORM + Drizzle Kit | Schema, queries, migrations |
| Authentication | Better Auth | Users, sessions, accounts, authentication |
| Auth integration | Better Auth Drizzle adapter | Auth tables in PostgreSQL |
| Async queue | pg-boss | PostgreSQL-backed jobs, retries, scheduling, concurrency |
| Agents Bridge server | Fastify | Lightweight synchronous/streaming HTTP API |
| Chat streaming | SSE initially | Stream chatbot responses without WebSocket complexity |
| Skill contracts | JSON Schema + TypeScript | Provider-neutral reasoning contracts |
| Deterministic validation | AJV | Contract and trusted-state validation |
| Document storage | Local filesystem initially | Immutable PRD/Addendum bytes |
| Future object storage | S3 / R2 adapter | Replace local storage without changing Atlas Core |
| Local infrastructure | Docker Compose | PostgreSQL and supporting services |

Redis, Kafka, Kubernetes, and a separate vector database are intentionally deferred until they solve a proven problem.

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
```

Its fundamental responsibility is:

> **Atlas determines what is allowed to become trusted project state.**

Agents Bridge may return reasoning candidates, but it may never directly advance trusted Atlas state.

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

These are responsibility boundaries, not a final schema. The actual schema should be designed carefully before implementation.

Better Auth should own authentication-related tables. Atlas should own Atlas domain tables.

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

Representative contracts:

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

This keeps Atlas semantics independent from a specific database library while still making PostgreSQL the first real application implementation.

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

---

## 7. Agents Bridge as a Separate Service

Agents Bridge is the one service currently justified as independently deployable.

```text
apps/
+-- atlas/
|
+-- agents-bridge/
```

Its job is **reasoning execution**, not project truth.

```text
Agents Bridge
|
+-- Skill Registry
|
+-- Interactive Executor
|   +-- chatbot
|
+-- Background Worker
|   +-- pg-boss
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
    +-- OpenAI
    +-- Groq
    +-- future vendors
```

Core execution concept:

```ts
interface ReasoningRuntime {
  execute<I, O>(
    skill: SkillDefinition<I, O>,
    input: I,
    context: ExecutionContext
  ): Promise<O>;
}
```

Provider adapters live beneath that interface.

---

## 8. Dual Execution Modes

Agents Bridge should support both interactive and background execution.

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
Model
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
  v
model
  |
  v
candidate result
  |
  v
Atlas deterministic processing
```

Typical background operations:

```text
PRD extraction
large reconciliation
CES assessment
rebuild
reindex
assurance-source ingestion
large dependency refresh
```

Jobs must remain idempotent even when queue retries are available.

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

### 9.2 Correction

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

---

## 10. Paid Model Usage and Budget Management

The operational concern should be broader than token counting.

Use a **Usage & Budget Manager**.

```text
execution
+-- skill
+-- provider
+-- model
+-- requested_by
+-- project/workspace
+-- estimated usage
+-- actual usage
+-- estimated cost
+-- actual cost
+-- latency
+-- attempt count
+-- status
```

Lifecycle:

```text
Reasoning request
       |
       v
estimate cost
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

Skills must remain unaware of provider pricing.

For example, `atlas.ces-assessment` should not know:

```text
OpenAI pricing
remaining account credit
provider rate limits
token pricing
```

Those are Agents Bridge responsibilities.

---

## 11. Provider Capacity Management

Agents Bridge should be able to manage provider-specific operational limits.

```text
Provider A
+-- max concurrent jobs
+-- requests/minute
+-- tokens/minute

Provider B
+-- different limits
```

The execution decision may consider:

```text
Queued job
   |
   v
skill requirement
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
execute
```

This becomes more important as Atlas starts using multiple paid model vendors.

---

## 12. Security Boundary

Separate database roles should reinforce the architecture.

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
+-- optionally SELECT from explicit views
```

Agents Bridge should not have permission to directly perform operations such as:

```sql
UPDATE atlas.resolved_knowledge;
UPDATE atlas.workspace_head;
UPDATE atlas.revision;
UPDATE atlas.publication;
```

Even if application code is wrong, the database should help enforce the authority boundary.

For an audit-oriented product, this is desirable.

---

## 13. Immutable Document Storage

Document bytes are separate from canonical database state.

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

Example local layout:

```text
.atlas-data/
└── documents/
    └── <project>/
        └── <document-id>/
            └── source.pdf
```

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

The database should not store machine-specific local paths as business meaning.

Later:

```text
LocalFilesystemDocumentStore
             |
             v
      S3DocumentStore
```

Atlas Core should not need to change when storage moves from local disk to S3/R2.

---

## 14. Package Structure

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
|   +-- execution/
|   +-- events/
|
+-- atlas-skills/
|   +-- document-extraction/
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

`@atlas/fixtures` remains useful, but its role changes.

It becomes:

```text
test scenarios
golden fixtures
regression fixtures
architecture verification
```

It should no longer own the application architecture or runtime source of truth.

---

## 15. Reasoning Skills

Expected core reasoning capabilities:

| Skill | Responsibility |
|---|---|
| `atlas.document-extraction` | Immutable document -> semantic candidates |
| `atlas.semantic-reconciliation` | Incoming candidates + retrieved knowledge -> semantic relationship proposals |
| `atlas.semantic-mediator` | User language -> query/explore/correct intent |
| `atlas.addendum-author` | Accepted correction intent -> standalone Preview Addendum |
| `atlas.ces-assessment` | Relevant project semantics + assurance knowledge -> CES assessment candidates |
| `atlas.workspace-review-projections` | Trusted resolved knowledge + validated CES assessments -> review projection |

Skills produce candidate reasoning.

They do not directly mutate trusted Atlas state.

---

## 16. Deterministic vs Model Responsibilities

### Model / Agents Bridge

```text
understand documents
interpret semantics
discover semantic relationships
propose reconciliation
reason about CES concerns
mediate user language
compose Addenda
semantic grouping
```

### Deterministic Atlas Core

```text
schema validation
immutability
revision creation
HEAD movement
indexes
approval
atomic commit
references
provenance
dependency state
publication
```

Invariant:

> **The model reasons. The deterministic system decides whether that reasoning satisfies the contract and may enter trusted Atlas state.**

---

## 17. Local Production-Shaped Environment

The local environment should already mirror production architecture.

### Local

```text
Atlas
Agents Bridge
PostgreSQL
Local filesystem documents
```

### Production later

```text
Atlas
Agents Bridge x N
Managed PostgreSQL
S3 / R2
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

The same repository contracts, migrations, revision rules, skill contracts, validation, and authority boundaries should exist in both environments.

---

## 18. Initial Deployment Philosophy

Atlas should remain mostly a modular application.

Do not split every capability into a service.

Avoid creating services such as:

```text
atlas-document-extraction-service
atlas-reconciliation-service
atlas-ces-service
atlas-addendum-service
atlas-retrieval-service
atlas-publish-service
```

Those are internal capabilities.

The initial service boundary should remain approximately:

```text
1. Atlas App / API
2. Agents Bridge
3. PostgreSQL
4. DocumentStore
```

Agents Bridge deserves its own service because its scaling, latency, failure, security, provider-secret, and cost-management characteristics differ materially from the Atlas application.

---

## 19. Queue Strategy

Use PostgreSQL-backed queueing initially.

```text
PostgreSQL
+-- Atlas state
+-- Auth state
+-- Bridge execution state
+-- pg-boss jobs
```

Benefits:

- fewer infrastructure components
- transactional enqueueing
- retry/backoff
- scheduling
- concurrency controls
- dead-letter handling
- simpler local development

Redis may be introduced later if PostgreSQL queueing becomes a proven bottleneck.

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

---

## 21. Production Baseline Invariants

1. **Atlas owns accepted truth.**
2. **PostgreSQL is the canonical persistent state store.**
3. **Agents Bridge performs reasoning but cannot directly commit trusted Atlas state.**
4. **Skills are provider-neutral reasoning contracts.**
5. **Interactive and background reasoning share the same execution runtime.**
6. **Expensive reasoning is queued; interactive chatbot reasoning may run synchronously.**
7. **The database participates in enforcing authority boundaries.**
8. **Immutable project documents are stored behind a DocumentStore abstraction.**
9. **Fixtures become tests and golden scenarios, not production truth.**
10. **Local and production environments use the same architecture and semantics.**
11. **Model usage, pricing, retries, and provider limits belong to Agents Bridge, not individual skills.**
12. **Atlas Core owns validation, revisions, HEAD movement, approval, commit, and publication.**

---

## 22. Final Architecture Principle

> **Atlas owns truth. PostgreSQL persists truth. Agents Bridge performs reasoning. Skills define reasoning contracts. The queue schedules expensive reasoning. Better Auth establishes identity. DocumentStore preserves immutable source bytes.**

This architecture is intended to become the first production-shaped backend baseline for Atlas rather than another temporary prototype layer.
