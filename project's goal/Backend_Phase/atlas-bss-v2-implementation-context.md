# Atlas BSS V2 Implementation Context

Status: Authorized implementation context for remaining BSS V2 realignment and ticket decomposition
Phase name: Backend Stack Setup V2 Reconciliation
Ticket-set prefix: BSS-V2
Repository: adityaa11/ces-platform
Branch inspected: codex/new-atlas-backend
Reviewed branch baseline before this context revision: 769cd368d4d2bb1d9b43c5872c2bba0a76b8976c
Encoding: UTF-8, ASCII-safe Markdown

---

## 1. Purpose

This implementation context governs the remaining additive Backend Stack Setup V2 work after the repository has already approved BSS-V2-001, BSS-V2-002, and BSS-V2-003.

Its purpose is not to redesign Atlas domain semantics and not to rewrite approved BSS/IDSER history.

The current authority documents are:

- `atlas-core-architecture-checkpoint-v3.md`; and
- `atlas-backend-production-baseline-v2.md`.

Those documents now establish a split execution model:

```text
source-grounded document perception
    -> qualified local processor

semantic / conversational reasoning
    -> separately qualified external reasoning provider
```

The immediate perception direction is local Docling for the currently evidenced digital-PDF class.

DOCSPIKE-001 recorded `PASS_WITH_LIMITS` feasibility evidence for:

```text
repository PDF
    -> local Docling
    -> deterministic generic perception result
    -> existing normalizePerceptionResult(...)
    -> unchanged NormalizedDocument v1
```

That spike remains feasibility evidence rather than production activation authority. Its known limits are explicit: visual regions were omitted where unstable, confidence was not fabricated, and scanned-PDF/OCR behavior was not established.

DOCSPIKE-001 one-shot Python timings are not the production latency qualification. The spike proved structural feasibility, determinism, and compatibility while repeatedly constructing a local conversion path. The production gate must measure the selected persistent service after required model/pipeline warm-up.

The next BSS/IDSER alignment target is therefore deliberately narrow:

```text
IDSER-003 D1 perception kickoff
    -> existing BSS-009 source authority
    -> Agents Bridge redeems/verifies exact PDF bytes
    -> qualified persistent Compose-private docling-serve
         -> docling-serve 1.21.0
         -> Docling 2.132.0
         -> CPU-only first profile
         -> local models/artifacts
         -> warm reusable Standard PDF pipeline
    -> deterministic Atlas mapper
    -> existing normalization
    -> Atlas-accepted NormalizedDocument v1
    -> STOP
```

Semantic extraction and reconciliation qualification resume only after that perception checkpoint.

Gemini remains an implemented adapter and a candidate for later reasoning qualification. Gemini PDF perception is no longer required for the primary development perception path.

Mistral remains an implemented but inactive/blocked external provider until separately requalified.

The remaining BSS V2 work must also preserve the production-economics substrate required for external reasoning providers, but provider quota/privacy/token-cost concepts must not be falsely imposed on local Docling execution.

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
BSS-005  Agents Bridge service foundation
BSS-006  pg-boss background runtime
BSS-007  DocumentStore foundation
BSS-008  Mistral provider adapter implementation
BSS-009  Document Perception foundation
BSS-009-01 Atlas perception authority
BSS-009-02 Bridge perception integration

BSS-V2-001 Provider capability decoupling        APPROVED
BSS-V2-002 Qualified route registry              APPROVED
BSS-V2-003 Gemini adapter contracts              APPROVED
```

BSS-008 remains:

```text
adapter implementation mechanics: retained
Mistral live route qualification: blocked / inactive
Mistral as permanent Atlas dependency: prohibited
```

BSS-V2-001/002/003 also remain historical approved work.

In particular:

- BSS-V2-001 established narrow capability interfaces.
- BSS-V2-002 established server-controlled qualified-route resolution.
- BSS-V2-003 established Gemini adapter behavior under deterministic transport tests, including a PDF-capable adapter surface.

The Docling realignment does not invalidate those approved commits. It changes which capability implementation is preferred for current perception.

The existing planned BSS-V2-004 and its blocker evidence must not be silently reinterpreted as a PASS or rewritten to pretend the previous Gemini-first plan never existed. Remaining ticket planning should supersede that plan explicitly while preserving its historical artifacts.

---

## 4. IDSER continuity through the current IDSER-011 point

The current Initial Draft implementation through IDSER-010 remains established domain behavior.

BSS V2 must preserve:

```text
NormalizedDocument v1
semantic contract v1
atlas.semantic.extract/v1
atlas.semantic.reconcile/v1
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

For the current perception-first realignment, the important upstream/downstream split is:

```text
UPSTREAM OF PERCEPTION CHECKPOINT

IDSER-003
    project/bundle creation
    ordered document manifest
    D1 perception execution/source grant/job

BSS-009 series
    source authorization
    byte redemption
    normalization
    Atlas-owned derived cache


PERCEPTION CHECKPOINT

Atlas-accepted NormalizedDocument v1


DOWNSTREAM OF CHECKPOINT

IDSER-002
    semantic contracts

IDSER-004
    semantic context/result authority

IDSER-005
    semantic worker/replay

IDSER-006
    extraction validation/materialization

IDSER-007+
    reconciliation and later lifecycle
```

The perception checkpoint must not require semantic success.

The existing IDSER-011 ticket set remains Mistral-specific historical live-provider acceptance evidence and must not be silently rewritten as Gemini or Docling acceptance.

Once perception is production-shaped and accepted, later semantic qualification may consume the existing IDSER contracts without reopening them unless an actual contract defect is separately authorized.

---

## 5. Current repository mismatch to reconcile

The repository has moved beyond the original BSS V2 planning assumptions.

The primary concrete-provider coupling was already corrected by BSS-V2-001 and BSS-V2-002.

BSS-V2-003 added Gemini beneath those interfaces.

The remaining mismatch is architectural/planning:

```text
old remaining plan
    Gemini must qualify perception + extraction + reconciliation together

current architecture
    perception and semantic reasoning qualify independently
```

DOCSPIKE-001 has shown that local Docling can reach the existing perception boundary for the current digital-PDF fixtures.

Therefore the remaining perception seam is:

```text
existing DocumentPerceptionProvider-style capability
    -> persistent Compose-private docling-serve
    -> deterministic Atlas mapper
    -> existing BSS-009 handoff
    -> unchanged NormalizedDocument v1
```

For the current Atlas local Docker profile, the topology is no longer an open subprocess/sidecar choice. Agents Bridge calls a long-lived private Docling Serve service. The service keeps its Python runtime, local model artifacts, converter/model cache, and initialized Standard PDF pipeline reusable across requests. A fresh Python/Docling process per PDF is not the production-shaped route.

The code-level interface name `DocumentPerceptionProvider` is retained for compatibility. Its semantics are executor-neutral; implementing it with local Docling does not make Docling a remote AI provider.

The following are not authorized by this realignment:

```text
semantic schema rewrite
NormalizedDocument v1 rewrite
direct Docling access to DocumentStore paths
semantic interpretation inside Docling mapping
fresh per-document Python/Docling subprocess as the production route
Docling RQ/Redis or another durable queue for the current D1 lifecycle
automatic GPU/CUDA fallback
public host exposure of Docling as an Atlas requirement
new queue technology
review/publication redesign
rewriting approved BSS/IDSER history
```

---

## 6. Required BSS V2 end state

The remaining BSS V2 work must support two execution shapes beneath one capability-routing substrate.

### 6.1 Local perception route

```text
Atlas/IDSER capability request
        |
        v
qualified route resolver
        |
        v
local_processor route
        |
        v
Agents Bridge
        |
        | exact BSS-009-authorized PDF bytes
        v
persistent Compose-private docling-serve
        |
        | local compute engine
        | warm reusable Standard PDF pipeline
        v
DoclingDocument JSON
        |
        v
deterministic Atlas mapper
        |
        v
existing normalizePerceptionResult(...)
        |
        v
NormalizedDocument v1
        |
        v
Atlas result acceptance/cache authority
```

The current route is pinned to docling-serve 1.21.0 and Docling 2.132.0 for qualification, with an immutable deployed image/runtime identity recorded in evidence. The first qualified execution profile is CPU-only.

The local route records service/processor/image identity, option-profile identity, qualification identity, warm-route timing, runtime/failure metrics, and route provenance.

It does not invent provider credentials, quota domains, RPM/TPM/RPD, external privacy classes, or token pricing.

### 6.2 External reasoning route

```text
Atlas semantic/chat capability request
        |
        v
qualified route resolver
        |
        v
external_provider route
        |
        +-- privacy preflight
        +-- quota/capacity admission
        +-- provider/model identity
        |
        v
provider adapter
        |
        v
bounded structured/stream result
        |
        +-- provider usage/provenance
        +-- cost telemetry where applicable
        |
        v
existing Atlas validation / persistence / replay authority
```

### 6.3 Immediate hard stop

Before semantic-model qualification resumes, the backend must prove:

```text
IDSER-003 D1 job
    -> pg-boss
    -> BSS-009 source grant/redemption
    -> Bridge verifies exact PDF bytes
    -> qualified ready/warm private Docling service
    -> deterministic mapping
    -> existing normalization/parser
    -> Atlas-accepted NormalizedDocument v1
```

The current D1 path keeps pg-boss as the sole Atlas job/retry/replay authority. It does not introduce Docling RQ/Redis or another durable queue.

and stop there.

The perception checkpoint is independently useful and reviewable. It must not be hidden inside a semantic-provider live-qualification ticket.

---

## 7. Mandatory authority split

Generated or revised tickets must preserve this authority model.

### 7.1 Atlas owns

```text
project truth
workspace/revision authority
source authorization
immutable source identity
NormalizedDocument acceptance/cache authority
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
capability implementation adapters
qualified route resolution
local processor invocation where configured
external provider credentials/adapters
processor/provider/model allowlists
bounded retries
timeout/cancellation
normalized execution errors
executor provenance
external provider capacity/rate-limit enforcement
external provider usage/economic telemetry
```

### 7.3 Local perception processor may perform

```text
PDF parsing
page/text-block recovery
heading/structural classification
reading-order recovery
table recovery
geometry recovery only when trustworthy
OCR only after separate qualification
```

It may not create business-semantic assertions, choose truth, discover source files independently, or write Atlas trusted state.

### 7.4 External reasoning provider may perform

```text
structured semantic reasoning
semantic relationship reasoning
CES reasoning when later authorized
chat generation when later authorized
tool-call proposals
Addendum language assistance when later authorized
embeddings when later qualified
multimodal interpretation when separately qualified
```

No BSS V2 ticket may move accepted project truth or product entitlement into Agents Bridge or an executor.

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

The existing BSS V2 ticket-set directory remains authoritative:

```text
project's goal/Backend_Phase/tickets/Stack_Setup_V2/
```

Do not generate a second competing BSS V2 directory.

Preserve:

```text
BSS-V2-001 approved history
BSS-V2-002 approved history
BSS-V2-003 approved history
existing BSS-V2-004 planned artifact
existing BSS-V2-004 blocker/evidence artifacts
existing planned BSS-V2-005 through BSS-V2-011 artifacts until explicitly regenerated
```

The old BSS-V2-004 concept bundled Gemini perception, extraction, reconciliation, and development activation. It is no longer the executable next plan under the current V3/Baseline V2 authority.

Do not rewrite its prior blocker evidence to make the history appear as though Docling had always been selected.

The preferred remaining-plan mechanism is to split the superseding work under new child identities, beginning with:

```text
BSS-V2-004-01
BSS-V2-004-02
BSS-V2-004-03
BSS-V2-004-04
```

This preserves the BSS-V2-004 historical namespace while making each new responsibility explicit.

Ticket/regeneration work may update the Stack_Setup_V2 README and the remaining planned ticket dependencies, but it must not alter approved 001-003 review history.

---

# 10. Required decomposition strategy

The remaining ticket set must be bite-sized in review authority, not merely line count.

A good child ticket should normally own:

```text
one primary infrastructure responsibility
one clear authority/trust transition
one bounded implementation surface
one primary validation harness or evidence family
3 to 6 Review Contract rows
```

The next work must not combine:

```text
Docling production integration
D1 lifecycle composition
semantic extraction qualification
semantic reconciliation qualification
external provider economics
```

into one GO checkpoint.

## 10.1 Mandatory perception-first split

The Docling production path is split because these are independently reviewable questions:

```text
A. Can Bridge invoke a persistent Compose-private Docling Serve service safely,
   keep the exact Atlas PDF profile warm/reusable, meet the <=20-second warm
   latency gate, and produce deterministic normalizer-compatible output?

B. Can the real IDSER-003/BSS-009 D1 lifecycle use that already-qualified
   resident service and reach Atlas-accepted NormalizedDocument v1 with
   retry/replay/readiness/failure integrity?
```

Those questions must not be merged.

## 10.2 Hard stop

After the D1 perception checkpoint reaches CK PASS:

```text
STOP
```

Do not continue automatically into semantic extraction qualification.

The next semantic ticket must consume the accepted perception boundary as a predecessor and use its own frozen semantic oracle.

## 10.3 General split trigger

Split further when any of these are true:

1. a ticket owns more than one external live reasoning qualification;
2. it combines a local processor integration with an external provider qualification;
3. it requires both a new durable persistence model and a materially new worker/queue lifecycle;
4. it changes more than one major authority boundary;
5. its required evidence needs unrelated harnesses that are not one coherent behavior;
6. its Security Refactor Readiness normally needs more than four material review bindings;
7. CK would need to rediscover substantial hidden sub-contracts;
8. a likely CFC finding would require redesigning sibling behavior rather than repairing one frozen clause.

Do not force work into an old ticket number merely to avoid adding a child ticket.

---

# 11. Recommended ticket decomposition

The remaining ticket plan is now staged around the perception checkpoint.

## BSS-V2-001 - Provider capability contracts and concrete-provider decoupling

Status: **approved historical authority**.

Do not regenerate or reopen it. Its narrow interfaces, including the existing `DocumentPerceptionProvider` code-level name, are consumed as established infrastructure.

## BSS-V2-002 - Qualified route registry and deployment-profile foundation

Status: **approved historical authority**.

Do not regenerate or reopen it. The route structure may be extended additively so a route can identify `local_processor` versus `external_provider` without rewriting its reviewed history.

## BSS-V2-003 - Gemini provider adapter contracts

Status: **approved historical authority**.

Do not regenerate or reopen it. Its Gemini PDF-capable adapter surface may remain implemented, but it is not the required current perception route.

## BSS-V2-004 - Historical Gemini mega-qualification plan

The existing planned ticket and blocker artifacts are retained as historical planning/evidence.

Do not execute it as the current next ticket.

Do not mutate its old evidence into Docling or semantic PASS evidence.

Its remaining responsibilities are superseded by the following child tickets.

## BSS-V2-004-01 - Persistent local Docling perception service integration

### Outcome

Turn the successful Docling feasibility path into the production-shaped local Docker implementation: a persistent Compose-private `docling-serve` service behind the existing perception capability, without yet composing the full IDSER D1 lifecycle.

### Owns

```text
docling-serve 1.21.0 + Docling 2.132.0 + immutable image/runtime identity
dedicated persistent Compose-private Docling service
local compute engine with bounded explicit conversion concurrency
CPU-only first qualification profile with explicit thread count
models/artifacts local before normal work
service health + model/profile warm readiness before route admission
exact Atlas Standard PDF option profile: OCR off, layout/tables on, unnecessary enrichments off
bounded private HTTP byte-upload invocation from Agents Bridge
BSS-009-authorized exact PDF bytes as the only source input
no DocumentStore/database/pg-boss/project authority inside Docling
deterministic mapper into the existing generic perception intermediate
page/text/heading/table preservation
stable deterministic source-unit IDs
geometry only when trustworthy
no fabricated confidence or visual metadata
service/network/timeout/cancellation/malformed-response normalization
processor/service provenance and stage/runtime metrics
every required warm fixture run <=20 seconds end to end
cold boot/model/pipeline warm-up recorded separately
existing normalizePerceptionResult(...)
unchanged parseNormalizedDocument(...)
```

### Does not own

```text
direct DocumentStore access
semantic extraction
semantic kinds
D1 project/bundle lifecycle integration
semantic-model qualification
OCR/scanned-PDF qualification
GPU/CUDA qualification
per-document Python/Docling subprocess production execution
Docling RQ/Redis or another durable queue
external provider quota/cost/privacy policy
```

### Key success condition

For the currently supported digital-PDF class:

```text
authorized PDF bytes already at Bridge
    -> ready/warm persistent private Docling service
    -> Docling conversion
    -> DoclingDocument JSON
    -> deterministic generic mapping
    -> existing normalization/parser
    -> parser-valid NormalizedDocument v1
```

with no external inference, no contract weakening, and every required warm qualification fixture run completing in <=20 seconds end to end.

## BSS-V2-004-02 - IDSER D1 Docling perception lifecycle checkpoint

### Outcome

Compose the already-qualified persistent Docling service with the approved IDSER-003 and BSS-009 lifecycle and stop at Atlas-accepted `NormalizedDocument v1`.

### Owns

```text
IDSER-003 D1 perception job consumption
pg-boss remains sole Atlas job lifecycle authority
BSS-009 source-grant redemption
verified exact PDF-byte handoff
qualified persistent Docling service route resolution
service identity/profile/readiness verification
perception worker execution through private HTTP conversion
existing deterministic mapping/normalization/parser
authenticated Atlas result handoff
Atlas-owned derived cache acceptance
duplicate delivery/idempotency
retry/replay/restart behavior
Docling service restart -> warm readiness -> safe retry
stale/conflicting completion rejection
bounded Docling/network/perception failures
Compose rebuild/readiness proof
```

### Mandatory success path

```text
create project/bundle
    -> exactly one D1 perception execution/job
    -> redeem and verify authorized source bytes
    -> qualified ready/warm private Docling service
    -> deterministic mapping/normalization/parser
    -> NormalizedDocument v1
    -> Atlas accepts one logical perception completion/cache
```

### Mandatory negatives

At minimum:

```text
expired/tampered source grant
hash/size/MIME mismatch
Docling service unavailable
Docling service not ready
service identity/profile mismatch
Docling HTTP/network/5xx failure
Docling processing failure
timeout/cancellation
malformed/incomplete Docling response
malformed mapped output
normalization/integrity failure
result-delivery outage
acknowledgement loss
duplicate queue delivery
stale/conflicting result
Bridge worker restart/replay
Docling service restart between jobs
```

None may create semantic candidates or advance semantic/reconciliation truth.

### Hard stop

CK PASS for this ticket establishes the perception checkpoint.

Do not require:

```text
semantic extraction
semantic reconciliation
Gemini
another live reasoning provider
Ready for Review
D2 sequencing
```

to close it.

## BSS-V2-004-03 - Semantic extraction live qualification

### Start gate

May be planned in detail after BSS-V2-004-02 CK PASS. It must not be used to close the perception checkpoint.

### Outcome

Qualify one explicit external reasoning route for bounded semantic extraction from accepted normalized source units.

### Required shape

```text
accepted NormalizedDocument v1
    -> deterministic bounded source-slot preparation
    -> product-independent semantic extraction instruction
    -> small provider-facing semantic proposal schema
    -> deterministic finalization
    -> complete atlas.semantic.extract/v1 validation
    -> frozen semantic oracle
```

The external model does not need to create system-owned IDs, evidence locator identities, source inventory bookkeeping, or other fields that deterministic code can reconstruct from source slots.

The final Atlas result still must satisfy the existing IDSER contract without weakening.

Provider/model identity is selected by explicit qualification evidence, not by this architecture context.

## BSS-V2-004-04 - Semantic reconciliation live qualification

### Start gate

Depends on BSS-V2-004-03 CK PASS.

### Outcome

Qualify an explicit reasoning route for bounded reconciliation using validated semantic candidates and the established IDSER reconciliation context.

Extraction PASS does not imply reconciliation PASS.

This ticket must have its own frozen oracle and must not broaden retrieval, truth, precedence, or publication authority.

## BSS-V2-005 - External provider quota-domain and capacity-profile foundation

Keep as a later external-provider operational ticket.

It owns real upstream quota-domain representation and provider capacity profiles.

It must not assign a fake quota domain to local Docling.

Local Docling capacity is represented separately as processor concurrency/runtime limits.

## BSS-V2-006 - Capability-aware admission and interactive protection

Preserve the existing pg-boss guarantees.

It may compose both:

```text
local processor admission/backpressure
external provider quota/capacity admission
```

while keeping them distinct.

## BSS-V2-007 - Execution telemetry and provenance ledger

Broaden the planned wording from provider-only telemetry to executor-aware telemetry.

Local Docling records:

```text
processor/version
route/qualification identity
page/request metrics
duration
retry/failure outcome
```

External provider execution additionally records tokens/provider usage/quota/cost references where applicable.

No raw source/prompt/secret material is persisted.

## BSS-V2-008 - Effective-dated external provider price profiles and shadow COGS

Provider economics only.

Do not invent token/page provider billing for local Docling.

Local infrastructure cost may be measured later through a separate product/economic decision.

## BSS-V2-009 - External-provider privacy preflight

Applies before external transmission.

Local Docling still obeys source authorization and local data-handling/redaction rules, but it does not receive fake provider training/retention classifications.

## BSS-V2-010 - Qualified fallback and route-state foundation

Fallback remains capability-compatible and qualification-bound.

A perception fallback is optional; no second perception executor is required merely to complete the current development profile.

A blocked Mistral route is not live fallback.

## BSS-V2-011 - Integrated BSS V2 checkpoint

This remains the final broader operational composition checkpoint after the perception and reasoning qualifications plus the applicable capacity/telemetry/privacy work.

It must consume predecessor PASS evidence rather than repairing predecessor defects.

It does not reopen full Initial Draft Ready-for-Review acceptance.

---

# 12. Dependency graph

The required remaining dependency shape is:

```text
BSS-V2-001  APPROVED
      |
      v
BSS-V2-002  APPROVED
      |
      +------------------------------+
      |                              |
      v                              v
BSS-V2-004-01                    BSS-V2-003  APPROVED
Docling executor                Gemini adapter availability
      |
      v
BSS-V2-004-02
D1 -> Docling -> NormalizedDocument v1
      |
      v
    STOP
      |
      v
BSS-V2-004-03
Semantic extraction qualification
      |
      v
BSS-V2-004-04
Reconciliation qualification
      |
      +------------------------------+
      |                              |
      v                              v
BSS-V2-005                    BSS-V2-007
External quota/capacity       Executor telemetry/provenance
      |                              |
      v                              v
BSS-V2-006                    BSS-V2-008
Admission/interactive         External price/shadow COGS
      |                              |
      +---------------+--------------+
                      |
                      v
                BSS-V2-009
                External privacy preflight
                      |
                      v
                BSS-V2-010
                Qualified fallback
                      |
                      v
                BSS-V2-011
                Integrated checkpoint
```

Important sequencing rules:

1. BSS-V2-004-01 depends on approved BSS-V2-001/002 and the existing BSS-009 contracts, not on Gemini.
2. BSS-V2-004-02 depends on BSS-V2-004-01 PASS plus the approved IDSER-003/BSS-009 lifecycle.
3. BSS-V2-004-03 must not begin before the explicit perception hard stop is reviewed and released.
4. BSS-V2-004-04 depends on extraction qualification but has independent acceptance.
5. External-provider economics/capacity work does not need to block the Docling perception checkpoint.
6. Dependencies must correspond to real consumed interfaces, not ticket-number ordering.

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

BSS-V2-004-01  medium
    local source/process boundary, no DocumentStore bypass, no semantic leakage

BSS-V2-004-02  medium
    execution-bound source/result handoff, replay/idempotency, no semantic advancement

BSS-V2-004-03 / 004-04  medium
    live external credential handling, bounded semantic context, secret-safe evidence, no contract weakening

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

These are bounded examples for the current plan. Ticket authors should use only the seams supported by the actual frozen scope.

### BSS-V2-001 / 002 / 003

Approved historical security bindings remain unchanged.

Do not reopen their reviewed contracts solely to rename provider terminology.

### BSS-V2-004-01 - Docling executor

```text
BOUNDARY-BSSV2-00401-SOURCE
Docling receives only source bytes already authorized and redeemed through BSS-009.

COUPLING-BSSV2-00401-DOCUMENTSTORE
Docling cannot discover or read DocumentStore paths independently.

COUPLING-BSSV2-00401-SEMANTICS
Docling mapping cannot create semantic candidates, rules, workflow steps, or truth decisions.

SEAM-BSSV2-00401-LOCAL-RUNTIME
The local processor boundary is bounded, cancellable, versioned, and unavailable failures are normalized without leaking source material.
```

### BSS-V2-004-02 - D1 perception checkpoint

```text
BOUNDARY-BSSV2-00402-EXECUTION
The D1 perception job, source grant, result handoff, and cache completion remain bound to the exact execution/document identity.

SEAM-BSSV2-00402-REPLAY
Retry, acknowledgement loss, duplicate delivery, and restart cannot create a second logical perception completion.

COUPLING-BSSV2-00402-SEMANTIC-ADVANCE
Perception success/failure cannot fabricate semantic acceptance or reconciliation state.
```

### BSS-V2-004-03 / 004-04 - external semantic qualification

```text
BOUNDARY-BSSV2-0040X-EXTERNAL
Only bounded semantic context crosses the external provider boundary.

SEAM-BSSV2-0040X-LIVE-EVIDENCE
Live evidence is secret-safe and uses approved non-confidential fixtures.

COUPLING-BSSV2-0040X-TRUTH
Model output remains an untrusted proposal; no model chooses accepted truth or publication.

COUPLING-BSSV2-0040X-SCHEMA-WEAKEN
Provider limitations cannot weaken the final Atlas semantic contracts.
```

### BSS-V2-005 / 006

```text
SEAM-BSSV2-CAPACITY-OPERATIONAL
External provider capacity and local processor resource admission remain operational infrastructure, not customer entitlement.

COUPLING-BSSV2-CAPACITY-KEY
Multiple external API keys must not be treated as automatic independent quota domains.

COUPLING-BSSV2-CAPACITY-LOCAL
Local Docling must not be assigned fake RPM/TPM/RPD or quota-domain semantics.
```

### BSS-V2-007

```text
SEAM-BSSV2-USAGE-REDACTION
Telemetry stores bounded metrics/provenance but not raw source, full prompts, provider bodies, or secrets.

BOUNDARY-BSSV2-USAGE-DB
Bridge telemetry persistence does not grant Bridge trusted Atlas write authority.
```

### BSS-V2-009

```text
SEAM-BSSV2-PRIVACY-PREFLIGHT
Required privacy compatibility is checked before external provider transmission.

COUPLING-BSSV2-PRIVACY-DOWNGRADE
No external route may silently lower privacy requirements to obtain a successful call.
```

Local Docling remains subject to source authorization and local data-handling/redaction rules rather than external provider training/retention classes.

### BSS-V2-010

```text
SEAM-BSSV2-FALLBACK-QUALIFIED
Fallback is restricted to explicitly qualified compatible routes.

COUPLING-BSSV2-AUTO-ROUTER
Truth-producing work cannot escape into arbitrary unqualified model routing.
```

---

# 21. Capability qualification rules

Qualification is executor- and capability-specific.

## 21.1 Local Docling perception

A local Docling route is not qualified merely because Python imports Docling or a spike script runs.

The production-shaped perception route must prove, for its supported document class:

```text
explicit Docling/runtime identity
bounded authorized PDF input
page preservation
major-text preservation
usable heading/section structure
usable reading order
table recovery where present
stable deterministic source-unit IDs
geometry only when trustworthy
no fabricated confidence/visual data
existing normalization compatibility
unchanged NormalizedDocument v1 validation
repeatability appropriate to deterministic processing
bounded timeout/cancellation/failure behavior
no external source transmission
```

Scanned-PDF/OCR behavior remains unqualified until separately proven.

## 21.2 External reasoning providers

Preserve the lesson from the Mistral live failure.

Provider documentation, API-key creation, model listing, dashboard quota display, or authentication alone are not qualification.

Each external reasoning capability must independently prove its live behavior.

The same model may serve extraction, reconciliation, chat, or another capability only if each required capability passes its own frozen gates.

Do not encode a rule that every capability must use one model or that every capability must use a different model.

Provider/model mapping remains a qualified deployment decision.

## 21.3 Provider-facing structured output

The external model does not need to emit every system-owned field of the final Atlas semantic result directly.

A bounded provider-facing intermediate is allowed when deterministic code owns fields such as source-slot identity, evidence locators, local/system IDs, or source-accounting reconstruction.

The mandatory rule is:

```text
provider proposal
    -> deterministic finalization
    -> complete unchanged Atlas v1 validation
```

No semantic contract weakening is permitted.

---

# 22. Execution-neutral contract preservation

BSS V2 must preserve these compatibility boundaries.

### 22.1 Document perception

```text
Immutable source bytes
      |
      v
BSS-009 authorization/redemption
      |
      v
qualified perception executor
      |
      +-- current local Docling route
      +-- future separately qualified executor
      |
      v
generic source-grounded perception result
      |
      v
existing Atlas normalization
      |
      v
NormalizedDocument v1
```

The current code-level `DocumentPerceptionProvider` interface name is retained for compatibility; it does not require a remote provider.

Optional geometry/confidence/visual data remains optional.

Do not fabricate missing optional fields.

Docling structural kinds such as heading/title/paragraph are not semantic kinds.

### 22.2 Semantic reasoning

```text
atlas.semantic.extract/v1
atlas.semantic.reconcile/v1
```

remain Atlas contracts.

Semantic work begins only after an accepted authorized `NormalizedDocument v1` exists.

Provider structured-output features may improve transport reliability but do not replace complete final Atlas-side validation.

No provider migration may weaken schema, evidence, source-accounting, or authority requirements.

### 22.3 Perception-to-semantic locator continuity

The Docling path must preserve stable normalized locators suitable for existing IDSER evidence validation:

```text
page number
locator type
locator ID
source text/table content
```

A semantic model should reference bounded source slots derived from these normalized units rather than inventing document locator identities.

---

# 23. Capacity and multi-user rules

Local processor capacity and external provider capacity are different resources.

### 23.1 Local Docling capacity

Plan for:

```text
local max concurrency
CPU/memory pressure
document/page/request bounds
processor timeout
worker/process availability
queue backpressure
```

Do not invent external quota-domain or token limits for Docling.

### 23.2 External provider capacity

Many Atlas users may share one upstream provider project/account.

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

`quota_domain_id` represents a real shared upstream provider capacity pool.

External capacity may need requests/minute, tokens/minute, requests/day, max concurrency, cooldown, and proven route/model sublimits.

Unknown limits remain explicit unknowns or conservative deployment values.

Do not invent numerical provider limits in architecture tickets.

---

# 24. Interactive protection

The ticket set must preserve a responsive Atlas UX while recognizing two different pressure sources.

Background work includes:

```text
local Docling perception
external semantic extraction
external semantic reconciliation
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

The infrastructure must support bounded local processor concurrency so perception cannot exhaust local runtime resources.

For external reasoning, it must support protected interactive capacity, priority-aware admission, separate capacity allocation, or equivalent protection so bulk background requests cannot consume all provider capacity.

Exact numeric percentages remain deployment policy.

---

# 25. Usage and economic telemetry rules

Every capability execution should be attributable to an executor route.

## 25.1 Local Docling telemetry

Record only useful operational/provenance data such as:

```text
execution ID
capability
route ID
executor kind = local_processor
processor/version
qualification version
page/request metrics where useful
retry count
latency/duration
final normalized status
bounded failure class
```

Do not invent provider tokens, quota-domain IDs, or provider price profiles.

## 25.2 External provider telemetry

External reasoning execution may additionally record:

```text
provider/model
quota domain
request/retry count
tokens/pages when reported
provider latency
price profile
actual cash cost
shadow production cost
```

The ledger is operational telemetry, not a duplicate source-document store.

## 25.3 Shadow cost

Free external provider execution must not make production AI economics invisible.

When an approved paid-equivalent profile exists, `actual_cash_cost` and `shadow_production_cost` remain distinct.

Local Docling infrastructure cost may be measured later through an explicit local infrastructure/product economics decision; do not manufacture a provider token bill for it.

## 25.4 Price changes

External provider prices are effective-dated configuration.

Historical provider usage must remain explainable against the applied price profile.

Use decimal-safe accounting types for financial amounts.

---

# 26. Privacy and local data-handling rules

External provider privacy class is route qualification metadata, not semantic skill behavior.

The conceptual external classes remain:

```text
EVALUATION
NO_TRAINING
ZDR_REQUIRED
```

Do not assume:

```text
stateless endpoint = ZDR
paid provider = ZDR
free provider = safe for confidential data
```

Before external transmission, the selected route must satisfy the required privacy class.

Local Docling perception does not transmit source bytes to an external provider, so provider training/retention classes do not apply to that route.

Local Docling still must obey:

```text
BSS-009 source authorization
bounded local input/output
ignored/local diagnostic artifact rules
source/log redaction
no unintended external network transmission
deployment filesystem/process isolation appropriate to the ticket
```

If perception later moves to a remote executor, external privacy qualification becomes mandatory for that route.

Final legal/compliance policy remains outside BSS V2 unless separately authorized.

---

# 27. Qualified fallback rules

Fallback is an execution reliability feature, not permission for arbitrary model/processor choice.

A fallback candidate must already satisfy:

```text
same Atlas capability
qualified executor identity
compatible final contract
applicable privacy/data-handling requirement
bounded input/output
required execution semantics
```

The actual selected route must always be recorded in provenance.

No second live perception executor is required merely to complete the current Docling development route.

A blocked Mistral route cannot be treated as live reasoning fallback until separately requalified.

---

# 28. Docker and local-environment discipline

`docker compose up` remains the canonical supported local stack path.

Docling production integration may use a managed local subprocess, loopback-only sidecar/container, or equivalent local execution boundary. The exact topology belongs to BSS-V2-004-01.

Whichever topology is selected must preserve:

```text
no public Docling endpoint requirement
no direct DocumentStore path discovery
bounded source/result transport
explicit processor/runtime version
timeout/cancellation
deterministic mapping
source-safe diagnostics
rebuildable derived state
```

Before classifying a failure as implementation/executor behavior, check as applicable:

```text
reviewed source actually built into image/runtime
affected container/process recreated after source/config change
expected Docling/runtime version active
environment values loaded by expected service
old process/container not still serving
migrations applied
pg-boss scenario state scoped
DocumentStore fixture state scoped
readiness state fresh
```

Use targeted rebuild/recreate.

Do not use indiscriminate `docker compose down --volumes` as routine repair.

Preserve unrelated local data and user changes.

---

# 29. Test strategy

Normal CI and ordinary ticket validation must not require live paid external inference.

Use four evidence layers.

### 29.1 Deterministic unit/contract tests

Prove:

```text
route selection
Docling mapping
schema handling
error classification
source boundary enforcement
semantic finalizer behavior where applicable
privacy preflight
quota-domain logic
cost calculation
redaction
```

with deterministic doubles/pure functions where appropriate.

### 29.2 Real local Docling integration

For BSS-V2-004-01, use real local Docling with approved non-confidential repository fixtures to prove:

```text
PDF processing
page/text/heading/table preservation
stable deterministic IDs/order
trustworthy-only geometry
existing normalizePerceptionResult(...)
unchanged parseNormalizedDocument(...)
repeatability
bounded failure behavior
no external inference
```

### 29.3 Compose perception lifecycle integration

For BSS-V2-004-02, prove:

```text
IDSER-003 D1 kickoff
BSS-009 source redemption
Docling execution
normalization
Atlas result handoff/cache
retry/replay/idempotency
restart/failure boundaries
no semantic advancement
```

with the real existing queue/authority seams.

### 29.4 Explicit live external reasoning qualification

Only tickets explicitly owning external reasoning qualification may require:

```text
real provider credential
real inference
real rate-limit/usage observation
semantic extraction fixture
reconciliation fixture when applicable
```

Live tests must be opt-in, secret-safe, and bounded.

A normal unit/Docling test must not accidentally spend provider credits.

---

# 30. Regression boundary

BSS V2 tickets run directly affected regressions, not the entire historical Atlas universe by default.

For BSS-V2-004-01, likely evidence includes:

```text
provider-capability/perception interface tests
Docling mapper tests
real local Docling fixture runs
BSS-009 normalization tests
Atlas Core perception tests
affected Bridge typechecks
```

For BSS-V2-004-02, likely evidence includes:

```text
IDSER-003 project/bundle kickoff regression
BSS-009 source grant/result handoff
perception worker/queue tests
pg-boss retry/replay/fencing
Atlas perception authority/cache tests
Compose boot/readiness
PostgreSQL role-denial checks
```

For semantic qualification tickets, use semantic worker/client/handoff and the frozen semantic-oracle harnesses relevant to that capability.

Do not automatically rerun all IDSER acceptance scenarios for every infrastructure ticket.

If an implementation changes a frozen semantic contract, `NormalizedDocument v1`, or Atlas authority instead of merely preserving it, stop and classify that as scope change.

---

# 31. Integrated checkpoint boundaries

BSS V2 now has two meaningful checkpoints.

## 31.1 Perception checkpoint - BSS-V2-004-02

This is the immediate checkpoint.

It must prove:

```text
approved generic perception interface/routing
qualified local Docling route
IDSER-003 D1 job consumption
BSS-009 source authority
unchanged NormalizedDocument v1
Atlas-owned result/cache acceptance
retry/replay/idempotency/restart correctness
bounded local processor failures
Compose/runtime freshness
restricted Bridge database authority
```

It intentionally does not prove:

```text
semantic extraction
semantic reconciliation
D2 sequencing
Ready for Review
CES
chat
publication
```

After CK PASS, stop before semantic qualification unless explicitly continued.

## 31.2 Broader BSS V2 checkpoint - BSS-V2-011

After the later semantic qualification and applicable external-provider operational tickets, BSS-V2-011 proves the full execution substrate composes.

It should establish:

```text
local Docling perception route remains qualified/healthy
semantic extraction route explicitly qualified
reconciliation route explicitly qualified
Mistral remains inactive unless separately requalified
route/profile configuration is explicit
local/external capacity controls remain distinct
interactive provider protection composes
executor telemetry/provenance composes
external provider price/shadow-cost recording composes
external privacy preflight composes
qualified fallback machinery remains bounded
Compose stack is healthy after correct rebuild/recreate
Bridge database authority remains restricted
directly affected BSS/perception/semantic regressions pass
```

It remains a composition checkpoint, not a catch-all repair ticket.

---

# 32. Handoff after BSS V2

The immediate handoff after BSS-V2-004-02 is not a full live Initial Draft acceptance set.

It is:

```text
accepted NormalizedDocument v1
    -> bounded semantic extraction qualification
    -> bounded reconciliation qualification
```

After the broader remaining BSS V2 set reaches PASS, a superseding live-provider Initial Draft acceptance set may then prove the complete functional path.

That later set may preserve the useful IDSER-011-style decomposition:

```text
01 consume qualified semantic route
02 real first-document semantic production path
03 real incremental sequencing and bounded prior context
04 integrated Ready for Review checkpoint
```

but it must consume the already-established Docling perception boundary rather than re-testing remote PDF perception as a semantic-provider requirement.

The actual reasoning provider/model must come from qualification evidence. Do not hard-code Gemini as acceptance authority merely because the adapter exists.

Do not create that later IDSER acceptance set as part of the current BSS V2 ticket regeneration unless separately requested.

---

# 33. Ticket-generation procedure for Codex

When this implementation context is supplied for remaining-ticket regeneration, Codex must perform planning work only unless separately given GO for an executable ticket.

1. Read this implementation context in full.
2. Read the current `atlas-core-architecture-checkpoint-v3.md` in full.
3. Read the current `atlas-backend-production-baseline-v2.md` in full.
4. Inspect approved BSS-V2-001/002/003 and preserve their reviewed authority.
5. Inspect the existing planned BSS-V2-004 and its blocker evidence; preserve them as history and do not treat them as current architecture authority.
6. Inspect DOCSPIKE-001 ticket/report and its actual implementation scripts as feasibility evidence, including its explicit limits.
7. Inspect BSS-009/009-01/009-02 source/perception authority.
8. Inspect IDSER-003 for the exact D1 perception kickoff seam.
9. Inspect IDSER-002/004/005/006 only enough to preserve the downstream semantic boundary and avoid prematurely entering it.
10. Inspect current provider-capability, route-registry, perception-worker, config, and Compose seams.
11. Use the current Atlas ticket/review contract conventions and Security Refactor Readiness skill.
12. Update the existing `Stack_Setup_V2/README.md` and generate/revise only the remaining planned ticket files/children required by the current plan.
13. Do not modify approved BSS-V2-001/002/003 ticket content or review history.
14. Do not implement production code during ticket regeneration.
15. Do not silently mark the historical BSS-V2-004 blocker evidence PASS.
16. Make BSS-V2-004-01 and BSS-V2-004-02 independently GO/CK/CFC/HMN friendly.
17. Freeze a hard stop after BSS-V2-004-02.
18. Do not fully freeze model-specific 004-03/004-04 acceptance details from guesses; inspect the current semantic spike evidence and exact intended provider/model at the time those tickets are generated.

If inspection reveals a genuine architecture conflict that cannot be resolved within V3/Baseline V2 authority, surface the exact planning conflict rather than inventing behavior.

---

# 34. Ticket README requirements

The existing `Stack_Setup_V2/README.md` should be updated to contain at minimum:

```text
purpose
primary architecture references
historical BSS compatibility statement
approved BSS-V2-001/002/003 preservation
IDSER continuity statement
DOCSPIKE-001 feasibility evidence and limits
scope/non-scope
Docling perception direction
external reasoning direction
security-readiness authoring rule
delivery order/dependency table
dependency graph
perception hard stop
review controls
Docker/local boot convention
broader completion boundary
later IDSER handoff
```

It must explicitly state:

```text
BSS V2 is additive.
Historical BSS checkpoints remain historical.
BSS-V2-001/002/003 remain approved.
IDSER-001 through IDSER-010 are not reopened.
Docling is the current digital-PDF perception direction, pending production-shaped qualification.
Gemini is an available reasoning adapter/candidate, not required perception authority.
Mistral remains implemented but inactive/blocked until requalified.
The immediate checkpoint ends at Atlas-accepted NormalizedDocument v1.
Semantic qualification begins afterward.
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
    replaces one hard-coded provider with another

"Make Gemini do PDF + extraction + reconciliation"
    recreates the superseded BSS-V2-004 mega-gate

"Make Docling understand workflow/rules/business facts"
    leaks semantic reasoning into the perception layer

"Let Docling read DocumentStore directly"
    bypasses BSS-009 source authority

"Give Docling RPM/TPM/RPD and token price fields"
    invents external-provider semantics for a local processor

"Change NormalizedDocument v1 to fit Docling"
    reverses the compatibility boundary

"Make security production ready"
    unbounded and not ticket-authoritative

"Implement pricing"
    confuses provider COGS telemetry with customer pricing

"Add OpenRouter fallback"
    future gateway integration is not automatically authorized

"Use a second Gemini API key for more quota"
    assumes keys equal independent quota domains

"Run all IDSER live scenarios after every BSS ticket"
    excessive and reopens frozen domain work

"Store raw source/prompt/response for observability"
    violates source-minimization boundaries

"Use TestRuntime when an external live profile is misconfigured"
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

The immediate completion boundary for the current realignment is the perception checkpoint:

```text
approved capability/routing foundation
    -> local Docling production executor
    -> IDSER-003 D1 + BSS-009 authority
    -> Atlas-accepted NormalizedDocument v1
    -> STOP
```

That checkpoint is complete only when the supported digital-PDF class, processor/runtime identity, source-locator stability, normalization, result acceptance, and retry/replay/failure behavior are proven without semantic-model dependency.

The broader BSS V2 phase later ends when the backend has also proven:

```text
semantic extraction route qualification
semantic reconciliation route qualification
Mistral retained inactive unless requalified
external quota-domain-aware capacity
capability-aware admission
interactive provider protection
executor telemetry/provenance
external provider price profiles/shadow COGS
external privacy preflight
qualified fallback foundation
Compose/runtime compatibility
existing queue/perception/semantic authority preserved
```

The phase does not automatically continue into full live Initial Draft domain acceptance.

---

# 39. Final implementation-context principle

The remaining BSS V2 work must make this transition explicit:

```text
CURRENT PROVEN FOUNDATIONS

IDSER-003 D1 kickoff
BSS-009 source/perception authority
BSS-V2 capability interfaces + route resolver
Gemini adapter available
Docling feasibility PASS_WITH_LIMITS
        |
        v

IMMEDIATE TARGET

IDSER D1
    -> BSS-009 authorized bytes
    -> local Docling
    -> deterministic generic perception
    -> unchanged NormalizedDocument v1
    -> Atlas acceptance
    -> STOP
        |
        v

LATER REASONING TARGET

accepted NormalizedDocument v1
    -> bounded source slots
    -> qualified semantic extraction route
    -> deterministic finalization
    -> existing Atlas semantic validation
    -> qualified reconciliation route
        |
        v

BROADER OPERATIONAL TARGET

external provider capacity + privacy + usage + cost + fallback
    while local perception remains a distinct local-resource concern
```

without changing what Atlas considers project truth.

The final rule for ticket generation is:

> **Build small, closed, reviewable capability checkpoints. Preserve historical authority. Let Docling do source-grounded document perception and stop at the normalized document boundary. Let external models do only separately qualified reasoning after that boundary. Make every acceptance condition explicit before GO, keep security readiness local to the ticket, and never use CK/CFC as a discovery phase for work that should have been frozen up front.**
