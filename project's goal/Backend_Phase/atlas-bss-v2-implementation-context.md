# Atlas BSS V2 Implementation Context

Status: Authorized implementation context for ticket-set decomposition
Phase name: Backend Stack Setup V2 Reconciliation
Ticket-set prefix: BSS-V2
Repository: adityaa11/ces-platform
Branch inspected: codex/new-atlas-backend
Reviewed branch HEAD: 749db157579c292a7ee8dbf73c77584bd9b45162
Encoding: UTF-8, ASCII-safe Markdown

---

## 1. Purpose

This implementation context authorizes a new additive Backend Stack Setup V2 ticket set.

The purpose of BSS V2 is not to redesign Atlas domain semantics and not to replace the already approved BSS and IDSER work.

BSS V2 exists to reconcile the provider-execution substrate with the architecture now established by:

- `atlas-core-architecture-checkpoint-v3.md`; and
- `atlas-backend-production-baseline-v2.md`.

The current Atlas backend already has strong provider-neutral service, queue, document, perception, semantic, persistence, replay, and authority foundations. The remaining mismatch is concentrated inside Agents Bridge, where generic runtime and worker code still depends directly on `MistralProvider` and Mistral-centric configuration.

The current Mistral adapter implementation remains useful, but the active live Mistral route cannot be treated as production-qualified because real inference is externally blocked by provider entitlement with a reported request allowance of zero.

The immediate development provider direction is Gemini.

The production architecture must not become Gemini-specific.

The target is:

```text
Atlas capability
      |
      v
Agents Bridge
      |
      v
qualified route
      |
      +-- Gemini
      +-- Mistral when requalified
      +-- future direct provider
      +-- future qualified gateway
```

BSS V2 must also establish the minimum production-economics substrate required so Atlas can later move from free development inference to paid multi-user operation without another backend redesign.

That substrate includes:

```text
provider capability interfaces
qualified routes
Gemini adapter and live qualification
quota domains
capability-aware capacity admission
interactive capacity protection
provider usage/provenance telemetry
effective-dated price profiles
shadow production COGS
privacy-class preflight
qualified fallback foundation
```

The BSS V2 ticket set must stop before Atlas product pricing, subscriptions, billing, customer plan rules, review UI, CES product behavior, chatbot product behavior, publication behavior, or other downstream domain features.

---

## 2. Primary authoritative sources

The generated ticket set must use these two documents together as the primary architecture authority:

```text
project's goal/Backend_Phase/atlas-core-architecture-checkpoint-v3.md
project's goal/Backend_Phase/atlas-backend-production-baseline-v2.md
```

If the generated tickets encounter a conflict between historical V2/Mistral documents and these new documents, the V3 architecture checkpoint and Backend Production Baseline V2 govern the new BSS V2 work.

The ticket author must not silently reinterpret either primary source.

---

## 3. Historical foundations that remain accepted

BSS V2 is additive.

The following existing checkpoints remain accepted foundations and must not be rewritten as if they never existed:

```text
BSS-001  Runtime / workspace foundation
BSS-002  Local PostgreSQL Compose foundation
BSS-003  PostgreSQL / Drizzle / database-role authority boundaries
BSS-004  Better Auth persistence
BSS-005  Agents Bridge provider-neutral service foundation
BSS-006  pg-boss background runtime
BSS-007  DocumentStore foundation
BSS-008  Mistral provider adapter implementation
BSS-009  Document Perception foundation
BSS-009-01 Atlas perception authority
BSS-009-02 Bridge perception integration
```

BSS-008 is specifically reclassified as:

```text
adapter implementation mechanics: retained
Mistral live route qualification: blocked / inactive
Mistral as permanent Atlas dependency: prohibited
```

The new ticket set must preserve the historical BSS ticket set and its review history.

Do not rewrite approved BSS tickets merely to make the history appear as if Gemini or route-based execution had always been present.

---

## 4. IDSER continuity through the current IDSER-011 point

The current Initial Draft implementation through IDSER-010 remains established domain behavior.

BSS V2 must preserve, at minimum:

```text
semantic contract v1
atlas.semantic.extract/v1
atlas.semantic.reconcile/v1
NormalizedDocument v1
bounded semantic context
candidate persistence
evidence/source accounting
knowledge-index scope integrity
reconciliation persistence
bundle/document sequencing
transactional stage advancement
pg-boss retry behavior
idempotency
result staging/replay
lease/fencing semantics
failure containment
bundle completion lifecycle
Ready for Review boundary
```

BSS V2 must not reopen those semantics merely because the provider substrate changes.

The existing IDSER-011 ticket set is Mistral-specific live-provider acceptance evidence.

It must remain historical and must not be silently rewritten into Gemini acceptance under the same ticket identity.

After BSS V2 reaches its final PASS checkpoint, a separate superseding live-provider acceptance ticket set may prove the active qualified route and then return Atlas to the functional point IDSER-011 was intended to establish.

---

## 5. Current repository mismatch to reconcile

The architecture is provider-neutral, but current code still contains concrete Mistral coupling in generic execution paths.

Known examples include:

```text
apps/agents-bridge/src/config.ts
    BridgeConfig is Mistral-centric.

apps/agents-bridge/src/main.ts
    directly constructs MistralProvider / MistralChatRuntime.

apps/agents-bridge/src/worker-main.ts
    directly constructs MistralProvider.

apps/agents-bridge/src/semantic-worker.ts
    requires concrete MistralProvider.

apps/agents-bridge/src/document-perception-worker.ts
    requires concrete MistralProvider.

apps/agents-bridge/src/runtime.ts
    exposes MistralChatRuntime as the concrete provider-backed runtime.

docker-compose.yml
    primarily wires MISTRAL_* provider configuration.
```

This is a bounded infrastructure mismatch.

It is not authority to rewrite:

```text
Atlas semantic schemas
NormalizedDocument semantics
Atlas persistence
bundle lifecycle
review authority
publication authority
DocumentStore authority
BSS-006 queue semantics
IDSER replay/fencing behavior
```

---

## 6. Required BSS V2 end state

BSS V2 is complete only when the established backend can demonstrate this provider-execution shape:

```text
Atlas capability request
        |
        v
provider-neutral capability interface
        |
        v
qualified route resolver
        |
        +-- deployment profile
        +-- qualification identity
        +-- work class
        +-- privacy requirement
        +-- quota domain
        +-- capacity profile
        +-- cost profile
        |
        v
qualified provider adapter
        |
        v
provider execution
        |
        v
normalized result / stream / error
        |
        +-- route provenance
        +-- normalized usage
        +-- operational cost telemetry
        |
        v
existing Atlas validation / persistence / replay boundaries
```

The development profile should be able to use Gemini through this substrate.

The Mistral adapter should remain available as an implemented but inactive route until it is separately requalified.

Moving later from Gemini Free to Gemini Paid, another direct provider, or a qualified gateway must primarily be a route/profile/qualification/capacity/privacy/cost change, not an Atlas semantic rewrite.

---

## 7. Mandatory authority split

Generated tickets must preserve this authority model.

### 7.1 Atlas owns

```text
project truth
workspace/revision authority
source authorization
semantic validation
reviewable state
review decisions
resolved knowledge
publication / Master
conversation authority
customer/product entitlement
workspace privacy requirement
Atlas usage allowance
Atlas commercial budget policy
```

### 7.2 Agents Bridge owns

```text
provider credentials
provider adapters
capability route resolution
provider/model allowlists
provider request translation
provider capacity enforcement
provider rate limits
provider retries
provider timeout/cancellation
normalized provider usage
normalized provider errors
route provenance
operational provider budgets
```

### 7.3 Provider may perform

```text
document perception / OCR
multimodal interpretation
structured reasoning
semantic relationship reasoning
CES reasoning when later authorized
chat generation when later authorized
tool-call proposals
Addendum language assistance when later authorized
embeddings when later qualified
```

No BSS V2 ticket may move accepted project truth or product entitlement into Agents Bridge.

---

## 8. Non-goals

The BSS V2 ticket set must not implement:

```text
subscription plans
Free / Pro / Team pricing rules
payment collection
Stripe or another billing provider
customer invoices
overage billing
final user-facing processing-credit design
final customer plan quotas
review UI
human review domain behavior
resolved knowledge
publication / Master advancement
CES product implementation
chatbot product implementation
Addendum product workflow
OpenRouter integration
new queue technology
Redis
Kafka
Kubernetes
standalone vector database
S3/R2 migration
enterprise tenancy administration
```

OpenRouter or another gateway may be referenced only as a future adapter possibility.

Do not implement it in this ticket set unless a later explicit architecture decision changes scope.

---

## 9. Ticket-set location and historical preservation

Generate a new additive ticket-set directory rather than reusing historical BSS ticket identities.

Preferred location:

```text
project's goal/Backend_Phase/tickets/Stack_Setup_V2/
```

Preferred contents:

```text
README.md
BSS-V2-001-...
BSS-V2-002-...
...
```

All generated tickets begin in:

```text
State: planned
```

Do not alter old approved BSS tickets to make them depend on BSS V2.

Do not rewrite the old Stack Setup README review history.

A higher-level index may later reference the new ticket set if explicitly requested, but ticket generation itself should preserve historical artifacts.

---

# 10. Required decomposition strategy

The ticket set must be bite-sized in terms of review authority, not merely line count.

A good BSS V2 child ticket should normally own:

```text
one primary infrastructure responsibility
one clear authority/trust transition
one bounded implementation surface
one primary validation harness or evidence family
3 to 6 Review Contract rows
```

A ticket is too large when it combines several independently reviewable responsibilities such as:

```text
new provider transport
new persistence schema
new queue behavior
new privacy policy
new cost model
new fallback policy
```

in one GO checkpoint.

A ticket is too small when it creates only a type/file/placeholder that has no independently useful behavior or reviewable boundary and exists only to force another ticket to complete the same responsibility.

The author should prefer coherent vertical infrastructure slices.

---

## 10.1 Split trigger

Before freezing each ticket, evaluate whether it can realistically be implemented, validated, committed, and handed to CK with all Review Contract rows proven in one bounded GO cycle.

Split the ticket further when any of these are true:

1. it owns more than one external live-provider qualification;
2. it requires both a new durable persistence model and a materially new worker/queue lifecycle;
3. it changes more than one major authority boundary;
4. its required evidence needs unrelated harnesses that cannot be understood as one coherent behavior;
5. its Security Refactor Readiness normally needs more than four material review bindings;
6. its CK reviewer would need to rediscover substantial hidden sub-contracts to decide PASS;
7. a likely CFC finding would require reopening half of the ticket rather than repairing a local clause.

When a split is needed after authoring has started, child numbering such as `BSS-V2-005-01` / `BSS-V2-005-02` is allowed.

Do not force work into the original number merely to avoid adding a child ticket.

---

# 11. Recommended ticket decomposition

The generated ticket set should follow this decomposition unless repository inspection finds a concrete reason to split one item further.

Do not merge these workstreams into one mega-ticket.

---

## BSS-V2-001 - Provider capability contracts and concrete-provider decoupling

### Outcome

Remove concrete Mistral typing from generic execution paths while preserving behavior.

### Owns

```text
provider-neutral capability interfaces for:
    document perception
    structured reasoning
    streaming chat
    future embeddings seam when useful

Mistral adapter conformance to those interfaces
semantic-worker dependency inversion
document-perception-worker dependency inversion
provider-backed runtime dependency inversion
behavior-preserving regression proof
```

### Does not own

```text
route registry
Gemini adapter
live provider calls
capacity management
usage persistence
privacy classes
fallback
```

### Key success condition

Generic worker/runtime code must no longer require a concrete `MistralProvider` type.

Existing Mistral behavior remains reachable through the provider-neutral interfaces.

---

## BSS-V2-002 - Qualified route registry and deployment-profile foundation

### Outcome

Introduce a server-controlled capability-to-route layer without changing Atlas semantic contracts.

### Owns

```text
route identity
capability mapping
provider/model identity
qualification identity
work class
enabled/disabled state
deployment profile validation
runtime/worker route resolution
explicit test/live profile selection
removal of silent production-shaped TestRuntime fallback
```

The initial route structure may leave later capacity/privacy/cost fields extensible rather than implementing those policies early.

### Does not own

```text
Gemini transport
live provider qualification
quota-domain enforcement
usage ledger
price catalog
privacy preflight
fallback execution
```

### Key success condition

Generic execution requests a capability route.

It does not construct a vendor class directly.

A live/production-shaped profile cannot silently return deterministic test responses because a provider key is missing.

---

## BSS-V2-003 - Gemini provider adapter contracts

### Outcome

Add Gemini beneath the existing provider-capability interfaces with deterministic contract tests.

### Owns only the provider surfaces required to catch up to the current IDSER-011 point and existing Bridge capability direction:

```text
structured generation
PDF/document perception
streaming chat capability if needed by the existing BSS-005/BSS-008 provider surface
provider-specific error normalization
usage/provenance normalization
request/response bounds
cancellation
secret handling
```

### Validation

Normal tests must use injected/mock transport or equivalent deterministic provider doubles.

This ticket must not require a real Gemini account to PASS.

### Does not own

```text
live Gemini qualification
active development route
provider capacity policy
customer entitlement
cost ledger
privacy policy selection
fallback
```

---

## BSS-V2-004 - Gemini live route qualification and development activation

### Outcome

Prove that the real Gemini account can execute the explicit Atlas capabilities required for current development, then activate only those qualified routes in the development profile.

### Required live gates

At minimum, as applicable:

```text
credential authentication
minimal real inference
non-zero usable entitlement
explicit model/processor identity
structured output with real Atlas schema
Bridge-side complete schema validation
synthetic/non-confidential PDF perception
NormalizedDocument compatibility
representative semantic extraction
representative reconciliation
streaming/cancellation if that route is activated
usage metadata observation
latency observation
429/rate-limit classification
privacy/account-setting evidence appropriate to EVALUATION use
```

### Rules

- Use only synthetic, public, or explicitly non-confidential material.
- Never commit the Gemini API key.
- Do not log raw Authorization headers, source grants, or full provider bodies.
- Do not accept model listing or successful authentication as qualification.
- Record explicit qualified model IDs in the qualification evidence/profile. Do not silently rely on mutable `latest` aliases unless the frozen ticket explicitly authorizes that behavior.
- If the real account has no usable inference entitlement, record an external-provider blocker. Do not substitute a mock and do not mark the live route qualified.

### Does not own

```text
multi-user capacity policy
usage persistence
shadow COGS
workspace privacy classes beyond the bounded development qualification
fallback
```

---

## BSS-V2-005 - Quota-domain and capacity-profile foundation

### Outcome

Represent upstream provider capacity correctly without assuming one API key equals one independent quota pool.

### Owns

```text
quota_domain identity
capacity-profile contract/config
known request/token/page/concurrency limits where available
route-to-quota-domain association
provider/project/account aliasing without secrets
capacity source/effective timestamp
local capacity/admission primitive
zero-entitlement classification
transient quota-exhaustion classification
```

### Must preserve

```text
multiple keys in one upstream project do not automatically create multiple quota domains
different model IDs do not automatically mean independent quotas
zero entitlement is not retried as transient backoff
```

### Does not own

```text
customer subscription limits
Free/Pro rules
worker priority integration
interactive capacity reservation
usage/cost ledger
```

---

## BSS-V2-006 - Capability-aware admission and interactive protection

### Outcome

Integrate capacity admission into existing background and interactive execution without replacing pg-boss.

### Owns

```text
capability-aware concurrency/admission
background workload isolation
interactive work classification
protected interactive capacity or equivalent priority rule
quota-domain-aware admission before provider calls
bounded cooldown behavior
existing pg-boss queue reuse
```

### Must preserve

```text
BSS-006 transaction/retry/idempotency semantics
existing queue technology
semantic/perception replay and fencing
worker graceful shutdown
```

### Does not own

```text
final numeric production limits as architecture constants
customer plan priority
billing
new queue technology
```

Exact limits belong to deployment capacity profiles.

---

## BSS-V2-007 - Provider execution usage and provenance ledger

### Outcome

Persist secret-safe provider execution telemetry for current real provider-backed paths.

### Owns

```text
Bridge-owned execution-usage persistence
route provenance
provider/model identity
qualification identity
quota-domain identity
work class
request/retry counts
tokens/pages where reported
queue delay where applicable
provider latency
total duration
normalized final status/failure class
current perception and structured-reasoning path integration
interactive/provider path seam where applicable
```

### Must not persist

```text
raw PDF bytes
full PRD text
full prompts
full provider response bodies
API keys
Authorization headers
source grants
```

### Authority

Operational usage state remains `bridge.*` / Agents Bridge authority.

This ticket must not grant `agents_bridge` write permission to trusted Atlas semantic tables.

---

## BSS-V2-008 - Effective-dated provider price profiles and shadow COGS

### Outcome

Make provider execution cost measurable without implementing customer billing.

### Owns

```text
effective-dated provider price profile
model/processor meter definitions
currency
input/output/cached token rates when applicable
page/request/other provider meters when applicable
decimal-safe cost calculation
actual cash cost field/semantics
shadow production cost field/semantics
link from execution usage to applied price profile
```

### Required behavior

A free development call may record:

```text
actual_cash_cost = 0
shadow_production_cost = calculated paid-equivalent estimate
```

when an approved production-equivalent price profile exists.

### Does not own

```text
subscription price
customer invoice
plan allowance
billing UI
payment provider
```

---

## BSS-V2-009 - Privacy-class execution preflight

### Outcome

Create a provider-neutral privacy requirement seam and ensure incompatible routes fail before provider transmission.

### Initial conceptual classes

```text
EVALUATION
NO_TRAINING
ZDR_REQUIRED
```

The exact shared enum/type may be frozen in this ticket.

### Owns

```text
provider-neutral privacy class contract
route privacy capability
execution-policy attachment point
preflight comparison
fail-before-network behavior
no silent downgrade
secret-safe diagnostics
```

The current development profile may use `EVALUATION` only for approved non-sensitive material.

The ticket must make it possible for a later Atlas policy layer to supply a stricter workspace requirement without redesigning provider adapters or route resolution.

### Does not own

```text
final legal/compliance policy
enterprise account administration
UI consent flows
customer plan design
regional residency policy unless already established
```

Unresolved future privacy/compliance policy remains explicitly unresolved rather than being invented by this ticket.

---

## BSS-V2-010 - Qualified fallback and route-state foundation

### Outcome

Allow controlled fallback only among already-qualified compatible routes.

### Owns

```text
primary/fallback route relationship
route enabled/disabled state
eligible operational fallback conditions
same-capability enforcement
privacy compatibility enforcement
qualification-version enforcement
route provenance for actual selected route
bounded route health/cooldown state if needed
```

### Mandatory rule

Truth-producing work must not be routed to arbitrary unqualified models.

An opaque auto-router is not an acceptable substitute for Atlas qualification.

### Current deployment expectation

The implementation may prove fallback behavior using deterministic qualified test routes.

The active development profile is not required to have a second live provider until another provider route is genuinely qualified.

Do not treat the currently blocked Mistral route as a live fallback merely because the adapter exists.

---

## BSS-V2-011 - Integrated BSS V2 reconciliation checkpoint

### Outcome

Prove that the BSS V2 provider substrate composes with the existing BSS and current semantic/perception infrastructure without reopening IDSER domain semantics.

### Owns only composition evidence such as

```text
provider-neutral generic workers/runtime
qualified Gemini development routes
Mistral retained but inactive
profile/readiness behavior
capacity/quota-domain admission wiring
interactive protection wiring
usage/provenance persistence
shadow cost calculation
privacy preflight
qualified fallback foundation
Compose boot/rebuild correctness
directly affected BSS/perception/semantic-worker regressions
Bridge database-role authority remains restricted
```

### Must not own

```text
full IDSER live D1/D2 bundle acceptance
Ready for Review through a real multi-document project
review UI
CES
chatbot product behavior
publication
Master
```

Those belong to the superseding live-provider IDSER acceptance that follows BSS V2.

### Integration rule

This final ticket consumes predecessor PASS evidence.

It does not reimplement or repair a predecessor-owned defect.

If composition exposes a substantive defect in a predecessor contract, return it to the owning ticket/planning boundary rather than turning BSS-V2-011 into a catch-all repair ticket.

---

# 12. Dependency graph

The preferred dependency shape is:

```text
BSS-V2-001
Provider capability decoupling
      |
      v
BSS-V2-002
Qualified routes / deployment profile
      |
      v
BSS-V2-003
Gemini adapter contracts
      |
      v
BSS-V2-004
Gemini live qualification
      |
      +-------------------------------+
      |                               |
      v                               v
BSS-V2-005                        BSS-V2-007
Quota/capacity foundation         Usage/provenance ledger
      |                               |
      v                               v
BSS-V2-006                        BSS-V2-008
Admission / interactive           Price profiles / shadow COGS
protection                            |
      |                               |
      +---------------+---------------+
                      |
                      v
                BSS-V2-009
                Privacy preflight
                      |
                      v
                BSS-V2-010
                Qualified fallback
                      |
                      v
                BSS-V2-011
                Integrated checkpoint
```

The ticket author may adjust parallelism when actual code dependencies justify it.

Do not create dependencies merely because one ticket number is lower.

Every dependency must correspond to a real interface or behavior the child consumes.

---

# 13. Ticket authoring requirements

Every BSS V2 ticket must be sufficiently explicit that GO, CK, CFC, and HMN can operate without reconstructing hidden acceptance criteria.

Each ticket should contain at minimum:

```text
Title / stable ticket ID
State
Review batch
Dependencies
Primary architecture/baseline references
Outcome
Current seam / starting state
Scope
Explicit non-authority / forbidden work
Review Contract
Security Refactor Readiness
Required validation
Direct regression boundary
Docker/environment notes when applicable
Hard stop and handoff
```

Do not write tickets that depend on vague prose such as:

```text
make provider routing production ready
improve security
handle quotas properly
add robust tests
support economics
```

Convert those ideas into bounded observable behavior.

---

# 14. Review Contract design

Each generated ticket must freeze its Review Contract during ticket authoring.

Use stable row IDs such as:

```text
RC-BSSV2-001-01
RC-BSSV2-001-02
...
```

A row should contain:

```text
Exact bounded behavior
Ticket authority / inherited boundary
Smallest authoritative proof
Binary closure oracle
Direct regression boundary when material
```

Prefer 3 to 6 rows per normal ticket.

A row must describe one independently decidable condition.

Do not create separate rows for every diagnostic command.

Do not create one enormous row that combines unrelated requirements.

### 14.1 Behavior versus proof

Keep these separate.

Example:

```text
Behavior:
semantic-worker depends on StructuredReasoningProvider-style interface.

Proof:
type/import inspection + focused semantic-worker tests.
```

The proof mechanism is not a second product requirement.

### 14.2 Binary closure

Avoid subjective closure such as:

```text
looks robust
is production ready
is secure enough
```

Use observable closure such as:

```text
PASS iff semantic-worker has no concrete Mistral/Gemini provider type dependency,
its provider-neutral contract tests pass, and directly affected semantic-worker
regressions remain green.
```

### 14.3 Required harness must be explicit

If a row requires Compose, a real live provider, a PostgreSQL permission check, or a specific integration harness, name it in the frozen ticket.

Do not let CK discover after implementation that a stronger harness was supposedly intended.

---

# 15. GO-friendly ticket design

The ticket set must be authored so GO can finish a ticket completely before handoff.

A ticket should not intentionally split:

```text
implementation now
proof later
```

across two tickets when proof is required to establish the implemented boundary.

GO must be able to:

```text
read frozen Review Contract
implement every row
run every required validation
wait for required asynchronous work to finish
inspect final evidence
record Review Contract Closure
commit one bounded checkpoint
set awaiting_review
record Internal readiness: READY_FOR_CK
```

### 15.1 No short-stop acceptance

Tickets must not make it reasonable for GO to stop at:

```text
command still running
Compose scenario still processing
provider call started but not observed
migration applied but behavior not proven
code implemented but required regression not run
```

When the ticket requires terminal behavior, its hard-stop section must state that GO continues until terminal evidence exists.

If the execution environment genuinely prevents required proof, GO must classify the row honestly rather than hand an incomplete checkpoint to CK.

### 15.2 No hidden planning decisions inside GO

Do not freeze tickets that require GO to decide:

```text
which new provider should Atlas use?
which new queue technology should be adopted?
what should the customer plan cost?
what legal privacy policy should Atlas promise?
```

Those are planning/architecture decisions and must already be resolved or intentionally deferred.

For Gemini model IDs, the live qualification ticket may use explicit configured models selected for qualification from the real provider account, but activation requires the ticket's live qualification evidence and an explicit recorded qualification identity.

---

# 16. CK-friendly ticket design

The first CK review must be able to inspect the complete ticket contract and consolidate all current ticket-bound findings in one review.

Ticket authoring should therefore:

```text
make all acceptance rows visible up front
name authoritative proof surfaces
state negative cases where they are genuinely required
state direct regressions that matter
avoid broad words that invite reviewer invention
```

CK must not need to infer that a ticket also intended:

```text
OpenRouter
paid Gemini
S3
billing
full IDSER reruns
all provider models
all future privacy laws
```

unless the frozen ticket explicitly says so.

The final integration ticket should consume predecessor PASS artifacts instead of restarting full review of every predecessor implementation.

---

# 17. CFC-friendly ticket design

A `CHANGES_REQUIRED` result should normally be repairable inside the same frozen ticket without redesigning its whole architecture.

To make that possible:

```text
keep ticket ownership narrow
use stable Review Contract rows
keep closure oracles binary
avoid overlapping responsibility with siblings
name the direct regression boundary
protect accepted predecessor interfaces
```

A likely finding should be local, for example:

```text
route resolver permits an unqualified route
usage ledger persisted raw prompt text
privacy preflight occurs after network submission
quota-domain limiter retries known zero entitlement
```

It should not require CFC to invent a new provider or redesign Atlas product policy.

CFC must be able to remediate exact frozen CK clauses and hand one bounded checkpoint back to CK.

---

# 18. HMN-friendly ticket design

HMN is useful only when the ticket has a stable contract that can support a bounded authorization.

Every ticket must therefore make it possible for HMN to answer:

```text
which exact Review Contract / CK clause is unresolved?
is it still within frozen ticket authority?
is this code remediation, evidence remediation, or a planning decision?
which already-proven rows must not be reopened?
```

Do not write tickets whose acceptance is so broad that HMN would need to invent a new test matrix or architecture rule to authorize continuation.

A new provider, architecture, product, legal, deployment, or policy decision remains `HUMAN_DECISION_REQUIRED` rather than being smuggled through HMN.

---

# 19. Security Refactor Readiness rules

Use `.agents/skills/engineering-security-refactor-readiness/SKILL.md` during ticket authoring exactly for its intended purpose.

It is not a full security audit.

It must reason only about the bounded current ticket and the accepted context that ticket consumes.

### 19.1 Security readiness must remain ticket-local

For each ticket, identify only material items such as:

```text
inherited authority boundary
new trust transition
sensitive asset touched by this ticket
future security-policy attachment seam
prohibited coupling
one or more focused verification seams
intentionally unresolved future policy
```

Do not repeat every security boundary in every BSS V2 ticket.

### 19.2 Evidence-proportionate review bindings

A normal ticket should usually have about 1 to 3 material security review bindings.

More may be justified, but more than four material bindings should trigger a scope review and likely ticket split.

Each binding should be provable with focused evidence.

If one binding requires a project-wide matrix unrelated to the ticket's primary behavior, the ticket or binding is probably too broad.

### 19.3 Do not invent future security policy

Examples of policy that may remain intentionally unresolved until a later security baseline or product decision:

```text
final enterprise data residency requirements
final legal retention policy
final customer-specific compliance mappings
final tenant isolation tiers
final incident-response policy
```

Preserve extension seams instead of making those unresolved items current blockers.

### 19.4 Security readiness by expected ticket type

Expected rough relevance:

```text
BSS-V2-001  minimal to low
    provider-neutral type/authority separation

BSS-V2-002  low to medium
    server-controlled route allowlist and explicit runtime profile

BSS-V2-003  medium
    provider credentials, bounded input, provider-type leakage, error redaction

BSS-V2-004  medium
    live credential handling, synthetic data, secret-safe evidence

BSS-V2-005  low to medium
    quota-domain aliases must be non-secret; capacity must not become product authority

BSS-V2-006  medium
    admission bypass and interactive/background isolation

BSS-V2-007  medium
    usage telemetry must exclude source content and secrets; Bridge DB authority remains bounded

BSS-V2-008  minimal to low
    cost-profile integrity; no accidental billing/customer authority

BSS-V2-009  medium to high
    fail-before-network privacy enforcement; no silent downgrade

BSS-V2-010  medium
    fallback cannot bypass qualification/privacy/capability rules

BSS-V2-011  low to medium
    composition verifies inherited boundaries; does not re-audit the whole system
```

This is guidance, not a quota of required findings.

A ticket with no material new security seam may use `minimal-relevance` rather than inventing requirements.

### 19.5 Security planning gaps

If readiness returns `planning-review-required`, do not freeze the ticket as executable.

Resolve the planning conflict or split the ticket first.

---

# 20. Recommended security seams by workstream

The following are examples of bounded seams the ticket author may use when they are supported by the final ticket scope.

Do not copy them mechanically if the actual ticket does not need them.

### BSS-V2-001

```text
SEAM-BSSV2-001-PROVIDER-INTERFACE
Generic workers depend only on provider-neutral capabilities.

COUPLING-BSSV2-001-CONCRETE-PROVIDER
Generic workers must not require Gemini/Mistral concrete classes.
```

### BSS-V2-002

```text
SEAM-BSSV2-002-SERVER-ROUTING
Provider/model choice remains server-controlled.

COUPLING-BSSV2-002-CLIENT-MODEL
Client/skill payloads cannot choose arbitrary provider/model IDs.
```

### BSS-V2-003

```text
SEAM-BSSV2-003-CREDENTIAL
Gemini credentials remain Bridge deployment secrets.

SEAM-BSSV2-003-BOUNDED-INPUT
Only explicit bounded provider input crosses the provider boundary.

COUPLING-BSSV2-003-SDK-LEAK
Gemini SDK/API types do not enter Atlas semantic/domain contracts.
```

### BSS-V2-004

```text
SEAM-BSSV2-004-LIVE-EVIDENCE
Qualification evidence is secret-safe and uses approved non-confidential material.
```

### BSS-V2-005 / 006

```text
SEAM-BSSV2-CAPACITY-OPERATIONAL
Provider capacity remains operational Bridge authority, not customer entitlement authority.

COUPLING-BSSV2-CAPACITY-KEY
Multiple API keys must not be treated as automatic independent quota domains.
```

### BSS-V2-007

```text
SEAM-BSSV2-USAGE-REDACTION
Usage ledger stores metrics/provenance but not raw source/prompt/secret material.

BOUNDARY-BSSV2-USAGE-DB
Bridge telemetry persistence does not grant Bridge trusted Atlas write authority.
```

### BSS-V2-009

```text
SEAM-BSSV2-PRIVACY-PREFLIGHT
Required privacy compatibility is checked before provider transmission.

COUPLING-BSSV2-PRIVACY-DOWNGRADE
No route/adaptor may silently lower privacy requirements to obtain a successful call.
```

### BSS-V2-010

```text
SEAM-BSSV2-FALLBACK-QUALIFIED
Fallback is restricted to explicitly qualified compatible routes.

COUPLING-BSSV2-AUTO-ROUTER
Truth-producing work cannot escape into arbitrary unqualified routing.
```

---

# 21. Provider qualification rules

The ticket set must preserve the lesson from the Mistral live failure.

Provider documentation, API-key creation, model listing, or dashboard quota display are not sufficient qualification.

A route becomes active only after the route-specific live ticket proves the required capability.

For current Gemini development, qualification must be explicit per capability.

The same model may serve multiple capabilities only if each capability passes its own required gates.

Do not encode a permanent rule that all Atlas capabilities use one model.

Do not encode a permanent rule that every capability must use a different model.

Capability mapping is a qualified deployment decision.

---

# 22. Provider-neutral contract preservation

BSS V2 must preserve these compatibility boundaries.

### 22.1 Document perception

```text
Immutable source bytes
      |
      v
qualified DocumentPerceptionProvider
      |
      v
Bridge-owned provider result
      |
      v
Atlas normalization
      |
      v
NormalizedDocument v1
```

Optional provider fields such as geometry/confidence remain optional.

Do not fabricate Mistral-shaped fields for Gemini.

### 22.2 Semantic reasoning

```text
atlas.semantic.extract/v1
atlas.semantic.reconcile/v1
```

remain Atlas contracts.

Provider structured-output features may improve generation reliability but do not replace complete Atlas-side validation.

No provider migration may weaken schema validation to make a provider call succeed.

---

# 23. Capacity and multi-user rules

BSS V2 must assume that many Atlas users can share one upstream provider project/account.

Therefore:

```text
Atlas user allowance
    !=
provider API key

provider API key count
    !=
independent quota count

provider model ID count
    !=
guaranteed independent quota count
```

`quota_domain_id` represents the real shared upstream capacity pool known to Atlas infrastructure.

Capacity policy must be able to reason about:

```text
requests/minute
tokens/minute
requests/day
pages or document limits when relevant
max concurrency
provider cooldown
route-specific sublimits when proven
```

Unknown provider limits remain explicit unknowns or conservative deployment limits.

Do not invent numerical provider limits in architecture tickets.

---

# 24. Interactive protection

The ticket set must preserve a future responsive Atlas UX.

Background work includes:

```text
document perception
semantic extraction
semantic reconciliation
CES assessment when later implemented
rebuild/reprocessing
```

Interactive work includes:

```text
chat
review explanation
clarification
bounded hypothetical reasoning
review-resolution assistance
```

The infrastructure must support protected interactive capacity, priority-aware admission, separate capacity allocation, or an equivalent bounded mechanism.

The exact numeric percentage is deployment policy and must not be hard-coded as architecture truth.

---

# 25. Usage and economic telemetry rules

Every real provider-backed execution in the current implemented capability surface should be attributable to:

```text
execution ID
capability
work class
route ID
provider
model/processor
qualification version
quota domain
request/retry count
usage units when reported
latency/duration
final normalized status
price profile
actual cash cost
shadow production cost
```

The ledger is operational telemetry.

It is not a duplicate source-document store.

### 25.1 Shadow cost

Free provider execution must not make Atlas economics invisible.

When a paid-equivalent profile exists:

```text
actual_cash_cost
shadow_production_cost
```

must remain distinguishable.

Shadow cost is planning telemetry, not an invoice.

### 25.2 Price changes

Provider prices are effective-dated data/configuration.

Historical usage must be explainable against the price profile applied at execution/accounting time.

Use decimal-safe accounting types for financial amounts.

---

# 26. Privacy rules

Privacy class is provider-route qualification metadata, not semantic skill behavior.

The initial conceptual ordering is:

```text
EVALUATION
NO_TRAINING
ZDR_REQUIRED
```

A route may satisfy one or more classes according to qualified provider/account/endpoint behavior.

Do not assume:

```text
stateless endpoint = ZDR
paid provider = ZDR
free provider = safe for confidential data
```

The current development Gemini profile may be qualified for EVALUATION with synthetic/non-confidential inputs.

Final production legal/privacy policy remains outside BSS V2 unless explicitly authorized.

---

# 27. Qualified fallback rules

Fallback is an execution reliability feature, not permission for arbitrary model choice.

A fallback candidate must already satisfy:

```text
same Atlas capability
qualified provider/model identity
compatible schema/contract
required privacy class
bounded input/output rules
required execution semantics
```

The actual selected route must always be recorded in provenance.

A currently blocked Mistral route cannot be treated as live fallback until separately requalified.

---

# 28. Docker and local-environment discipline

`docker compose up` remains the canonical supported local stack path.

BSS V2 tickets that affect Compose-managed source/config must include a bounded stale-environment procedure.

Before classifying a failure as implementation or provider behavior, check as applicable:

```text
reviewed source actually built into image
container recreated after config/source change
environment values loaded by expected service
old process/container not still serving traffic
migrations applied
pg-boss jobs/scenario state scoped correctly
DocumentStore fixture/scenario state scoped correctly
readiness marker/state fresh
```

Use targeted rebuild/recreate of affected services.

Do not use indiscriminate `docker compose down --volumes` as a default repair.

Preserve unrelated local data and user changes.

---

# 29. Test strategy

Normal CI and ordinary ticket validation must not require a live paid provider.

Use three evidence layers.

### 29.1 Deterministic unit/contract tests

Prove:

```text
provider request translation
schema handling
response normalization
error classification
privacy preflight
route selection
quota-domain logic
cost calculation
redaction
```

with deterministic doubles where appropriate.

### 29.2 Local integration / Compose

Prove:

```text
Bridge startup/readiness
worker injection
pg-boss behavior
PostgreSQL role boundaries
usage persistence
capacity integration
existing perception/semantic handoffs
```

without requiring every test to hit a live external provider.

### 29.3 Explicit live provider qualification

Only tickets explicitly owning live qualification may require:

```text
real provider credential
real inference
real rate-limit/usage observation
real synthetic PDF
```

Live tests must be opt-in and secret-safe.

A normal unit test must not accidentally spend provider credits.

---

# 30. Regression boundary

BSS V2 tickets must run directly affected regressions, not the entire historical Atlas universe by default.

Likely affected evidence families include, depending on the ticket:

```text
BSS-005 service/runtime tests
BSS-006 worker/queue tests
BSS-009 perception tests
semantic worker tests
semantic client/handoff tests
perception replay tests
semantic replay/fencing tests
Compose smoke/readiness
PostgreSQL role-denial checks
```

Do not automatically rerun all IDSER acceptance scenarios for every provider-infrastructure ticket.

If a BSS V2 implementation changes a frozen semantic contract or Atlas authority instead of merely preserving it, stop and classify that as scope change rather than silently absorbing it into regression work.

---

# 31. Final integrated checkpoint boundary

BSS-V2-011 must prove the provider substrate is ready for a new live-provider IDSER acceptance phase.

It should establish:

```text
generic workers no longer require concrete Mistral/Gemini types
Gemini development routes are explicitly qualified and active
Mistral adapter remains available but inactive/blocked
route/profile configuration is explicit
capacity/quota-domain controls compose
interactive protection composes
usage/provenance recording composes
price/shadow-cost recording composes
privacy preflight composes
qualified fallback machinery exists without pretending a blocked route is live
Compose stack is healthy after correct rebuild/recreate
Bridge database authority remains restricted
directly affected BSS/perception/semantic regressions pass
```

It intentionally does not prove:

```text
real authenticated D1 through complete semantic persistence
real D2 incremental sequencing
N/N bundle Ready for Review
```

Those are the next live IDSER acceptance responsibilities.

---

# 32. Handoff after BSS V2

After every executable BSS V2 child reaches CK PASS, the next planning step is a superseding live-provider acceptance ticket set.

That ticket set should preserve the useful IDSER-011 decomposition:

```text
01 active-route live qualification consumption
02 live first-document production path
03 live incremental sequencing and bounded prior context
04 integrated Ready for Review checkpoint
```

but it must prove provider-neutral capability routes rather than hard-coding `MistralProvider` as the acceptance authority.

The actual execution provenance should identify Gemini for the current development route.

Do not create that IDSER ticket set as part of BSS V2 ticket generation unless separately requested.

---

# 33. Ticket-generation procedure for Codex

When this implementation context is supplied for ticket generation, Codex should perform the following planning work only.

1. Read this implementation context in full.
2. Read `atlas-core-architecture-checkpoint-v3.md` in full.
3. Read `atlas-backend-production-baseline-v2.md` in full.
4. Inspect the current approved BSS-005 through BSS-009-02 contracts needed by the planned work.
5. Inspect the current provider/runtime/worker/config implementation seams named in this context.
6. Inspect IDSER contracts only enough to preserve the interfaces BSS V2 must not change.
7. Use the current Atlas ticket/review contract conventions and Security Refactor Readiness skill during ticket authoring.
8. Generate the new `Stack_Setup_V2` README and the planned ticket files.
9. Do not implement production code.
10. Do not change current ticket states outside the newly generated planned BSS V2 set.

If inspection reveals that one recommended ticket is still too large, split it before freezing the ticket set and explain the split in the README dependency graph.

If inspection reveals a genuine architecture conflict that cannot be resolved within V3/Baseline V2 authority, stop ticket generation for that conflict and surface the exact planning decision rather than inventing behavior.

---

# 34. Ticket README requirements

The new `Stack_Setup_V2/README.md` should contain at minimum:

```text
purpose
primary architecture references
historical BSS compatibility statement
IDSER continuity statement
scope/non-scope
provider direction
security-readiness authoring rule
delivery order/dependency table
dependency graph
review controls
Docker/local boot convention
completion boundary
handoff to superseding IDSER live acceptance
```

The README must explicitly state:

```text
BSS V2 is additive.
Historical BSS checkpoints remain historical.
IDSER-001 through IDSER-010 are not reopened.
Gemini is the current development provider direction, not permanent architecture authority.
Mistral remains an implemented but inactive/blocked provider route until requalified.
```

---

# 35. Review workflow compatibility

The generated ticket set must be optimized for the repository's current workflow:

```text
GO
  -> complete frozen ticket
  -> Review Contract Closure
  -> awaiting_review

CK
  -> one consolidated first review
  -> PASS or CHANGES_REQUIRED

CFC
  -> one bounded remediation of frozen CK clauses
  -> awaiting_review

CK
  -> bounded verification

HMN
  -> only when human/planning authority is needed for another bounded continuation
```

Ticket authoring must not rely on CK to discover missing acceptance criteria.

Ticket authoring must not rely on HMN to create a second acceptance contract.

Ticket authoring must not make CFC the normal place where required proof is first implemented.

---

# 36. Anti-patterns explicitly prohibited

Do not generate tickets with these shapes:

```text
"Modernize all provider infrastructure"
    too broad

"Add Gemini and migrate Atlas"
    risks replacing one hard-coded provider with another

"Make security production ready"
    unbounded and not ticket-authoritative

"Implement pricing"
    confuses provider COGS telemetry with customer pricing

"Add OpenRouter fallback"
    future provider/gateway choice not currently authorized

"Use a second Gemini API key for more quota"
    assumes keys equal independent quota domains

"Run all IDSER live scenarios after every BSS ticket"
    excessive and reopens frozen domain work

"Store prompt/response for observability"
    violates the usage-ledger source-minimization boundary

"Use TestRuntime when the live profile is misconfigured"
    creates false readiness

"Use any available model as fallback"
    violates qualification/auditability
```

---

# 37. Definition of a good BSS V2 ticket

A generated child ticket is ready to freeze only when all answers below are yes.

```text
Can the ticket's primary responsibility be stated in one sentence?

Does it preserve approved predecessor authority instead of rewriting it?

Are all dependencies actual interfaces it consumes?

Can GO complete implementation and required proof in one bounded cycle?

Can CK decide every Review Contract row without inventing a stronger requirement?

If CK finds a defect, can CFC repair the frozen clause without redesigning siblings?

If a second remediation is needed, can HMN authorize exact unresolved clause IDs?

Are security readiness bindings ticket-local and evidence-proportionate?

Are future security/product/legal policies left unresolved instead of invented?

Does the ticket have a clear hard stop and next owner?
```

If any answer is no, revise or split the ticket before freezing the set.

---

# 38. BSS V2 completion boundary

The BSS V2 phase ends when the backend has proven:

```text
provider-neutral capability injection
qualified route/deployment profiles
Gemini adapter
real Gemini development qualification
Mistral retained but inactive
quota-domain-aware capacity representation
capability-aware admission
interactive capacity protection
provider execution usage/provenance ledger
effective-dated price profiles
shadow production COGS
provider-neutral privacy preflight
qualified fallback foundation
Compose/runtime compatibility
existing queue/perception/semantic authority preserved
```

The phase then stops.

It does not continue into live Initial Draft domain acceptance automatically.

---

# 39. Final implementation-context principle

The BSS V2 ticket set must make this transition possible:

```text
CURRENT

Atlas semantic/perception pipeline
        |
        v
concrete Mistral-coupled Bridge wiring
        |
        v
blocked live Mistral route
```

into:

```text
TARGET

Atlas semantic/perception pipeline
        |
        v
provider-neutral Bridge capabilities
        |
        v
qualified route + policy substrate
        |
        +-- Gemini active development route
        +-- Mistral retained inactive route
        +-- future qualified provider/gateway
        |
        v
capacity + privacy + usage + cost controls
        |
        v
existing Atlas validation / replay / authority
```

without changing what Atlas considers project truth.

The final rule for ticket generation is:

> Build small, closed, reviewable infrastructure checkpoints. Preserve historical authority. Make every acceptance condition explicit before GO. Keep security readiness local and future-policy aware. Prove one coherent boundary per ticket. Do not trade one provider lock-in for another, and do not push required proof into CK/CFC as a discovery phase.
