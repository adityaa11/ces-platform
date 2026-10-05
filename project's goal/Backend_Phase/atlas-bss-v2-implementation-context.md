# Atlas BSS V2 Implementation Context

Status: Authorized implementation context for remaining BSS V2 realignment and ticket decomposition
Phase name: Backend Stack Setup V2 Reconciliation
Ticket-set prefix: BSS-V2
Repository: adityaa11/ces-platform
Branch inspected: codex/new-atlas-backend
Reviewed branch baseline before this context revision: 3c0855e04743e06b51009a941c9f1d13d1c394ff
Encoding: UTF-8, ASCII-safe Markdown

---

## 1. Purpose

This implementation context governs the remaining additive Backend Stack Setup V2 work after the repository has approved BSS-V2-001, BSS-V2-002, BSS-V2-003, BSS-V2-004-01, and BSS-V2-004-02.

Its purpose is not to redesign Atlas domain semantics and not to rewrite approved BSS/IDSER history.

The current authority documents are:

- `atlas-core-architecture-checkpoint-v3.md`; and
- `atlas-backend-production-baseline-v2.md`.

Those documents now establish the current execution split:

```text
source-grounded document perception
    -> approved qualified local Docling route
    -> Atlas-accepted NormalizedDocument v1

semantic extraction
    -> Atlas-owned PROMPT-003-equivalent semantic profile
    -> distinct qualified Anoman gateway adapter
    -> requested gemini-2.5-flash
    -> small untrusted provider proposal
    -> deterministic Atlas finalization
    -> unchanged atlas.semantic.extract/v1 validation

semantic reconciliation
    -> separately qualified later
    -> extraction qualification does not imply reconciliation qualification
```

The perception-first milestone is already closed:

```text
BSS-V2-004-01  persistent local Docling executor        APPROVED
BSS-V2-004-02  IDSER D1 -> Docling -> NormalizedDocument v1 lifecycle  APPROVED
```

The current semantic productionization authority additionally includes:

```text
SEM-ANM-PROMPT-003
    CK-approved schema-driven extraction prompt/profile

SEM-ANM-SPIKE-004
    CK PASS for bounded live Anoman execution
    requested model: gemini-2.5-flash
    response_format: json_object
    temperature: 0
    exactly two calls
    no retry/fallback/correction/semantic repair
```

The SPIKE-004 historical runner result remains `FAIL` because the required inherited SPIKE-003 phrase oracle produced documented false negatives for written S2/S4 semantics. CK returned `PASS` and established that the provider proposals satisfy the ticket's written semantic conditions. Ticket generation must preserve both facts and must not rerun or rewrite the spike merely to make the old oracle print PASS.

The current BSS continuation therefore begins from accepted `NormalizedDocument v1` and productionizes the qualified extraction behavior. Anoman must be represented as a distinct gateway adapter; it must not be implemented by changing the direct Gemini adapter's base URL or identity.

The direct Gemini adapter remains approved BSS-V2-003 history/capability. Mistral remains implemented but inactive/blocked until separately requalified.

The remaining BSS V2 work must also preserve the production-economics substrate required for external reasoning routes, while provider/gateway quota/privacy/token-cost concepts must not be falsely imposed on local Docling execution.

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
BSS-V2-003 Direct Gemini adapter contracts       APPROVED
BSS-V2-004-01 Persistent Docling executor        APPROVED
BSS-V2-004-02 D1 Docling lifecycle checkpoint    APPROVED
```

BSS-008 remains:

```text
adapter implementation mechanics: retained
Mistral live route qualification: blocked / inactive
Mistral as permanent Atlas dependency: prohibited
```

BSS-V2-001/002/003/004-01/004-02 remain historical approved work.

In particular:

- BSS-V2-001 established narrow capability interfaces.
- BSS-V2-002 established server-controlled qualified-route resolution.
- BSS-V2-003 established the direct Gemini adapter under deterministic transport tests.
- BSS-V2-004-01 established the persistent Compose-private Docling executor and qualification profile.
- BSS-V2-004-02 established the real IDSER D1 lifecycle through Atlas-accepted `NormalizedDocument v1`.

The Docling realignment therefore no longer describes future work. Semantic tickets consume the accepted normalized-document boundary and must not requalify or reopen the completed perception milestone.

The existing superseded BSS-V2-004 Gemini mega-ticket and its blocker evidence remain historical artifacts. They must not be silently reinterpreted as PASS or rewritten to pretend the previous Gemini-first combined plan never existed.

The Anoman prompt/spike sequence is qualification evidence for the next semantic extraction productionization work. It does not alter approved BSS history and does not qualify reconciliation.

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

The important current split is:

```text
APPROVED PERCEPTION FOUNDATION

IDSER-003
    project/bundle creation
    ordered document manifest
    D1 perception execution/source grant/job

BSS-009 series
    source authorization
    byte redemption
    normalization
    Atlas-owned derived cache

BSS-V2-004-01 / 004-02
    qualified Docling execution
    accepted NormalizedDocument v1


CURRENT SEMANTIC PRODUCTIONIZATION BOUNDARY

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

The existing IDSER-011 ticket set remains Mistral-specific historical live-provider acceptance evidence and must not be silently rewritten as Anoman, Gemini, or Docling acceptance.

The next BSS extraction work consumes the existing IDSER contracts. It may change execution composition from "provider emits the complete Atlas result" to "provider emits a bounded proposal and Atlas deterministically finalizes system-owned fields," but it must not weaken or redefine the final `atlas.semantic.extract/v1` contract.

If productionization reveals an actual frozen IDSER contract defect, stop and classify it as a separate scope-change decision rather than silently changing IDSER semantics inside BSS.

---

## 5. Current repository mismatch to reconcile

The repository has moved beyond the original BSS V2 planning assumptions.

The primary concrete-provider coupling was already corrected by BSS-V2-001 and BSS-V2-002.

BSS-V2-003 added Gemini beneath those interfaces.

The remaining mismatch is now semantic-runtime composition rather than perception:

```text
current production semantic worker shape
    -> StructuredReasoningProvider
    -> provider expected to emit the full final Atlas semantic result

qualified spike shape
    -> deterministic bounded source slots
    -> PROMPT-003
    -> small Atlas Semantic V1 provider proposal
    -> proposal validation + source accounting
    -> deterministic finalization
    -> complete unchanged Atlas semantic result
```

The production code must catch up to the qualified spike architecture without importing the spike runner as production runtime.

The current required semantic seam is:

```text
existing StructuredReasoningProvider capability
    -> distinct Anoman gateway adapter
    -> requested gemini-2.5-flash
    -> provider-facing Atlas Semantic V1 proposal schema
    -> deterministic Atlas finalizer
    -> existing parseSemanticExtractionResult(...)
    -> existing staging/replay/handoff
```

Anoman is a gateway/executor identity, while `gemini-2.5-flash` is the requested model identity. These identities must not be collapsed.

PROMPT-003 is Atlas-owned semantic instruction/profile authority for this productionization step. Its generated prompt/schema/provenance/hashes are qualification references; production runtime should reproduce equivalent behavior from production-owned packages rather than reading `scripts/sem-anm-*` artifacts forever.

The following are not authorized by this realignment:

```text
semantic contract v1 rewrite
NormalizedDocument v1 rewrite
direct Docling access to DocumentStore paths
semantic interpretation inside Docling mapping
fresh per-document Python/Docling subprocess as the production route
Docling RQ/Redis or another durable queue for the current D1 lifecycle
automatic GPU/CUDA fallback
public host exposure of Docling as an Atlas requirement
implementing Anoman by mutating the direct Gemini adapter identity/base URL
permanent production imports from spike runner modules
provider-side or deterministic post-processing semantic repair
silent arbitrary gateway model routing
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

The current route is pinned to docling-serve 1.36.0 and docling-slim 2.132.0 for qualification, with an immutable deployed image/runtime identity recorded in evidence. The first qualified execution profile is CPU-only.

For the current linux/amd64 qualification route, the official image family is `quay.io/docling-project/docling-serve-cpu:v1.36.0` and the immutable platform image digest is `sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7`. The multi-architecture index digest observed for that tag is `sha256:225c8586e20d5d0fc6811a9e0e044fa602bcc4393f00389009bad42d6787b58f`. Runtime evidence must verify the installed distributions rather than infer them from the tag.

The local route records service/processor/image identity, option-profile identity, qualification identity, warm-route timing, runtime/failure metrics, and route provenance.

It does not invent provider credentials, quota domains, RPM/TPM/RPD, external privacy classes, or token pricing.

### 6.2 External semantic extraction route

```text
accepted NormalizedDocument v1
        |
        v
deterministic bounded source-unit preparation
        |
        v
production-owned PROMPT-003-equivalent compiler
        |
        +-- Atlas Semantic V1 Zod/schema descriptions
        +-- fixed cross-field semantic composition policy
        v
provider-facing extraction proposal schema
        |
        v
qualified route resolver
        |
        v
external_provider route
        |
        +-- gateway identity: anoman
        +-- requested model: gemini-2.5-flash
        +-- privacy/capacity admission as applicable
        v
Anoman StructuredReasoningProvider adapter
        |
        v
untrusted provider proposal
        |
        +-- JSON/proposal validation
        +-- exact source accounting
        v
deterministic Atlas finalizer
        |
        +-- system-owned IDs
        +-- evidence/source-inventory wiring
        +-- final Atlas envelope fields
        +-- NO semantic repair
        v
unchanged parseSemanticExtractionResult(...)
        |
        v
existing staging / replay / Atlas handoff
```

The current spike transport evidence used Anoman's OpenAI-compatible `/v1/chat/completions` endpoint with Bearer `ANOMAN_API_KEY`, `stream=false`, `temperature=0`, and `response_format={"type":"json_object"}`. Production tickets may preserve this qualified behavior while moving it behind normal production configuration and adapter boundaries.

Gateway provenance should record requested model and actual served/routed model/provider metadata when exposed. Useful Anoman-specific telemetry may be normalized from `_anoman` fields such as weighted tokens, gateway-reported cost, routing mode, provider type/region, guardrails, and cache, without leaking raw gateway response shapes into Atlas domain code.

### 6.2.1 Frozen Anoman spike execution reference

Ticket generation must understand how the reviewed qualification actually reached Anoman. This is a qualification reference, not a requirement to preserve the spike directory layout in production.

The reviewed SPIKE-004 path is:

```text
scripts/sem-anm-spike004/run.mts
    -> verifies approved predecessor reachability and exact artifact hashes
    -> loads prompt bytes from scripts/sem-anm-prompt003/generated/system-prompt.txt
    -> uses the frozen S1-S4 user payload inherited from sem-anm-spike003
    -> imports callAnoman(...) through scripts/sem-anm-spike004/anoman-client.mts
         -> thin re-export of scripts/sem-anm-spike002/anoman-client.mts
    -> POST https://api.anoman.io/v1/chat/completions
         Authorization: Bearer ANOMAN_API_KEY
         model: gemini-2.5-flash
         stream: false
         temperature: 0
         response_format: {"type":"json_object"}
         messages:
           system = exact PROMPT-003 generated prompt
           user   = exact bounded source-slot payload
    -> receives choices[0].message.content
    -> optional complete outer JSON-fence removal only
    -> JSON parse
    -> atlasProviderExtractionProposalV1Schema.parse(...)
    -> exact source accounting
    -> frozen qualification oracle
    -> no finalizer
    -> no persistence
    -> no reconciliation
    -> no third/correction call
```

The qualified prompt/schema authority currently records:

```text
PROMPT-003 system prompt SHA-256
da008b14342f9414f6c64fd2315379a82b3b7dcdc4263550d83fd795d6a82ed1

provider proposal schema SHA-256
c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b

prompt provenance SHA-256
90e9e3b6a6607dedd4c135c485dbfc9223741a6200be6bd28519d4bb7f4b5200

cross-field policy SHA-256
2f2e13a0cce0d0ad578718bb52e69d69abfbd9bb0d6dfb593ab6b010d930cb10
```

Productionization may relocate or refactor this logic, but BSS-V2-004-03-02 must prove that the production semantic profile remains equivalent to the qualified PROMPT-003 authority or surface an explicit scope change.

### 6.3 Current semantic hard stop

The next production-shaped checkpoint is:

```text
accepted NormalizedDocument v1
    -> production bounded source units
    -> production PROMPT-003-equivalent compiler
    -> production Anoman adapter
    -> validated provider proposal
    -> deterministic finalizer
    -> unchanged atlas.semantic.extract/v1 validation
    -> existing staging/replay/handoff
    -> CK PASS for the integrated production extraction route
    -> STOP before reconciliation
```

BSS-V2-004-03 must end at this extraction checkpoint.

BSS-V2-004-04 is a separate reconciliation qualification and must not be pulled into the extraction checkpoint.

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
direct-provider and gateway credentials/adapters
processor/gateway/provider/model allowlists
bounded retries
timeout/cancellation
normalized execution errors
executor provenance
external-route capacity/rate-limit enforcement
external-route usage/economic telemetry
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

### 7.4 External reasoning executor may perform

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
additional gateway integration beyond the selected Anoman extraction route
new queue technology
Redis
Kafka
Kubernetes
standalone vector database
S3/R2 migration
enterprise tenancy administration
```

Anoman is explicitly authorized only for the current semantic-extraction productionization path described here. OpenRouter or another additional gateway remains future scope unless a later explicit architecture decision changes it.

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
BSS-V2-004-01 approved history
BSS-V2-004-02 approved history
existing superseded BSS-V2-004 planned artifact
existing BSS-V2-004 blocker/evidence artifacts
SEM-ANM-PROMPT-003 approved artifacts/history
SEM-ANM-SPIKE-004 CK PASS review artifact and historical runner result
existing planned BSS-V2-005 through BSS-V2-011 artifacts until explicitly regenerated
```

The old BSS-V2-004 concept bundled Gemini perception, extraction, reconciliation, and development activation. It is no longer the executable next plan under the current V3/Baseline V2 authority.

Do not rewrite its prior blocker evidence to make the history appear as though Docling had always been selected.

The current remaining-plan mechanism preserves the BSS-V2-004 namespace while decomposing semantic extraction further:

```text
BSS-V2-004-01     APPROVED
BSS-V2-004-02     APPROVED

BSS-V2-004-03-01  Anoman structured-reasoning adapter and qualified-route seam
BSS-V2-004-03-02  PROMPT-003 production semantic extraction pipeline/finalizer
BSS-V2-004-03-03  integrated production Anoman extraction qualification

BSS-V2-004-04     independent semantic reconciliation qualification
```

Ticket/regeneration work may update the Stack_Setup_V2 README and remaining planned dependencies, but it must not alter approved 001/002/003/004-01/004-02 review history or the completed Anoman spike history.

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
Anoman gateway transport/configuration
PROMPT-003 compiler/schema/finalizer productionization
integrated live production extraction qualification
semantic reconciliation qualification
external-route economics/capacity
```

into one GO checkpoint.

## 10.1 Completed perception split

BSS-V2-004-01 and BSS-V2-004-02 already proved the independently reviewable Docling executor and D1 lifecycle questions. Do not regenerate or recombine them.

## 10.2 Mandatory extraction split

The extraction continuation is split because these are independently reviewable questions:

```text
A. Can Agents Bridge represent and invoke Anoman as a distinct bounded
   StructuredReasoningProvider route with correct identity, secret handling,
   errors, cancellation, usage, cost, and routing provenance?

B. Can production-owned code reproduce the qualified PROMPT-003 semantic
   instruction/schema behavior, prepare bounded source units, validate the
   small provider proposal, and deterministically materialize the complete
   unchanged Atlas extraction contract without semantic repair?

C. Can the actual production worker path compose A + B against accepted
   NormalizedDocument v1 and real Anoman inference while preserving existing
   staging/replay/handoff semantics?
```

These questions map to BSS-V2-004-03-01, -03-02, and -03-03 and must not be merged unless later planning evidence proves the review authority remains genuinely bounded.

## 10.3 Hard stop

After BSS-V2-004-03-03 reaches CK PASS:

```text
STOP BEFORE RECONCILIATION
```

BSS-V2-004-04 must then qualify reconciliation independently with its own prompt/schema/context/oracle authority.

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

The remaining ticket plan is now staged around semantic extraction productionization from the already-approved perception checkpoint.

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

Status: **APPROVED historical authority. Do not regenerate or reopen.**

### Outcome

Turn the successful Docling feasibility path into the production-shaped local Docker implementation: a persistent Compose-private `docling-serve` service behind the existing perception capability, without yet composing the full IDSER D1 lifecycle.

### Owns

```text
docling-serve 1.36.0 + docling-slim 2.132.0 + immutable image/runtime identity
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

Status: **APPROVED historical authority. Do not regenerate or reopen.**

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

## BSS-V2-004-03 - Semantic extraction productionization parent

This parent is a planning namespace. Do not execute it as one mega-ticket.

Authoritative predecessors:

```text
BSS-V2-004-02                         CK PASS
SEM-ANM-PROMPT-003                    CK-approved prompt/profile authority
SEM-ANM-SPIKE-004 reviewed commit     8b69d5a
SEM-ANM-SPIKE-004 CK review           PASS
```

Historical SPIKE-004 runner terminal `FAIL` remains preserved because of the documented inherited oracle false negatives. The CK review, not a rewritten runner result, is the planning authority that selects the bounded productionization direction.

### BSS-V2-004-03-01 - Anoman structured-reasoning adapter and qualified-route seam

#### Outcome

Add Anoman as a distinct production `StructuredReasoningProvider` implementation and qualified route identity without changing semantic meaning.

#### Owns

```text
ANOMAN_API_KEY server-side configuration
HTTPS base URL / OpenAI-compatible /v1/chat/completions transport
providerId / gateway identity = anoman
requested model identity = gemini-2.5-flash for the current qualified extraction route
stream=false
temperature=0
response_format=json_object
bounded timeout/cancellation
request/response size bounds
network/auth/rate-limit/provider error normalization
usage token normalization
Anoman weighted-token/cost/routing metadata normalization where available
requested vs served/routed model/provider provenance
route-registry/config/worker-main injection
deterministic adapter tests with injected transport
```

#### Must not own

```text
PROMPT-003 semantic redesign
source-slot semantics
Atlas semantic finalization
reconciliation
live production extraction activation
mutating GeminiProvider into an Anoman proxy
```

#### Hard stop

Adapter and route seam are CK-approved under deterministic tests. No live semantic claim is made by this child alone.

### BSS-V2-004-03-02 - PROMPT-003 production semantic extraction pipeline and deterministic finalizer

#### Outcome

Promote the qualified schema-driven extraction behavior into production-owned code while preserving Atlas Semantic V1 and avoiding permanent runtime dependency on spike scripts/artifacts.

#### Owns

```text
production-owned Atlas Semantic V1 extraction proposal Zod/schema
production-owned PROMPT-003-equivalent compiler
schema-derived field/kind descriptions
exact CROSS-FIELD SEMANTIC COMPOSITION policy semantics
deterministic bounded source-unit preparation from accepted NormalizedDocument v1
strict provider proposal parsing/validation
exact source accounting
deterministic finalizer
system-owned local candidate IDs
evidence/source-unit wiring
source_statement_inventory materialization
final Atlas envelope fields
unchanged parseSemanticExtractionResult(...) validation
semantic-worker extraction path composition
focused replay/handoff regression coverage
equivalence proof against the approved PROMPT-003 prompt/schema/policy artifacts
```

The finalizer may materialize only deterministic system-owned bookkeeping. It must not:

```text
change semantic kind
rewrite normalized meaning
invent business conditions
invent clarification questions
repair a semantically invalid proposal
silently discard incompatible provider meaning to force validation
```

The production implementation does not need to preserve the spike directory layout. It must preserve the qualified semantics and prove deterministic equivalence or an explicitly reviewed compatible production representation.

#### Hard stop

The production extraction pipeline is deterministically testable with an injected provider proposal, passes the unchanged final Atlas parser, and is CK-approved without a live provider call.

### BSS-V2-004-03-03 - Integrated production Anoman semantic-extraction qualification

#### Outcome

Qualify the **actual production path**, not the spike runner, for `atlas.semantic.extract`.

#### Required path

```text
Atlas-accepted NormalizedDocument v1
    -> production bounded source-unit preparation
    -> production PROMPT-003-equivalent compiler
    -> BSS-V2-004-03-01 Anoman adapter/qualified route
    -> real bounded Anoman inference
    -> provider proposal parsing/Zod validation
    -> exact source accounting
    -> deterministic finalizer
    -> unchanged atlas.semantic.extract/v1 validation
    -> existing semantic worker staging/replay/handoff
```

#### Live evidence rules

```text
opt-in and secret-safe
approved synthetic/public/non-confidential fixture material
pinned requested gemini-2.5-flash
actual served/routed identity captured where exposed
no semantic repair
no correction call
no arbitrary model fallback
bounded retries only if explicitly frozen for transport behavior; never semantic retry
normalized latency/usage/cost/routing provenance
written-contract-aligned semantic acceptance oracle
```

Do not reuse the inherited SPIKE-003 phrase matcher as unquestioned Atlas Semantics V1 authority. The production oracle must be frozen before GO and must reflect the written semantic acceptance contract. It may reuse valid parts of prior oracle logic, but it must not rewrite historical SPIKE-004 evidence.

Representative production qualification may use the bounded S1-S4 semantic set and a normalized-document fixture that exercises the real source-unit builder. Broader all-16-kind, large Safara, adversarial, or long-context coverage should be split into separately bounded robustness tickets if needed rather than making this integration ticket unreviewable.

#### Activation rule

Only CK PASS for this child may authorize the current development `atlas.semantic.extract` route to resolve to Anoman. A successful adapter test or historical spike alone does not activate production extraction.

#### Hard stop

Stop after production extraction qualification. Do not continue automatically into reconciliation.

## BSS-V2-004-04 - Independent semantic reconciliation qualification

### Start gate

Depends on BSS-V2-004-03-03 CK PASS.

### Outcome

Qualify an explicit reasoning route for bounded reconciliation using validated semantic candidates and the established IDSER reconciliation context.

Extraction PASS does not imply reconciliation PASS.

This ticket must freeze its own:

```text
bounded reconciliation context
provider-facing reconciliation schema
prompt/instruction authority
deterministic system-owned finalization where applicable
written acceptance oracle
live route identity
validation/handoff evidence
```

PROMPT-003 extraction semantics must not be assumed to describe reconciliation. The ticket may reuse the Anoman adapter if that route is selected, but adapter reuse is not semantic qualification.

It must not broaden retrieval, truth, precedence, review, or publication authority.

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

External direct-provider/gateway execution additionally records tokens, gateway/provider/model provenance, quota/cost references, and gateway-specific normalized usage metadata where applicable.

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
BSS-V2-003  APPROVED             BSS-V2-004-01  APPROVED
Direct Gemini adapter            Persistent Docling service
                                      |
                                      v
                                BSS-V2-004-02  APPROVED
                                D1 -> Docling -> NormalizedDocument v1
                                      |
                                      +----------------------+
                                      |                      |
                                      |         SEM-ANM-PROMPT-003 CK authority
                                      |         SEM-ANM-SPIKE-004 CK PASS
                                      |                      |
                                      +----------+-----------+
                                                 |
                                                 v
                                     BSS-V2-004-03-01
                                     Anoman adapter/route seam
                                                 |
                                                 v
                                     BSS-V2-004-03-02
                                     PROMPT-003 production pipeline/finalizer
                                                 |
                                                 v
                                     BSS-V2-004-03-03
                                     integrated production extraction qualification
                                                 |
                                  +--------------+--------------+
                                  |                             |
                                  v                             v
                         BSS-V2-004-04                    BSS-V2-005
                         reconciliation                   quota/capacity
                         qualification                         |
                                  |                             v
                                  |                        BSS-V2-006
                                  |                        admission/interactive
                                  |
                                  +--------------+--------------+
                                                 |
                                                 v
                                           BSS-V2-007
                                      telemetry/provenance
                                                 |
                                                 v
                                           BSS-V2-008
                                      price/shadow COGS
                                                 |
                                                 v
                                           BSS-V2-009
                                      external privacy preflight
                                                 |
                                                 v
                                           BSS-V2-010
                                      qualified fallback
                                                 |
                                                 v
                                           BSS-V2-011
                                      integrated checkpoint
```

Important sequencing rules:

1. BSS-V2-004-01 and BSS-V2-004-02 are already approved and are consumed as immutable predecessors.
2. BSS-V2-004-03-01 depends on approved capability/routing infrastructure plus the selected Anoman extraction direction; it does not depend on changing the direct Gemini adapter.
3. BSS-V2-004-03-02 depends on the PROMPT-003 qualification authority and existing IDSER semantic contracts; it may be developed against injected provider proposals.
4. BSS-V2-004-03-03 depends on both -03-01 and -03-02 CK PASS and is the first child that qualifies the real production extraction composition.
5. BSS-V2-004-04 depends on -03-03 CK PASS but has independent reconciliation acceptance.
6. BSS-V2-005 and BSS-V2-007 should depend on BSS-V2-004-03-03 PASS because that is the first production-shaped external extraction route whose capacity and telemetry they operationalize. They need not wait for reconciliation unless their frozen scope explicitly consumes it.
7. Dependencies must correspond to real consumed interfaces, not ticket-number ordering.

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

For the current extraction route, the planning choice is already resolved: gateway `anoman`, requested model `gemini-2.5-flash`, and PROMPT-003 semantic profile. GO must not reopen provider selection inside BSS-V2-004-03. Activation still requires BSS-V2-004-03-03 live production-path evidence and an explicit recorded qualification identity.

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
an unrequested second gateway
a different requested model
paid-provider migration
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

BSS-V2-004-03-01  medium
    Anoman credential/config boundary, distinct gateway identity, bounded transport, provenance/error redaction

BSS-V2-004-03-02  medium
    prompt/schema authority, source-unit boundary, no semantic repair, final contract preservation

BSS-V2-004-03-03  medium to high
    live external credential handling, bounded semantic context, secret-safe evidence, route activation gate

BSS-V2-004-04  medium to high
    independent reconciliation context/schema/oracle, secret-safe live evidence, no extraction-assumption leakage

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

### BSS-V2-004-01 - Persistent Docling service

```text
BOUNDARY-BSSV2-00401-SOURCE
Docling receives only exact source bytes already authorized and redeemed through BSS-009 and supplied by Agents Bridge.

COUPLING-BSSV2-00401-DOCUMENTSTORE
Docling cannot discover or read DocumentStore paths independently and receives no Atlas database or pg-boss credentials.

COUPLING-BSSV2-00401-SEMANTICS
Docling mapping cannot create semantic candidates, rules, workflow steps, or truth decisions.

SEAM-BSSV2-00401-PRIVATE-SERVICE
The persistent docling-serve endpoint is reachable only through the intended Compose-private service boundary in the base Atlas profile.

SEAM-BSSV2-00401-READINESS
Atlas routing cannot treat the service as ready until the pinned runtime identity, required local artifacts, and exact Atlas PDF option profile are loaded/warm.

COUPLING-BSSV2-00401-SUBPROCESS
A fresh Python/Docling process per PDF cannot be used as the normal production route or as a silent fallback.

COUPLING-BSSV2-00401-SECOND-QUEUE
The current Docling route cannot introduce RQ/Redis or another durable job authority beneath pg-boss.

SEAM-BSSV2-00401-LOCAL-RUNTIME
The service/network/processor boundary is bounded, cancellable, versioned, and unavailable/malformed failures are normalized without leaking source material.
```

### BSS-V2-004-02 - D1 perception checkpoint

```text
BOUNDARY-BSSV2-00402-EXECUTION
The D1 perception job, source grant, exact-byte Docling request, result handoff, and cache completion remain bound to the exact execution/document identity.

SEAM-BSSV2-00402-SERVICE-READINESS
A service restart, profile mismatch, or not-ready state cannot be bypassed; D1 resumes only after the qualified Docling route is ready/warm again.

SEAM-BSSV2-00402-REPLAY
Retry, acknowledgement loss, duplicate delivery, Bridge restart, and Docling service restart cannot create a second logical perception completion.

COUPLING-BSSV2-00402-SECOND-QUEUE
pg-boss remains the sole Atlas D1 job lifecycle authority; Docling task/RQ persistence is not added to this path.

COUPLING-BSSV2-00402-SEMANTIC-ADVANCE
Perception success/failure cannot fabricate semantic acceptance or reconciliation state.
```

### BSS-V2-004-03-01 - Anoman adapter/route seam

```text
BOUNDARY-BSSV2-0040301-SECRET
ANOMAN_API_KEY remains server-side and never enters route IDs, semantic payloads, logs, evidence, or client responses.

SEAM-BSSV2-0040301-IDENTITY
Gateway identity, requested model identity, and served/routed identity where available remain distinguishable and attributable.

COUPLING-BSSV2-0040301-GEMINI
The direct Gemini adapter is not repurposed into an Anoman proxy by changing only its endpoint.

COUPLING-BSSV2-0040301-ROUTING
Anoman routing cannot silently broaden the qualified model set for truth-producing work.
```

### BSS-V2-004-03-02 - PROMPT-003 production semantic pipeline

```text
BOUNDARY-BSSV2-0040302-SOURCE
Only deterministic bounded source units derived from accepted NormalizedDocument v1 enter the provider-facing semantic payload.

SEAM-BSSV2-0040302-PROMPT
Production prompt/schema/policy authority is deterministically attributable to the CK-approved PROMPT-003 semantics.

COUPLING-BSSV2-0040302-SPIKE-RUNTIME
Production execution does not depend permanently on scripts/sem-anm-* runner modules or generated spike files.

COUPLING-BSSV2-0040302-SEMANTIC-REPAIR
The finalizer cannot change provider semantic meaning to force Atlas contract validation.

COUPLING-BSSV2-0040302-SCHEMA-WEAKEN
The final Atlas semantic contract remains unchanged even though the provider-facing proposal schema is smaller.
```

### BSS-V2-004-03-03 - integrated extraction qualification

```text
BOUNDARY-BSSV2-0040303-EXTERNAL
Only the frozen bounded semantic payload crosses the Anoman boundary.

SEAM-BSSV2-0040303-LIVE-EVIDENCE
Live evidence is opt-in, secret-safe, attributable to the exact production route, and uses approved non-confidential fixtures.

SEAM-BSSV2-0040303-ACTIVATION
atlas.semantic.extract cannot activate the Anoman route merely because an adapter test or historical spike succeeded; this child must reach CK PASS.

COUPLING-BSSV2-0040303-ORACLE
Historical SPIKE-004 evidence is not rewritten to satisfy a stale phrase oracle; the production oracle is frozen separately against the written semantic contract.

COUPLING-BSSV2-0040303-TRUTH
Provider output remains an untrusted proposal; neither Anoman nor the requested model chooses accepted truth or publication.
```

### BSS-V2-004-04 - reconciliation qualification

```text
BOUNDARY-BSSV2-00404-EXTERNAL
Only the frozen bounded reconciliation context crosses the selected external route.

COUPLING-BSSV2-00404-EXTRACTION
PROMPT-003 extraction authority is not assumed to define reconciliation semantics.

SEAM-BSSV2-00404-LIVE-EVIDENCE
Live evidence is secret-safe and uses approved non-confidential fixtures.

COUPLING-BSSV2-00404-TRUTH
Reconciliation output remains an untrusted proposal; no model chooses accepted truth or publication.
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

A local Docling route is not qualified merely because Python imports Docling, a spike script runs, a container is alive, or one cached conversion is fast.

The current production-shaped perception route must prove, for its supported document class:

```text
docling-serve 1.36.0 + docling-slim 2.132.0 + immutable image/runtime identity
Compose-private persistent service topology
exact BSS-009-authorized PDF byte input
no source-store/database/queue discovery authority
models/artifacts available locally before normal work
service health + model/profile warm readiness
exact Atlas no-OCR Standard PDF option fingerprint
CPU-only first execution profile
explicit CPU thread count and local conversion concurrency
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
repeatability across sequential requests without service/process replacement
bounded service/network/timeout/cancellation/failure behavior
no per-document Docling process initialization
no Docling-owned durable queue for Atlas D1
no external source transmission
every required warm end-to-end fixture run <=20 seconds
cold boot/model/pipeline warm-up measured separately
```

The warm latency gate begins when Agents Bridge already possesses the authorized PDF bytes and ends after Docling response handling, deterministic mapping, `normalizePerceptionResult(...)`, and `parseNormalizedDocument(...)` succeed. Cold initialization may be excluded only because the route remains unavailable until it completes.

Scanned-PDF/OCR behavior remains unqualified until separately proven. GPU/CUDA is also a separate execution-profile qualification, not an automatic fallback.

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
Docling local conversion concurrency
Docling CPU thread count
CPU/memory pressure
resident service/model footprint
document/page/request bounds
processor/request timeout
service health/readiness/warm state
Bridge worker availability
pg-boss queue backpressure
```

The first CPU qualification must freeze the actual thread/concurrency profile used for the <=20-second evidence. More threads or more concurrent conversions are measured deployment changes, not free capacity.

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
docling-serve / Docling / image/runtime identity
device profile
Atlas PDF option-profile fingerprint
qualification version
service readiness state
page/request metrics where useful
Docling-reported processing/pipeline time where available
Bridge-to-Docling duration
mapping/normalization duration
total warm-route duration
retry count
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
exact-byte Bridge -> Docling request boundary
Compose-private service exposure
bounded local input/output
single-use/temporary conversion artifacts only as required by the service
ignored/local diagnostic artifact rules
source/log redaction
no unintended external network transmission
no Atlas DB/DocumentStore/pg-boss credentials in Docling
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

The current Docling production topology is frozen for BSS-V2-004-01 as a dedicated persistent Compose-private `docling-serve` service.

The current local profile must preserve:

```text
docling-serve 1.36.0
docling-slim 2.132.0
immutable deployed image/runtime identity
CPU-only first profile
local compute engine
one Uvicorn worker process unless separately justified
explicit bounded Docling conversion concurrency
explicit CPU thread count
models/artifacts local before normal work
service health + model/profile warm readiness
no required public host port
no direct DocumentStore path discovery
exact authorized byte transport from Bridge
no Atlas database/pg-boss credentials in Docling
no Docling RQ/Redis lifecycle authority
timeout/cancellation
deterministic mapping
source-safe diagnostics
rebuildable derived state
```

A fresh Python/Docling subprocess per PDF is not the current production route. A future perception topology may differ only through separate qualification against the same Atlas capability boundary.

Before classifying a failure as implementation/executor behavior, check as applicable:

```text
reviewed source actually built into image/runtime
affected Bridge/Docling service recreated after source/config change
expected docling-serve / Docling / image/runtime identity active
CPU-only device profile actually active
required local model artifacts present
exact Atlas PDF option profile warm
environment values loaded by expected service
old process/container not still serving
migrations applied
pg-boss scenario state scoped
DocumentStore fixture state scoped
health/readiness state fresh
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

For BSS-V2-004-01, use the real persistent Compose-private Docling service with approved non-confidential repository fixtures to prove:

```text
service/model/profile warm readiness
exact authorized-byte request boundary
PDF processing
page/text/heading/table preservation
stable deterministic IDs/order
trustworthy-only geometry
existing normalizePerceptionResult(...)
unchanged parseNormalizedDocument(...)
repeatability across sequential requests without service/process replacement
every required warm fixture run <=20 seconds end to end
cold service boot/model/pipeline warm-up recorded separately
bounded unavailable/not-ready/network/5xx/timeout/cancellation/malformed-response behavior
no subprocess fallback
no external inference
```

### 29.3 Compose perception lifecycle integration

For BSS-V2-004-02, prove:

```text
IDSER-003 D1 kickoff
pg-boss job authority
BSS-009 source redemption
Bridge exact-byte verification
qualified service identity/profile/readiness
persistent private Docling execution
deterministic mapping/normalization/parser
Atlas result handoff/cache
retry/replay/idempotency
Bridge restart/replay
Docling service restart -> warm readiness -> safe retry
service/network/failure boundaries
no semantic advancement
no second durable queue
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
Docling private-service HTTP adapter tests
Docling mapper tests
service health/readiness/warm-profile tests
real persistent Docling fixture runs
<=20-second warm-route timing matrix
service/network/failure classification tests
BSS-009 normalization tests
Atlas Core perception tests
affected Bridge typechecks
```

For BSS-V2-004-02, likely evidence includes:

```text
IDSER-003 project/bundle kickoff regression
BSS-009 source grant/result handoff
private Docling route identity/readiness checks
perception worker/queue tests
pg-boss retry/replay/fencing
Docling service restart/readiness recovery
no-subprocess-fallback proof
no-RQ/Redis second-queue proof
Atlas perception authority/cache tests
Compose boot/readiness
PostgreSQL role-denial checks
```

For BSS-V2-004-03-01, use deterministic Anoman adapter/config/route/error/provenance tests with injected transport and no required live call.

For BSS-V2-004-03-02, use prompt/schema equivalence tests, source-unit builder tests, proposal parser/source-accounting tests, deterministic finalizer tests, unchanged Atlas parser tests, semantic-worker tests, and directly affected replay/handoff regressions.

For BSS-V2-004-03-03, use an opt-in live production-path harness plus semantic worker/client/handoff and a frozen written-contract-aligned extraction oracle. Preserve the historical SPIKE-004 result rather than modifying it.

For BSS-V2-004-04, use reconciliation-specific context/schema/oracle and handoff evidence; do not reuse extraction acceptance as reconciliation proof.

Do not automatically rerun all IDSER acceptance scenarios for every infrastructure ticket.

If an implementation changes a frozen semantic contract, `NormalizedDocument v1`, or Atlas authority instead of merely preserving it, stop and classify that as scope change.

---

# 31. Integrated checkpoint boundaries

BSS V2 now has three meaningful checkpoints.

## 31.1 Perception checkpoint - BSS-V2-004-02

Status: **APPROVED predecessor checkpoint.** It is no longer the immediate implementation target.

It must prove:

```text
approved generic perception interface/routing
qualified persistent Compose-private Docling service
pinned service/Docling/image/runtime identity
CPU-only first profile and explicit thread/concurrency settings
models/profile warm before route readiness
<=20-second warm-route qualification already PASS
IDSER-003 D1 job consumption
pg-boss sole job lifecycle authority
BSS-009 source authority and exact-byte handoff
unchanged NormalizedDocument v1
Atlas-owned result/cache acceptance
retry/replay/idempotency/restart correctness
Docling service restart/readiness recovery
bounded local service/network/processor failures
no subprocess fallback
no second durable queue
Compose/runtime freshness
restricted Bridge/database/DocumentStore authority
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

Its CK PASS is consumed as the stable starting boundary for semantic productionization.

## 31.2 Semantic extraction checkpoint - BSS-V2-004-03-03

This is the immediate current checkpoint.

It must prove:

```text
accepted NormalizedDocument v1
production bounded source-unit preparation
production PROMPT-003-equivalent semantic profile
distinct Anoman gateway adapter
pinned requested gemini-2.5-flash
provider proposal validation
exact source accounting
deterministic finalization without semantic repair
unchanged atlas.semantic.extract/v1 parser
existing staging/replay/handoff compatibility
secret-safe live route provenance
written-contract-aligned semantic acceptance
no arbitrary model fallback
```

It intentionally does not prove:

```text
semantic reconciliation
all 16 kinds exhaustively
large Safara reliability
adversarial/long-context robustness unless separately frozen
chat
CES
publication
```

After CK PASS, stop before reconciliation unless BSS-V2-004-04 is explicitly started.

## 31.3 Broader BSS V2 checkpoint - BSS-V2-011

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

The immediate handoff after the approved BSS-V2-004-02 perception boundary is:

```text
accepted NormalizedDocument v1
    -> BSS-V2-004-03-01 Anoman adapter/route seam
    -> BSS-V2-004-03-02 PROMPT-003 production pipeline/finalizer
    -> BSS-V2-004-03-03 integrated production extraction qualification
    -> STOP
    -> BSS-V2-004-04 independent reconciliation qualification
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

For the current extraction productionization, the selected route is already evidence-backed: Anoman gateway requesting `gemini-2.5-flash` under PROMPT-003. Do not replace it with direct Gemini merely because the adapter exists, and do not generalize this extraction choice into reconciliation authority.

Do not create that later IDSER acceptance set as part of the current BSS V2 ticket regeneration unless separately requested.

---

# 33. Ticket-generation procedure for Codex

When this implementation context is supplied for remaining-ticket regeneration, Codex must perform planning work only unless separately given GO for an executable ticket.

1. Read this implementation context in full.
2. Read the current `atlas-core-architecture-checkpoint-v3.md` in full.
3. Read the current `atlas-backend-production-baseline-v2.md` in full.
4. Inspect approved BSS-V2-001/002/003/004-01/004-02 and preserve their reviewed authority.
5. Inspect the superseded BSS-V2-004 and its blocker evidence; preserve them as history and do not treat them as current architecture authority.
6. Inspect SEM-ANM-PROMPT-003 approved compiler/schema/policy artifacts and their provenance/hashes.
7. Inspect SEM-ANM-SPIKE-004 runner, Anoman client reuse, exact route configuration, committed report, and committed CK PASS review artifact.
8. Preserve the SPIKE-004 distinction: historical runner terminal FAIL under frozen inherited oracle; CK PASS because the written semantic conditions were satisfied and the oracle had documented false negatives.
9. Inspect the exact production semantic seams: provider-capabilities, route-registry, config, worker-main, semantic-worker, atlas-skills semantic prompt/output contract, and atlas-contracts semantic parsers.
10. Inspect BSS-009/009-01/009-02, IDSER-003, and approved 004-01/004-02 only as consumed perception authority; do not reopen them.
11. Inspect IDSER-002/004/005/006 and directly affected replay/handoff contracts enough to preserve the final semantic boundary.
12. Generate BSS-V2-004-03 as child tickets -03-01, -03-02, and -03-03; do not regenerate it as one mega-ticket.
13. Keep BSS-V2-004-04 independent from extraction and do not assume PROMPT-003 is its reconciliation prompt.
14. Update the existing `Stack_Setup_V2/README.md` and revise remaining planned BSS-V2-005 through -011 dependencies to match the new graph.
15. Make BSS-V2-005 and BSS-V2-007 consume BSS-V2-004-03-03 PASS as their first production external-route predecessor unless a narrower real dependency is explicitly proven.
16. Do not modify approved BSS-V2-001/002/003/004-01/004-02 ticket content or review history.
17. Do not implement production code during ticket regeneration.
18. Do not silently mark the historical BSS-V2-004 blocker evidence PASS.
19. Do not rewrite SEM-ANM-SPIKE-004 to PASS at the runner level or rerun it only to satisfy the stale inherited phrase oracle.
20. Freeze a hard stop after BSS-V2-004-03-03 before reconciliation.
21. Use the current Atlas ticket/review contract conventions and Security Refactor Readiness skill.

If inspection reveals a genuine architecture conflict that cannot be resolved within V3/Baseline V2 authority, surface the exact planning conflict rather than inventing behavior.

---

# 34. Ticket README requirements

The existing `Stack_Setup_V2/README.md` should be updated to contain at minimum:

```text
purpose
primary architecture references
historical BSS compatibility statement
approved BSS-V2-001/002/003/004-01/004-02 preservation
IDSER continuity statement
completed Docling perception boundary
SEM-ANM-PROMPT-003 authority
SEM-ANM-SPIKE-004 CK PASS plus historical runner-result distinction
scope/non-scope
Anoman extraction productionization direction
PROMPT-003 proposal/finalizer architecture
independent reconciliation direction
security-readiness authoring rule
delivery order/dependency table
dependency graph
extraction hard stop
review controls
Docker/local boot convention
broader completion boundary
later IDSER handoff
```

It must explicitly state:

```text
BSS V2 is additive.
Historical BSS checkpoints remain historical.
BSS-V2-001/002/003/004-01/004-02 remain approved.
IDSER-001 through IDSER-010 are not reopened.
Docling is the approved current digital-PDF perception route for the qualified class.
The current Docling profile is persistent Compose-private docling-serve 1.36.0 + docling-slim 2.132.0.
The first qualification profile is CPU-only, warm before routing, with <=20-second warm end-to-end fixture gates.
Agents Bridge sends exact BSS-009-authorized PDF bytes; Docling does not discover DocumentStore.
pg-boss remains the sole Atlas D1 job lifecycle authority; Docling RQ/Redis is not part of the current path.
Fresh per-document Python/Docling subprocess execution is not the production profile.
The direct Gemini adapter remains approved but is not the selected extraction route.
The current extraction productionization route is Anoman requesting pinned gemini-2.5-flash under PROMPT-003.
Anoman remains a distinct gateway adapter identity; do not disguise it as direct Gemini.
Provider output is a small untrusted semantic proposal; Atlas deterministically finalizes system-owned fields without semantic repair.
SEM-ANM-SPIKE-004 historical runner FAIL and CK PASS are both preserved.
Mistral remains implemented but inactive/blocked until requalified.
The immediate current checkpoint is BSS-V2-004-03-03 production extraction qualification.
Reconciliation begins only afterward under independent BSS-V2-004-04 authority.
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

"Point GeminiProvider at Anoman"
    collapses gateway identity, direct-provider identity, routing provenance, and qualification authority

"Make Anoman/Gemini emit the complete Atlas extraction result"
    pushes system-owned IDs/evidence/accounting into provider semantics instead of using the qualified proposal/finalizer split

"Import scripts/sem-anm-spike004/run.mts into the production worker"
    turns qualification evidence into permanent production runtime coupling

"Make Gemini do PDF + extraction + reconciliation"
    recreates the superseded BSS-V2-004 mega-gate

"Make Docling understand workflow/rules/business facts"
    leaks semantic reasoning into the perception layer

"Let Docling read DocumentStore directly"
    bypasses BSS-009 source authority

"Spawn a fresh Python/Docling process for every production PDF"
    discards the required persistent warm service model and reintroduces per-request initialization

"Expose Docling on a public host port because Bridge needs HTTP"
    confuses private Compose service networking with public service exposure

"Add Docling RQ/Redis under pg-boss"
    creates a second durable job authority for the same D1 lifecycle

"Silently switch the CPU route to CUDA/GPU to pass latency"
    changes the qualified execution profile instead of proving or separately qualifying it

"Count model/service cold start as normal per-document latency"
    mixes deployment readiness with the frozen warm-route performance gate

"Give Docling RPM/TPM/RPD and token price fields"
    invents external-provider semantics for a local processor

"Change NormalizedDocument v1 to fit Docling"
    reverses the compatibility boundary

"Make security production ready"
    unbounded and not ticket-authoritative

"Implement pricing"
    confuses provider COGS telemetry with customer pricing

"Add OpenRouter fallback"
    an additional gateway is not automatically authorized merely because Anoman is now selected for extraction

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

The perception checkpoint is already complete through BSS-V2-004-01 and BSS-V2-004-02.

The immediate completion boundary for the current realignment is now the semantic extraction checkpoint:

```text
approved capability/routing foundation
    -> approved Docling perception boundary
    -> Atlas-accepted NormalizedDocument v1
    -> BSS-V2-004-03-01 Anoman adapter/route seam
    -> BSS-V2-004-03-02 PROMPT-003 production pipeline/finalizer
    -> BSS-V2-004-03-03 integrated live production extraction qualification
    -> unchanged atlas.semantic.extract/v1
    -> existing staging/replay/handoff
    -> STOP BEFORE RECONCILIATION
```

That checkpoint is complete only when gateway/model/profile identities are explicit, provider output is validated as an untrusted proposal, deterministic finalization performs no semantic repair, the complete unchanged Atlas extraction contract validates, the real production worker path is exercised through live Anoman inference, route provenance is secret-safe and attributable, and CK approves activation of `atlas.semantic.extract`.

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
direct Gemini adapter available
BSS-V2-004-01 persistent Docling PASS
BSS-V2-004-02 D1 -> NormalizedDocument v1 PASS
SEM-ANM-PROMPT-003 CK-approved semantic profile
SEM-ANM-SPIKE-004 CK PASS with historical oracle-false-negative runner FAIL preserved
        |
        v

IMMEDIATE TARGET

accepted NormalizedDocument v1
    -> BSS-V2-004-03-01
         distinct Anoman StructuredReasoningProvider adapter/route
         requested gemini-2.5-flash
    -> BSS-V2-004-03-02
         production PROMPT-003-equivalent compiler
         bounded source units
         provider proposal validation
         deterministic finalizer
         unchanged Atlas extraction contract
    -> BSS-V2-004-03-03
         real production live extraction qualification
    -> STOP BEFORE RECONCILIATION
        |
        v

NEXT REASONING TARGET

BSS-V2-004-04
    -> independently qualified reconciliation context/schema/prompt/oracle
        |
        v

BROADER OPERATIONAL TARGET

external route capacity + privacy + usage + cost + fallback
    while local perception remains a distinct local-resource concern
```

without changing what Atlas considers project truth.

The final rule for ticket generation is:

> **Build small, closed, reviewable capability checkpoints and preserve historical authority. The Docling normalized-document boundary is already approved. Productionize semantic extraction next as three bounded responsibilities: a distinct Anoman gateway seam, a production-owned PROMPT-003 proposal/finalizer pipeline, and an integrated live production qualification. Keep provider output untrusted, keep deterministic finalization free of semantic repair, preserve the unchanged Atlas semantic contract, and stop before independently qualified reconciliation. Make every acceptance condition explicit before GO, keep security readiness local to the ticket, and never use CK/CFC as a discovery phase for work that should have been frozen up front.**
