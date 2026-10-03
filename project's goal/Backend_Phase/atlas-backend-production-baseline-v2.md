# Atlas Backend Production Baseline V2

## Status

This document is the V2 production baseline for the Atlas backend Stack Setup and BSS extension work.

It is synchronized with:

```text
atlas-core-architecture-checkpoint-v3.md
```

including the V3 Docling perception realignment.

It supersedes `atlas-backend-production-baseline-mistral-synced.md` where the two documents conflict.

This baseline is intentionally focused on infrastructure and service boundaries that BSS tickets own. It is not a replacement for Atlas domain tickets and it does not redefine semantic meaning already established by IDSER.

The purpose of this baseline is to let Atlas compose a practical local perception processor with replaceable external reasoning providers while ensuring that later movement to paid capacity, another provider, a gateway, stronger privacy, or higher multi-user concurrency does not require another backend redesign.

The central BSS rule is:

> **BSS establishes execution-neutral capability routing and bounded integration. Local perception processors and external reasoning providers remain replaceable beneath Atlas-owned contracts. Atlas domain code continues to own source authority, project truth, review authority, publication, product entitlement, and semantic meaning.**

The local development environment should continue to resemble production in contracts, authority, queue behavior, capability routing, telemetry, and failure handling. Development may differ in provider plan, local processor topology, capacity, credentials, storage adapter, deployment size, and cost.

---

# 1. Relationship to Atlas Core Architecture Checkpoint V3

This baseline is subordinate to the V3 architecture checkpoint.

When this document discusses capability routing, local processors, provider routing, capacity, privacy, usage, or economic controls, the following V3 authority split applies:

```text
Atlas
+-- project truth
+-- workspace/revision authority
+-- source authorization
+-- immutable document identity
+-- NormalizedDocument acceptance/cache authority
+-- semantic validation
+-- review state and decisions
+-- resolved knowledge
+-- publication / Master
+-- conversation authority
+-- customer/product entitlement
+-- workspace privacy requirement
+-- Atlas usage allowance and product budget policy

Agents Bridge
+-- capability implementation adapters
+-- capability route resolution
+-- local processor invocation where configured
+-- external provider credentials/adapters
+-- processor/provider/model allowlists
+-- bounded retries / timeout / cancellation
+-- normalized execution errors/provenance
+-- external-provider capacity/rate-limit enforcement
+-- external-provider usage/economic telemetry

Local perception processor
+-- source-grounded PDF structure extraction
+-- text/heading/table/geometry observations within qualification
+-- no semantic or truth authority

External reasoning provider
+-- bounded structured reasoning
+-- streaming generation
+-- embeddings/multimodal work when separately qualified
+-- no source, semantic acceptance, review, or publication authority
```

BSS tickets must not move an Atlas-owned responsibility into Agents Bridge, Docling, Gemini, Mistral, or another executor merely because an implementation makes that convenient.

---

# 2. Compatibility With Approved BSS Work

V2 is an extension of the existing Stack Setup, not a reset.

The following approved foundations remain valid and should not be rewritten unless a later explicit scope-change decision proves a contract defect.

| Existing checkpoint | V2 status | Guidance |
| --- | --- | --- |
| BSS-001 Runtime / workspace foundation | Preserve | No runtime reset. |
| BSS-002 Local PostgreSQL | Preserve | PostgreSQL remains the local canonical database. |
| BSS-003 PostgreSQL / Drizzle authority boundaries | Preserve | `atlas_app` and `agents_bridge` authority separation remains mandatory. |
| BSS-004 Better Auth persistence | Preserve | Better Auth remains authentication persistence; Atlas owns authorization. |
| BSS-005 Agents Bridge service foundation | Preserve and extend | Provider-neutral service and `ReasoningRuntime` remain the base. |
| BSS-006 pg-boss background runtime | Preserve and extend | pg-boss remains the queue; capacity becomes capability-aware. |
| BSS-007 DocumentStore foundation | Preserve | Immutable source storage boundary remains unchanged. |
| BSS-008 Mistral provider adapter | Preserve implementation, reclassify qualification | Adapter work remains useful; active Mistral live route is not currently production-qualified. |
| BSS-009 series Document Perception | Preserve | Atlas authorization, source grants, normalization, replay, and cache ownership remain authoritative. |

The V2 BSS extension must compose with those checkpoints.

It must not behave as though the old work never existed.

---

# 3. BSS-008 Reclassification

BSS-008 established valuable provider-integration mechanics:

```text
provider adapter boundary
server-side credentials
structured reasoning transport
streaming normalization
tool-call normalization
perception primitive
bounded retries
cancellation
timeouts
usage normalization
privacy preflight
provider error normalization
server-controlled model selection
```

Those are retained.

The part that is no longer an active production baseline is the assumption that the current Mistral account can execute Atlas live inference.

The observed live condition is:

```text
API authentication succeeds
model discovery succeeds
live inference returns HTTP 429
provider-advertised request allowance = 0/minute
```

Therefore the current state is:

```text
Mistral adapter implementation: retained
Mistral route qualification: blocked / inactive
Mistral as permanent Atlas dependency: prohibited
```

A BSS extension must not delete historical Mistral code merely to make Gemini the new hard-coded provider.

The target is provider-neutral capability routing with Mistral and Gemini as adapters beneath it.

---

# 4. IDSER Continuity

The current Initial Draft implementation through IDSER-010 is not reopened by this baseline.

The following remain established domain behavior:

```text
semantic contract v1
atlas.semantic.extract/v1
atlas.semantic.reconcile/v1
bounded context selection
bundle/document sequencing
candidate persistence
evidence accounting
reconciliation persistence
queue transaction semantics
idempotency
result replay
lease/fencing behavior
failure handoff
bundle lifecycle
Ready for Review boundary
```

IDSER-003 already provides the production-shaped first-document kickoff:

```text
project + bundle + ordered document manifest
    -> D1 perception execution/source grant
    -> atlas-document-perception-v1 pg-boss job
```

BSS-009/009-01/009-02 already provide the perception authority boundary:

```text
authorized source bytes
    -> perception capability
    -> normalizePerceptionResult(...)
    -> NormalizedDocument v1
    -> Atlas-owned accepted derived cache
```

The current first alignment target is therefore:

```text
IDSER-003 D1 kickoff
    -> BSS-009 source authority
    -> qualified local Docling perception
    -> unchanged normalization
    -> Atlas-accepted NormalizedDocument v1
    -> STOP
```

IDSER-002, IDSER-004, IDSER-005, and IDSER-006 remain valid downstream semantic infrastructure, but semantic-provider qualification is not a prerequisite for declaring this perception checkpoint successful.

IDSER-011 remains Mistral-specific live-provider acceptance evidence and must not be silently rewritten as Gemini acceptance under the same historical contract.

BSS extension tickets may refactor execution infrastructure used by IDSER, but they must preserve IDSER semantic contracts and authority unless a real contract defect is separately authorized.

---

# 5. Production-Shaped System Overview

The V2 backend shape is:

```text
CLIENT
  |
  v
ATLAS BACKEND
  |
  +-- PostgreSQL
  +-- DocumentStore
  +-- pg-boss
         |
         v
    AGENTS BRIDGE
         |
         +-- capability APIs
         +-- route resolver
         +-- worker/runtime
         |
         +-- PERCEPTION ROUTE
         |      |
         |      v
         |   local Docling
         |
         +-- REASONING ROUTES
                |
                v
          Gemini / Mistral /
          future provider/gateway
```

The perception-to-semantics boundary remains:

```text
Immutable PDF
    |
    v
Document Perception
    |
    v
NormalizedDocument v1
    |
    +-- perception-first checkpoint
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
```

The BSS extension changes the execution substrate, not the meaning of this pipeline.

---

# 6. Current Technology Baseline

The following technologies remain the selected baseline unless a separate architecture decision changes them.

| Area | Technology / direction | BSS responsibility |
| --- | --- | --- |
| Runtime | Node.js 24 LTS | Runtime consistency |
| Language | TypeScript | Shared contracts and adapters |
| Main database | PostgreSQL | Canonical Atlas and operational persistence |
| ORM / migrations | Drizzle ORM + Drizzle Kit | Schema and migrations |
| Authentication | Better Auth | Identity/session persistence |
| Queue | pg-boss | Background jobs, retries, concurrency, scheduling |
| Agents Bridge | Fastify | Execution-neutral capability service |
| Interactive streaming | SSE initially | Bounded low-latency streamed work |
| Capability contracts | TypeScript + JSON Schema/AJV | Execution-neutral validation |
| Document storage | DocumentStore abstraction | Immutable source bytes |
| Local source adapter | Local filesystem | Development only |
| Future source adapter | S3/R2 compatible | Deployment substitution |
| Digital-PDF perception direction | Docling behind the existing perception capability | Local source-grounded perception |
| Derived perception | Atlas-owned `NormalizedDocument v1` | Rebuildable operational state |
| External reasoning | Qualified provider adapters | Semantic/chat/CES execution |
| Capability routing | Agents Bridge | Qualified execution routes |
| External-provider capacity | Agents Bridge | Quota/concurrency admission |
| External-provider usage | Agents Bridge | Normalized execution telemetry/economics |
| Local processor capacity | Deployment/Bridge runtime | Bounded CPU/memory/concurrency without fake provider quotas |
| Product entitlement | Atlas | Not an executor-adapter responsibility |
| Local infrastructure | Docker Compose | Production-shaped developer stack |

Redis, Kafka, Kubernetes, and a standalone vector database remain deferred until operational evidence requires them.

---

# 7. Required BSS Extension Outcomes

The BSS V2 work now has two execution tracks and one explicit perception-first milestone.

Already established by approved BSS-V2 work:

```text
BSS-V2-001
    provider-capability decoupling

BSS-V2-002
    server-controlled qualified-route registry

BSS-V2-003
    Gemini adapter contracts under deterministic tests
```

The next required outcomes are:

```text
1. Preserve BSS-V2-001/002/003 historical approval and interfaces.
2. Add a production-shaped local Docling perception implementation behind the existing perception capability.
3. Preserve BSS-009 source-grant, normalization, replay, and Atlas cache authority.
4. Prove IDSER-003 D1 -> Docling -> Atlas-accepted NormalizedDocument v1.
5. Stop at that perception checkpoint before semantic-provider qualification.
6. Resume semantic extraction qualification from bounded source units derived from the accepted NormalizedDocument.
7. Qualify semantic extraction and semantic reconciliation independently.
8. Preserve Gemini as an available reasoning adapter; do not require Gemini PDF perception for the primary perception path.
9. Preserve Mistral as an inactive/optional external provider until separately requalified.
10. Apply provider quota/privacy/usage/cost controls only to external-provider routes that actually need them.
11. Keep local processor resource limits distinct from provider quota domains.
12. Preserve all existing queue, replay, fencing, Atlas authority, and semantic contracts.
```

These outcomes must remain split into coherent reviewable tickets. The perception milestone must not be hidden inside an oversized provider-qualification ticket.

---

# 8. Current Execution Seams After BSS-V2-001/002/003

BSS-V2-001 and BSS-V2-002 have already corrected the primary concrete-provider coupling and route-selection seams. Generic semantic/perception workers now consume narrow capability interfaces and live/development routing is server-controlled.

BSS-V2-003 has added a Gemini adapter beneath those interfaces without activating it as universal execution authority.

The remaining perception-specific seam is no longer:

```text
replace Mistral with Gemini
```

It is:

```text
existing DocumentPerceptionProvider-style capability
    -> local Docling implementation
    -> existing BSS-009 handoff/normalization
```

The production integration must decide only the bounded execution topology necessary to invoke Docling safely. Whether that is implemented as a managed local subprocess, loopback-only sidecar, or another isolated local adapter is a ticket-level infrastructure decision.

It must preserve:

```text
Bridge receives bytes only through BSS-009 authorization
Docling does not discover DocumentStore paths
Docling emits no business semantics
mapper output remains generic/source-grounded
normalizePerceptionResult(...) remains authoritative
NormalizedDocument v1 remains unchanged
no public Docling endpoint is required
```

This is infrastructure work, not a reason to rewrite semantic schemas, Atlas persistence, bundle lifecycle, reconciliation semantics, review authority, or publication authority.

---

# 9. Execution Capability Interfaces

Generic workers must depend on capability interfaces rather than vendor or processor classes.

The established interfaces are conceptually:

```text
DocumentPerceptionProvider
    perceive(input, signal)

StructuredReasoningProvider
    structured(request)

StreamingChatProvider
    streamChat(request)

EmbeddingProvider
    embed(request)
```

The existing code-level name `DocumentPerceptionProvider` is retained for compatibility. Its semantics are executor-neutral: a local Docling adapter may implement it without pretending Docling is a remote AI provider.

## 9.1 Semantic worker

The semantic worker must depend on a `StructuredReasoningProvider`-style interface.

It must not import a concrete Mistral/Gemini provider as its required type.

## 9.2 Perception worker

The perception worker must depend on the existing perception capability interface.

It must not know whether authorized bytes are processed by local Docling or another separately qualified perception executor.

The worker must not allow a local processor to bypass source grants or Atlas result handoff.

## 9.3 Interactive runtime

The provider-backed interactive runtime must resolve a qualified `StreamingChatProvider` rather than constructing a vendor-specific runtime directly.

The existing BSS-005 `ReasoningRuntime` remains valid and should be composed rather than replaced.

---

# 10. Executor Adapter Contracts

All concrete executors remain below Bridge-owned capability interfaces.

Processor/provider SDK/API types must not leak into Atlas Core, semantic skill contracts, perception contracts, review state, trusted Atlas tables, client responses, or queue payloads.

A local Docling adapter may own:

```text
bounded local invocation
Docling version/configuration
deterministic mapping into the generic perception intermediate
processor timeout/cancellation
local execution error normalization
processor provenance and runtime metrics
```

It may not own DocumentStore discovery, source authorization, business-semantic classification, Atlas normalization authority, or trusted persistence.

An external provider adapter may additionally own endpoint construction, provider authentication, request/response translation, provider usage extraction, rate-limit/retry classification, and provider-specific privacy preflight.

No executor adapter may own workspace authorization, semantic truth, review decisions, publication, customer plan logic, or Atlas pricing plans.

---

# 11. Qualified Route Registry

BSS V2 uses the route layer described by the V3 architecture.

A route is the deployable binding between one Atlas capability and one qualified execution implementation.

Conceptually:

```text
QualifiedRoute
+-- route_id
+-- capability
+-- executor_kind            local_processor | external_provider
+-- executor_id
+-- model_or_processor_id
+-- adapter_version
+-- qualification_version
+-- work_class
+-- privacy_class            when external transmission applies
+-- quota_domain_id          when an upstream quota exists
+-- cost_profile_id          when provider economics apply
+-- capacity_profile_id
+-- fallback_policy_id
+-- effective_from
+-- effective_until
+-- enabled
```

The existing approved route registry may be extended additively to express local processors. Historical BSS-V2-002 evidence is not rewritten.

The minimum requirement is that route identity, executor identity, and qualification identity are explicit and auditable.

## 11.1 Server-controlled routing

Clients and skills request capabilities such as `atlas.document.perceive`, `atlas.semantic.extract`, `atlas.semantic.reconcile`, `atlas.ces.assess`, and chat/addendum capabilities.

They must not choose Docling, Gemini, Mistral, OpenAI, OpenRouter, model IDs, processor IDs, endpoint URLs, or provider-specific parameters.

## 11.2 Pinned execution identity

Production deployment routes should use explicit qualified model/processor identities.

Mutable external-model aliases may only be used under an explicit qualification/rollout policy. Local processor versions must likewise be explicit enough to reproduce qualification evidence.

---

# 12. Deployment Profiles

BSS V2 supports named deployment profiles as configuration, not domain semantics.

The current intended development shape is:

```text
ATLAS_DEV

atlas.document.perceive
    -> qualified local Docling route for supported digital PDFs

atlas.semantic.extract
    -> separately qualified structured-reasoning route

atlas.semantic.reconcile
    -> separately qualified structured-reasoning route

atlas.ces.assess
    -> separately qualified reasoning route when implemented

atlas.chat.default
    -> separately qualified interactive route
```

A future production profile may use different executors without changing Atlas domain contracts.

A deployment profile must be validated at startup/configuration load.

Unknown capabilities, duplicate active routes, missing executor implementation, missing qualification references, or privacy-incompatible external mappings must fail safe.

A local route must not be rejected merely because it has no provider API key, quota domain, token price profile, or network privacy class when those fields are genuinely inapplicable.

---

# 13. Current Development Execution Direction

The current development direction is split by capability.

```text
document perception
    -> local Docling for the currently evidenced digital-PDF class

semantic extraction / reconciliation
    -> external reasoning model selected only after bounded qualification

interactive chat / CES
    -> separate qualification when their workstreams require them
```

Gemini remains an implemented external-provider adapter and a reasoning-provider candidate. It is no longer required to provide the primary PDF perception path.

## 13.1 Docling perception integration requirements

A production-shaped Docling integration must consume only BSS-009-authorized PDF bytes, run behind the existing perception capability interface, use an explicit Docling/runtime version, map only source-grounded structure, preserve page/reading order and tables, emit stable source-unit IDs, emit geometry only when trustworthy, omit unsupported confidence/visual data instead of fabricating it, pass existing normalization, and record processor provenance/runtime metrics.

Scanned-PDF/OCR support remains a separate qualification until proven.

## 13.2 External reasoning-provider requirements

An external reasoning adapter should support only capability surfaces required by authorized tickets: structured generation, streaming chat when needed, usage/provenance normalization, provider-specific errors, and future embeddings when authorized.

Provider-hosted project memory, files, conversations, or agents must not become required to reconstruct Atlas state.

## 13.3 Provider-facing structured output

Provider-native structured output is a transport reliability aid, not Atlas authority.

The provider-facing schema does not need to duplicate every internal Atlas field when deterministic application code owns identifiers, source locators, evidence wiring, source accounting, or other system-owned metadata.

The permitted shape is:

```text
bounded semantic input
    -> provider-facing intermediate schema
    -> untrusted semantic proposal
    -> deterministic finalization
    -> complete Atlas v1 validation
```

No provider limitation may weaken the final Atlas semantic contract.

---

# 14. Capability Qualification Before Dependency

The Mistral incident and DOCSPIKE-001 establish one permanent BSS rule:

> **Do not freeze production dependency on installation, model discovery, API-key authentication, or a successful isolated demo. Prove the actual capability boundary Atlas will consume.**

## 14.1 Local perception qualification

For a local Docling route, the applicable gates are:

```text
explicit processor/runtime identity
real bounded PDF processing
page preservation
major-text preservation
usable heading/section structure
usable reading order
table recovery where present
stable source-unit IDs
trustworthy-only geometry
no fabricated confidence/visual metadata
repeatable Atlas-facing output
existing normalization success
unchanged NormalizedDocument v1 parser success
bounded timeout/cancellation/failure behavior
source remains local/authorized
runtime/resource observations
```

Do not invent provider API credentials, RPM/TPM/RPD, 429 behavior, training-retention policy, or token pricing for a local processor.

## 14.2 External reasoning-provider qualification

Before an external provider/model route is active for semantic reasoning, the applicable live gates include credential authentication, usable entitlement, pinned model identity, bounded structured output, representative semantic extraction, representative reconciliation when applicable, deterministic finalization where used, complete Atlas-side v1 validation, repeatability against the frozen semantic oracle, latency, rate limits, usage metadata, and privacy/account evidence.

Qualification evidence must be secret-safe.

---

# 15. Document Perception Continuity

The BSS-009 series remains authoritative.

The source authority flow remains:

```text
Atlas
  -> authorizes document
  -> issues bounded source grant
  -> Agents Bridge redeems verified PDF bytes
  -> qualified local Docling route
  -> generic source-grounded perception result
  -> existing normalizePerceptionResult(...)
  -> NormalizedDocument v1
  -> authenticated Atlas result handoff
  -> Atlas-owned derived cache
```

Docling must not bypass source grants by reading DocumentStore paths directly.

The current primary integration target consumes the IDSER-003 D1 perception job and terminates when Atlas has accepted the corresponding `NormalizedDocument v1`.

Semantic extraction is downstream and is not required to close this perception checkpoint.

## 15.1 NormalizedDocument is the compatibility boundary

The existing `NormalizedDocument v1` contract remains valid.

Optional page dimensions, block kind, bounding boxes, confidence, visual labels, and asset references remain genuinely optional. Docling must leave unavailable or untrustworthy values absent rather than fabricating them.

The existing field currently named `provider` remains a compatibility field in v1 and may carry Docling executor provenance without requiring an immediate schema rename. Any terminology cleanup requires an intentional future contract version.

## 15.2 Docling mapping boundary

The current normalizer accepts a loose Bridge-owned page shape.

The production Docling adapter should reuse the behavior proven by DOCSPIKE-001:

```text
Docling page/text/table structure
    -> deterministic generic IDs/order/content
    -> trustworthy geometry only
    -> existing normalizer
```

Docling structural labels such as heading/title/paragraph are document structure, not semantic kinds.

The mapper must never emit `workflow_step`, `rule`, `constraint`, `actor`, or other business-semantic classifications.

---

# 16. Semantic Worker Continuity

The existing semantic contracts remain:

```text
atlas.semantic.extract/v1
atlas.semantic.reconcile/v1
```

They begin from an authorized accepted `NormalizedDocument v1` boundary.

The Docling integration must not change candidate kinds, semantic relationship vocabulary, source statement inventory, evidence reference semantics, bounded context limits, selector metadata, result envelope semantics, or the technical failure contract.

The semantic worker continues to depend on:

```text
StructuredReasoningProvider
    -> separately qualified reasoning route
```

A future semantic-provider integration may introduce a smaller provider-facing intermediate result followed by deterministic finalization, provided the final output still passes the complete unchanged Atlas semantic contract and IDSER evidence/source-accounting validation.

Provider/model provenance remains recorded in the semantic result envelope.

---

# 17. Interactive and Background Work Classes

BSS V2 formalizes two execution classes already implied by BSS-005/BSS-006.

## 17.1 Interactive

Used when a human is waiting.

Examples:

```text
chat query
review explanation
clarification
bounded hypothetical reasoning
review-resolution assistance
Addendum drafting assistance
```

Interactive execution should normally use the Bridge interactive runtime and SSE.

## 17.2 Background

Used for expensive or non-interactive work.

Examples:

```text
document perception
semantic extraction
semantic reconciliation
CES assessment
rebuild/reprocessing
large dependency refresh
```

Background execution remains pg-boss backed.

## 17.3 Interactive protection

Bulk PRD processing must not be allowed to consume every provider slot required for low-latency interactive work.

The BSS capacity layer must therefore support either:

```text
reserved interactive capacity
priority-aware admission
separate quota allocation
or equivalent bounded protection
```

Exact percentages are deployment policy, not architecture constants.

---

# 18. pg-boss Remains the Queue

BSS V2 does not introduce Redis or Kafka for provider capacity.

The existing BSS-006 guarantees remain:

```text
transactional enqueue
retry/backoff
idempotency
lease/fencing
logical completion
failed-job visibility
bounded graceful shutdown
```

Existing queue names remain valid current infrastructure:

```text
atlas-document-perception-v1
bridge-background-execution-v1
```

Future BSS tickets may add capability-specific queue names if required, but a new queue technology is not justified.

---

# 19. Capability-Aware Background Concurrency

The current worker uses a global configuration such as:

```text
AGENTS_BRIDGE_WORKER_CONCURRENCY
```

That remains a valid compatibility default but is not the final production capacity model.

BSS V2 requires the ability to constrain at least these logical workloads independently:

```text
perception
semantic extraction
semantic reconciliation
CES
interactive chat/review assistance
```

Implementation options include:

```text
separate pg-boss queue workers
per-capability semaphores
route-level semaphores
provider token buckets
shared quota-domain limiters
```

The exact mechanism belongs to the bounded BSS ticket.

The required result is that one workload cannot unintentionally monopolize all provider capacity.

---

# 20. Provider Capacity Profiles

Each active route should reference a capacity profile.

Conceptually:

```text
CapacityProfile
+-- capacity_profile_id
+-- quota_domain_id
+-- max_concurrency
+-- requests_per_minute when known
+-- tokens_per_minute when applicable
+-- requests_per_day when applicable
+-- pages_per_minute/day when applicable
+-- request_bytes
+-- response_bytes
+-- cooldown policy
+-- retry policy
+-- source of limit
+-- observed_at / effective_from
```

Limits may be provider-advertised, deployment-configured, or conservatively measured.

They must not be inferred from the number of API keys.

---

# 21. Quota Domains

A key V2 production concept is `quota_domain_id`.

Many Atlas users may share one upstream provider project/account.

Several provider routes may also share the same upstream quota.

Example:

```text
Gemini project: atlas-dev
        |
        +-- perception route
        +-- extraction route
        +-- reconciliation route
        +-- chat route
```

Even when those routes use different model IDs, BSS must not assume their capacity is completely independent unless provider qualification proves it.

A quota domain represents the upstream pool that capacity enforcement must respect.

Conceptually:

```text
QuotaDomain
+-- quota_domain_id
+-- provider/account/project identity alias
+-- shared request capacity
+-- shared token capacity
+-- shared daily capacity
+-- route-specific sublimits where known
```

The alias must not contain credentials.

Creating multiple keys inside one upstream project must not automatically create multiple quota domains.

---

# 22. Capacity Admission

Before a provider network call, Agents Bridge should perform operational admission.

Conceptually:

```text
qualified route selected
        |
        v
privacy preflight
        |
        v
route enabled/healthy?
        |
        v
quota-domain capacity available?
        |
        v
route/model capacity available?
        |
        +-- yes -> execute
        |
        +-- temporary no -> queue/cooldown/fallback according to work class
        |
        +-- structural no -> typed failure / route disabled
```

The provider adapter itself should not implement Atlas customer-plan logic.

Customer entitlement is supplied/enforced by Atlas outside this operational capacity check.

---

# 23. Rate-Limit and Entitlement Classification

BSS V2 must distinguish operationally different cases.

At minimum:

```text
provider authentication failure
provider entitlement = zero
provider quota exhausted
provider transient 429
provider 5xx/unavailable
local Bridge capacity saturated
route disabled/unqualified
privacy mismatch
provider timeout
malformed provider output
response bound exceeded
```

## 23.1 Zero entitlement

A provider-advertised zero request allowance is not a backoff problem.

The route should be classified as unavailable/unqualified for live production use until entitlement changes.

Do not burn retries against a known zero-capacity route.

## 23.2 Transient 429

Transient 429 handling may use bounded retry/cooldown when safe.

Structured/background requests may retry before result acceptance according to existing idempotency rules.

Interactive streaming must not transparently restart after observable text/tool events have been emitted.

## 23.3 Public contract compatibility

Bridge internal telemetry may preserve fine-grained provider failure causes even when existing Atlas semantic/perception technical contracts intentionally normalize them to broader categories such as `provider_unavailable`.

Do not break IDSER contracts solely to expose provider diagnostics to Atlas domain code.

---

# 24. Normalized Usage Ledger

BSS V2 establishes provider execution usage as first-class operational state.

Every real provider-backed execution should leave a secret-safe record sufficient for capacity and economic analysis.

Conceptually:

```text
ProviderExecutionUsage
+-- execution_id
+-- capability
+-- skill_id / skill_version when applicable
+-- work_class
+-- route_id
+-- provider
+-- model_or_processor
+-- qualification_version
+-- quota_domain_id
+-- privacy_class
+-- project/workspace/bundle/document references when safely supplied
+-- request_count
+-- retry_count
+-- input_tokens when available
+-- output_tokens when available
+-- cached_tokens when available
+-- processed_pages when applicable
+-- request_bytes when useful
+-- response_bytes when useful
+-- queue_delay when applicable
+-- provider_latency
+-- total_duration
+-- final_status
+-- normalized_failure_class when applicable
+-- price_profile_id
+-- actual_cash_cost
+-- shadow_production_cost
+-- started_at
+-- completed_at
```

Exact table names are not frozen here.

## 24.1 No source content

Usage records must not persist:

```text
raw PDF bytes
full prompts
full PRD text
provider response bodies
API keys
authorization headers
source grants
```

## 24.2 Authority namespace

Low-level provider execution/usage state belongs under Bridge operational authority.

It must not give the `agents_bridge` role new permission to mutate Atlas trusted state.

Atlas may later aggregate selected usage into product/billing analytics through an explicit read/handoff boundary.

---

# 25. Effective-Dated Provider Cost Profiles

Provider pricing changes over time.

BSS must not hard-code provider prices in semantic skills or business logic.

Conceptually:

```text
ProviderPriceProfile
+-- price_profile_id
+-- provider
+-- model_or_processor
+-- billing_mode
+-- effective_from
+-- effective_until
+-- currency
+-- input_token_rate
+-- output_token_rate
+-- cached_input_rate
+-- page_rate
+-- request_rate
+-- other meter rules
```

Not every provider uses every meter.

Historical usage must retain the profile used to calculate its cost.

Use decimal-safe accounting types; do not rely on binary floating-point for financial totals.

---

# 26. Shadow Production Cost

Development on a free tier must not make Atlas appear economically free.

When a paid-equivalent profile exists, every provider execution should be able to record:

```text
actual_cash_cost
shadow_production_cost
```

For example:

```text
Gemini Free development call
actual_cash_cost       = 0
shadow_production_cost = calculated from the selected production-equivalent profile
```

The shadow value is planning telemetry, not an invoice.

It allows later analysis of:

```text
cost per document
cost per page
cost per extraction
cost per reconciliation
cost per bundle
cost per project
cost per chat session
P50/P90/P99 AI COGS
```

Final subscription pricing remains outside BSS.

---

# 27. Product Entitlement Is Not a BSS Provider Concern

BSS must prepare the infrastructure for commercial operation without implementing Atlas subscription plans.

The following belong to Atlas product/business policy, not provider adapters:

```text
Free vs Pro vs Team
monthly processing credits
trial expiration
overage rules
project count limits
page allowances
per-user quotas
team allowances
billing UI
payment collection
```

BSS may expose and persist the operational measurements required for those policies.

BSS must not embed rules such as:

```text
if Free user then use Gemini
if Pro user then use OpenAI
```

A later Atlas policy layer may choose qualified route classes based on product rules, but semantic skills remain unchanged.

---

# 28. Privacy Classes

BSS V2 adopts the V3 privacy classes as route qualification properties.

Initial conceptual classes:

```text
EVALUATION
NO_TRAINING
ZDR_REQUIRED
```

The exact enum representation may be frozen by the ticket that introduces the shared contract.

## 28.1 EVALUATION

Intended for approved non-sensitive use such as:

```text
synthetic PRDs
public documents
non-confidential evaluation material
approved test fixtures
```

A free development provider may be qualified only for this class if stronger guarantees are not available.

## 28.2 NO_TRAINING

Requires provider/account terms that satisfy the Atlas production no-training policy.

Retention may still exist unless separately constrained.

## 28.3 ZDR_REQUIRED

Requires explicit zero-data-retention qualification for the relevant provider/account/endpoint.

A stateless API shape alone is not proof of ZDR.

## 28.4 Privacy preflight

Before transmitting source or semantic context:

```text
required privacy class
        |
        v
selected route privacy class
        |
   sufficient?
     /     \
   yes      no
   |        |
execute   reject before network transmission
```

No provider adapter may silently downgrade privacy to obtain a successful response.

---

# 29. Qualified Fallback

BSS V2 may support fallback, but only as controlled qualified routing.

A valid fallback chain is:

```text
Atlas capability
    |
    v
primary qualified route
    |
  unavailable / eligible rate limit
    |
    v
fallback route already qualified
for the same capability and privacy requirement
```

Fallback must preserve:

```text
capability contract
privacy requirement
schema/output validation
bounded input
usage/provenance recording
idempotency semantics
```

## 29.1 No arbitrary auto-router for truth-producing work

Semantic extraction, reconciliation, and CES must not be sent to an arbitrary model chosen by an opaque automatic router unless every possible selected route is explicitly covered by Atlas qualification policy.

Model identity must remain visible in execution provenance.

## 29.2 Gateway adapters

OpenRouter or another gateway may later be implemented as a provider/gateway adapter.

A gateway may provide:

```text
transport abstraction
provider host failover
qualified model fallback
price/latency routing
```

Agents Bridge still owns:

```text
Atlas capability identity
allowed qualified routes
privacy requirement
capacity policy
usage provenance
validation
```

Direct-provider capability must remain possible so a gateway does not become a new mandatory lock-in boundary.

---

# 30. Configuration and Secret Boundary

The current `BridgeConfig` is Mistral-centric and must evolve toward provider-neutral configuration.

The target shape should separate:

```text
Bridge service config
Provider credential/config blocks
Qualified route/deployment profile
Capacity profiles
Privacy classes
Cost profiles
```

Provider secrets remain deployment secrets.

They must not appear in:

```text
route IDs
qualification artifacts
usage ledger rows
Atlas semantic payloads
logs
test snapshots
client responses
```

## 30.1 No silent test-runtime fallback in production

The current service can choose a `TestRuntime` when no provider key is present.

V2 requires explicit environment/profile intent.

A production-shaped profile must not silently serve deterministic test responses because a provider credential is missing.

Expected behavior is conceptually:

```text
test profile
    -> TestRuntime permitted

development profile without live provider
    -> Bridge may boot for non-provider tests, but live route reports unavailable

live/production profile
    -> required active routes must validate or readiness fails
```

---

# 31. Readiness and Health

Service process health and provider-route readiness are different concepts.

## 31.1 Health

`/healthz` should continue to answer whether the Bridge process is alive.

## 31.2 Service readiness

`/readyz` should continue to reflect whether the configured Bridge deployment can safely accept its required workload.

For a live deployment profile, readiness should consider required active route configuration.

It must not claim live provider readiness merely because:

```text
configuration parsed
API key exists
model list endpoint works
```

Live qualification is an explicit prerequisite artifact, not a startup network probe that repeatedly consumes provider requests.

## 31.3 Route status

BSS may expose a secret-safe operational route status view containing only data such as:

```text
route_id
capability
provider
model/processor
qualification version
enabled/disabled
privacy class
health/cooldown state
```

Do not expose credentials, quota tokens, or source content.

---

# 32. PostgreSQL Ownership for New BSS Operational State

BSS V2 may add Bridge-owned operational tables/migrations when necessary for:

```text
route qualification metadata
usage/execution ledger
cost profile references
capacity/cooldown state
provider replay/idempotency state
```

The established role rule remains:

```text
agents_bridge
    owns/uses bridge.* and pgboss.* operational state

atlas_app
    owns/uses atlas.* trusted/domain state
```

Agents Bridge must remain unable to mutate:

```text
atlas.semantic_candidate
atlas.reconciliation_*
atlas.review_*
atlas.resolved_knowledge
atlas.workspace_head
atlas.revision
atlas.publication
```

If Atlas later needs commercial aggregation, expose only the minimum usage projection or handoff required.

Do not grant broad Bridge access to Atlas tables for convenience.

---

# 33. Provider Execution Provenance

Every provider result used by Atlas must remain attributable to an execution route.

At minimum, provenance should retain:

```text
provider
model/processor
route_id or stable route fingerprint
qualification version
endpoint/capability class when appropriate
attempt
latency
usage metadata when available
```

Provider provenance is not source evidence.

Atlas must preserve both:

```text
source evidence
    -> which immutable human document supports the meaning?

execution provenance
    -> which provider/model produced the proposal?
```

Provider migration must not change immutable evidence identity.

---

# 34. Deterministic Atlas Projections Remain Outside BSS Provider Work

BSS must not turn Atlas projections into provider-dependent rendering services.

The V3 rule remains:

```text
structured Atlas state
    -> deterministic projection by default
```

Main Workflow, Project Facts, review projection, review progress, dependency impact, and similar views should consume Atlas state without unnecessary inference.

Provider reasoning is used only where a qualified semantic capability genuinely requires it.

This reduces:

```text
COGS
TPM pressure
latency
provider lock-in
privacy exposure
```

---

# 35. Local Docker Compose Contract

`docker compose up` remains the canonical supported local stack boot.

BSS extension work must update the existing Compose-managed services rather than creating unnecessary standalone provider containers.

The expected local shape remains approximately:

```text
Atlas
Agents Bridge API
Agents Bridge worker
PostgreSQL
LocalFilesystemDocumentStore
configured provider credentials/routes
```

Provider adapters run inside Agents Bridge.

## 35.1 Stale environment discipline

BSS implementation and review must distinguish provider/code defects from stale local infrastructure.

When reviewed source/config changes affect a service:

```text
rebuild/recreate the affected image/container
verify environment values
verify migration state
verify old processes are stopped
verify pg-boss jobs and fixture state are scoped
```

Do not classify stale Docker state as a provider architecture failure.

Do not solve stale state by indiscriminate volume destruction when bounded cleanup is sufficient.

---

# 36. Testing Strategy

Normal automated tests must not depend on paid/live provider availability.

The test strategy should have three layers.

## 36.1 Deterministic unit/contract tests

Use injected/mock transports to prove:

```text
request translation
schema handling
response parsing
stream parsing
usage normalization
error mapping
privacy preflight
route resolution
capacity admission
fallback eligibility
cost calculation
```

## 36.2 Integration/Compose tests

Use local provider mocks or deterministic adapters to prove:

```text
Bridge API
worker
queue
transactional enqueue
retries
idempotency
replay
fencing
result handoff
route selection
usage persistence
role permissions
```

## 36.3 Explicit live qualification tests

Live provider tests must be opt-in and secret-safe.

They prove real account behavior and must never be silently substituted by mocks.

A live qualification failure must be classified honestly as one of:

```text
Atlas defect
adapter defect
provider contract mismatch
account entitlement/quota blocker
privacy-policy blocker
provider outage
```

---

# 37. Gemini Qualification Evidence Required by BSS

Before Gemini becomes the active development route, BSS qualification should prove at least:

```text
1. minimal real inference returns success;
2. exact configured model IDs are available to the real key/account;
3. representative structured-output request succeeds;
4. complete Atlas-side AJV validation passes;
5. representative PDF processing succeeds;
6. result can be normalized into current NormalizedDocument without fabricated fields;
7. semantic extraction works against current v1 contract;
8. reconciliation works against current v1 contract;
9. streaming/cancellation works if chat is in scope;
10. provider usage/provenance can be normalized;
11. observed rate-limit behavior is recorded;
12. privacy class for the active route is explicit.
```

BSS should not claim production-grade privacy merely because the route works technically.

---

# 38. Mistral Preservation and Optional Requalification

The Mistral adapter remains a supported code asset unless an explicit later cleanup removes it.

It should become just another adapter beneath the capability interfaces.

The route may remain:

```text
disabled
or
not qualified for active use
```

while Gemini is active.

If Mistral entitlement is later corrected, requalification may enable it without changing Atlas semantic code.

No current BSS ticket should spend time repeatedly retrying a known zero-entitlement provider merely to preserve historical assumptions.

---

# 39. BSS-Owned Economics vs Later Product Economics

The BSS extension should establish:

```text
normalized usage
provider/model provenance
quota-domain capacity
price profiles
shadow cost
operational budget primitives
```

It should not establish final customer pricing.

The later product layer can consume BSS telemetry to implement:

```text
trial allowance
Free/Pro/Team plans
processing credits
chat allowance
overage
billing
plan upgrades
```

This separation is what allows product pricing to change without rewriting provider adapters or semantic skills.

---

# 40. Security and Privacy Review Expectations for New BSS Tickets

Every new BSS ticket derived from this baseline should run the repository's engineering/security readiness authoring workflow before implementation.

At minimum, provider-economics BSS tickets should explicitly consider boundaries such as:

```text
BOUNDARY: Atlas truth remains outside Bridge.
BOUNDARY: Provider credentials remain Bridge secrets.
BOUNDARY: Source authorization remains Atlas-owned.
BOUNDARY: Provider usage ledger contains no source content.

SEAM: Provider adapter is replaceable behind capability interface.
SEAM: Route resolver can enforce privacy before transmission.
SEAM: Capacity manager can enforce quota domains independently of semantic skills.
SEAM: Usage ledger can support later Atlas commercial aggregation without trusted-state mutation.

COUPLING: No semantic skill imports provider/model pricing.
COUPLING: No worker requires concrete Mistral/Gemini type.
COUPLING: No Atlas customer receives the shared provider credential.
COUPLING: No free-tier assumption becomes a semantic contract.

SEC-GAP: Final enterprise region/residency policy may remain future scope.
SEC-GAP: BYOK may remain future product scope.
```

Exact readiness IDs belong to ticket authoring.

---

# 41. What the Next BSS Ticket Set Should Not Do

The next BSS work must not expand into unrelated Atlas domain scope.

Out of scope unless separately authorized:

```text
review UI implementation
human review decision semantics
publication / Master advancement
new reconciliation relationship types
semantic candidate schema redesign
Main Workflow business logic
Project Facts business logic
CES product semantics
chat correction semantics
subscription billing UI
payment integration
enterprise SSO/SCIM
S3/R2 migration unless separately ticketed
vector database introduction
Redis/Kafka introduction
Kubernetes deployment
```

Provider infrastructure must not become a catch-all reason to reopen the whole Backend Phase.

---

# 42. Recommended BSS Extension Workstreams

This baseline does not freeze exact ticket numbers, but the work should be decomposed into coherent reviewable boundaries similar to the following dependency order.

```text
A. Provider capability decoupling and qualified-route foundation
        |
        v
B. Gemini provider adapter and real route qualification
        |
        +-------------------+
        |                   |
        v                   v
C. Capacity/quota-domain    D. Usage/cost ledger
   admission                   and price profiles
        |                   |
        +---------+---------+
                  |
                  v
E. Qualified fallback / production execution profile
```

The exact split should be chosen so GO, CK, CFC, and HMN can complete each ticket without broad cross-scope proof.

## 42.1 Workstream A - provider capability decoupling

Should own only infrastructure such as:

```text
provider capability interfaces
route registry/resolver
deployment profile validation
generic runtime/worker injection
removal of concrete Mistral worker typing
explicit test/live runtime selection
```

It should not need a real Gemini call to prove the abstraction.

## 42.2 Workstream B - Gemini adapter and qualification

Should own:

```text
Gemini transport
structured output
PDF perception
streaming if required
usage normalization
provider-specific errors
real-account qualification
active development route
```

It must consume Workstream A rather than creating a second routing mechanism.

## 42.3 Workstream C - capacity and quota domains

Should own:

```text
capacity profiles
quota-domain accounting
capability concurrency
interactive protection
429 cooldown/admission
```

It should not implement customer subscription plans.

## 42.4 Workstream D - usage/cost ledger

Should own:

```text
normalized provider usage
route provenance persistence
price profile
shadow production cost
secret-safe telemetry
```

It should not implement billing or customer invoices.

## 42.5 Workstream E - qualified fallback / production profile

Should compose only already-qualified routes and already-proven capacity/usage primitives.

It must not use arbitrary model auto-routing.

---

# 43. Review and Regression Boundary

Each BSS ticket remains a finite infrastructure review batch.

A BSS ticket that refactors provider seams used by IDSER must run directly affected regression evidence, for example:

```text
BSS-005 service/runtime tests
BSS-006 worker/queue tests
BSS-009 perception tests
semantic worker tests
semantic client/handoff tests
replay/fencing tests
Compose smoke where affected
```

It does not automatically need to reopen every IDSER acceptance scenario.

If a change modifies a frozen IDSER contract or semantic authority, that is a scope-change decision and must be surfaced before implementation continues.

---

# 44. Evidence Requirements for BSS Provider Work

Review artifacts should favor exact, secret-safe evidence such as:

```text
route ID
capability
provider/model ID
qualification version
HTTP status class
normalized usage counts
latency
retry count
queue delay
privacy class
cost profile ID
calculated shadow cost
hashes / IDs
PASS/FAIL of bounded contracts
```

They should not include:

```text
API keys
Authorization headers
full PDF text
raw provider response bodies
source grants
confidential PRDs
provider secret configuration dumps
```

---

# 45. Failure Safety

No provider infrastructure failure may result in accidental trusted-state advancement.

Examples:

```text
provider 429
provider timeout
route unavailable
usage ledger write retry
cost profile missing
privacy mismatch
fallback exhausted
worker restart
```

must not directly:

```text
mark semantic execution successful
mark bundle complete
create accepted truth
move Master HEAD
publish
approve review state
```

Existing Atlas result validation and queue replay/fencing remain the authority that prevents this.

---

# 46. Multi-User Production Economics Principle

Atlas should assume that many Atlas users can share one upstream provider quota domain.

The production model is therefore:

```text
many Atlas users
      |
      v
Atlas entitlement/policy
      |
      v
Agents Bridge admission
      |
      v
shared provider capacity
```

The fact that a provider gives one API key to Atlas is not a product flaw.

The required architecture is to meter and protect Atlas users independently while managing aggregate provider capacity underneath them.

BSS provides the infrastructure for that aggregation.

Atlas product policy later decides how the capacity is sold or allocated.

---

# 47. Development vs Production Provider Economics

Development may use a free provider route if it passes the required technical and privacy qualification for that environment.

Production must not assume that free-tier economics remain available.

The architecture must support this transition without code redesign:

```text
Development
    Gemini Free
        |
        v
same capability contracts
same route resolver
same usage ledger
same queue/capacity controls

Production
    Gemini Paid / other qualified provider / gateway
        |
        v
same capability contracts
same Atlas semantic code
```

Changing provider billing mode should primarily change:

```text
route configuration
capacity profiles
price profiles
privacy qualification
operational budgets
```

not domain code.

---

# 48. Baseline Invariants

The following are V2 production-baseline invariants for BSS work.

1. **Atlas owns accepted truth, review authority, publication, and customer entitlement.**
2. **Agents Bridge owns provider execution, routing, provider capacity, retries, normalized usage, and provider secrets.**
3. **Provider/model IDs remain deployment configuration, not semantic contracts.**
4. **BSS-001 through BSS-007 remain approved foundations.**
5. **BSS-009 and its Atlas/Bridge perception authority remain approved foundations.**
6. **BSS-008 provider-adapter mechanics are retained; current Mistral live qualification is not treated as active production capacity.**
7. **IDSER-001 through IDSER-010 are not reopened by provider infrastructure work.**
8. **IDSER-011 remains Mistral-specific historical/live-gate evidence and is not silently renamed to Gemini.**
9. **Generic workers must not require concrete Mistral or Gemini provider types.**
10. **Provider capability interfaces are the injection boundary for perception, structured reasoning, streaming chat, and future embeddings.**
11. **Qualified routes bind capabilities to explicit provider/model identities.**
12. **Routes require capability-specific live qualification before active use.**
13. **Authentication/model discovery alone do not qualify a provider route.**
14. **Gemini is the current development qualification direction, not a permanent dependency.**
15. **Mistral may remain implemented but inactive until entitlement is corrected and requalified.**
16. **NormalizedDocument v1 remains the provider-neutral perception compatibility boundary.**
17. **Semantic extraction/reconciliation v1 contracts remain unchanged by provider migration.**
18. **pg-boss remains the background queue technology.**
19. **Existing transaction, idempotency, replay, lease, fencing, and completion guarantees must survive the provider refactor.**
20. **One global worker concurrency value is a compatibility default, not the final multi-user capacity model.**
21. **Provider capacity must become capability-aware and quota-domain-aware.**
22. **Interactive work must have protected capacity or equivalent priority.**
23. **Multiple API keys in one upstream quota domain are not assumed to multiply capacity.**
24. **Fine-grained provider failure telemetry may exist without breaking existing Atlas semantic failure contracts.**
25. **Every provider execution records normalized route provenance and usage.**
26. **Provider pricing is effective-dated configuration, not skill logic.**
27. **Free-tier calls should support shadow production cost calculation.**
28. **BSS does not implement final customer plans or billing.**
29. **Privacy class is a qualified route property checked before provider transmission.**
30. **Stateless API usage alone does not prove ZDR.**
31. **Fallback is allowed only among qualified routes that satisfy the same capability/privacy contract.**
32. **Automatic unqualified model routing is prohibited for truth-producing reasoning.**
33. **Gateway support may be added later without replacing Agents Bridge as the Atlas capability/qualification boundary.**
34. **Provider credentials remain server-side and are never distributed one-per-user by default.**
35. **No provider failure may directly advance Atlas trusted state.**
36. **Normal automated tests remain provider-independent; live provider tests are explicit and opt-in.**
37. **Docker Compose remains the supported production-shaped local stack path.**
38. **Provider changes must not require a rewrite of Atlas Core, semantic contracts, review semantics, or publication authority.**

---

# 49. Stack Setup V2 Completion Boundary

The BSS extension is complete when the backend can demonstrate the following production-shaped infrastructure without requiring a semantic/domain redesign:

```text
provider-neutral capability interfaces
        |
        v
qualified route/deployment profile
        |
        v
Gemini adapter live-qualified for the authorized capabilities
        |
        v
Mistral retained as optional/inactive adapter
        |
        v
capability-aware / quota-domain-aware capacity control
        |
        v
protected interactive execution
        |
        v
normalized usage + route provenance
        |
        v
effective-dated cost profiles + shadow COGS
        |
        v
privacy-class preflight
        |
        v
qualified fallback foundation
        |
        v
existing BSS/IDSER contracts still passing
```

The BSS extension intentionally stops before final product pricing, subscription billing, full review UI, CES product implementation, publication UI, enterprise account administration, or any other downstream domain feature.

---

# 50. Final Baseline Principle

The production backend should be able to move through:

```text
Gemini Free development
        |
        v
Gemini paid production
        |
        v
multi-provider direct routing
        |
        v
OpenRouter or another gateway where useful
        |
        v
enterprise privacy-qualified routes
```

without changing the Atlas semantic system.

The final BSS V2 principle is:

> **Build provider execution as infrastructure, not product truth. BSS must make provider identity, capacity, privacy, cost, and availability replaceable while preserving the already-established Atlas authority, semantic contracts, queue safety, and document lifecycle.**
