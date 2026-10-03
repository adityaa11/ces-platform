# Atlas Core Architecture Checkpoint V3

## Status

This document is the V3 architecture checkpoint for Atlas Core.

It supersedes `atlas-core-architecture-checkpoint-v2-mistral-enriched-v2.md` where the two documents conflict. The V2 semantic, review, provenance, document, and authority principles remain valid unless explicitly amended here.

V3 reconciles four realities:

1. the production-oriented architecture already established in the Backend Phase;
2. the code that now exists on `codex/new-atlas-backend`, including BSS-001 through BSS-009 and IDSER work through the current Initial Draft pipeline;
3. the provider, capacity, privacy, and product-economics requirements discovered during live-provider qualification; and
4. the local Docling perception feasibility evidence showing that digital-PDF perception can reach the unchanged `NormalizedDocument v1` boundary without external inference.

The goal is not to redesign Atlas around another model vendor or to force every capability through a remote AI provider. The goal is to make the existing Atlas architecture explicitly capable of composing qualified local processors and qualified external reasoning providers without changing Atlas truth semantics.

The central V3 rule is:

> **Atlas owns project truth, source authority, product entitlement, and durable business policy. Agents Bridge owns bounded execution of qualified capability implementations and normalized execution telemetry. Local processors and external providers are replaceable execution mechanisms beneath Atlas-owned contracts; neither becomes Atlas semantic authority.**

---

# 1. Compatibility With Established Backend Work

V3 is an architecture reconciliation, not a reset.

The following foundations remain valid:

```text
BSS-001  Runtime / workspace foundation
BSS-002  Local PostgreSQL
BSS-003  PostgreSQL / Drizzle authority boundaries
BSS-004  Better Auth persistence
BSS-005  Agents Bridge service foundation
BSS-006  pg-boss background runtime
BSS-007  DocumentStore foundation
BSS-009  Document Perception authority and handoff foundation

IDSER-001 through IDSER-010
          domain persistence, semantic contracts, sequencing,
          reconciliation, replay, lifecycle, and deterministic proof
```

## 1.1 BSS-008 is preserved but reclassified

BSS-008 produced two different kinds of value that must no longer be treated as one thing.

The architectural/provider-adapter work remains valid:

```text
provider adapter boundary
server-controlled provider/model selection
structured-output transport
streaming normalization
tool-call normalization
perception primitive
bounded retries
cancellation
timeouts
usage normalization
privacy preflight
provider error normalization
secret isolation
```

The Mistral-specific live production qualification is not currently valid as the active Atlas provider baseline.

The observed live account state independently demonstrated:

```text
authentication succeeds
model discovery succeeds
live inference returns HTTP 429
provider advertises request limit = 0/minute
```

Therefore V3 classifies the current Mistral route as:

```text
implemented adapter
+
not currently production-qualified for this Atlas deployment
```

This does not delete the Mistral adapter and does not invalidate the provider-neutral Bridge architecture.

## 1.2 IDSER-011 remains historical live-provider evidence

The existing IDSER-011 ticket set explicitly proves a real Mistral path. It must not be silently rewritten into Gemini acceptance while retaining the same historical identity.

Its current Mistral-specific live gate should be preserved as externally blocked evidence.

A replacement or superseding provider-qualification checkpoint should prove the active provider route under V3 without reopening the deterministic IDSER-001 through IDSER-010 authority already established.

## 1.3 Capability decoupling remains the correct infrastructure direction

The architecture requires generic workers to depend on narrow capabilities rather than concrete vendor classes.

BSS-V2-001 has since demonstrated that the semantic worker, perception worker, and interactive runtime can consume provider-neutral capability interfaces while retaining the existing Mistral adapter behavior. BSS-V2-002 has established server-controlled qualified-route resolution.

Those results strengthen, rather than replace, the V3 rule:

```text
generic execution path
    -> capability interface
    -> qualified implementation
```

A qualified implementation may be a local processor for a capability that does not require remote inference, or an external provider/model for a capability that does.

Existing semantic contracts, persistence, queue semantics, replay semantics, source authority, and Atlas truth authority must remain unchanged by this infrastructure correction.

## 1.4 Docling perception feasibility evidence

DOCSPIKE-001 provides current feasibility evidence for a local digital-PDF perception path.

The recorded experiment:

```text
repository PDF
    -> local Docling
    -> deterministic generic perception result
    -> existing normalizePerceptionResult(...)
    -> unchanged NormalizedDocument v1
```

demonstrated on the required repository-owned digital PDFs:

```text
all pages preserved
major text preserved
usable heading/section structure
usable reading order
tables preserved where present
trustworthy text geometry preserved
primary Safara output deterministic across equivalent runs
no external inference call
no NormalizedDocument v1 change
```

The recorded result is `PASS_WITH_LIMITS` and remains feasibility evidence until its review is accepted and a separate production-integration ticket is approved. The known limits are not hidden: visual regions were omitted when geometry was unstable, confidence was not fabricated, and scanned-PDF/OCR behavior was not established.

This evidence changes the preferred development perception direction. It does not itself activate Docling in production and does not alter semantic extraction or reconciliation authority.

---

# 2. Core Atlas Principle

Atlas remains a governed knowledge system derived from immutable human-readable documents.

```text
Immutable Documents
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
Semantic Candidates
        |
        v
Targeted Retrieval
        |
        v
Semantic Reconciliation
        |
        v
Validated Reviewable State
        |
        v
Human Review
        |
        v
Accepted Workspace Resolution
        |
        v
Resolved Workspace Knowledge
```

From accepted knowledge, Atlas may derive:

```text
Main Workflow
Project Facts
Project Context
CES assessments/results
review projections
chat context
```

No perception processor or reasoning provider becomes the system of record.

A qualified perception processor may derive source-grounded document structure. A qualified reasoning provider may propose bounded semantic or analytical output.

Atlas validates, persists, reviews, accepts, publishes, and reconstructs.

---

# 3. Authority Model

The V3 authority split is strict.

## 3.1 Deterministic Atlas authority

Atlas owns:

```text
authentication integration
project authorization
projects
workspaces
base revision / HEAD
immutable document identity
document authorization
derived perception ownership
semantic candidate persistence
retrieval policy
knowledge index
reconciliation state
reviewable state
review decisions
resolved knowledge
dependency graph
approval
publication
Master advancement
conversation state
chat context assembly
CES result state
commercial entitlement
workspace privacy requirement
Atlas usage allowance
Atlas budget policy
```

## 3.2 Agents Bridge authority

Agents Bridge owns:

```text
capability implementation adapters
local processor invocation where configured
provider credentials
provider adapters
capability route resolution
processor/provider/model allowlists
provider request translation
provider-specific limits
provider health
provider concurrency
provider rate-limit enforcement
bounded retries
timeout/cancellation
normalized execution usage/metrics
normalized execution errors
route/executor provenance
operational execution budgets
```

Provider-specific quota, pricing, retention, and rate-limit policy applies only where an external provider is actually used. A local processor such as Docling must not be forced into fictitious RPM/TPM/RPD, credential, training-retention, or token-cost semantics.

Agents Bridge does not own:

```text
project truth
review decisions
customer plan entitlement
publication
workspace authorization
conversation authority
source discovery
Atlas semantic repository traversal
```

## 3.3 Capability executor authority

A local perception processor may perform only the source-grounded perception work for which it is qualified, for example:

```text
PDF parsing
text-block recovery
heading/structural classification
reading-order recovery
table recovery
geometry normalization when trustworthy
OCR when separately qualified
```

A reasoning provider may perform only the reasoning capabilities for which its route is qualified, for example:

```text
structured semantic reasoning
relationship reasoning
CES reasoning
chat response generation
tool-call proposals
Addendum language composition
embedding generation
multimodal interpretation when separately qualified
```

A perception processor must not manufacture business semantics merely because it detects document structure. A reasoning provider must not become source, review, publication, or truth authority.

All executor output remains untrusted until the applicable Atlas/Bridge validation succeeds.

---

# 4. Execution-Neutral Capability Model

Atlas features request capabilities, not vendor, processor, or model IDs.

The initial capability vocabulary is:

```text
atlas.document.perceive
atlas.semantic.extract
atlas.semantic.reconcile
atlas.retrieval.embed
atlas.ces.assess
atlas.chat.default
atlas.chat.deep
atlas.addendum.compose
```

These names describe Atlas needs.

They do not mean:

```text
Docling
Gemini
Mistral
OpenAI
OpenRouter
or any fixed processor/model family
```

Skills and Atlas clients must not select arbitrary processor/provider names, model IDs, endpoint URLs, provider-specific safety options, or pricing parameters.

## 4.1 Narrow provider interfaces

The concrete worker/runtime implementation should use capability interfaces conceptually similar to:

```text
DocumentPerceptionProvider
    perceive(...)

StructuredReasoningProvider
    structured(...)

StreamingChatProvider
    streamChat(...)

EmbeddingProvider
    embed(...)
```

`DocumentPerceptionProvider` is the existing code-level interface name. Its semantics are executor-neutral: it may be implemented by a local processor such as Docling or by a remote provider when separately qualified. Renaming the interface is not required merely to integrate Docling.

One implementation may support one or several interfaces.

The existing Mistral adapter may continue to implement applicable interfaces. The Gemini adapter may continue to implement applicable remote-provider interfaces. A local Docling adapter may implement only the perception interface. Future providers or processors may implement the same Atlas-facing capability contracts.

The semantic worker must depend on `StructuredReasoningProvider`, not a concrete vendor.

The perception worker must depend on the perception capability interface, not a concrete vendor or direct filesystem parser.

---

# 5. Qualified Deployment Routes

V3 makes capability routing a first-class deployment concept.

A capability is executed through a **Qualified Route**.

Conceptually:

```text
QualifiedRoute
+-- route_id
+-- capability
+-- executor_kind              local_processor | external_provider
+-- executor_id
+-- model_or_processor_id
+-- adapter_version
+-- qualification_version
+-- work_class
+-- privacy_class              when applicable
+-- cost_profile_id            when applicable
+-- capacity_profile_id        when applicable
+-- fallback_policy_id         when applicable
+-- effective_from
+-- effective_until (optional)
+-- enabled
```

The already-implemented route registry may be extended additively to represent a local processor. Existing approved route history must not be rewritten merely because the executor vocabulary becomes broader.

An external-provider route is not valid merely because the provider lists the model. A local-processor route is not valid merely because the library can be imported.

A route becomes usable only after the qualification gates applicable to that executor and capability pass.

## 5.1 Deployment profiles

A deployment profile groups active routes without changing Atlas semantics.

Example development shape:

```text
ATLAS_DEV

atlas.document.perceive
    -> qualified local Docling route for supported digital PDFs

atlas.semantic.extract
    -> separately qualified structured-reasoning route

atlas.semantic.reconcile
    -> separately qualified structured-reasoning route

atlas.ces.assess
    -> separately qualified reasoning route

atlas.chat.default
    -> separately qualified interactive route
```

A future production profile may map the same capabilities differently:

```text
ATLAS_PRODUCTION

atlas.document.perceive
    -> qualified local processor or remote perception provider

atlas.semantic.extract
    -> Provider B / Model E

atlas.semantic.reconcile
    -> Provider C / Model R

atlas.ces.assess
    -> Provider C / Model C

atlas.chat.default
    -> Provider B / Model H
```

No Atlas semantic contract should change because this mapping changes.

## 5.2 Current development direction

The current development direction is intentionally split by capability:

```text
document perception
    -> local Docling integration for the supported digital-PDF class

semantic extraction / reconciliation
    -> separate model qualification after the perception checkpoint

chat / CES
    -> separate capability qualification when their phases require it
```

Docling is not semantic authority and is not evidence that semantic extraction or reconciliation is solved.

Gemini remains one available development reasoning-provider direction, but no exact reasoning provider/model is frozen by this checkpoint. Any external model identity must be explicit, pinned, available to the real account, independently qualified for its capability, and recorded in route provenance.

Mutable `*-latest` aliases should not be production defaults unless a deliberate qualification policy explicitly permits them.

Historical `worker1` Gemini success remains useful background evidence. It does not replace current capability-specific qualification.

---

# 6. Capability Qualification Is a Production Gate

The Mistral incident and the Docling feasibility work establish a broader V3 rule:

> **Do not treat installation, model listing, API-key authentication, or a successful isolated demo as production qualification. Qualification must prove the actual capability boundary Atlas will consume.**

Every active route must pass the gates applicable to its executor type and capability before production-shaped implementation depends on it.

## 6.1 Common qualification gates

Every capability route should prove, as applicable:

```text
1. Executor identity
   - exact processor/provider/model identity is recorded
   - adapter and qualification versions are explicit

2. Capability compatibility
   - exact Atlas capability is supported
   - no hidden state is required to reconstruct Atlas behavior

3. Bounded input/output
   - the executor receives only authorized bounded input
   - output is parsed and validated before trusted handoff

4. Contract compatibility
   - final Atlas-owned contract validates without weakening
   - unavailable optional data remains absent rather than fabricated

5. Determinism or repeatability appropriate to the capability
   - deterministic processors should be materially repeatable
   - probabilistic reasoning routes must meet the frozen semantic repeatability/quality oracle

6. Failure behavior
   - timeout/cancellation/failure is bounded
   - failed execution does not create trusted partial state

7. Provenance
   - actual executor identity and execution metadata are recorded
```

## 6.2 Local document-perception qualification

For a local processor such as Docling, qualification is based on document-processing behavior rather than remote-provider economics.

For the currently evidenced digital-PDF path, qualification should cover:

```text
real bounded PDF input
page preservation
major-text preservation
heading/section structure
reading order
table recovery where present
stable source-unit IDs
geometry only when trustworthy
no fabricated confidence or visual data
repeatable Atlas-facing output
existing normalizePerceptionResult(...) compatibility
unchanged parseNormalizedDocument(...) success
bounded runtime/resource behavior
no external source transmission
```

Scanned-PDF/OCR behavior is a separate capability qualification until explicitly proven.

A local Docling route does not need invented API credentials, RPM/TPM/RPD, provider training-retention policy, token pricing, or 429 behavior. Those concepts apply only when the actual executor has them.

## 6.3 External reasoning-provider qualification

An external reasoning route should cover the applicable gates:

```text
credential and usable entitlement
pinned model identity
bounded structured generation
provider-facing schema compatibility
deterministic Atlas finalization where used
complete final Atlas-side contract validation
representative semantic extraction when applicable
representative reconciliation when applicable
latency
real rate-limit behavior
usage metadata
privacy/data-use classification
cost profile when production economics require it
```

Provider-native structured output is a transport aid. Atlas may use a smaller provider-facing intermediate schema when deterministic code owns IDs, evidence wiring, source accounting, or other system-owned fields. The final Atlas result must still satisfy the complete unchanged Atlas contract before acceptance.

A model that passes chat qualification does not automatically pass reconciliation qualification. A model that accepts PDFs does not automatically pass Atlas perception qualification.

## 6.4 Qualification is capability-specific

A route may therefore be qualified for:

```text
digital-PDF perception only
OCR/scanned perception only
semantic extraction only
semantic reconciliation only
chat only
multiple explicitly proven capabilities
```

The same executor may serve several capabilities only when each required capability has its own valid qualification evidence.
---

# 7. Immutable Document Model

The durable document model remains unchanged.

Atlas has two durable project document origins:

```text
externally authored PRD

Atlas-assisted human Addendum
```

Both become immutable source documents after acceptance.

Atlas distinguishes three layers:

```text
1. IMMUTABLE SOURCE
2. DERIVED DOCUMENT PERCEPTION
3. DERIVED SEMANTICS
```

Only layer 1 is durable human-authored project evidence.

Derived perception and semantic state are reconstructable operational state.

Provider changes must never change the immutable source identity.

---

# 8. Document Perception

Document Perception remains separate from Semantic Extraction.

The perception stage answers structural/source questions such as:

```text
what pages exist?
what text blocks exist?
which blocks are headings or paragraphs?
what is the reading order?
what tables exist?
what trustworthy geometry exists?
```

It does not answer business-semantic questions such as:

```text
is this a workflow step?
is this a business rule?
does this contradict another fact?
which statement should be accepted?
```

The target boundary is:

```text
Immutable PDF bytes
       |
       v
atlas.document.perceive
       |
       v
qualified perception executor
       |
       +-- local Docling processor for supported digital PDFs
       |
       +-- future separately qualified perception executor
       |
       v
generic source-grounded perception result
       |
       v
existing normalizePerceptionResult(...)
       |
       v
NormalizedDocument v1
```

The current BSS-009 authority flow remains valid:

```text
Atlas authorizes source access
Atlas issues bounded source grant
Bridge redeems explicit source bytes
qualified perception executor processes only those bytes
Atlas receives a normalized result
Atlas owns derived cache
```

Agents Bridge must not discover DocumentStore paths or project files independently. A local processor does not gain direct source-store authority merely because it executes on the same machine or Compose network.

## 8.1 NormalizedDocument remains the perception/semantics compatibility boundary

The established contract remains the compatibility boundary.

Conceptually:

```text
NormalizedDocument
+-- artifact identity
+-- source SHA-256
+-- execution identity
+-- executor provenance
+-- pages[]
    +-- page number
    +-- optional dimensions
    +-- textBlocks[]
        +-- stable id
        +-- text
        +-- optional structural kind
        +-- optional boundingBox
        +-- optional confidence
    +-- tables[]
    +-- visualRegions[]
```

Any perception implementation must adapt to this contract.

Atlas must not weaken the contract merely to make an executor appear compatible.

Optional fields are genuinely optional; missing or untrustworthy processor metadata must remain missing rather than fabricated.

The existing field currently named `provider` in `NormalizedDocument v1` is treated as execution provenance for compatibility. Docling integration does not require an immediate v1 schema rename. A future contract version may adopt broader executor terminology only through an intentional versioned migration.

## 8.2 Current Docling evidence and integration direction

DOCSPIKE-001 demonstrated the following Atlas-facing path without modifying the contract:

```text
local Docling 2.132.0
    -> deterministic mapper
    -> generic perception result
    -> normalizePerceptionResult(...)
    -> parseNormalizedDocument(...)
    -> NormalizedDocument v1
```

For the primary Safara benchmark, the recorded evidence preserved all seven pages, all nine required major headings, usable major text and reading order, and deterministic Atlas-facing output across two equivalent runs. Finance and Readiness fixtures also demonstrated table recovery.

The current limits remain explicit:

```text
visual regions not yet qualified
confidence not emitted
scanned-PDF/OCR behavior not yet qualified
production lifecycle integration not yet authorized by the spike itself
```

Therefore the immediate production-shaped perception goal is bounded:

```text
IDSER-scheduled D1 perception execution
    -> existing BSS-009 source authority
    -> local Docling processor
    -> unchanged normalization
    -> Atlas-accepted NormalizedDocument v1
    -> STOP before semantic extraction qualification
```

That checkpoint must prove stable source locators and replay/failure behavior before semantic-provider qualification is resumed.
---

# 9. Semantic Extraction and Reconciliation

This section begins only after an authorized, accepted `NormalizedDocument v1` exists. The Docling realignment does not reopen or weaken the established IDSER semantic contracts.

The current semantic contracts established during IDSER remain authoritative until intentionally versioned.

```text
atlas.semantic.extract/v1
atlas.semantic.reconcile/v1
```

Semantic Extraction derives evidence-grounded candidate meaning from a bounded `NormalizedDocument` context.

Semantic Reconciliation receives bounded current candidates plus Atlas-authorized prior candidates selected by deterministic policy.

The current provider-neutral path remains:

```text
Atlas semantic context
        |
        v
Agents Bridge
        |
        v
StructuredReasoningProvider
        |
        v
provider response
        |
        v
schema validation
        |
        v
Atlas result handoff
        |
        v
persistence / reviewable state
```

The provider cannot promote candidates to accepted truth.

## 9.1 Reconciliation semantics remain unchanged

Atlas may propose relationships such as:

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

A valid reconciliation output may still require human resolution.

```text
valid
    != accepted

reviewable
    != resolved
```

---

# 10. Targeted Retrieval and Incremental Processing

Atlas continues to avoid full-corpus provider calls for ordinary work.

```text
incoming candidate / user request
        |
        v
Atlas retrieval/index
        |
        v
bounded relevant neighborhood
        |
        v
provider-backed reasoning
```

Retrieval may use:

```text
semantic identity
business object/property
actor
condition
relationship
workflow neighborhood
project terminology
dependency
workspace/revision
optional embedding similarity
```

Retrieval discovers relevant context.

It does not decide truth.

The bounded-context strategy is now also an economic requirement because it reduces:

```text
input tokens
provider cost
TPM pressure
latency
privacy exposure
```

---

# 11. Reviewable State and Resolved Knowledge

The V2 review boundary remains unchanged.

```text
Base Resolved Knowledge
        +
Validated Incoming Candidates
        +
Validated Reconciliation Relationships
        |
        v
VALIDATED REVIEWABLE STATE
        |
        v
Human Review
        |
        v
ACCEPTED WORKSPACE RESOLUTION
        |
        v
RESOLVED WORKSPACE KNOWLEDGE
```

Reviewable state may contain contradictions, ambiguity, possible supersession, source-internal inconsistency, dependency impact, evidence references, and human decisions without becoming Master truth.

New or clarifying human project meaning that is not already supported by immutable documents must still enter through an Addendum.

---

# 12. Projections Are Deterministic by Default

Main Workflow, Project Facts, review projection, and similar human-facing projections must not become unnecessary model-cost centers.

The default rule is:

```text
accepted/reviewable structured Atlas state
        |
        v
deterministic projection
        |
        v
human-facing model
```

Provider-backed reasoning may be used only where deterministic derivation is insufficient and the capability has an explicit qualified route.

The model must not independently reinterpret historical PRDs merely to render a projection that Atlas can derive from persisted semantic state.

## 12.1 Main Workflow and Project Facts

Both remain projections of the same resolved knowledge.

```text
Resolved Knowledge
   |            |
   v            v
Main Workflow  Project Facts
```

They must not silently disagree.

CES does not scrape rendered projection UI.

## 12.2 Review Projection

Review Projection remains downstream of validated candidates, reconciliation, dependencies, evidence, review metadata, and applicable validated CES state.

It organizes review state.

It does not decide:

```text
semantic truth
reconciliation
supersession
conflict resolution
approval
publication
CES discovery
```

---

# 13. CES

CES remains a distinct reasoning capability.

```text
Relevant Resolved Project Semantics
        +
Governed Assurance Knowledge
        |
        v
atlas.ces.assess
        |
        v
CES Assessment Candidates
        |
        v
Deterministic Validation
        |
        v
Validated CES Assessments
```

CES keeps separate:

```text
SOURCE SAID
```

from:

```text
CES DERIVED
```

Provider/model routing for CES may differ from extraction or chat if qualification, quality, cost, or capacity justify it.

---

# 14. Conversational Semantic Mediator

The chatbot remains Atlas's contextual semantic mediator.

It is not the source of truth and not the primary post-extraction surface.

Atlas owns:

```text
conversation identity
conversation history
workspace authorization
selected review/semantic identity
bounded retrieval
current/base state
incoming state
reconciliation state
evidence
dependencies
permissions
```

Agents Bridge receives only the bounded context authorized for the current request.

## 14.1 Interactive work class

Chat is explicitly an **interactive** provider workload.

Interactive work must not be starved by a burst of background PRD processing.

The capacity system must therefore support protected interactive capacity or equivalent priority semantics.

## 14.2 Query, Explore, Correct

The broad modes remain:

```text
QUERY
EXPLORE
CORRECT
```

Query and Explore do not mutate project truth.

Correct may result in:

```text
evidence-supported review resolution
```

or:

```text
Preview Addendum
```

The existing rule remains:

> **Chatbot owns human -> document. Atlas owns document -> knowledge.**

---

# 15. Work Classes and Queue Architecture

V3 keeps pg-boss.

No Redis/Kafka redesign is required merely because Atlas now accounts for provider economics and capacity.

The important change is that one global concurrency number must not remain the long-term meaning of Atlas provider capacity.

## 15.1 Background work

Typical background provider work:

```text
document perception
semantic extraction
semantic reconciliation
CES assessment
rebuild/reprocessing
large dependency refresh
```

Background work may wait in pg-boss without changing semantic correctness.

## 15.2 Interactive work

Typical interactive work:

```text
chat query
chat exploration
review-item explanation
clarification
review-resolution assistance
bounded Addendum drafting
```

Interactive work should normally use the interactive Bridge runtime rather than wait behind bulk background jobs.

## 15.3 Capability-aware capacity lanes

The target capacity model is conceptually:

```text
Provider Capacity
     |
     +-- perception budget
     +-- extraction budget
     +-- reconciliation budget
     +-- CES budget
     +-- protected interactive budget
```

These are logical admission/capacity policies. They do not require separate infrastructure products.

Implementation may use:

```text
separate pg-boss queue names
shared queue with capability-aware admission
per-capability semaphores
provider/model token buckets
or a combination
```

The architecture requirement is independent control, not a prescribed queue implementation.

## 15.4 Existing worker compatibility

The current implementation already has:

```text
atlas-document-perception-v1 queue
bridge-background-execution-v1 queue
AGENTS_BRIDGE_WORKER_CONCURRENCY
```

V3 preserves these as valid current foundations.

The later evolution is to make admission/concurrency capability-aware without breaking the current transaction, retry, idempotency, replay, and fencing guarantees.

---

# 16. Multi-User Capacity Model

Atlas assumes many Atlas users may share one server-side provider project/account and one or a small number of server-side provider credentials.

Provider credentials are not user credentials.

```text
Atlas User A --+
Atlas User B --+
Atlas User C --+--> Atlas --> Agents Bridge --> provider project/account
Atlas User D --+
```

Provider RPM/TPM/RPD or equivalent capacity is therefore shared infrastructure capacity.

Creating multiple API keys inside the same upstream quota domain must not be treated as a guaranteed capacity multiplier.

Atlas must protect users from one tenant or workload consuming all available provider capacity.

This requires Atlas-side entitlement plus Bridge-side capacity control.

---

# 17. Three Separate Economic Controls

V3 formally separates three concerns that must never be collapsed into one counter.

## 17.1 Customer entitlement

Question:

> What is this Atlas account allowed to use?

Examples:

```text
plan capability access
monthly Atlas processing allowance
chat allowance
project/document/page allowance
overage policy
trial expiration
```

Owner:

```text
Atlas application/business policy
```

## 17.2 Atlas economic policy

Question:

> How much provider cost is Atlas willing to incur for this account, capability, or period?

Examples:

```text
tenant budget
workspace budget
capability budget
monthly service budget
hard stop / soft warning
free-evaluation subsidy
```

Owner:

```text
Atlas application/infrastructure policy
```

Semantic skills must remain unaware of these values.

## 17.3 Provider execution capacity

Question:

> Can the currently qualified route execute this request now?

Examples:

```text
RPM
TPM
RPD
concurrency
page limits
request-byte limits
provider outage
429 cooldown
model availability
```

Owner:

```text
Agents Bridge
```

These three controls may all reject or delay a request for different reasons and must produce different typed outcomes.

---

# 18. Economic Admission

Provider-backed execution should pass an admission boundary before network transmission.

Conceptually:

```text
request
  |
  v
authenticated tenant/workspace
  |
  v
capability entitlement
  |
  v
privacy requirement
  |
  v
Atlas usage allowance / budget
  |
  v
qualified route resolution
  |
  v
provider capacity admission
  |
  +--> execute now
  |
  +--> enqueue background work
  |
  +--> qualified fallback
  |
  +--> typed capacity/budget failure
```

A background job may be queued when capacity is temporarily unavailable.

Interactive work should prefer a qualified fallback or a bounded capacity response rather than silently waiting behind an unbounded background backlog.

---

# 19. Usage Ledger and Execution Provenance

Every provider-backed execution must leave enough metadata to understand quality, capacity, and cost without storing raw PRD content in an economic ledger.

Conceptually:

```text
execution_usage
+-- execution_id
+-- tenant/account identity
+-- project_id
+-- workspace_id
+-- bundle_id when applicable
+-- document_id when applicable
+-- capability
+-- skill/version when applicable
+-- work_class
+-- route_id
+-- provider
+-- model/processor
+-- qualification_version
+-- privacy_class
+-- request_count
+-- retry_count
+-- input_tokens when reported/derived
+-- output_tokens when reported/derived
+-- cached_tokens when reported
+-- pages when applicable
+-- bytes when applicable
+-- latency
+-- queue_delay when applicable
+-- status
+-- provider error class when applicable
+-- price_profile_id
+-- actual_cash_cost
+-- shadow_production_cost
+-- started_at
+-- completed_at
```

Exact table names are not frozen here.

## 19.1 Split operational and commercial ownership

Bridge may persist low-level operational execution/usage state in its own authority namespace.

Atlas may persist/aggregate commercial usage needed for tenant allowance, product analytics, and billing policy.

The same event must not grant Bridge access to Atlas trusted semantic state.

## 19.2 No source content in cost telemetry

Usage/cost telemetry should contain:

```text
IDs
counts
sizes
token/page usage
provider/model identity
latency
status
cost metadata
```

It should not contain:

```text
raw PDF bytes
full prompts
full provider bodies
PRD text
secrets
source grants
```

---

# 20. Effective-Dated Provider Cost Catalog

V3 treats provider price as changing configuration, not semantic code.

Conceptually:

```text
ProviderPriceProfile
+-- price_profile_id
+-- provider
+-- model/processor
+-- effective_from
+-- effective_until
+-- currency
+-- input_price_per_unit
+-- output_price_per_unit
+-- cached_input_price_per_unit
+-- page_price_per_unit
+-- request_price_per_unit
+-- other_meter_rules
```

Not every provider uses every meter.

Historical executions retain the price profile used for their cost calculation.

Provider pricing must not be hard-coded inside semantic skills.

---

# 21. Shadow Production Cost

Free-tier development must not hide future COGS.

Even when:

```text
actual cash cost = 0
```

Atlas should calculate a shadow production cost using the equivalent paid/production price profile when one is defined.

This allows development and beta telemetry to answer:

```text
cost per document
cost per page
cost per extraction
cost per reconciliation
cost per bundle
cost per project
cost per chat session
cost per active account
P50 / P90 / P99 AI COGS
```

The product can therefore be priced from observed Atlas workloads rather than from free-tier illusions.

---

# 22. Privacy Classes

Provider privacy is now a first-class route qualification property.

The initial privacy classes are conceptually:

```text
EVALUATION
NO_TRAINING
ZDR_REQUIRED
```

The names may later become formal enums, but the distinction is required.

## 22.1 EVALUATION

May permit a provider route without ZDR or production no-training guarantees.

This class is intended for:

```text
synthetic documents
public documents
non-confidential evaluation content
approved development fixtures
```

Evaluation mode must not be silently presented as production-confidential processing.

## 22.2 NO_TRAINING

Requires provider/account terms sufficient to prohibit provider training/use for model improvement according to Atlas production policy.

Retention may still exist unless separately constrained.

## 22.3 ZDR_REQUIRED

Requires an explicitly qualified provider/account/endpoint combination with zero-data-retention guarantees appropriate to the deployment requirement.

Stateless API shape alone does not prove ZDR.

## 22.4 Privacy preflight

```text
workspace/plan privacy requirement
        |
        v
route privacy class
        |
   sufficient?
     /     \
   yes      no
   |        |
execute   reject before provider transmission
```

The provider adapter must never downgrade privacy silently to obtain a successful call.

---

# 23. Qualified Fallbacks

Fallback is permitted only among routes already qualified for the same Atlas capability and required privacy class.

```text
atlas.semantic.reconcile
        |
        v
primary qualified route
        |
   unavailable / rate-limited
        |
        v
qualified fallback route
```

Fallback must preserve:

```text
capability contract
privacy requirement
schema requirement
bounded context
Atlas validation
execution provenance
usage accounting
```

## 23.1 No arbitrary model router for truth-producing work

Atlas must not delegate semantic extraction, reconciliation, or CES truth-producing proposals to an unqualified automatic model selector whose selected model can change invisibly.

A gateway such as OpenRouter may be used beneath Agents Bridge, but it is still a provider/gateway adapter and not a replacement for Atlas qualification.

A model-level fallback chain must list Atlas-qualified models explicitly.

## 23.2 Gateway portability

OpenRouter or another gateway may later provide:

```text
provider transport
provider health routing
host failover
model failover
price/latency routing
```

Agents Bridge must still own:

```text
Atlas capability identity
qualification policy
privacy requirement
allowed routes
budget/capacity policy
provenance
validation
```

Atlas must retain direct-provider adapter capability so one gateway does not become a new hard lock-in boundary.

---

# 24. Rate Limits, 429s, and Capacity Behavior

Rate limiting is expected production behavior, not an exceptional architecture surprise.

Agents Bridge must distinguish:

```text
provider entitlement = zero
provider quota exhausted
provider transient 429
provider outage
local Atlas concurrency saturation
Atlas customer allowance exhausted
Atlas economic budget exhausted
```

These are different failure classes.

## 24.1 Zero entitlement

A provider-advertised zero request allowance is not a retry/backoff problem.

It is a route-qualification or provider-entitlement failure.

The route must be disabled or blocked until entitlement changes.

## 24.2 Transient capacity

For eligible transient 429/5xx conditions, Bridge may apply bounded retry/cooldown before observable completion.

After interactive streaming has emitted observable output, transparent replay must remain prohibited unless the protocol explicitly supports safe resumability.

## 24.3 Queue absorption

Background queues absorb bursts but must not be used to disguise fundamentally insufficient production capacity.

Queue-delay telemetry must be measured so Atlas can detect when a free/beta route is degrading user experience.

---

# 25. Provider Economics Must Not Leak Into Semantic Skills

Semantic skills define meaning contracts.

They must not contain logic such as:

```text
use Gemini because cheaper
use Mistral if free credits remain
use OpenRouter after $10
wait because this user is on Free
```

Those are execution/economic policy decisions outside the semantic skill.

A skill may declare semantic/execution requirements such as:

```text
structured output required
streaming required
multimodal input required
maximum bounded context
human review required
privacy class required by caller/deployment
```

The route resolver and economic admission layer decide how those requirements are satisfied.

---

# 26. Atlas User-Facing Units Are Not Provider Tokens

Atlas product plans should not expose raw vendor tokens as the primary customer abstraction.

Internally Atlas may meter:

```text
tokens
pages
requests
provider dollars
```

User-facing entitlement may instead use Atlas-native units such as:

```text
processed documents
processed pages
semantic processing credits
projects/workspaces
chat allowance
team members
```

The mapping from Atlas entitlement units to provider cost is product policy and may change without changing semantic architecture.

V3 does not freeze the final pricing plans.

---

# 27. Security Boundary

The existing database-role and service boundary remains.

```text
atlas_app
+-- auth.*
+-- atlas.*
+-- authorized queue enqueue

agents_bridge
+-- bridge.*
+-- pgboss.*
+-- explicitly granted operational access
```

Agents Bridge must remain unable to directly mutate trusted Atlas semantic state.

Provider credentials remain server-side Bridge secrets.

They must not appear in:

```text
client responses
skill payloads
review projections
semantic business rows
fixtures
test snapshots
logs
```

One Atlas provider credential may serve many Atlas users, but it must never be exposed to those users.

Future BYOK/enterprise routing may be added as a separate product capability without weakening this rule.

---

# 28. Evidence and Provenance

Evidence continues through:

```text
Source Document
      |
      v
Candidate
      |
      v
Reconciliation
      |
      v
Reviewable State
      |
      v
Resolved Knowledge
```

Provider/model provenance is additional execution provenance; it is not source evidence.

Atlas must preserve both distinctions:

```text
What human document supports this meaning?

Which provider/model produced this proposal?
```

They answer different audit questions.

A provider migration must not invalidate source evidence identity.

---

# 29. Addendum and Human Correction

The V2 correction model remains unchanged.

If existing immutable evidence already supports the intended meaning, human review may resolve Atlas interpretation without a new document.

If the human introduces new or clarifying project meaning, Atlas must create a Preview Addendum and run the normal document/semantic/reconciliation path before acceptance.

Provider choice does not change this authority rule.

---

# 30. Reconstruction and Provider Changes

Atlas must remain reconstructable from:

```text
immutable PRDs
+
immutable Addenda
+
governed human decisions
```

Provider conversation memory must never be required.

A provider/model change may produce different candidate proposals during a future rebuild. That does not authorize silent mutation of historical accepted revisions.

Rebuild/migration behavior must remain governed and auditable.

---

# 31. Current Development Execution Strategy

For the immediate Backend Phase continuation:

```text
1. preserve approved BSS-009 source/perception authority and IDSER-003 D1 kickoff;
2. preserve BSS-V2-001/002 capability decoupling and server-controlled route selection;
3. integrate local Docling behind the existing perception capability for the currently evidenced digital-PDF class;
4. prove the production-shaped D1 path through existing BSS-009 authority to an Atlas-accepted NormalizedDocument v1;
5. stop at that perception checkpoint before semantic extraction;
6. only after the perception checkpoint, resume bounded semantic-model qualification against source slots derived from the accepted NormalizedDocument;
7. qualify semantic extraction and reconciliation independently;
8. do not reopen IDSER-001 through IDSER-010 unless the integration reveals an actual frozen-contract defect.
```

Gemini remains available as a reasoning-provider candidate and as an already-implemented adapter capability, but Gemini PDF perception is no longer required for the primary development perception path.

Free or paid external models may be used for development/evaluation only according to their qualified capability, privacy class, and real account limits.

V3 does not assume that any free provider tier will support public multi-user production indefinitely.
---

# 32. Current Implementation Reconciliation Target

The target code shape is conceptually:

```text
Atlas
  |
  +-- deterministic domain/application services
  |
  +-- source authorization / perception acceptance
  |
  +-- entitlement / privacy / economic admission
  |
  +-- pg-boss producers
          |
          v
Agents Bridge
  |
  +-- Background Worker
  +-- Interactive Executor
  +-- Capability Registry
  +-- Qualified Route Resolver
  |
  +-- Perception execution
  |       |
  |       +-- local Docling adapter
  |       +-- future qualified perception executor
  |
  +-- Reasoning execution
          |
          +-- GeminiProvider
          +-- MistralProvider (inactive until requalified)
          +-- future GatewayProvider / DirectProvider
```

External-provider-only controls such as provider quota domains, provider privacy classifications, token usage, and price profiles remain attached to external routes. Local processor execution records processor identity/version, runtime metrics, failures, and provenance without inventing provider economics.

The existing `ReasoningRuntime`, BSS-009 perception contracts, `NormalizedDocument v1`, IDSER semantic contracts, queue transaction guarantees, replay/fencing work, and result handoff boundaries should be reused.

V3 does not authorize replacing those contracts merely to fit Docling or a provider SDK.
---

# 33. Architecture Invariants

The following are V3 invariants.

1. **Atlas owns accepted truth and review authority.**
2. **Durable project knowledge originates from immutable human-readable documents plus governed human decisions.**
3. **Document Perception and Semantic Extraction remain separate capabilities.**
4. **Document perception may be implemented by a qualified local processor or a qualified remote provider.**
5. **NormalizedDocument remains execution-neutral derived operational state and the perception/semantics compatibility boundary.**
6. **Perception structure is not business semantics; headings, blocks, tables, and geometry do not become semantic assertions by themselves.**
7. **Semantic candidates and reconciliation results remain proposals until Atlas validation and authority rules accept them.**
8. **Reviewable state remains distinct from resolved knowledge.**
9. **Retrieval discovers relevant context; it does not decide truth.**
10. **Reconciliation must reason over relevant incoming-vs-existing and incoming-vs-incoming knowledge.**
11. **Main Workflow, Project Facts, and review projections are deterministic from Atlas state by default and must not become unnecessary inference workloads.**
12. **CES remains grounded reasoning over resolved project semantics plus governed assurance knowledge.**
13. **Chat remains a bounded contextual mediator, not project memory or truth authority.**
14. **New human project meaning not supported by existing immutable evidence must enter through an immutable Addendum.**
15. **Agents Bridge remains the bounded execution boundary for capability implementations.**
16. **Atlas features request capabilities, not processor/provider/model IDs.**
17. **Concrete execution routes are deployment configuration backed by capability-specific qualification evidence.**
18. **Local processor installation does not qualify a route; external-provider authentication or model discovery does not qualify a route.**
19. **A route may be qualified for one capability and rejected for another.**
20. **Docling is the current digital-PDF perception integration direction, subject to production-shaped qualification of the evidenced document class.**
21. **Gemini is a reasoning-provider candidate and existing adapter capability, not an architecture dependency and not a required perception path.**
22. **Mistral adapter code may remain, but the current Mistral live route is not treated as active production-qualified reasoning.**
23. **Provider SDK types and processor-specific internals must not leak into Atlas Core/skills/trusted state.**
24. **pg-boss remains the background queue technology.**
25. **Provider capacity must become capability-aware; one global worker concurrency value is not the final multi-user capacity model.**
26. **Interactive work must have protected capacity or equivalent priority so bulk processing cannot starve chat.**
27. **Many Atlas users may share one upstream provider quota domain; Atlas must meter users independently of provider keys.**
28. **Customer entitlement, Atlas economic policy, external-provider capacity, and local processor resource limits are separate concerns.**
29. **Every capability execution must record executor provenance appropriate to its route.**
30. **Every external-provider-backed execution must emit normalized usage suitable for provider capacity/economic accounting.**
31. **Free-tier external execution must still record shadow production cost when a paid-equivalent cost profile exists.**
32. **Provider pricing is effective-dated configuration, not semantic code.**
33. **Skills remain unaware of vendor pricing and customer plan mechanics.**
34. **Privacy class must be checked before external provider transmission. Local execution must still respect source authorization and local data-handling boundaries.**
35. **A stateless external API call does not by itself prove ZDR.**
36. **Fallback is allowed only among qualified routes satisfying the same capability and applicable privacy requirement.**
37. **Automatic unqualified model routing is not permitted for truth-producing reasoning.**
38. **Executor changes must preserve execution provenance and Atlas validation.**
39. **Provider capacity failures, entitlement failures, customer allowance failures, Atlas budget failures, and local processor failures must remain distinguishable.**
40. **Queueing may absorb temporary background bursts but must not hide structurally insufficient execution capacity.**
41. **Provider credentials remain server-side and are never one-per-Atlas-user by default.**
42. **Processor/provider/model changes must not change immutable source identity or silently mutate historical accepted truth.**
43. **BSS-001 through BSS-007, BSS-009, approved BSS-V2 capability/routing work, and provider-neutral IDSER work remain foundations of V3 rather than being discarded.**
---

# 34. Resulting V3 Architecture

```text
                               ATLAS USERS
                                   |
                                   v
                        Atlas Auth / Authorization
                                   |
                                   v
                        Product / Tenant Policy
                     entitlement / privacy / budget
                                   |
                                   v
                         Atlas Application/Core
                                   |
          +------------------------+------------------------+
          |                        |                        |
          v                        v                        v
   Deterministic State      Background Pipeline       Interactive AI Work
   / Projections            perception / semantics    chat/review help
          |                        |                        |
          |                        v                        |
          |                     pg-boss                     |
          |                        |                        |
          +------------------------+------------------------+
                                   |
                                   v
                              Agents Bridge
                                   |
                         Capability / Route Resolver
                                   |
                    +--------------+--------------+
                    |                             |
                    v                             v
             PERCEPTION ROUTE              REASONING ROUTE
                    |                             |
             local Docling                 external provider
             for qualified                Gemini / Mistral /
             document class               future provider
                    |                             |
                    v                             v
         generic perception result       structured proposal
                    |                             |
                    v                             v
      normalizePerceptionResult(...)    Atlas/Bridge validation
                    |                             |
                    v                             |
          NormalizedDocument v1                   |
                    |                             |
                    +-------------+---------------+
                                  |
                                  v
                           Atlas validation /
                         persistence authority
```

External reasoning routes additionally pass through the applicable provider capacity, privacy, usage, and economic controls. Local Docling execution uses source authorization, bounded runtime/error handling, processor provenance, and local resource controls without pretending to be a token-billed provider.

The semantic knowledge path remains:

```text
Immutable Source
      |
      v
Qualified Document Perception
      |
      v
NormalizedDocument v1
      |
      +-- current first integration checkpoint / stable source locators
      |
      v
Semantic Extraction
      |
      v
Validated Candidates
      |
      v
Targeted Retrieval
      |
      v
Reconciliation
      |
      v
Validated Reviewable State
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
      +-- Main Workflow
      +-- Project Facts
      +-- Project Context
      +-- CES Assessment
      +-- Review Projection
      +-- Contextual Chat
```
---

# 35. Checkpoint Boundary

The immediate V3 implementation checkpoint is deliberately narrower than the full AI pipeline.

The next perception milestone is:

```text
IDSER-scheduled D1
    |
    v
existing BSS-009 source authority
    |
    v
qualified local Docling execution
    |
    v
existing normalization
    |
    v
Atlas-accepted NormalizedDocument v1
    |
    v
STOP
```

That checkpoint must establish stable source locators, deterministic/replay-safe perception behavior, bounded failure handling, and the unchanged `NormalizedDocument v1` contract for the supported digital-PDF class.

It must not require semantic extraction, semantic reconciliation, CES, chat, or a remote reasoning provider to declare perception success.

After that checkpoint, Atlas resumes semantic-model qualification from the accepted normalized document boundary:

```text
NormalizedDocument v1
    -> deterministic bounded source selection
    -> qualified semantic extraction
    -> Atlas-owned final validation/materialization
```

External reasoning providers may change between development and production:

```text
Gemini
OpenRouter-backed qualified models
OpenAI
Mistral if entitlement is corrected and requalified
another direct provider
enterprise ZDR routes
```

The perception processor may also change in the future if another implementation independently qualifies against the same contract.

The executor can change.

The cost can change.

The rate limits can change.

The privacy requirement can change.

The customer plan can change.

The Atlas semantic architecture must not need to change with them.

The final V3 principle is therefore:

> **Atlas is not built around a model vendor or document-processing vendor. Atlas is built around governed capability boundaries. Source-grounded perception terminates at a stable normalized document; semantic reasoning begins only after that boundary. Every processor or provider remains replaceable beneath Atlas-owned contracts, validation, provenance, and authority.**
