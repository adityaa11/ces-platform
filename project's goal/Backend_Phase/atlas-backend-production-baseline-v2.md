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
2. Add the current production-shaped Docling perception profile as a persistent Compose-private `docling-serve` service behind the existing perception capability.
3. Preserve BSS-009 source-grant, normalization, replay, and Atlas cache authority.
4. Require Agents Bridge to redeem/verify exact authorized PDF bytes and send only those bytes to Docling; Docling must not discover source storage.
5. Keep Docling models and the exact Atlas digital-PDF processing profile warm before route readiness.
6. Qualify the first Docling route as CPU-only and require every representative warm end-to-end perception run to complete in <=20 seconds.
7. Prove IDSER-003 D1 -> BSS-009 -> Bridge -> persistent Docling service -> Atlas-accepted NormalizedDocument v1.
8. Keep pg-boss as the sole Atlas job lifecycle authority; do not add Docling RQ/Redis for the current D1 path.
9. Stop at that perception checkpoint before semantic-provider qualification.
10. Resume semantic extraction qualification from bounded source units derived from the accepted NormalizedDocument.
11. Qualify semantic extraction and semantic reconciliation independently.
12. Preserve Gemini as an available reasoning adapter; do not require Gemini PDF perception for the primary perception path.
13. Preserve Mistral as an inactive/optional external provider until separately requalified.
14. Apply provider quota/privacy/usage/cost controls only to external-provider routes that actually need them.
15. Keep local processor resource limits distinct from provider quota domains.
16. Preserve all existing queue, replay, fencing, Atlas authority, and semantic contracts.
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
    -> persistent Compose-private docling-serve
    -> deterministic Atlas mapper
    -> existing BSS-009 handoff/normalization
```

The current production-shaped local Docker topology is no longer an open subprocess/sidecar choice. For the first qualified development profile, Agents Bridge calls a long-lived private Docling Serve instance over the Compose network. The service keeps its Python runtime, model artifacts, converter cache, and initialized Standard PDF pipeline reusable across document requests.

This is a deployment-profile choice beneath the executor-neutral perception capability. A future perception executor may use another independently qualified topology, but the current Docling route must preserve:

```text
Bridge receives exact PDF bytes only through BSS-009 authorization/redemption
Bridge sends only those bounded bytes to the private Docling service
Docling does not discover DocumentStore paths or receive Atlas DB/queue authority
Docling Serve is not exposed as a required public host service
Docling emits no business semantics
mapper output remains generic/source-grounded
normalizePerceptionResult(...) remains authoritative
NormalizedDocument v1 remains unchanged
models/artifacts are local before normal work
the exact Atlas no-OCR PDF profile is warm before route readiness
fresh per-document Python/Docling subprocess execution is not the normal production route
pg-boss remains the Atlas job/retry/replay authority
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

The current production-shaped Docling profile is:

```text
Agents Bridge
    -> Compose-private persistent docling-serve 1.21.0
         -> Docling 2.132.0
         -> local compute engine
         -> CPU-only first qualification profile
         -> local model artifacts
         -> reusable cached/initialized Standard PDF pipeline
    -> DoclingDocument JSON
    -> deterministic Atlas mapper
    -> existing normalization/parser
    -> NormalizedDocument v1
```

The deployed image/runtime identity must be immutable enough to reproduce qualification evidence; mutable `latest` or `main` tags are not frozen qualification identities.

The route must consume only exact BSS-009-authorized PDF bytes supplied by Agents Bridge. Docling receives no DocumentStore paths, Atlas database credentials, pg-boss credentials, project/workspace authority, semantic authority, or publication authority.

The Atlas digital-PDF option profile must remain explicit and minimal: Standard PDF pipeline; OCR off; table structure and layout/reading-order processing on; remote services off; external plugins off; picture description/classification, chart extraction, code enrichment, and formula enrichment off unless a later frozen ticket separately authorizes them; page-image generation off unless a mapper requirement proves it necessary.

Models/artifacts must already be local before normal work. Route readiness requires service health, model-loading readiness, pinned runtime identity, and the exact Atlas option profile being warm/reusable. A fresh Python/Docling subprocess per PDF is not the current production route.

The integration must map only source-grounded structure, preserve page/reading order and tables, emit stable source-unit IDs, emit geometry only when trustworthy, omit unsupported confidence/visual data instead of fabricating it, pass existing normalization, and record processor provenance/runtime metrics.

Scanned-PDF/OCR support remains a separate qualification until proven. GPU/CUDA is also a separately qualifiable execution profile rather than an implicit fallback for the CPU route.

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

For the current local Docling route, the applicable gates are:

```text
pinned docling-serve / Docling / image/runtime identity
Compose-private service exposure
exact BSS-009-authorized PDF byte input
models/artifacts local before normal work
service health plus model/pipeline readiness before route admission
exact Atlas no-OCR Standard PDF profile warm and reusable
explicit CPU device/thread/concurrency profile
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
bounded service/network/timeout/cancellation/failure behavior
no per-document Docling process initialization
no Docling-owned durable queue for Atlas D1
runtime/resource observations
every required warm end-to-end fixture run <=20 seconds
cold boot/model/pipeline warm-up reported separately
```

The warm latency gate begins when Bridge already possesses the authorized PDF bytes and ends after Docling conversion, response handling, deterministic mapping, `normalizePerceptionResult(...)`, and `parseNormalizedDocument(...)` succeed. Cold initialization may be excluded only because the route remains unavailable until initialization completes.

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

The current worker-wide concurrency setting remains a valid compatibility default but is not the final production capacity model.

BSS V2 must be able to constrain these workloads independently:

```text
local document perception
semantic extraction
semantic reconciliation
CES
interactive chat/review assistance
```

Suitable mechanisms may include per-capability semaphores, route-level semaphores, local processor concurrency/resource limits, external provider token buckets, and shared external quota-domain limiters.

The required result is that CPU-heavy local perception cannot monopolize the worker/runtime, while bulk external reasoning cannot consume every provider slot needed for interactive work.

---

# 20. Execution Capacity Profiles

Capacity policy depends on executor type.

External-provider routes may use:

```text
quota_domain_id
max_concurrency
requests/tokens/day or minute when applicable
request/response bounds
cooldown/retry policy
effective limit source
```

Local Docling routes instead use local processor controls such as:

```text
Docling local conversion concurrency
Docling CPU thread count
request/page bounds
timeout
measured/configured CPU or memory guardrails
service readiness/warm state
retry policy owned by the Atlas/Bridge job boundary
processor/service/image/config identity
```

For the first CPU profile, Docling conversion concurrency and CPU thread count must be explicit rather than accidental defaults. Increasing either is a measured capacity decision, not an assumption.

Local processors do not receive a fake quota domain merely to mimic an external provider.

---

# 21. External Provider Quota Domains

`quota_domain_id` is an external-provider concept.

Several reasoning routes may share one upstream provider project/account and therefore one real request/token/daily capacity pool.

Different model IDs or multiple keys must not be assumed to provide independent capacity unless provider qualification proves it.

Local Docling execution is governed by local processor capacity, not an upstream provider quota domain.

---

# 22. Capacity Admission

Admission is executor-specific.

Local processor route:

```text
qualified route
    -> source already authorized
    -> route healthy
    -> local capacity available
    -> execute / queue / bounded failure
```

External provider route:

```text
qualified route
    -> privacy preflight
    -> route healthy
    -> quota-domain capacity
    -> route/model capacity
    -> execute / queue-cooldown-fallback / bounded failure
```

Customer entitlement remains Atlas-owned and is not implemented by executor adapters.

---

# 23. Execution Failure Classification

External-provider cases include authentication failure, zero entitlement, quota exhaustion, transient 429, provider outage, provider timeout, malformed provider output, and privacy mismatch.

Local-processor cases include startup/unavailability, processor timeout, local resource saturation, malformed mapped output, unsupported document class, and normalization/integrity failure.

Shared cases include disabled/unqualified route, Bridge capacity saturation, request/response bound failure, and cancellation.

Do not burn retries against known zero provider entitlement. Do not force local processor failures into provider-rate-limit categories.

Bridge may retain fine-grained operational diagnostics while existing Atlas semantic/perception contracts continue exposing their stable bounded failure categories.

---

# 24. Operational Execution Telemetry and Provider Usage Ledger

All capability execution should record secret-safe executor provenance and bounded operational metrics.

Local Docling execution should record execution/capability/route identity, docling-serve/Docling/image/runtime identity, device profile, option-profile fingerprint, qualification version, page count where useful, service readiness state, bounded request metrics, Docling-reported processing/pipeline time where available, Bridge-to-Docling duration, mapping/normalization duration, total warm-route duration, retry count, final status, and normalized failure class.

External-provider execution additionally records provider/model identity, quota-domain and privacy metadata, provider usage units when available, provider latency, price-profile reference, actual cash cost, and shadow production cost where applicable.

Telemetry must not persist raw PDFs, full PRD text, full prompts/provider bodies, API keys, authorization headers, or source grants.

Bridge operational telemetry must not grant the Bridge database role authority to mutate Atlas trusted state.

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

# 28. Privacy and Local Data Handling

External-provider routes retain the V3 privacy classes:

```text
EVALUATION
NO_TRAINING
ZDR_REQUIRED
```

The required privacy class must be checked before external transmission; a provider adapter may not silently downgrade it.

Local Docling perception does not transmit source bytes to an external provider, so provider training/retention classifications do not apply to that local route. It still must satisfy Atlas source authorization, local artifact redaction, bounded diagnostics, and deployment data-handling rules.

If perception later moves to a remote executor, that route must independently satisfy external privacy qualification.

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

Configuration must separate executor-neutral service settings from executor-specific configuration.

The target shape separates:

```text
Bridge service config
Qualified route/deployment profile
Local processor config/version
External provider credential/config blocks
Execution capacity profiles
External privacy classes
External provider cost profiles
```

Provider secrets remain deployment secrets and must not appear in route IDs, qualification artifacts, telemetry rows, semantic payloads, logs, snapshots, or client responses.

Local Docling configuration contains no provider API secret and must not be rejected for lacking one.

## 30.1 No silent test-runtime fallback

A test runtime is permitted only under explicit test-profile intent.

Expected behavior is:

```text
test profile
    -> TestRuntime permitted

development perception profile
    -> qualified local Docling may execute without any external provider credential

development reasoning profile
    -> required external reasoning route must be explicitly configured and qualified

production-shaped profile
    -> every capability required by that profile must resolve to a qualified executor
```

Missing external-provider credentials must never produce a deterministic fake reasoning success.

---

# 31. Readiness and Health

Service process health and capability-route readiness are different concepts.

## 31.1 Health

`/healthz` should continue to answer whether the Bridge process is alive.

## 31.2 Service readiness

`/readyz` should reflect whether the configured deployment can safely accept its required workloads.

Readiness is capability-specific:

```text
local Docling perception route
    -> implementation/config present
    -> qualification identity present
    -> private Docling service healthy
    -> pinned runtime identity matches qualification
    -> required model artifacts available
    -> exact Atlas PDF option profile initialized/warm
    -> local capacity available

external reasoning route
    -> adapter/config present
    -> required credential present
    -> qualification identity present
```

Startup must not repeatedly call an external provider merely to prove readiness. Live qualification is a recorded prerequisite artifact.

A profile containing only a qualified local perception route may be ready for perception even when no semantic reasoning provider is active.

## 31.3 Route status

A secret-safe operational route status may expose:

```text
route_id
capability
executor_kind
executor/provider identity
model/processor
qualification version
enabled/disabled
privacy class when applicable
health/cooldown state when applicable
```

Do not expose credentials, quota tokens, source content, or local source paths.

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

# 33. Execution Provenance

Every result used by Atlas remains attributable to its execution route.

Local Docling perception provenance includes the local-processor executor type, docling-serve/Docling/image/runtime identity, CPU/GPU device profile, route and option-profile identity, qualification version, attempt, duration, and bounded runtime metrics when available.

External reasoning provenance includes provider/model identity, route and qualification identity, attempt, latency, and normalized usage when available.

Execution provenance is distinct from immutable source evidence. Changing processor or provider must never change source evidence identity.

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

The local production-shaped stack includes Atlas, Agents Bridge API/worker, PostgreSQL, LocalFilesystemDocumentStore, a dedicated persistent Docling Serve service for perception, and external reasoning-provider configuration only when those capabilities are being exercised.

The current Docling service contract is:

```text
service: persistent Compose-private docling-serve
version: docling-serve 1.21.0
Docling: 2.132.0
first device profile: CPU-only
compute engine: local
Uvicorn worker processes: one unless separately justified
Docling local conversion concurrency: explicit and bounded
models/artifacts: local before route readiness
converter/model cache: enabled/reusable
public host port: not required by the base Atlas profile
Atlas queue authority: pg-boss
Docling RQ/Redis: not used by the current D1 path
```

Agents Bridge reaches Docling by private Compose service identity and sends exact BSS-009-authorized PDF bytes through the stable Docling Serve v1 file-conversion API or equivalent frozen v1 byte-upload contract. Docling receives no source path/storage-discovery authority.

A one-shot per-document Python/Docling subprocess is not the current production-shaped route. A future perception topology may differ only after separate qualification against the same Atlas capability boundary.

Docling service liveness and Atlas route readiness are distinct. The route must remain unavailable until the service is healthy, required models are loaded/available, the pinned runtime identity is verified, and the exact Atlas digital-PDF option profile is warm.

## 35.1 Stale environment discipline

When perception runtime/configuration changes, rebuild or recreate only the affected Bridge/Docling services, confirm the intended docling-serve/Docling/image/runtime identity, verify models/artifacts and route warm readiness, verify migrations, ensure old processes/containers are stopped, and scope pg-boss/fixture state correctly.

Do not misclassify stale Docker/runtime state as an architecture failure or use destructive volume removal as the default repair. Do not use `docker compose down --volumes`, broad image pruning, or host CUDA/Python removal as routine repair.

---

# 36. Testing Strategy

Normal automated tests must not depend on live paid external-provider availability.

## 36.1 Deterministic contract tests

Use pure mapping and injected transport tests for route resolution, Docling mapping, schemas, error handling, source boundaries, privacy preflight, capacity logic, fallback eligibility, and cost calculation.

## 36.2 Local Docling integration

Use the real persistent Compose-private Docling service with approved non-confidential fixtures to prove:

```text
service/model/profile warm readiness
exact authorized-byte request boundary
PDF processing
page/text/heading/table preservation
deterministic IDs/order
trustworthy geometry behavior
existing normalization
unchanged parseNormalizedDocument(...)
repeatability across sequential requests without service/process replacement
<=20-second warm end-to-end fixture runs
bounded unavailable/not-ready/network/5xx/timeout/cancellation/malformed-response failures
no external inference
no per-document subprocess fallback
```

Record cold service boot/model/pipeline warm-up separately from warm per-document latency.

## 36.3 Compose integration

Prove worker/queue transactionality, source-grant redemption, private Docling service readiness, retries, replay, fencing, result handoff, route selection, execution telemetry, service restart recovery, and role permissions.

The perception-first Compose scenario must prove:

```text
IDSER-003 D1 kickoff
    -> pg-boss
    -> BSS-009 grant/redemption
    -> Bridge verifies exact PDF bytes
    -> qualified ready/warm private Docling service
    -> deterministic mapper
    -> unchanged normalization/parser
    -> Atlas-accepted NormalizedDocument v1
```

pg-boss remains the sole Atlas job lifecycle authority. The current D1 path does not add Docling RQ/Redis or another durable queue.

## 36.4 Live external-provider qualification

Live provider tests are opt-in and secret-safe and qualify only the external reasoning capability being tested.

---

# 37. External Reasoning Qualification Evidence Required by BSS

Gemini remains an available reasoning-provider candidate, but Gemini PDF perception is not required for the primary perception path.

Before an external provider becomes an active semantic route, qualification should prove:

```text
minimal real inference
pinned model identity
bounded provider-facing structured output
deterministic finalization where used
complete Atlas semantic v1 validation
representative semantic extraction against the frozen oracle
representative reconciliation before reconciliation activation
sufficient repeatability
latency/rate-limit observations
normalized usage/provenance
explicit external privacy class
```

Semantic qualification begins after the perception-first checkpoint has produced an accepted `NormalizedDocument v1`.

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

while another qualified reasoning route is active.

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

Given the approved BSS-V2 history and Docling feasibility evidence, the preferred dependency shape is:

```text
A. Capability decoupling + route foundation
   BSS-V2-001 / 002 already approved
        |
        +------------------------------+
        |                              |
        v                              v
B. Docling production perception   C. External reasoning adapter availability
        |                              BSS-V2-003 Gemini already approved
        v
D. IDSER D1 -> Docling -> NormalizedDocument v1 checkpoint
        |
        v
      STOP
        |
        v
E. Semantic extraction qualification
        |
        v
F. Reconciliation qualification
        |
        v
G. External-provider capacity / usage / privacy / fallback
```

The perception checkpoint is intentionally before semantic-model qualification.

## 42.1 Workstream A - capability decoupling and route foundation

Represented by approved BSS-V2-001/002. It owns capability interfaces, route resolution, deployment-profile validation, generic injection, and explicit test/live selection.

## 42.2 Workstream B - Docling production perception

Own the current persistent local Docling service profile: Compose-private `docling-serve`, pinned service/Docling/image identity, CPU-only first qualification profile, local model artifacts, warm reusable Standard PDF pipeline, BSS-009-authorized exact-byte consumption through Bridge, deterministic mapping, current `NormalizedDocument v1` normalization, <=20-second warm-route qualification, processor provenance, and local resource/readiness/timeout/cancellation behavior.

It must not implement semantic extraction, direct DocumentStore access, a per-document Docling subprocess production path, GPU qualification, or a second durable queue.

## 42.3 Workstream C - external reasoning adapter availability

BSS-V2-003 already proves Gemini adapter contracts deterministically. Additional provider adapters are not required before the perception checkpoint.

## 42.4 Workstream D - perception lifecycle checkpoint

Own the integrated path:

```text
IDSER-003 D1 job
    -> pg-boss
    -> BSS-009 source grant/redemption
    -> Bridge verifies exact PDF bytes
    -> already-qualified ready/warm private Docling service
    -> deterministic mapping
    -> normalization/parser
    -> Atlas result acceptance/cache
```

It consumes, rather than redefines, the Docling <=20-second CPU qualification from Workstream B. It ends at accepted `NormalizedDocument v1`.

## 42.5 Workstreams E/F - semantic qualification

Start only after the perception checkpoint. Extraction and reconciliation qualify independently against frozen semantic oracles and final Atlas validation.

## 42.6 Workstream G - external-provider operations

Capacity/quota domains, interactive protection, usage/cost ledger, external privacy preflight, and provider fallback apply to external-provider routes. Local Docling resource controls remain separate and must not be forced into provider quota/economic abstractions.

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

# 47. Development vs Production Execution Economics

Local Docling perception and external reasoning have different economics.

For perception:

```text
persistent local Docling service
    -> CPU/memory/resident-service runtime cost
    -> explicit local conversion concurrency/thread profile
    -> no token billing
    -> no provider RPM/TPM/RPD
    -> no source transmission to external inference
```

Infrastructure resource cost may later be measured for product economics, but it must not be represented as fake provider token usage.

For external reasoning, development may use a free route if it passes the required technical and privacy qualification for that environment.

Production must not assume free-tier economics remain available.

Changing external-provider billing mode should primarily change route configuration, capacity profiles, price profiles, privacy qualification, and operational budgets, not domain code or the Docling/`NormalizedDocument v1` boundary.

---

# 48. Baseline Invariants

The following are V2 production-baseline invariants for BSS work.

1. **Atlas owns accepted truth, source authority, review authority, publication, and customer entitlement.**
2. **Agents Bridge owns bounded capability execution and executor routing; external-provider credentials/capacity remain Bridge infrastructure.**
3. **Processor/provider/model identities remain deployment configuration, not semantic contracts.**
4. **BSS-001 through BSS-007 remain approved foundations.**
5. **BSS-009 and its Atlas/Bridge perception authority remain approved foundations.**
6. **BSS-008 provider-adapter mechanics are retained; current Mistral live qualification is inactive.**
7. **Approved BSS-V2-001/002/003 history is preserved.**
8. **IDSER-001 through IDSER-010 are not reopened by execution infrastructure work.**
9. **IDSER-003 D1 perception kickoff is the upstream Initial Draft handoff consumed by Docling integration.**
10. **Generic workers must not require concrete vendor/processor types.**
11. **The existing `DocumentPerceptionProvider` interface is executor-neutral despite its historical name.**
12. **Qualified routes may represent local processors or external providers.**
13. **Local Docling qualification is based on document fidelity, repeatability, normalization, and runtime behavior, not provider API economics.**
14. **Docling is the current development digital-PDF perception direction, subject to production-shaped integration qualification.**
15. **The current local Docker Docling profile is a persistent Compose-private Docling Serve service; a fresh per-document Python/Docling subprocess is not the production shape.**
16. **The current first Docling qualification profile is CPU-only, warm before routing, and every required warm production-shaped fixture run must complete within 20 seconds end to end.**
17. **pg-boss remains the sole Atlas D1 job lifecycle authority; the current perception path does not add Docling RQ/Redis or another durable queue.**
18. **Gemini remains an external reasoning-provider candidate and adapter, not a required perception dependency.**
19. **Mistral may remain implemented but inactive until entitlement is corrected and requalified.**
20. **`NormalizedDocument v1` remains the perception/semantics compatibility boundary.**
21. **Docling structural labels never become business-semantic classifications by themselves.**
22. **The first integrated checkpoint ends at Atlas-accepted `NormalizedDocument v1`; semantic qualification comes afterward.**
23. **Semantic extraction/reconciliation v1 contracts remain unchanged by perception integration.**
24. **A smaller provider-facing semantic intermediate is allowed only when deterministic finalization restores the complete unchanged Atlas v1 contract.**
25. **pg-boss remains the background queue technology.**
26. **Existing transaction, idempotency, replay, lease, fencing, and completion guarantees survive executor changes.**
27. **Local processor resource limits and external provider quota domains are distinct concepts.**
28. **External-provider capacity remains capability-aware and quota-domain-aware.**
29. **Interactive external work must have protected capacity or equivalent priority.**
30. **Multiple API keys in one upstream quota domain are not assumed to multiply capacity.**
31. **Every capability execution records appropriate executor provenance.**
32. **External-provider executions additionally record normalized usage needed for capacity/economic analysis.**
33. **Provider pricing is effective-dated configuration, not skill logic.**
34. **Free-tier external calls may support shadow production cost calculation.**
35. **BSS does not implement final customer plans or billing.**
36. **External privacy class is checked before provider transmission; local perception still obeys source authorization and local data-handling rules.**
37. **Fallback is allowed only among qualified routes satisfying the same capability and applicable privacy contract.**
38. **Automatic unqualified model routing is prohibited for truth-producing reasoning.**
39. **Provider credentials remain server-side and are never distributed one-per-user by default.**
40. **No executor failure may directly advance Atlas trusted state.**
41. **Normal automated tests remain external-provider-independent; live provider tests are explicit and opt-in.**
42. **Docker Compose remains the supported production-shaped local stack path.**
43. **Executor changes must not require a rewrite of Atlas Core, semantic contracts, review semantics, or publication authority.**

---

# 49. Perception-First Checkpoint and Stack Setup V2 Completion Boundary

BSS V2 now has an explicit near-term checkpoint before the broader external-provider substrate is considered complete.

## 49.1 Near-term perception checkpoint

The first required production-shaped result is:

```text
IDSER-003
project/bundle + D1 perception kickoff
    -> pg-boss
    -> BSS-009 authority
    -> Bridge redeems/verifies exact PDF bytes
    -> qualified persistent Compose-private Docling Serve
         -> ready/warm CPU profile
         -> exact Atlas digital-PDF options
    -> deterministic generic mapping
    -> existing normalizePerceptionResult(...)
    -> Atlas-accepted NormalizedDocument v1
    -> STOP
```

Closure requires:

```text
supported digital-PDF class explicit
pinned docling-serve / Docling / image/runtime identity
CPU thread/concurrency profile explicit
service/model/profile readiness proven
models/artifacts local before normal work
stable source locators
required source units preserved
unchanged NormalizedDocument v1
every required warm end-to-end qualification run <=20 seconds
cold boot/model/pipeline warm-up recorded separately
Atlas-owned cache/result handoff
retry/replay/idempotency/failure behavior proven
service restart -> warm readiness -> safe retry proven
no semantic candidate/reconciliation requirement
no direct DocumentStore access from Docling
no per-document subprocess production fallback
no Docling RQ/Redis lifecycle authority
```

Only after this checkpoint should semantic extraction/reconciliation model qualification resume.

## 49.2 Broader BSS V2 completion

The broader BSS extension may subsequently continue with semantic/reconciliation route qualification, external-provider capacity/admission, protected interactive execution, external usage and route provenance, provider cost profiles/shadow COGS, external privacy preflight, qualified fallback, and directly affected BSS/IDSER regression proof.

The BSS extension intentionally stops before final product pricing, subscription billing, full review UI, CES product implementation, publication UI, enterprise account administration, or downstream domain features.

---

# 50. Final Baseline Principle

The production backend should support two replaceable execution layers:

```text
SOURCE PERCEPTION

immutable PDF
    -> qualified local Docling today
    -> another qualified perception executor later if needed
    -> same NormalizedDocument v1 boundary


SEMANTIC REASONING

accepted NormalizedDocument v1
    -> qualified external reasoning model
    -> paid/free/provider/gateway may change
    -> same Atlas semantic contracts and validation
```

without changing the Atlas semantic system.

The final BSS V2 principle is:

> **Build capability execution as infrastructure, not product truth. Keep source-grounded perception separate from semantic reasoning. Docling may implement perception locally; external models may implement reasoning. Both remain replaceable beneath Atlas-owned authorization, contracts, validation, provenance, queue safety, and document lifecycle.**
