# Backend Stack Setup Ticket Set

- **State:** `complete`
- **Primary baseline:** [Atlas Backend Production Baseline](../../atlas-backend-production-baseline-mistral-synced.md)
- **Architecture guardrails:** [Atlas Core Architecture — Updated Checkpoint](../../atlas-core-architecture-checkpoint-v2-mistral-enriched-v2.md)

## Purpose

Establish the production-shaped backend workspace and infrastructure boundaries described by the Backend Phase baseline.

These tickets set up the runtime, persistence, identity, reasoning-service, queue, immutable document storage, provider integration, and document-perception foundations.

They do **not** implement Atlas's full knowledge lifecycle.

The existing `apps/atlas` UI and its fixture-driven prototype remain in place while backend services are introduced. `@atlas/fixtures` remains test and golden-scenario material; it is not a production source of truth.

The ticket set follows an additive checkpoint model:

```text
approved checkpoint
      |
      v
frozen architectural boundary
      |
      v
later tickets compose or extend it
without silently rewriting it
```

A later ticket may build on an approved boundary, but it must not retroactively change that ticket's accepted responsibility unless an explicit scope-change decision reopens it.

---

## Validation boundary

- BSS acceptance is limited to stack setup and the service, database, queue, storage, provider, or document-perception boundary named by the individual ticket.
- The `@atlas/fixtures` test suite, golden-bundle generation and reconciliation, PRD/PDF fixture catalog checks, semantic-extraction golden tests, and fixture-driven UI scenario checks are explicitly excluded from BSS acceptance criteria and blockers. They belong to the AUI, GLF, SFE, or later semantic/domain ticket sets.
- References to workspace tests in BSS tickets mean tests for the BSS-owned packages and directly affected integration targets. They do not require the Atlas golden-fixture suite.
- A BSS ticket may use a small synthetic fixture that exists only to validate its own infrastructure/contract boundary, such as a synthetic PDF for document-perception transport and normalization checks.

---

## Local boot contract

This is an additive developer-workflow convention recorded after BSS-001 through BSS-004 were approved; it does not reopen or change their accepted review criteria.

- For every planned BSS ticket that introduces a runnable process or local infrastructure dependency, `docker compose up` is the canonical command that boots the supported local stack.
- A ticket that adds a long-running service must add or update its root `docker-compose.yml` service definition, including the required environment configuration, startup dependencies, health/readiness checks where applicable, and graceful shutdown behavior. Developers must not need a separate manual process-start command after `docker compose up`.
- A ticket that adds a library, adapter, provider capability, filesystem-only capability, or internal contract must state that it runs inside an existing Compose-managed service and must not introduce an unnecessary standalone container.
- The ticket's validation must prove its runnable component is available from the Compose boot path.
- `docker compose up -d postgres` remains the supported database-only workflow.
- `docker compose down` stops the local stack but preserves named data volumes; only `docker compose down --volumes` is a deliberate local-data reset.
- Build or smoke checks for `apps/atlas` may be used when a ticket needs to verify stack compatibility; they do not expand the ticket to fixture-suite validation or UI changes.

---

## Delivery order

Each ticket is its own review batch because each establishes a distinct boundary and acceptance decision.

Tickets remain planned until authorized. After implementation and validation, the implementation commit is recorded when the batch reaches review.

A dependent ticket must not begin implementation until the dependency checkpoints have reached the review state required by the review controls below.

| Order | Ticket / batch | State | Depends on | Review question |
|---:|---|---|---|---|
| 1 | [BSS-001](BSS-001-runtime-and-workspace-foundation.md) / BSS-BATCH-01 | `approved` | — | Is the workspace reproducible on the selected Node and TypeScript toolchain while preserving the existing prototype? |
| 2 | [BSS-002](BSS-002-local-postgresql-compose.md) / BSS-BATCH-02 | `approved` | BSS-001 | Can developers start a durable local PostgreSQL instance through the documented Compose workflow? |
| 3 | [BSS-003](BSS-003-postgresql-drizzle-boundaries.md) / BSS-BATCH-03 | `approved` | BSS-001, BSS-002 | Are PostgreSQL migrations, schema ownership, and repository boundaries established without prematurely fixing the domain schema? |
| 4 | [BSS-004](BSS-004-better-auth-persistence.md) / BSS-BATCH-04 | `approved` | BSS-003 | Does Better Auth persist identity and sessions in its own PostgreSQL schema without taking ownership of Atlas authorization? |
| 5 | [BSS-005](BSS-005-agents-bridge-service-foundation.md) / BSS-BATCH-05 | `approved` | BSS-001, BSS-003 | Can Agents Bridge serve a provider-neutral interactive API and SSE while remaining separate from Atlas truth? |
| 6 | [BSS-006](BSS-006-pg-boss-background-runtime.md) / BSS-BATCH-06 | `approved` | BSS-003, BSS-005 | Can the background runtime process PostgreSQL-backed jobs with retries while remaining unable to mutate trusted Atlas state? |
| 7 | [BSS-007](BSS-007-document-store-foundation.md) / BSS-BATCH-07 | `approved` | BSS-001 | Can immutable source bytes be stored and retrieved through a storage-neutral interface using the initial local adapter? |
| 8 | [BSS-008](BSS-008-mistral-provider-adapter.md) / BSS-BATCH-08 | `approved` | BSS-005 | Can Mistral provide structured reasoning, streamed chat/tool events, and a document-perception provider primitive through provider-neutral Bridge contracts without taking ownership of Atlas truth or document authorization? |
| 9 | [BSS-009](BSS-009-document-perception-pipeline.md) / BSS-BATCH-09 | `approved` | BSS-006, BSS-007, BSS-008 | Are the Document Perception contracts, bounded source-handoff primitives, provider-neutral normalization, and existing-worker queue foundation safe for later Atlas-owned endpoint and integration work? |
| 10 | [BSS-009-01](BSS-009-01-atlas-perception-authority.md) / BSS-BATCH-09.1 | `approved` | BSS-009 | Does Atlas exclusively and securely own perception operational state, source redemption, result handoff, and rebuildable cache persistence? |
| 11 | [BSS-009-02](BSS-009-02-bridge-perception-integration.md) / BSS-BATCH-09.2 | `approved` | BSS-009-01, BSS-008 | Can the existing Atlas/Bridge stack execute a secure, idempotent, provider-neutral PDF perception operation end to end while preserving all authority and privacy boundaries? |

### Dependency sequence after BSS-007

```text
BSS-007
DocumentStore foundation
      |
      | PASS
      v
BSS-008
Mistral provider adapter
      |
      | PASS
      v
BSS-009
Document Perception foundations
      |
      | PASS
      v
BSS-009-01
Atlas perception authority
      |
      | PASS
      v
BSS-009-02
Bridge perception integration
```

BSS-009 also depends on the already-approved BSS-006 queue/runtime boundary.

The sequence does **not** mean BSS-008 owns the document-perception workflow.

The responsibility split is:

```text
BSS-008
    provider capabilities
        |
        +-- structured reasoning
        +-- streamed chat/tool events
        +-- OCR/document-perception provider primitive

BSS-009 series
    Atlas document-perception workflow
        |
        +-- source authorization
        +-- source grant / bounded handoff
        +-- document-perception job
        +-- source-integrity verification
        +-- provider-neutral normalization
        +-- NormalizedDocument
        +-- derived-perception cache
        +-- result handoff / idempotency
```

Semantic Extraction remains downstream work outside this Stack Setup checkpoint:

```text
DocumentStore
      |
      v
Document Perception       <- BSS-009 series
      |
      v
NormalizedDocument
      |
      v
Semantic Extraction       <- later SFE/domain ticket
      |
      v
SemanticCandidates
```

---

## Scope boundaries

### Persistence and authority

- PostgreSQL remains the canonical persistent state store for Atlas-owned canonical and operational metadata.
- `pg-boss` remains the queue. Redis, Kafka, Kubernetes, and a standalone vector database are not introduced by this ticket set.
- `Atlas Core` must not depend on Drizzle.
- Better Auth owns its authentication tables.
- Agents Bridge receives a separately restricted database role and does not write accepted Atlas state.
- These tickets establish schema and migration mechanics and the minimum BSS-owned operational state needed by their boundaries; they do not lock the final Atlas domain schema.

### Immutable source documents

- BSS-007 remains the storage authority for immutable source bytes.
- The initial document adapter is for local development.
- Its interface must support a later S3/R2 adapter.
- Local files are not a production persistence solution.
- Machine-specific local paths remain private to the adapter.
- Later document-perception work must consume source bytes through an Atlas-authorized boundary rather than exposing DocumentStore paths to Agents Bridge.

### Document Perception vs Semantic Extraction

The ticket set now explicitly recognizes:

```text
Document Perception
        !=
Semantic Extraction
```

BSS-009 may establish:

```text
immutable PDF
      |
      v
NormalizedDocument
```

but must not establish:

```text
NormalizedDocument
      |
      v
SemanticCandidates
```

The final semantic-extraction contract, text/visual evidence semantics, diagram interpretation, reconciliation behavior, CES assessment behavior, approval workflow, and publication behavior remain later work.

### Agents Bridge

- BSS-005 remains the approved provider-neutral Bridge foundation.
- BSS-006 remains the approved background runtime.
- BSS-008 and BSS-009 are additive.
- BSS-008 must not rewrite the BSS-005 `ReasoningRuntime`.
- BSS-009 must use the existing BSS-006 pg-boss worker lifecycle rather than creating a second queue or worker framework.
- Agents Bridge continues to receive explicit bounded input and must not independently scan Atlas project state or discover documents.

---

## Provider direction

### Mistral is the first provider qualification direction

Groq is no longer the planned first provider for this ticket set.

The current provider direction is **Mistral**, implemented behind the provider-neutral Agents Bridge boundary.

BSS-008 owns provider integration and qualification.

Current capability direction:

```text
atlas.reasoning.structured
    -> Mistral Large 3 / Medium 3.5
       subject to explicit Atlas qualification

atlas.chat.default
    -> Mistral Small 4

atlas.document.perceive
    -> Mistral OCR 4.1
```

Optional embedding capability may later use:

```text
atlas.retrieval.embed
    -> mistral-embed
```

but embedding support is not required for BSS-008 or BSS-009 acceptance unless separately authorized.

### Provider neutrality remains mandatory

The Mistral decision does not make Atlas model-specific.

```text
Atlas capability / skill
        |
        v
Agents Bridge
        |
        v
server-controlled capability alias
        |
        v
qualified provider/model/endpoint
```

Clients and skills must not choose arbitrary:

```text
provider
model ID
endpoint
provider-specific parameters
```

Provider secrets, rate limits, usage, retries, capacity, pricing/budgets, and privacy/retention policy remain Bridge-owned operational concerns.

### Stateless provider boundary

The current Atlas direction prefers stateless provider execution.

BSS-008 should use provider APIs such as:

```text
chat completions
OCR
```

without making provider-hosted:

```text
Files
Agents
Conversations
Libraries
project memory
```

part of Atlas's canonical state.

Atlas owns:

```text
project documents
workspace state
revision state
resolved truth
chat history
retrieval
derived perception
approval
publication
```

### OCR capability is not the Atlas pipeline

BSS-008's OCR support is only the provider primitive:

```text
bounded provider input
      |
      v
Mistral OCR
      |
      v
Bridge-owned provider perception result
```

The BSS-009 series owns the actual Atlas pipeline:

```text
DocumentStore
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
BSS-008 OCR capability
      |
      v
NormalizedDocument
      |
      v
Atlas-owned derived-perception cache
```

This separation is required so BSS-008 remains a finite provider-adapter review batch rather than absorbing storage, queue orchestration, authorization, and document lifecycle behavior.

---

## Architecture continuity

BSS-001 through BSS-007 remain historical checkpoints.

The Mistral and Document Perception decisions must be applied **forward**:

```text
existing accepted foundation
        |
        v
new baseline decision
        |
        +-- revise planned BSS-008
        |
        +-- add planned BSS-009
```

Do not rewrite approved tickets as though they originally contained this design.

In particular:

```text
BSS-005
    remains provider-neutral service/runtime foundation

BSS-006
    remains generic pg-boss background runtime

BSS-007
    remains immutable source-storage foundation
```

The new work composes those boundaries.

---

## Review controls

- Keep each ticket in `planned` until the user authorizes its implementation.
- When an authorized ticket is implemented, validated, and committed, update it to `awaiting_review` and record the implementation commit in the ticket/batch.
- Do not start a dependent ticket until every required prior checkpoint has a `PASS` review.
- An `awaiting_review` dependency does not authorize dependent implementation.
- A new technology choice, provider decision, execution mode, data contract, or product behavior that is not in the named baselines is a scope decision, not an implementation detail to add silently.
- Once a BSS checkpoint receives `PASS`, treat its accepted boundary as frozen unless a later explicit scope-change decision reopens it.
- A later ticket may extend an approved component only through its published interfaces and authority boundaries.
- If implementation reveals that a planned ticket would require changing an approved predecessor's accepted boundary, stop and surface that as a scope-change decision rather than silently modifying the predecessor.
- The BSS review question must remain narrow enough to produce a finite PASS/fail decision for that ticket's named responsibility.

## Forward engineering-readiness convention

For new or still-planned engineering tickets, use the repository-local
[engineering-security-refactor-readiness skill](../../../../.agents/skills/engineering-security-refactor-readiness/SKILL.md)
during ticket authoring. Supply only the bounded ticket scope, accepted
project/architecture context, relevant dependency boundaries, and any already
decided technology/profile context. Do not retrofit this section into approved
historical BSS checkpoints.

When readiness is applicable, freeze a compact section in the ticket. Stable
IDs are authoritative; wording may be concise. Record the mandatory bindings
under the frozen `reviewBindings` field; the following is its human-readable
Markdown form:

```markdown
## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-...` Accepted authority or responsibility inherited by this ticket.

### Required seams

- `SEAM-...` Implementation seam that later security policy must be able to use.

### Prohibited couplings

- `COUPLING-...` Dependency or responsibility this ticket must not introduce.

### Intentionally unresolved security policy

- `SEC-GAP-...` Policy intentionally left for the future security baseline.

### Mandatory review bindings

- `REV-READY-...`
  Ref: `SEAM-...`
  Question: Does the implementation preserve the declared seam?
  Evidence: boundary or test evidence
```

Implementation consumes this frozen section and does not rerun readiness
authoring. The single [engineering-implementation-review entry point](../../../../.agents/skills/engineering-implementation-review/SKILL.md)
always performs the base review. If the ticket declares a readiness section or
readiness bindings, it must also load
`references/security-refactor-readiness.md`; an unresolved required reference
is an inconclusive/blocking finding. Readiness bindings are minimum coverage,
not a substitute for independent review, and the result remains one overall
review outcome.

### Current review gate

At the time of this README update:

```text
BSS-001  approved
BSS-002  approved
BSS-003  approved
BSS-004  approved
BSS-005  approved
BSS-006  approved
BSS-007  approved
BSS-008  approved (`b9b75f3`, PASS)
BSS-009  approved (`b6c65a8`, PASS)
BSS-009-01  approved (`5ca655f`, PASS)
BSS-009-02  approved (`20bf00b`, PASS)
```

Therefore:

```text
Stack Setup
    is complete; no dependency-ready BSS ticket remains in this ticket set
```

---

## Stack Setup completion boundary

The Stack Setup ticket set is complete when the approved checkpoints establish, at minimum:

```text
reproducible runtime/workspace
        |
        v
PostgreSQL foundation
        |
        v
persistence/role boundaries
        |
        v
Better Auth persistence
        |
        v
provider-neutral Agents Bridge
        |
        v
background queue runtime
        |
        v
immutable DocumentStore
        |
        v
qualified Mistral provider adapter
        |
        v
provider-neutral Document Perception pipeline
        |
        v
NormalizedDocument
```

The Stack Setup phase intentionally stops before:

```text
semantic extraction
reconciliation
resolved knowledge
CES assessment
workflow/facts projections
chatbot correction semantics
approval/publication behavior
```

Those belong to the subsequent Atlas feature/domain phases.
