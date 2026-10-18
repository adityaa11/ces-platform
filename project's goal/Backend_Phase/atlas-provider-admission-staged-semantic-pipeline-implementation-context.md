# Atlas Provider Admission and Staged Semantic Pipeline Implementation Context

> **SUCCESSOR PRECEDENCE NOTE (2026-10-19).** This long architecture document contains archived `IDSER-012-02` drafts and historical `semantic_ready` / direct-continuation proposals. All five `IDSER-012-02` ticket files are now `superseded`. Current narrowly authorized *planning* direction: [IDSER-012-03](tickets/Initial_Draft_Phase/IDSER-012-03-semantic-batch-planner-ghr-contract-hard-stop.md) real accepted NormDoc → GHR-body fixture/parser → Atlas read-only resolver → BSS-effective capacity fit → durable planned handoffs, **STOP before GHR, SEM intake, provider work**. `IDSER-012-01` remains approved; real GHR, activation, BSS-admitted SEM and qualified lifecycle/OPEN-A are future independently gated work. When this historical context conflicts with the 012-03 ticket or the approved SEM-CUTOVER winner, defer to those newer owners; never run its old `IDSER-012-02` task graph.


**Status:** Authorized planning context for ticket generation; no GO authorization is implied.  
**Repository:** `adityaa11/ces-platform`  
**Branch inspected:** `codex/new-atlas-backend`  
**Inspected HEAD:** `466e56427c13f0cedbeb994f7d4564e4f26f9296`  
**Encoding:** UTF-8, ASCII-safe Markdown  
**Supersedes for future ticket generation:** `atlas-staged-worker-pipeline-docling-admission-context.md` where that earlier context conflicts with this document. Historical approved tickets/evidence are not rewritten.

---

## 1. Purpose

This context freezes the next architecture decomposition before any IDSER-012 or BSS-V2-005/006 implementation begins.

The desired sequence is:

```text
IDSER-012-01
local Docling perception
    -> accepted NormalizedDocument v1
    -> STOP

BSS-V2-005
provider capacity catalogue
+ provider-dependent process/workload catalogue
+ deterministic capacity planner
    -> versioned DesiredAdmissionProfile
    -> STOP

BSS-V2-006
generic durable provider runtime authority
    -> dynamic RPM/TPM/RPD/concurrency enforcement
    -> hard interactive protection
    -> fair background admission
    -> durable reserve/dispatch/reconcile/defer
    -> STOP

IDSER-012-02
semantic extraction becomes the first production consumer
    -> bounded semantic batches
    -> BSS-V2-006 provider admission
    -> already-qualified BSS-V2-004 semantic executor
    -> one accepted document extraction result
    -> semantic_ready
    -> STOP BEFORE RECONCILIATION
```

The central design decision is:

> Do not design semantic-specific rate limiting. Establish one provider-capacity planning layer and one reusable durable runtime admission authority, then make semantic extraction the first client. Reconciliation, CES, chat, Addendum assistance, and later external-provider processes consume the same runtime pattern.

This context contains the actual intended ticket contracts. A later Codex ticket-generation pass should materialize these contracts into ticket files and run the repository `engineering-security-refactor-readiness` skill for each generated executable ticket. Ticket generation must not redesign the contracts below while adding security seams.

---

## 2. Historical authority and compatibility

The new work is additive. Do not rewrite approved history.

Preserve at minimum:

```text
BSS-006
pg-boss remains the durable background broker/runtime.

BSS-009 / BSS-009-01 / BSS-009-02
Atlas owns perception execution/source grants/result acceptance/cache.
Raw PDF bytes and DocumentStore paths do not enter ordinary queue transport.

BSS-V2-001
capability interfaces remain provider neutral.

BSS-V2-002
qualified route resolution remains server controlled.

BSS-V2-003
direct Gemini adapter remains retained history/capability.

BSS-V2-004-01
persistent private local Docling perception route is approved.

BSS-V2-004-02
real D1 -> Docling -> accepted NormalizedDocument v1 is approved and stops there.

BSS-V2-004-03-01 through -03
canonical Semantic V1 Zod, provider proposal/prompt compiler, and NormalizedDocument source-unit pipeline are approved as reached by the branch.

IDSER-001 through IDSER-010
semantic contracts, candidate/evidence persistence, reconciliation, replay, failure containment, bundle lifecycle, and card projection remain historical accepted behavior unless a new IDSER ticket explicitly amends future production sequencing.
```

The following planned work remains separate and may continue under its own contracts:

```text
BSS-V2-004-03-04
Anoman StructuredReasoningProvider adapter

BSS-V2-004-03-05
deterministic extraction finalizer / provider-neutral worker composition

BSS-V2-004-03-06
live Anoman extraction qualification
```

### 2.1 Planned BSS-V2-004-03-07 realignment

The current planned `BSS-V2-004-03-07` directly releases D1 from accepted perception into a semantic pg-boss execution. That shape would bypass the new BSS-V2-005/006 provider admission authority.

Therefore ticket generation from this context must treat the current unimplemented `BSS-V2-004-03-07` as superseded-before-implementation by IDSER-012-02. Preserve the file/history, but do not execute its old direct-continuation contract.

`BSS-V2-004-03-06` remains the live route qualification predecessor. `IDSER-012-02` becomes the production lifecycle release that consumes the qualified route through BSS-V2-006.

---

## 3. Current repository seams inspected

At the inspected HEAD:

### 3.1 Bridge worker concurrency is still shared

`apps/agents-bridge/src/worker-config.ts` exposes one:

```text
AGENTS_BRIDGE_WORKER_CONCURRENCY
```

`apps/agents-bridge/src/worker.ts` applies the same `localConcurrency` to the background semantic queue and perception queue. Local Docling capacity and external-provider background execution therefore still share one process knob.

IDSER-012-01 must separate the local perception worker concurrency from unrelated background-provider concurrency.

### 3.2 Docling Compose controls still contain the old misleading variables

Current Compose still contains:

```text
DOCLING_SERVE_WORKERS=1
DOCLING_LOCAL_CONVERSION_CONCURRENCY=1
```

while the observed Docling v1.36.0 local engine previously reported two local workers. The qualified two-worker profile must use the real local-engine controls and be re-proven rather than relying on defaults.

### 3.3 Current project creation and reconciliation still serialize bundle perception

The accepted historical shape persists all members but starts only D1 perception, then reconciliation acceptance schedules the next manifest member. This is the sequencing IDSER-012-01 intentionally amends for new staged-policy bundles.

### 3.4 Current extraction acceptance immediately continues into reconciliation

`packages/atlas-db/src/extraction-acceptance.ts` currently creates/enqueues reconciliation on accepted extraction and sets the member to `reconciling`.

IDSER-012-02 must replace that future staged continuation with a durable `semantic_ready` stop. It must not let successful staged extraction bypass that stop.

### 3.5 Current lifecycle states do not contain the new staging states

`packages/atlas-core/src/project.ts` currently has:

```text
pending
perception_queued
perceiving
extracting
reconciling
completed
needs_attention
```

The new staged lifecycle needs at least:

```text
perceived
semantic_ready
```

Both remain processing states, not truth states.

### 3.6 Current BSS-V2-005/006 are too small for the discovered responsibility

The existing planned BSS-V2-005 models quota domains/capacity profiles but does not yet own the provider-dependent process/workload catalogue or deterministic planner.

The existing planned BSS-V2-006 owns pre-call admission/interactive protection but does not yet freeze the durable backlog, multi-resource reservation accounting, fair scheduling, plan-version convergence, or runtime provider-pressure adaptation required by this design.

They must therefore be repartitioned before GO.

---

## 4. Architecture end state

```text
                        LOCAL PERCEPTION

immutable bundle manifest
        |
        v
Atlas fair local-perception backlog
        |
        | <= local permits
        v
pg-boss perception execution
        |
        v
Bridge perception worker pool
        |
        v
persistent private Docling
        |
        v
accepted NormalizedDocument v1
        |
        +------------------------------> STOP for IDSER-012-01


                    EXTERNAL PROVIDER PLANNING

Provider Capacity Catalogue
        +
Provider-dependent Process Catalogue
        +
Workload Envelope Profiles
        +
service-class / protection policy
        |
        v
BSS-V2-005 deterministic planner
        |
        v
versioned DesiredAdmissionProfile
        |
        +------------------------------> STOP for BSS-V2-005


                    EXTERNAL PROVIDER RUNTIME

DesiredAdmissionProfile
        +
durable waiting provider work
        +
per-request RequestResourceEnvelope
        +
durable quota buckets/reservations
        +
actual usage + provider pressure
        |
        v
BSS-V2-006 runtime admission authority
        |
        +-- defer / schedule wakeup
        |
        +-- reserve atomically
        |      |
        |      v
        |   pg-boss admitted execution
        |
        +-- reconcile actual usage
        +-- cooldown / temporary clamp
        +-- converge when plan version changes
        |
        +------------------------------> generic reusable infrastructure


                    FIRST CONSUMER: SEMANTICS

NormalizedDocument v1
        |
        v
deterministic bounded semantic batch plan
        |
        v
provider work per batch
        |
        v
BSS-V2-006 admission
        |
        v
qualified BSS-V2-004 semantic executor
        |
        v
batch proposal/finalization staging
        |
        v
complete document aggregation
        |
        v
one atlas.semantic.extract/v1 accepted result
        |
        v
semantic_ready
        |
        +------------------------------> STOP BEFORE RECONCILIATION
```

Later:

```text
reconciliation -> same BSS-V2-006
CES            -> same BSS-V2-006
chat           -> same BSS-V2-006
Addendum       -> same BSS-V2-006
```

No later consumer may create an independent RPM/TPM/RPD limiter unless a future architecture decision explicitly replaces the shared authority.

---

## 5. Deterministic planning versus dynamic runtime truth

The planning/runtime split is mandatory.

| BSS-V2-005 deterministic/configured | BSS-V2-006 dynamic/durable runtime |
| --- | --- |
| quota-domain identity | active plan version |
| published/fetched/operator-configured RPM | current request credits/reservations |
| published/fetched/operator-configured TPM | current token credits/reservations |
| published/fetched/operator-configured RPD | current daily consumption/reservations |
| known/conservative provider concurrency | in-flight provider calls |
| capacity source/version/effective time | waiting provider work |
| provider quota-accounting policy identity | concrete RequestResourceEnvelope for each work item |
| process service class | fair admission turn / virtual usage |
| process fairness scope | actual fit decision now |
| hard interactive protection policy | current protected-headroom consumption |
| background weight/borrowing policy | current background dominant-resource usage |
| workload envelope/profile identity | actual provider-reported usage |
| bounded request construction ceilings | reservation refund/debt |
| safety/headroom policy | 429 / Retry-After / temporary clamp |
| versioned DesiredAdmissionProfile | current effective capacity |

Rule:

```text
provider/config ceiling
        >=
planner usable/desired ceiling
        >=
runtime effective ceiling for new admissions
```

BSS-V2-006 may become more conservative than the planner from runtime evidence. It may not exceed the current planner/provider ceiling on its own.

A confirmed permanent provider-limit change updates BSS-V2-005 catalogue/planning input and publishes a new plan version. A transient provider-pressure event is handled by BSS-V2-006 without requiring an immediate planner rewrite.

---

## 6. Formal vocabulary

The implementation may choose exact TypeScript names, but the following conceptual records are frozen.

### 6.1 ProviderCapacityProfile

Represents one shared external upstream quota domain.

Minimum semantics:

```text
quotaDomainId
nonSecretProviderAccountAlias
associated qualified route IDs / capabilities

limits:
  requestsPerMinute: known | unknown | zero
  tokensPerMinute:   known | unknown | zero
  requestsPerDay:    known | unknown | zero
  maxConcurrency:    known | unknown | zero

quotaAccountingPolicyId
capacitySource:
  provider_api | provider_docs | operator_config | qualified_observation
sourceRef / sourceVersion
observedAt
effectiveFrom
profileVersion
```

A model ID, API key, or route ID alone is not automatically a quota domain. Multiple routes/models may share one configured quota domain.

Local Docling never receives a fake quota domain.

### 6.2 ProviderProcessProfile

Describes an Atlas process that can consume an external provider.

Conceptual fields:

```text
processKind / capability
serviceClass: interactive | background
fairnessScope: bundle | project | conversation | execution | configured generic key
workloadProfileId or inactive/unbound
backgroundWeight
maxBorrow policy
optional process max concurrency
interactiveProtectionPolicy
active / qualified eligibility
```

The process catalogue describes execution policy, not customer plan entitlement.

A future process may exist as inactive until a qualified route and workload profile are available.

### 6.3 WorkloadEnvelopeProfile

Describes how one process constructs and estimates a bounded provider request.

Do not store a guessed constant such as `semantic = 20k tokens` as truth.

Freeze instead:

```text
profileId/version
processKind
route/model compatibility identity
prompt/schema/compiler identity
batch-profile identity
max source/corpus bound
max request input bytes/units
output reservation policy
optional reasoning reservation policy
input token estimator identity/version
quota accounting policy identity
safety margin policy
planning RequestResourceEnvelope
```

The structural request bound is deterministic. Token count may be an estimate when no exact provider tokenizer/count endpoint exists; the estimator/version/safety margin must therefore be explicit and reviewable.

### 6.4 RequestResourceEnvelope

One concrete provider attempt consumes a multi-resource vector.

Conceptually:

```text
requestUnits
quotaTokenUnits
rpdUnits
concurrencyUnits

estimationSource/version
inputEstimate
outputReservation
reasoningReservation when relevant
safetyMargin
workloadProfileVersion
```

Do not collapse RPM/TPM/RPD/concurrency into one scalar.

Anoman `weighted_tokens` or cost-routing weight is not TPM unless documented provider evidence explicitly establishes that accounting relationship. Billing/cost weight remains separate from rate-limit resource units.

### 6.5 DesiredAdmissionProfile

Versioned BSS-V2-005 planner output for one quota domain.

Conceptually:

```text
profileId/version
quotaDomainId
providerCapacityProfileVersion
plannerVersion
effectiveFrom

usable global capacity after safety headroom
hard interactive reserve vector
background capacity vector
background process weights / optional caps
process/workload profile references
unknown/zero-capacity classifications
```

This is policy/configuration output, not current remaining quota.

### 6.6 RuntimeCapacityState

BSS-V2-006 durable operational truth for one quota domain.

Conceptually:

```text
activeDesiredProfileVersion
request-token bucket state
TPM-token bucket state
RPD day/window state
current in-flight concurrency
background sub-budget state
runtime clamps/cooldown
last refill/reconciliation time
next wakeup time
```

It is Bridge operational state and must not become Atlas business truth or product entitlement.

---

## 7. Bounded request weight: deterministic part and estimated part

Use three distinct concepts.

### 7.1 StructuralBound

Known deterministically from Atlas request construction.

For semantic extraction this eventually includes:

```text
max source units per batch
max normalized corpus bytes/chars per batch
fixed prompt/schema/compiler version
max metadata overhead
configured output ceiling/reservation rule
```

The semantic batcher is therefore also a capacity-control boundary.

A large PDF may produce many batches, but one admitted provider call remains bounded.

### 7.2 PlanningResourceEnvelope

A conservative resource vector used by BSS-V2-005 to plan capacity.

It is derived from the structural bound plus a versioned token estimator/accounting rule and safety margin.

It is not an observed average.

### 7.3 RequestResourceEnvelope

A more precise reservation for one actual built batch/request.

Example:

```text
planning envelope for semantic batch profile: <= Q tokens

actual batch A request estimate: 14,200 quota-token units
actual batch B request estimate: 9,800 quota-token units
```

Both remain within the frozen planning ceiling.

After execution, BSS-V2-006 reconciles the reservation against normalized actual provider usage when available.

Observed averages/p50/p95 may later be used to revise the workload profile, but they do not silently weaken the structural ceiling or automatically raise provider capacity.

---

## 8. BSS-V2-005 planner policy

### 8.1 Provider usable capacity

For each known limit dimension, apply the configured safety/headroom policy:

```text
usableCapacity = providerCapacity - configuredHeadroom
```

Unknown remains unknown. Zero remains structurally unavailable. Do not invent a positive capacity from an unknown value.

### 8.2 Hard interactive protection

Interactive synchronous work, especially future chat, must not wait behind a large background extraction backlog.

Therefore hard-protected interactive capacity is non-lendable to background work.

The process catalogue supplies an explicit service target/policy. The planner combines that target with the process planning envelope to derive a protected resource vector, for example:

```text
protected concurrency seats
protected RPM headroom
protected TPM headroom
protected RPD headroom
```

No production numeric target is invented in these tickets. Deployment/profile data must supply the desired service target. If the configured hard interactive target cannot fit inside the usable provider capacity, the plan is invalid and must fail closed.

Interactive work may use its reserve and may borrow otherwise-unused background capacity when global capacity permits. Background work may never borrow the hard interactive reserve.

### 8.3 Background capacity

```text
backgroundCapacity = usableGlobalCapacity - hardInteractiveReserve
```

Background processes share this capacity by configured weights and optional caps. Idle background capacity is work-conserving and borrowable by another background process unless a configured cap says otherwise.

### 8.4 Multi-resource fairness

Do not implement fixed per-process worker counts as the fairness model.

A semantic request and a reconciliation request can consume different combinations of RPM, TPM and concurrency. The runtime therefore needs weighted multi-resource fairness.

Use a discrete weighted dominant-resource-cost policy inspired by DRF:

```text
requestDominantCost = max(
  requestUnits / backgroundRPMBudget,
  quotaTokenUnits / backgroundTPMBudget,
  rpdUnits / backgroundRPDBudget,
  concurrencyUnits / backgroundConcurrencyBudget
)

laneVirtualUsage += requestDominantCost / laneWeight
```

BSS-V2-006 selects the lowest eligible lane virtual usage among backlogged background lanes whose next candidate fits current capacity.

This is an Atlas discrete admission policy inspired by DRF; do not claim mathematical equivalence to the continuous DRF allocation theorem.

Within a selected process lane, use the process-defined fairness key and a durable least-recently-admitted turn with stable ID tie-breaks.

A candidate that cannot currently fit TPM/RPM does not permanently lose its fair entitlement; the scheduler may skip it temporarily and admit another fitting candidate.

### 8.5 Concurrency / "water slide" terminology

The colloquial "water slides" are concurrency opportunities. RPM/TPM/RPD are separate rails that can prevent a slide from being used.

The planner may derive nominal concurrency allocation only from an explicit known/conservative concurrency ceiling and configured service-class policy. It must not infer a hard concurrency guarantee from RPM/TPM alone unless a separately configured/qualified latency model authorizes that calculation.

---

## 9. BSS-V2-006 durable runtime algorithm

### 9.1 One broker, two states

pg-boss remains the only durable broker.

Distinguish:

```text
waiting for provider admission
!=
admitted executable provider job
```

Bridge-owned durable provider-work state may be used to select fair candidates. Actual provider execution is enqueued into existing pg-boss execution machinery only after reservation succeeds.

No Redis, Kafka, RQ, or process-local semaphore becomes authority.

### 9.2 Durable registration and wakeup

The runtime authority must support idempotent provider-work registration with:

```text
logical work identity
process kind
quota domain
fairness key
RequestResourceEnvelope
payload/execution reference, not raw confidential prompt/body
state
```

The implementation must preserve atomic/no-lost-work behavior for background callers. A transaction-capable outbox/registration seam may use pg-boss as the durable intent/wakeup mechanism; it must not require another broker.

When waiting work cannot yet fit and no completion event will naturally wake the scheduler, schedule one deduplicated pg-boss wakeup at the earliest known capacity/cooldown boundary. Do not run a busy polling daemon.

### 9.3 Atomic admission

Per quota domain:

```text
BEGIN
  lock durable quota-domain runtime state
  load active DesiredAdmissionProfile
  apply refill/window rollover
  apply runtime clamps/cooldown
  select fair eligible work
  verify global capacity fit
  verify service-class/background sub-budget fit
  create reservation
  mark work admitted
  enqueue existing executable pg-boss job in same transaction
  update fairness state
COMMIT
```

Never:

```text
check capacity
unlock
later enqueue
```

### 9.4 Hard interactive protection

Background admission is legal only if the admission leaves the configured hard interactive reserve available across every protected resource dimension.

Interactive admission checks global effective capacity and is not queued behind background fairness. A future chat integration may fail fast only when the provider itself is genuinely unavailable/cooling down or the protected/global capacity is actually exhausted.

Do not preempt already-running external calls.

### 9.5 Plan-version change

BSS-V2-006 dynamically reads the latest effective DesiredAdmissionProfile.

If a new plan decreases capacity:

```text
running calls continue
new admissions are clamped
runtime naturally converges as reservations complete
```

If a new plan increases capacity:

```text
next admission/wakeup can consume the newly available capacity
```

Every reservation records the profile version that authorized it. Do not retroactively rewrite an old reservation as if it had been admitted under the new plan.

### 9.6 Reservation reconciliation

Before network transmission, reserve the request's resource envelope.

After normalized provider usage is available:

```text
reserved > actual
    -> return/refund unused token capacity subject to current ceiling

actual > reserved
    -> record deficit/debt
    -> reduce subsequent effective capacity until the debt clears
```

Request/RPD units count conservatively for a transmitted attempt even if the provider response is incomplete. Hidden adapter retries are prohibited; each actual outbound provider attempt must reacquire or hold an explicit reservation under the logical work/attempt identity.

### 9.7 429 / Retry-After / provider limit drift

Runtime observations may only make BSS-V2-006 more conservative than the active plan.

If the provider returns an explicit lower limit/remaining/reset observation through normalized adapter metadata, record a temporary observed clamp bounded by the plan ceiling.

If the provider returns `Retry-After`, persist a quota-domain cooldown until that boundary.

If a 429 has no usable limit metadata, enter bounded conservative cooldown/probe behavior; do not hammer the provider and do not discard waiting work.

Runtime observation must never permanently increase configured capacity.

A confirmed permanent provider-limit change belongs in BSS-V2-005 catalogue/planner input and yields a new DesiredAdmissionProfile version.

### 9.8 BSS-V2-007 boundary

BSS-V2-006 may persist only the operational usage/reservation state required for correct admission.

BSS-V2-007 remains the owner of richer historical execution usage/provenance telemetry.

Do not turn BSS-V2-006 into the final analytics/cost ledger, and do not block correct admission on BSS-V2-007 being implemented first.

---

## 10. IDSER-012-01 local perception design

The local route is intentionally independent from BSS-V2-005/006 external-provider quotas.

The final local profile remains:

```text
Atlas local perception permits     = 2
Bridge perception concurrency      = 2
Docling local conversion workers   = 2
Uvicorn workers                    = 1
```

Use the actual Docling v1.36.0 local-engine controls:

```text
DOCLING_SERVE_ENG_KIND=local
DOCLING_SERVE_ENG_LOC_NUM_WORKERS=2
UVICORN_WORKERS=1
```

Keep CPU/thread settings separately bounded.

### 10.1 Staged-bundle cutover

New staged bundles require an explicit persisted policy/version marker. Historical sequential bundles are not silently adopted.

Under saturation, project creation may validly commit:

```text
project/bundle/documents persisted
all members pending
zero perception execution
zero source grant
zero executable pg-boss perception job
```

The invariant is durable eligibility, not immediate D1 kickoff.

### 10.2 Fair local backlog

The durable manifest is the waiting backlog.

Use a monotonic admission turn, not wall-clock recency:

```text
never admitted first
then lowest last-admission turn
then stable bundle ID

inside bundle:
lowest pending manifest sequence
```

Idle capacity is borrowable. If only Project A exists, two A documents may use both local permits. When B/C appear, already-running A work is not preempted; the next free admissions go to the least-served eligible bundles.

### 10.3 JIT source grant

Only an admitted member receives:

```text
perception execution
fresh BSS-009 source grant
pg-boss perception job
perception_queued state
```

Pending work has no grant to expire.

### 10.4 Terminal boundary

Successful perception:

```text
Docling -> valid NormalizedDocument v1 -> Atlas acceptance/cache
```

then the staged member becomes `perceived` and stops. No semantic execution or provider work is created by IDSER-012-01.

---

## 11. IDSER-012-02 semantic consumer design

### 11.1 One document execution, many provider batches

Preserve one logical Atlas semantic extraction execution per document.

A large accepted `NormalizedDocument v1` may generate multiple deterministic provider batches beneath that execution:

```text
one document semantic execution
    -> batch 1 provider work
    -> batch 2 provider work
    -> ...
    -> batch N provider work
    -> complete document aggregation
    -> one atlas.semantic.extract/v1 result
```

Do not create N independent trusted document extraction results merely because there are N provider calls.

### 11.2 Deterministic batch plan

Consume the approved source-unit/prompt compiler boundary and add a deterministic batch plan with:

```text
stable batch identity
stable source-unit ordering
no source unit duplicated across batches
no eligible source unit silently omitted
bounded corpus/request size per batch
exact source map per batch
batch-plan hash/version
```

A source unit that cannot fit the supported bounded profile fails closed rather than being silently truncated.

### 11.3 Provider work per batch

For every batch:

```text
build exact prepared reasoning request
compute RequestResourceEnvelope
register provider work with BSS-V2-006
wait until admitted
execute through already-qualified StructuredReasoningProvider route
validate proposal + exact batch source accounting
run deterministic finalizer
stage batch result fragment idempotently
```

No lifecycle/provider code may branch on Anoman directly. Qualified-route composition selects the adapter.

### 11.4 Document aggregation

After all required batches complete:

```text
verify exact batch/source coverage
verify no duplicate/dangling source inventory
namespace/rekey batch-local candidate identities deterministically if required
union candidate/evidence/source inventory
canonical Semantic V1 final parse
stage/deliver one document extraction result
```

No partial candidate/evidence materialization becomes accepted Atlas state before the complete document extraction result passes the existing acceptance authority.

### 11.5 semantic_ready stop

For staged bundles, accepted extraction must:

```text
materialize candidates/evidence/index once
complete document extraction execution once
member -> semantic_ready
create zero reconciliation executions/jobs
```

`semantic_ready` is processing state, not truth precedence.

Reconciliation is a later IDSER scope and will consume the same BSS-V2-006 provider runtime plus a separate same-bundle keyed-writer rule.

---

## 12. Mature design references - guidance, not repository authority

The following external references support the engineering shape but do not override Atlas tickets/architecture:

1. Kubernetes API Priority and Fairness: nominal concurrency shares, fair queuing, lending/borrowing, and protecting important classes during overload.  
   https://kubernetes.io/docs/concepts/cluster-administration/flow-control/

2. Dominant Resource Fairness (Ghodsi et al., NSDI 2011): fair allocation when consumers use different mixtures of multiple resource types.  
   https://www.usenix.org/conference/nsdi11/dominant-resource-fairness-fair-allocation-multiple-resource-types

3. LiteLLM rate-limit/budget reservation documentation: reserve estimated request/token/cost capacity before provider execution and reconcile against actual usage afterward.  
   https://docs.litellm.ai/docs/proxy/users

4. OpenAI Cookbook parallel processor: jointly throttle request and token rates and deliberately leave capacity headroom rather than flooding the provider.  
   https://github.com/openai/openai-cookbook/blob/main/examples/api_request_parallel_processor.py

Atlas should reuse these patterns conceptually while preserving PostgreSQL + pg-boss and existing authority boundaries. Do not add Redis/Kubernetes/LiteLLM merely because the reference implementations use different infrastructure.

---

# 13. Ticket-size decision

The four top-level scopes are too large to make each a single GO/CK/CFC/HMN unit.

The repository workflow expects one clear responsibility, one bounded implementation surface, and roughly 3-6 Review Contract rows per executable ticket. A first CK review must traverse every row and one CFC pass must be capable of repairing the frozen finding set without redesign.

Therefore materialize the following decomposition.

```text
IDSER-012                         umbrella
  IDSER-012-01                   local perception umbrella
    IDSER-012-01-01              staged fair local perception admission
    IDSER-012-01-02              real two-worker Docling -> NormalizedDocument v1 composition

BSS-V2-005                       provider planning umbrella
  BSS-V2-005-01                  quota-domain/provider-capacity catalogue
  BSS-V2-005-02                  process/workload-envelope catalogue contracts
  BSS-V2-005-03                  deterministic capacity planner
  BSS-V2-005-04                  versioned DesiredAdmissionProfile publication/cutover

BSS-V2-006                       durable runtime umbrella
  BSS-V2-006-01                  durable provider-work/reservation/window foundation
  BSS-V2-006-02                  fair admission + hard interactive protection + atomic dispatch
  BSS-V2-006-03                  withdrawn; no active ticket or implementation (any successor requires fresh planning)
  BSS-V2-006-04                  integrated deterministic runtime checkpoint

IDSER-012-02                     semantic-consumer umbrella
  IDSER-012-02-01                bounded semantic batch plan + resource envelopes
  IDSER-012-02-02                provider-admitted batch execution/staging
  IDSER-012-02-03                complete document aggregation -> semantic_ready stop
```

No child may silently absorb the next child's work merely because implementation code is nearby.

---

# 14. Codex ticket-generation instructions

When generating tickets from this context:

1. Use the exact scope partition and Review Contract intent below.
2. Create/update ticket-set READMEs and dependency diagrams to match the new order.
3. Preserve all approved historical ticket text/evidence.
4. Mark the old unimplemented BSS-V2-004-03-07 direct-continuation plan as superseded before implementation; do not delete historical evidence.
5. Replace the stale IDSER-012 umbrella content with the new umbrella draft below.
6. Do not regenerate the deleted earlier IDSER-012-01 through -04 files from old context.
7. For every executable child, run `.agents/skills/engineering-security-refactor-readiness/SKILL.md` using only that child's frozen scope/dependencies, then append the generated Security Refactor Readiness section.
8. Security readiness may add seams/bindings/prohibited couplings supported by the ticket, but may not change the Review Contract, add provider/product policy, or enlarge scope.
9. Keep every new ticket `planned`. Ticket generation is not GO.
10. Use ASCII-safe Markdown and existing naming/review-batch conventions.

---

# 15. Frozen ticket drafts

The following drafts are the source content for ticket generation. Minor prose cleanup and repository-relative links are allowed. Scope, dependencies, hard stops, and Review Contract meaning are frozen.

---

## 15.1 IDSER-012 umbrella draft

### Title

`IDSER-012: Staged perception and provider-admitted semantic pipeline realignment`

### State / type

- State: `planned`
- Type: non-executable umbrella
- Review family: `IDSER-BATCH-12`

### Outcome

Amend only future staged Initial Draft execution so local perception can progress independently across bundle members, external semantic work consumes the shared BSS-V2-005/006 provider-admission substrate, and extraction stops durably before reconciliation.

Historical IDSER sequencing evidence remains historical and is not rewritten.

### Future staged flow

```text
bundle manifest
 -> IDSER-012-01 fair local perception
 -> accepted NormalizedDocument v1 / perceived
 -> IDSER-012-02 provider-admitted semantic extraction
 -> semantic_ready
 -> later reconciliation redesign
```

### Explicit historical amendment

For staged-policy bundles only, supersede the procedural rules that:

```text
project commit must immediately create D1 perception work
only D1 may be perception eligible
reconciliation acceptance schedules the next document's perception
D2/D3 must wait for prior reconciliation
```

Preserve all other source, replay, failure, candidate/evidence, review, and truth boundaries unless a generated child explicitly says otherwise.

### Children

```text
IDSER-012-01-01
IDSER-012-01-02
BSS-V2-005 children
BSS-V2-006 children
IDSER-012-02-01
IDSER-012-02-02
IDSER-012-02-03
```

No reconciliation implementation belongs to this generated set.

---

## 15.2 IDSER-012-01 umbrella draft

### Title

`IDSER-012-01: Fair bounded local Docling perception to NormalizedDocument v1`

- State: `planned`
- Type: non-executable umbrella
- Children: `IDSER-012-01-01`, `IDSER-012-01-02`

### Outcome

For explicitly staged bundles, replace reconciliation-driven next-document perception with a durable bundle-fair local admission backlog, execute at most the qualified two-worker Docling capacity, accept valid `NormalizedDocument v1` independently per document, persist `perceived`, and stop before any semantic work.

### Hard stop

```text
PDF -> local admission -> Docling -> accepted NormalizedDocument v1 -> perceived -> STOP
```

No external-provider quota/runtime infrastructure belongs to IDSER-012-01.

---

## 15.3 IDSER-012-01-01 executable draft

### Title

`IDSER-012-01-01: Staged fair local perception admission and cutover`

- State: `planned`
- Review batch: `IDSER-BATCH-12-01-01`
- Dependencies: approved BSS-006, BSS-009/01/02, BSS-V2-004-01/02, IDSER-003, IDSER-008, IDSER-010-04/05

### Outcome

Create the Atlas-owned durable staged-policy perception backlog and race-safe bundle-fair admission transaction. Staged project creation may commit with zero executable perception jobs when both local permits are occupied.

### Owned behavior

- explicit persisted staged-policy/version marker;
- staged members begin as durable pending eligibility;
- durable monotonic bundle admission turn;
- max Atlas local perception permits = 2;
- never/least-recently-served bundle fairness with stable tie-break;
- lowest pending manifest sequence inside selected bundle;
- JIT BSS-009 perception execution/grant/job only on admission;
- project creation and terminal perception events may invoke the same idempotent gate;
- legacy sequential bundles are not silently adopted.

### Non-authority

No Docling two-worker requalification, no semantic execution, no external quota domain, no provider admission, no reconciliation redesign, no Ready-for-Review change.

### Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-0120101-01 | Staged policy is explicit and legacy bundles are not silently selected. | PASS iff only staged-policy bundles enter the new gate and an incompatible active legacy scheduler cannot concurrently bypass the same local capacity authority. |
| RC-0120101-02 | Saturated staged project creation may commit with all members pending and no execution/grant/job. | PASS iff project/bundle/documents remain durable and eligible while no expiring source grant or executable job exists until a permit opens. |
| RC-0120101-03 | Admission is race-safe and globally bounded to two non-terminal perception permits. | PASS iff concurrent creation/refill cannot create a third admitted execution and capacity is computed/updated under one Atlas-owned PostgreSQL serialization seam. |
| RC-0120101-04 | Admission is durable bundle-fair with elastic borrowing. | PASS iff A(4)/B(5)/C(2) and one-bundle fixtures prove durable turns, no starvation, lowest pending sequence, and A may use both permits while alone without preemption. |
| RC-0120101-05 | Admission atomically creates execution + fresh BSS-009 grant + pg-boss job + member state. | PASS iff rollback exposes none of those effects, pending work has no grant/job, and no raw PDF/storage path enters queue/admission metadata. |

### Validation / hard stop

Use deterministic DB/queue fixtures, creation/refill races, rollback, grant-expiry negative, permission denial, and IDSER-010-04/05 regressions. Stop before changing Bridge/Docling worker concurrency or executing real multi-document Docling load.

### Security section

Codex must generate this ticket's Security Refactor Readiness from the frozen scope after materializing the draft.

---

## 15.4 IDSER-012-01-02 executable draft

### Title

`IDSER-012-01-02: Two-worker Docling perception composition and terminal NormalizedDocument v1`

- State: `planned`
- Review batch: `IDSER-BATCH-12-01-02`
- Dependencies: IDSER-012-01-01 CK `PASS`; approved BSS-V2-004-01/02

### Outcome

Compose the accepted staged admission gate with an explicit 2/2/2 local execution profile, real persistent Docling concurrency, accepted `NormalizedDocument v1`, refill/replay/failure behavior, and a durable `perceived` terminal state for this phase.

### Owned behavior

- split Bridge perception concurrency from unrelated background-provider concurrency;
- explicit Docling local engine controls with two local workers and one Uvicorn worker;
- Atlas permit / Bridge perception / Docling worker profile = 2/2/2;
- mismatch fails readiness/qualification;
- successful perception accepts exactly one valid normalized document and moves member to `perceived`;
- completion/failure releases capacity through the same gate;
- project/card lifecycle accepts `perceived` as processing without inventing a new user-facing truth state;
- no semantic work created.

### Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-0120102-01 | Effective local runtime is explicitly 2 Atlas permits / 2 Bridge perception consumers / 2 Docling local workers / 1 Uvicorn worker. | PASS iff effective Compose + live engine inspection show those values, ignored controls are removed, and mismatch fails readiness/qualification. |
| RC-0120102-02 | Real concurrent load never transmits more than two perception calls to Docling. | PASS iff two calls can be held in flight and a third remains unadmitted until a durable terminal release. |
| RC-0120102-03 | Accepted perception terminates at one parser-valid `NormalizedDocument v1` and durable `perceived`. | PASS iff success produces one accepted cache/result, card/read lifecycle remains processing, and zero semantic execution/job exists. |
| RC-0120102-04 | Restart, duplicate delivery, acknowledgement loss and terminal failure preserve once-only perception effects and refill. | PASS iff no duplicate accepted result/cache, failed bundle becomes `needs_attention`, remaining failed-bundle pending work is ineligible, and another healthy bundle may use the released permit. |
| RC-0120102-05 | The exact two-worker Docling profile remains materially deterministic and within the accepted warm-route performance boundary or raises an explicit performance decision. | PASS iff concurrent and sequential controls preserve pages/content/IDs without concurrency corruption, resource observations are recorded, and no CUDA/remote service/second broker appears. |

### Validation / hard stop

Run real warm two-concurrent repository-approved digital PDFs plus A/B/C lifecycle composition, restart/readiness/failure and inherited BSS-006/BSS-009/BSS-V2-004 regressions. Hard stop at `perceived`; no semantic scheduling.

### Security section

Codex generates ticket-local readiness after materializing the frozen draft.

---

## 15.5 BSS-V2-005 umbrella draft

### Title

`BSS-V2-005: External provider capacity catalogue and deterministic admission planning`

- State: `planned`
- Type: non-executable umbrella
- Dependencies: accepted BSS-005/006, BSS-V2-001/002; external semantic adapter/qualification may remain independently in progress

### Outcome

Create the reusable, provider-neutral planning substrate that describes real external quota domains, Atlas provider-dependent process policy, bounded workload envelopes, and a deterministic versioned DesiredAdmissionProfile. Do not perform runtime admission or provider calls.

### Children

```text
BSS-V2-005-01 provider capacity catalogue
BSS-V2-005-02 process/workload-envelope catalogue
BSS-V2-005-03 deterministic planner
BSS-V2-005-04 desired-profile publication/versioning
```

Local Docling is excluded from external-provider quota semantics.

---

## 15.6 BSS-V2-005-01 executable draft

### Title

`BSS-V2-005-01: External quota-domain and provider-capacity catalogue`

- State: `planned`
- Review batch: `BSS-V2-BATCH-05-01`
- Dependencies: BSS-V2-001/002 CK `PASS`; BSS-003 role/migration boundaries

### Outcome

Represent secret-free external upstream quota domains and versioned capacity profiles with explicit known/unknown/zero RPM, TPM, RPD and concurrency limits plus source/effective metadata and quota-accounting policy identity.

### Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00501-01 | Quota-domain identity is a server-controlled non-secret shared-capacity identity, not an API key/model synonym. | PASS iff multiple configured routes may share one domain, aliases expose no credentials, and invalid domain references fail. |
| RC-BSSV2-00501-02 | RPM/TPM/RPD/concurrency limits distinguish known positive, known zero and unknown. | PASS iff no unknown limit silently becomes positive and zero produces structural unavailability. |
| RC-BSSV2-00501-03 | Every capacity profile records source, source/version reference, observed/effective time and profile version. | PASS iff refreshed/operator-changed limits create traceable versions rather than mutating history invisibly. |
| RC-BSSV2-00501-04 | Quota accounting is versioned independently from billing/cost weighting. | PASS iff Anoman/provider weighted billing metadata cannot be treated as TPM unless an explicit accounting-policy version says so. |
| RC-BSSV2-00501-05 | Local Docling remains outside external quota-domain semantics. | PASS iff no local route needs fake RPM/TPM/RPD/provider-account metadata and existing local readiness remains valid. |

### Non-authority

No process fairness, planner allocation, runtime window counters, provider calls, product entitlement, price/cost ledger or customer allowance.

### Security section

Codex generates ticket-local readiness after materializing the frozen draft.

---

## 15.7 BSS-V2-005-02 executable draft

### Title

`BSS-V2-005-02: Provider-dependent process and bounded workload-envelope catalogue`

- State: `planned`
- Review batch: `BSS-V2-BATCH-05-02`
- Dependencies: BSS-V2-005-01 CK `PASS`; BSS-V2-001 capability contracts

### Outcome

Define reusable process-policy and workload-envelope contracts without hard-coding guessed average token weights.

### Owned behavior

- process kind/capability;
- interactive/background service class;
- generic fairness-scope identity;
- background weight/borrow/cap policy;
- hard interactive protection policy shape;
- active/inactive route/workload eligibility;
- versioned WorkloadEnvelopeProfile;
- structural bound + estimator/accounting/safety identities;
- planning and per-request RequestResourceEnvelope validation.

Semantic/reconciliation/chat/CES may be represented as process identities, but remain inactive until their route/workload integration exists.

### Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00502-01 | Process profiles express service class, fairness scope and allocation policy without customer-plan entitlement. | PASS iff planner-facing policy is execution operational metadata only and unknown process/capability fails closed. |
| RC-BSSV2-00502-02 | Workload profiles describe bounded construction and versioned estimation rather than a guessed constant average. | PASS iff structural bounds, estimator/accounting version, output reservation and safety policy are explicit and invalid/unbounded profiles cannot activate. |
| RC-BSSV2-00502-03 | RequestResourceEnvelope preserves independent request/token/day/concurrency dimensions. | PASS iff validation rejects negative/overflow/missing required resource dimensions and never collapses them to one magic scalar. |
| RC-BSSV2-00502-04 | Billing/weighted-token observations remain distinct from rate-limit resource accounting. | PASS iff no cost/weighted field affects TPM admission without explicit quota-accounting authority. |
| RC-BSSV2-00502-05 | Process/workload versions are immutable references suitable for later reservation audit. | PASS iff profile replacement creates a new identity/version and old references remain resolvable. |

### Non-authority

No provider execution, no live usage statistics, no runtime reservations, no semantic batching implementation, no final numeric production process weights.

### Security section

Codex generates ticket-local readiness after materializing the frozen draft.

---

## 15.8 BSS-V2-005-03 executable draft

### Title

`BSS-V2-005-03: Deterministic multi-resource provider capacity planner`

- State: `planned`
- Review batch: `BSS-V2-BATCH-05-03`
- Dependencies: BSS-V2-005-01 and -02 CK `PASS`

### Outcome

Implement a pure/deterministic planner that turns one quota-domain capacity profile plus active process/workload policies into a DesiredAdmissionProfile. It calculates hard interactive protection and the remaining weighted background pool but performs no runtime admission.

### Planner rules

```text
provider ceiling
 -> safety/headroom policy
 -> usable global capacity
 -> validate/derive hard interactive reserve vector
 -> background capacity = global - hard reserve
 -> normalize background lane weights/caps
 -> emit versionable deterministic desired profile
```

Hard interactive reserve is non-lendable to background work. Interactive may later borrow unused background capacity at runtime.

### Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00503-01 | Same catalogue/profile inputs produce byte-equivalent/canonically equivalent DesiredAdmissionProfile output. | PASS iff repeat planning is deterministic and independent of wall-clock/random/provider calls except explicit effective metadata. |
| RC-BSSV2-00503-02 | Planner never allocates beyond usable provider capacity in any RPM/TPM/RPD/concurrency dimension. | PASS iff boundary fixtures reject oversubscribed protection/headroom and unknown/zero dimensions fail according to policy rather than being invented. |
| RC-BSSV2-00503-03 | Hard interactive reserve is explicitly separated from background capacity. | PASS iff a saturated background plan cannot consume protected interactive resource units in the generated profile. |
| RC-BSSV2-00503-04 | Background allocation is expressed as weighted multi-resource policy/caps, not fixed FIFO or provider-specific workers. | PASS iff different workload envelopes produce different dominant-resource costs while idle background capacity remains borrowable within policy. |
| RC-BSSV2-00503-05 | Planner does not infer guaranteed concurrency from RPM/TPM alone. | PASS iff hard concurrency seats require explicit known/conservative concurrency capacity and invalid service targets fail closed. |

### Validation / hard stop

Use synthetic capacity/process/workload matrices only. Include token-heavy vs request-heavy workloads, hard chat protection, unknown/zero limits, oversubscribed protection and deterministic repeat-build tests. No network call and no runtime DB counter mutation.

### Security section

Codex generates ticket-local readiness after materializing the frozen draft.

---

## 15.9 BSS-V2-005-04 executable draft

### Title

`BSS-V2-005-04: Versioned DesiredAdmissionProfile publication and cutover`

- State: `planned`
- Review batch: `BSS-V2-BATCH-05-04`
- Dependencies: BSS-V2-005-03 CK `PASS`; BSS-003 Bridge operational persistence boundary

### Outcome

Persist/publish immutable DesiredAdmissionProfile versions as Bridge operational configuration so BSS-V2-006 can atomically resolve one active effective plan per quota domain. Changing provider limits or process policy produces a new plan version rather than rewriting active reservation history.

### Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00504-01 | Desired profiles are immutable/versioned and bind exact input profile versions plus planner version. | PASS iff old versions remain queryable and current activation references one exact version. |
| RC-BSSV2-00504-02 | Activation is atomic per quota domain and fails closed for invalid/missing referenced capacity/process/workload profiles. | PASS iff runtime readers cannot observe a partially published plan. |
| RC-BSSV2-00504-03 | Increasing/decreasing source limits or process policy produces a new plan that can become effective without rewriting in-flight work. | PASS iff deterministic transition fixtures expose old/new versions distinctly with effective times. |
| RC-BSSV2-00504-04 | Bridge operational ownership and role boundaries remain intact. | PASS iff persistence is restricted to `bridge.*` operational state and no Atlas trusted/domain tables or customer entitlements are introduced. |

### Hard stop

A new plan can be deterministically published/activated and read. No provider work is admitted or dispatched yet.

### Security section

Codex generates ticket-local readiness after materializing the frozen draft.

---

## 15.10 BSS-V2-006 umbrella draft (historical)

**Historical planning snapshot (sections 15.10–15.12):** these draft rows do not override the approved BSS-V2-006-01/02 tickets or the withdrawal of BSS-V2-006-03. Consult the current ticket set for active authority.

### Title

`BSS-V2-006: Durable fair external-provider runtime admission authority`

- State: `planned`
- Type: non-executable umbrella
- Dependencies: all BSS-V2-005 children CK `PASS`; BSS-006; BSS-V2-001/002

### Outcome

Provide one reusable Bridge-owned durable authority for external-provider work admission across semantic extraction, reconciliation, CES, chat and future capabilities. Enforce DesiredAdmissionProfile plus live reservations/provider pressure before network transmission while preserving pg-boss as the only broker.

### Children

```text
006-01 durable provider work + reservation/window foundation
006-02 fair admission + hard interactive protection + atomic dispatch
006-03 WITHDRAWN — no active ticket or implementation; 006-03A is newly planned with independent GO/CK
006-04 integrated deterministic runtime checkpoint
```

Local Docling continues to use its separate local-capacity seam.

---

## 15.11 BSS-V2-006-01 executable draft

### Title

`BSS-V2-006-01: Durable provider-work, reservation, and quota-window foundation`

- State: `planned`
- Review batch: `BSS-V2-BATCH-06-01`
- Dependencies: BSS-V2-005-04 CK `PASS`; BSS-006; BSS-003 Bridge persistence/role boundary

### Outcome

Create the Bridge-owned durable operational substrate for waiting provider work, per-attempt RequestResourceEnvelope reservations, quota-domain runtime/window state, and deduplicated wakeups. No fairness policy or real provider call is released yet.

### Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00601-01 | Provider work registration is idempotent by logical work/attempt identity and persists process/quota/fairness/resource references without raw prompt/source bodies. | PASS iff duplicate registration yields one waiting work item and prohibited content/secrets are absent. |
| RC-BSSV2-00601-02 | Quota-domain runtime state durably tracks active plan version, refill/window state, in-flight concurrency and cooldown metadata. | PASS iff restart preserves capacity state and stale/missing plan references fail closed. |
| RC-BSSV2-00601-03 | Reservation records bind work identity, attempt, RequestResourceEnvelope and authorizing DesiredAdmissionProfile version. | PASS iff one attempt cannot hold duplicate live reservations and old reservations remain attributable after a plan change. |
| RC-BSSV2-00601-04 | Waiting/admitted execution uses pg-boss only and can schedule one deduplicated future wakeup without a polling daemon. | PASS iff no Redis/second broker/process-local timer becomes durable authority and duplicate wakeup requests collapse safely. |
| RC-BSSV2-00601-05 | Operational persistence remains Bridge-owned and cannot mutate Atlas trusted state. | PASS iff role tests keep `agents_bridge` in allowed operational schemas and deny trusted Atlas writes. |

### Hard stop

Persistence and deterministic state transitions exist, but no provider transport is authorized by this child.

### Security section

Codex generates ticket-local readiness after materializing the frozen draft.

---

## 15.12 BSS-V2-006-02 executable draft

### Title

`BSS-V2-006-02: Fair multi-resource admission, interactive protection, and atomic dispatch`

- State: `planned`
- Review batch: `BSS-V2-BATCH-06-02`
- Dependencies: BSS-V2-006-01 CK `PASS`

### Outcome

Implement the per-quota-domain admission transaction that enforces hard interactive reserve, weighted dominant-resource background fairness, caller fairness keys, resource fit, atomic reservation and pg-boss executable dispatch.

### Required scheduling behavior

- background cannot consume hard interactive reserve;
- interactive checks global effective capacity and is not queued behind background fairness;
- background lane selection uses durable weighted dominant-resource virtual usage;
- within lane use durable least-recently-admitted fairness key + stable tie-break;
- temporarily unfit work may be skipped without losing eligibility;
- no preemption of active provider calls;
- admission/reservation/job enqueue is one transaction.

### Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00602-01 | No admitted work exceeds current global RPM/TPM/RPD/concurrency resource state. | PASS iff controlled boundaries deny one-more admission in each dimension and denied work never reaches executable transport. |
| RC-BSSV2-00602-02 | Background saturation preserves the complete configured hard interactive reserve. | PASS iff a large background backlog cannot consume protected request/token/day/concurrency headroom and a protected interactive fixture can still reserve when global capacity is otherwise healthy. |
| RC-BSSV2-00602-03 | Background processes receive durable weighted multi-resource fairness with work-conserving borrowing. | PASS iff request-heavy/token-heavy lane fixtures converge by weighted dominant cost, an idle lane wastes no background capacity, and no backlogged fitting lane starves. |
| RC-BSSV2-00602-04 | One process cannot monopolize its lane across fairness keys. | PASS iff A(large backlog)/B(small)/C(small) fixtures rotate durable fairness keys while allowing elastic borrowing when competitors are absent. |
| RC-BSSV2-00602-05 | Reservation + admitted state + pg-boss execution enqueue commit atomically. | PASS iff rollback exposes none, crash/retry cannot double-dispatch one attempt, and capacity is not released before durable terminal/reconcile state. |

### Hard stop

Use deterministic fake execution; do not yet claim correctness for actual provider usage reconciliation or 429/Retry-After adaptation.

### Security section

Codex generates ticket-local readiness after materializing the frozen draft.

---

## 15.13 BSS-V2-006-03 withdrawal and new 006-03A contract

The BSS-V2-006-03 executable draft, ticket, implementation, and active review artifacts were withdrawn by explicit user direction. This context supplies no reusable authority for provider-feedback, runtime-pressure, reconciliation, or plan-convergence work. The former 03A parent is traceability-only; its connected 03A-01..06 children are the prospective contracts and each needs explicit GO and independent CK. This withdrawn text gives them no authority.

---

## 15.14 BSS-V2-006-04 executable draft

### Title

`BSS-V2-006-04: Integrated durable provider-admission runtime checkpoint`

- State: `planned`
- Review batch: `BSS-V2-BATCH-06-04`
- Dependencies: BSS-V2-006-01/02 CK `PASS`; BSS-V2-006-03A-01..06 CK `PASS`

### Outcome

Prove the generic runtime as one reusable external-provider authority before semantic extraction becomes a client.

### Required deterministic scenario

At minimum, use one shared synthetic quota domain with:

```text
hard-protected interactive process
background extraction-like process with large backlog
background reconciliation-like process with heavier token envelope
multiple fairness keys/projects
bounded RPM + TPM + RPD + concurrency
```

Exercise saturation, borrowing, interactive arrival, plan decrease/increase, actual-usage under/over reservation, 429/Retry-After, restart, acknowledgement loss and deduplicated wakeup.

### Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00604-01 | All external executable transport in the harness is preceded by one durable reservation/admission decision. | PASS iff denied/deferred work never reaches fake transport and no admission bypass path exists. |
| RC-BSSV2-00604-02 | Background load cannot block a healthy protected interactive request, while idle background capacity remains work-conserving among background lanes. | PASS iff the interactive request receives protected capacity without waiting behind the background queue and background fairness/borrowing still progresses. |
| RC-BSSV2-00604-03 | Restart/replay/ack-loss preserve reservation, fairness and once-only dispatch/reconciliation effects. | PASS iff no quota double-spend/refund, duplicate executable job or stale capacity release occurs. |
| RC-BSSV2-00604-04 | Runtime dynamically converges across plan and provider-pressure changes without code/config reload of each consumer. | PASS iff profile vN -> vN+1 and temporary runtime clamp change new admissions as designed while existing work remains attributable. |
| RC-BSSV2-00604-05 | Local Docling and Atlas trusted state remain outside this external-provider authority. | PASS iff no local perception route needs quota metadata and Bridge admission tables/roles do not own Atlas truth. |

### Hard stop

After PASS, BSS-V2-006 is available as shared infrastructure. Do not implement semantic, reconciliation, CES or chat product behavior in this checkpoint.

### Security section

Codex generates ticket-local readiness after materializing the frozen draft.

---

## 15.15 IDSER-012-02 umbrella draft

### Title

`IDSER-012-02: Provider-admitted multi-batch semantic extraction to semantic_ready`

- State: `planned`
- Type: non-executable umbrella
- Dependencies: IDSER-012-01-02 CK `PASS`; all BSS-V2-005/006 children CK `PASS`; BSS-V2-004-03-04/05 CK `PASS`; BSS-V2-004-03-06 CK `PASS` with semantic qualification result `PASS`

### Outcome

Make Initial Draft semantic extraction the first production consumer of the shared provider admission runtime. One perceived document may generate one or more bounded provider batches, but Atlas accepts exactly one complete document extraction result and then stops durably at `semantic_ready` with no reconciliation job.

### Children

```text
IDSER-012-02-01 bounded semantic batch plan + RequestResourceEnvelope
IDSER-012-02-02 BSS-V2-006-admitted batch execution/staging
IDSER-012-02-03 complete document aggregation + semantic_ready stop
```

### Explicit predecessor realignment

This umbrella supersedes the unimplemented old `BSS-V2-004-03-07` direct D1 semantic continuation. Provider route qualification remains BSS-V2-004 authority; lifecycle/provider-work admission belongs here plus BSS-V2-006.

---

## 15.16 IDSER-012-02-01 executable draft

### Title

`IDSER-012-02-01: Deterministic semantic batch planning and provider resource envelopes`

- State: `planned`
- Review batch: `IDSER-BATCH-12-02-01`
- Dependencies: IDSER-012-01-02 CK `PASS`; BSS-V2-004-03-01/02/03/05 CK `PASS`; BSS-V2-005/006 contracts CK `PASS`

### Outcome

From one accepted/perceived `NormalizedDocument v1`, create one document-level semantic execution plus a deterministic complete batch plan. Build an exact provider request and RequestResourceEnvelope for each batch without making a provider call.

### Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-0120201-01 | Same NormalizedDocument/profile versions produce the same ordered batch plan, stable batch IDs and plan hash. | PASS iff repeat build is deterministic and independent of provider/runtime state. |
| RC-0120201-02 | Every eligible source unit is represented exactly once across the batch plan or the document fails closed. | PASS iff duplicate, omitted, dangling or individually-unfit source units cannot silently continue. |
| RC-0120201-03 | Every batch is bounded by the active semantic WorkloadEnvelopeProfile and prepared through the approved provider-neutral source/prompt compiler. | PASS iff no batch exceeds corpus/request structural bounds and no provider-specific lifecycle branch appears. |
| RC-0120201-04 | Each batch receives a valid RequestResourceEnvelope derived from the exact request plus versioned estimator/accounting/safety policy. | PASS iff resource vectors stay within planning ceilings and weighted billing metadata is not substituted for TPM. |
| RC-0120201-05 | No provider work, semantic result acceptance, candidate materialization or reconciliation is emitted. | PASS iff this child is pure preparation plus durable document/batch planning only. |

### Security section

Codex generates ticket-local readiness after materializing the frozen draft.

---

## 15.17 IDSER-012-02-02 executable draft

### Title

`IDSER-012-02-02: Provider-admitted semantic batch execution and staged finalization`

- State: `planned`
- Review batch: `IDSER-BATCH-12-02-02`
- Dependencies: IDSER-012-02-01 CK `PASS`; BSS-V2-006-04 CK `PASS`; BSS-V2-004-03-06 CK `PASS` with qualification `PASS`

### Outcome

Register every semantic batch as external provider work, let BSS-V2-006 decide admission, execute only admitted batches through the already-qualified provider-neutral extraction path, and stage validated batch fragments without yet accepting a document result.

### Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-0120202-01 | Every semantic batch becomes one idempotent provider-work item bound to the document execution, batch ID, quota domain, fairness key and RequestResourceEnvelope. | PASS iff retries/restart cannot create duplicate logical batch work and no raw provider secret/source body enters admission metadata. |
| RC-0120202-02 | No batch reaches StructuredReasoningProvider transport without BSS-V2-006 admission/reservation. | PASS iff capacity-denied/deferred batches remain waiting and transport count is zero until admitted. |
| RC-0120202-03 | Admitted batches use the existing qualified route/provider-neutral worker and preserve proposal validation, exact source accounting and deterministic finalizer semantics. | PASS iff worker/lifecycle code does not inspect Anoman identity and invalid provider output cannot become a staged fragment. |
| RC-0120202-04 | Batch staging is idempotent/fenced and does not materialize Atlas document candidates/evidence yet. | PASS iff duplicate/ack-loss execution yields one staged fragment per batch and Atlas trusted extraction state remains unchanged until complete aggregation. |
| RC-0120202-05 | Terminal batch failure contains the document semantic execution and releases provider capacity correctly. | PASS iff failed work cannot falsely mark another batch/document complete, reservation is reconciled/terminal, and no reconciliation work is emitted. |

### Security section

Codex generates ticket-local readiness after materializing the frozen draft.

---

## 15.18 IDSER-012-02-03 executable draft

### Title

`IDSER-012-02-03: Complete semantic document aggregation and semantic_ready stop`

- State: `planned`
- Review batch: `IDSER-BATCH-12-02-03`
- Dependencies: IDSER-012-02-02 CK `PASS`

### Outcome

When every required semantic batch for one document has a valid staged fragment, deterministically aggregate those fragments into one canonical `atlas.semantic.extract/v1` result, deliver through the existing Atlas acceptance authority, materialize candidate/evidence/index once, mark the staged member `semantic_ready`, and stop before reconciliation.

### Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-0120203-01 | Aggregation requires complete exact batch/source coverage for the frozen batch plan. | PASS iff missing, duplicate, foreign or stale-plan fragments fail closed and no partial document acceptance occurs. |
| RC-0120203-02 | Batch-local identities/evidence combine deterministically into one canonical Semantic V1 result without semantic repair. | PASS iff repeated aggregation is stable, all candidates/evidence remain source-grounded, and provider meaning is not rewritten to make validation pass. |
| RC-0120203-03 | Existing extraction acceptance materializes candidates/evidence/index exactly once from the one complete document result. | PASS iff replay/ack-loss cannot duplicate candidate/evidence/index effects and cross-document/bundle scope checks remain intact. |
| RC-0120203-04 | Successful staged extraction terminates at durable `semantic_ready`; zero reconciliation execution/job is emitted. | PASS iff `semantic_ready` is accepted by Core/DB/read projection as processing and current extraction acceptance no longer auto-enqueues reconciliation for staged bundles. |
| RC-0120203-05 | Multi-document/multi-bundle composition preserves independent perception and provider-admitted extraction. | PASS iff later documents can reach perceived/extracting/semantic_ready without waiting for prior reconciliation and provider fairness/capacity remains owned by BSS-V2-006. |

### Hard stop

Stop before reconciliation selection, keyed writer, relationship-direction redesign, bundle completion/Ready-for-Review changes, CES or chat integration.

### Security section

Codex generates ticket-local readiness after materializing the frozen draft.

---

# 16. README/dependency updates required during ticket generation

Ticket generation must update the Initial Draft and Stack Setup V2 READMEs to represent the actual dependency graph.

Recommended high-level graph:

```text
                     +---------------------+
                     | IDSER-012-01-01     |
                     +----------+----------+
                                |
                                v
                     +---------------------+
                     | IDSER-012-01-02     |
                     +----------+----------+
                                |
                                | perceived NormalizedDocument v1
                                |
                                +-------------------------------+
                                                                |
BSS-V2-005-01 -> 005-02 -> 005-03 -> 005-04                    |
                                      |                         |
                                      v                         |
BSS-V2-006-01 -> 006-02 -> 006-03A (planned) -> 006-04                    |
                                      |                         |
                                      +-------------------------+
                                                                |
BSS-V2-004-03-04 -> 03-05 -> 03-06 qualification PASS         |
                                      |                         |
                                      +-------------------------+
                                                                v
                                                    IDSER-012-02-01
                                                            |
                                                            v
                                                    IDSER-012-02-02
                                                            |
                                                            v
                                                    IDSER-012-02-03
                                                            |
                                                            v
                                                      semantic_ready
                                                            |
                                                           STOP
```

`BSS-V2-004-03-07` old direct-continuation plan is superseded before implementation and must not remain shown as an executable predecessor that bypasses BSS-V2-006.

BSS-V2-007 and later BSS tickets may consume the new admission/provenance seams later; they are not pulled into this implementation context unless their dependencies need mechanical README realignment.

---

# 17. Required evidence discipline

For every generated executable child:

```text
GO
  -> derive every Review Contract row before coding
  -> run ticket-required harnesses
  -> create compact Review Contract Closure ledger
  -> Internal readiness: READY_FOR_CK
  -> awaiting_review

CK
  -> review every row in one consolidated pass
  -> freeze complete findings/oracles

CFC
  -> one bounded remediation pass for frozen in-scope clauses only

HMN
  -> only after workflow returns to human/planning authority
  -> cannot change this ticket's acceptance requirements
```

This decomposition intentionally keeps each executable child within one primary implementation/evidence family so one CFC pass is realistic.

---

# 18. Explicit non-goals for this context

Do not implement in this ticket-generation set:

```text
reconciliation ready-order/keyed writer
relationship-direction redesign
full BSS-V2-004-04 reconciliation qualification
CES provider integration
chat provider integration
Addendum provider integration
customer subscription/plan entitlement
customer usage allowance
billing/pricing/COGS
BSS-V2-007 historical telemetry ledger beyond runtime-minimum reservation state
privacy/legal/residency baseline
fallback routing policy
multi-host distributed Docling scheduling
GPU/OCR perception profile
Redis/Kafka/RQ/Kubernetes
Master/publication/review decisions
```

Future consumers must reuse BSS-V2-006 rather than creating local provider-rate-limit mechanisms.

---

# 19. Final implementation target after this context's generated tickets

```text
Project A uploads many PDFs
Project B uploads a few PDFs
Project C uploads a few PDFs

LOCAL PERCEPTION
  -> two Docling slots
  -> bundle-fair turns
  -> idle borrowing
  -> each success stops at perceived/NormalizedDocument v1

EXTERNAL SEMANTICS
  -> each perceived document creates deterministic bounded semantic batches
  -> batches become durable provider work
  -> background semantic work cannot consume hard future-chat headroom
  -> multiple projects share extraction capacity fairly
  -> RPM/TPM/RPD/concurrency are reserved before provider calls
  -> provider pressure can clamp runtime without losing work
  -> planner profile changes dynamically alter future admissions
  -> actual usage reconciles reservations
  -> all document batches aggregate once
  -> one accepted semantic extraction result
  -> semantic_ready
  -> no reconciliation job
```

The reusable operational invariant is:

> Any future external-provider process supplies a process/workload profile plus RequestResourceEnvelope and consumes the same BSS-V2-006 authority. It does not implement its own provider quota scheduler.

---

# 20. Hard stop for the planning pass

This document authorizes ticket generation only.

Codex may materialize the frozen ticket drafts, update READMEs/dependencies, mark the unimplemented old BSS-V2-004-03-07 plan superseded, and generate ticket-local Security Refactor Readiness sections.

It must then stop.

No production implementation begins until the user explicitly invokes GO for one dependency-ready executable child.


---

# 21. Post-generation CK-readiness amendments

**Authority:** this section was added after reviewing the generated ticket set at branch HEAD `d2f35e60e9bbf1e3c352d168e10d751acdb50d24`. Where it conflicts with the earlier frozen drafts in §§13-16, this section and the patched ticket files are authoritative. Planning only; no GO is granted.

## 21.1 Provider limit windows are first-class planning inputs

A numeric limit without enforcement/reset semantics is incomplete. BSS-V2-005-01 versions the per-dimension quota-window/refill policy together with RPM/TPM/RPD capacity. Fixed-window, rolling-window, token-bucket/refill, provider-reset-observation, or daily-calendar semantics may be supported, but policy identity and required parameters are explicit. Concurrency is instantaneous rather than a refill window.

Unknown reset semantics remain unknown and must not become optimistic refill behavior. An explicitly configured conservative fallback is allowed only as separately versioned/provenanced planner input. BSS-V2-006 derives runtime window state only from the active profile's exact window-policy version.

## 21.2 One reservation authorizes at most one outbound provider attempt

For BSS-V2-006-admitted execution:

```text
one logical attempt -> one reservation -> at most one outbound transport attempt
```

Hidden SDK/adapter retry under the same reservation is prohibited. A retry after a transmitted failure is a new explicit attempt/reservation under the same logical work identity.

The provider-neutral Bridge contract may be extended additively with operational feedback needed for admission correctness: `transportMayHaveStarted`, trustworthy normalized usage, Retry-After, and safely normalized rate-limit limit/remaining/reset observations when exposed. Raw headers/provider bodies remain adapter-local.

If transport definitely did not start, release the reservation. If transport may have started but usage is unavailable, release concurrency at terminal state but conservatively retain transmitted request/RPD consumption and reserved TPM until the applicable safe quota-window boundary. Missing usage is never zero usage.

## 21.3 Runtime fairness has no historical borrowing debt

Weighted dominant-resource virtual usage is epoch-based. Maintain a durable quota-domain virtual-time baseline from currently backlogged eligible lanes. When an idle lane becomes backlogged:

```text
laneVirtualUsage = max(laneVirtualUsage, quotaDomainVirtualTime)
```

so a newcomer cannot monopolize capacity merely because another lane previously borrowed idle capacity.

When DesiredAdmissionProfile weights/caps change, BSS-V2-006 creates a new fairness epoch/rebase. Historical virtual usage under old weights must not become debt under the new plan.

## 21.4 Plan activation must wake sleeping backlog

BSS-V2-005-04 exposes a monotonic active-plan revision/change seam. BSS-V2-006 wires plan activation to one durable deduplicated pg-boss admission wakeup per affected quota domain.

A plan increase/decrease must affect existing waiting work without requiring a new user request, worker restart, or unrelated completion event. A decrease never preempts running work.

## 21.5 Semantic batching consumes the single SEM-CUTOVER stepwise engine (amended 2026-10-15)

Each perceived RUN-003 document is eligible for a **deterministic batch plan**, not a new batch-specific semantic methodology. The sole executable `atlas.semantic.extract` is SEM-CUTOVER-007A (eight-stage stepwise v0.3.1 and exact `atlas.semantic.extract.stepwise_multimodal.relationship-envelope/v0.4.0`, one combined `semantic_proposal + relationship_proposals`). `IDSER-012-02-01` must reuse its existing `buildStepwiseSourcePacket()` → `buildStepwiseRelationshipEnvelopeRequest()`, strict parsing, SEM/REL qualification, composite and replay—not restore historical `buildSemanticSourcePacket()` or old single-packet byte parity. Earlier draft §15 preserves history only.

```text
owned_source -> each eligible locator exactly one batch; only owner emits source_results
context_only_reference -> repeat only within authorized bounded profile; no output ownership
provisional/REL/accepted context -> trust/lineage/version checks per SEM-006/REL
canonical / qualified deferred -> explicit exact source partition at Atlas acceptance
```

Context and meaningful visuals require current Atlas source/media/relationship authorization and an image-capable qualified route. Structural proximity is not proof that cross-batch title, legend, condition or dependent source retains semantic meaning. Prior provisional revisions loaded by ordinary SEM code are not yet shown as provider-facing stepwise packet context in the winner ledger; stop under a bounded SEM owner decision if batching needs that feature. No unexamined meaningful visual can become `non_fact`.

The current whole-document stepwise builder needs an **orchestration-level** source-unit/relationship-preserving adaptation, not a second compiler or a mutated frozen prompt. Per-batch system/user/schema/image bytes and the exact versioned BSS-V2-005 estimator/accounting/output/safety policy determine the RequestResourceEnvelope; do not equate billing weight with TPM. No -02-01 provider work or materialization.

## 21.6 Revised semantic-consumer partition (supersedes original unconditional outcome)

```text
APPROVED PERC-RESET-008 / IDSER-012-01 -> perceived RUN-003 NormalizedDocument v1
SEM-CUTOVER-007A -> sole stepwise source/relationship/extraction/composite
BSS-V2-005 active plan + BSS-V2-006 actual durable reservation
   |
   v
IDSER-012-02-01 -> deterministic stepwise owned/context/REL/deferred batch plan + envelopes
IDSER-012-02-02 -> immutable process/workload + BSS-V2-005 DesiredAdmissionProfile
BSS-V2-004-03-06 -> bounded live same-engine experiment CK PASS AND semantic meaning PASS
IDSER-012-02-03 -> one reservation per actual attempt; shared SEM engine; fenced non-truth fragments
IDSER-012-02-04 -> exact Atlas-authenticated canonical / partial_accepted / qualified_deferred
                  -> explicit staged lifecycle/reconciliation policy OPEN-A before GO
```

BSS-V2-004-03-05's old consolidated CK PASS is retired as a future dependency; the original CHANGES_REQUIRED review remains historical. BSS-V2-004-03-06 qualifies exact SEM successor semantics, not the original old finalizer or a separate Anoman extraction implementation. An experiment CK PASS with semantic FAIL cannot unblock production semantic work.

## 21.7 Current dependency shape and acceptance stop

```text
PERC-RESET-008 + approved IDSER-012-01 + SEM-007A qualified shared engine
           + BSS-V2-005-04 / BSS-V2-006-04 genuine CK PASS
                     -> IDSER-012-02-01 CK PASS
                     -> IDSER-012-02-02 CK PASS
                     -> BSS-V2-004-03-06 CK PASS + semantic PASS
                     -> IDSER-012-02-03 CK PASS
                     -> IDSER-012-02-04 BLOCKED until policy OPEN-A resolved
```

Accepted SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE permits reconciliation on partially accepted canonical candidates and preserves full-canonical historical reconciliation. The earlier unconditional staged `semantic_ready` / zero-reconciliation plan is **not authorized** as an override. A qualified fully deferred result has no Semantic V1 or reconciliation effects and is a separate reviewable terminal state. A bounded Atlas/SEM policy decision must distinguish full/partial/deferred and historical flows before any `IDSER-012-02-04` GO. See §22 for the governing prospective owner/stop and test requirements. `BSS-V2-004-03-07` and the original IDSER-011 Mistral live series remain superseded-before-implementation.

---

## 22. October 15, 2026 prospective semantic-successor amendment (binding over §§15 and 21 when conflicting)

**Authorization:** user-directed IDSER ticket cleanup against the [SEM-CUTOVER winner](../feedback/SEM-CUTOVER-WINNER-REALIGNMENT-20261015.md), [IDSER successor authority map](../feedback/IDSER-SEMANTIC-SUCCESSOR-AUTHORITY-MAP-20261015.md), and [PERC-RESET successor baseline](../feedback/CANONICAL-PERCEPTION-BASELINE-v1.md). **Scope:** future IDSER-012-02/BSS-V2-004-03-06 planning requirements only. This appendix does not rewrite an already CK-approved SEM/REL/IDSER/BSS history, issue GO, or self-declare CK PASS. Earlier §15 is archival original draft; §§21.5–21.7 remain usable for batch/admission ownership **except** the superseded requirements identified here.

1. **One extractor, not a batch-owned second model algorithm.** The only permitted `atlas.semantic.extract` execution uses SEM-CUTOVER-007A eight-stage stepwise v0.3.1, the exact `atlas.semantic.extract.stepwise_multimodal.relationship-envelope/v0.4.0` profile (strict combined `semantic_proposal + relationship_proposals`), `buildStepwiseSourcePacket()`, `buildStepwiseRelationshipEnvelopeRequest()`, qualified REL-03/SEM-006/SEM-005, and a shared neutral transport/composite replay. Retire `buildSemanticSourcePacket()`, `prompt-003/v1`, old consolidated BSS-V2-004-03-05 future CK PASS and legacy byte parity from future extraction dependencies; old artifacts remain historical.
2. **Distinct ownership, unchanged output security.** PERC-RESET-008 and approved IDSER-012-01 supply accepted RUN-003 `NormalizedDocument v1` + exact scoped derived assets at `perceived`. IDSER-012-02-01 owns deterministic bounded *orchestration* over shared stepwise owned/context/REL roles, not an alternate compiler. Source ownership is exact once; context-only can repeat but never own output. Genuine cross-batch context/condition, visual meaning and prior provisional revisions need evidence; a missing SEM provider-facing revision seam is a named SEM-owner STOP.
3. **Independent shared admission.** BSS-V2-005 plans/publishes one current `DesiredAdmissionProfile`; BSS-V2-006 exclusively reserves one explicit outbound attempt per eligible request and accounts for usage. IDSER-012-02-02 activates that true generic plan with exact v0.4.0 profiles and no call; -02-03 registers/adopts reserved attempts and stages non-truth fragments through the **same** SEM engine. No provider-specific limiter/fallback, external quota for Docling, hidden retry or prompt repair call.
4. **Live qualification as a separate meaning gate.** Planned BSS-V2-004-03-06 qualifies exact successor v0.4.0 batch-aware source/REL semantics using bounded synthetic real Anoman **development-only** transport and independent M01–M13 semantics where applicable. An experiment's CK PASS is **not** a semantic PASS. No claim of official production ZDR, no live spending without explicit GO, and no legacy 03-05 CK gate.
5. **Qualified document acceptance, not invented full success.** `partial_accepted` materializes only canonical subset + exact deferred coverage; `qualified_deferred` yields no Semantic V1/candidate/evidence/index/reconcile and is a distinct reviewable terminal state. Older §21.6/21.7 unconditional "one extraction result -> semantic_ready -> zero reconciliation" is **not** governing for deferred or partial outcomes. **OPEN-A**: SEM-007A-DEFERRED-ACCEPTANCE allows reconciliation on partial canonical candidates and retains historical full-canonical reconciliation; older staged policy wanted none. Before IDSER-012-02-04 GO, obtain explicit bounded Atlas/SEM staged acceptance/lifecycle authority, proving full/partial/deferred/legacy cases, not silent overriding of approved RC-DA-03/04/06.
6. **Retired versus pending IDSER.** IDSER-011-01..04 `superseded-unimplemented`; IDSER-012-01 perception umbrellas `coverage-complete-non-executable`; IDSER-012 and IDSER-012-02 remain non-executable umbrellas with four genuinely planned semantic leaves. No retired batch/umbrella can be a future CK PASS predecessor. Historical approved IDSER-001..010 stay immutable.

**GO stop:** Any unresolved upstream SEM-007A independent CK/profile evidence, cross-batch REL method/provisional-context equivalence, BSS admission activation, live meaning qualification or staged acceptance policy must be reported as **specific BLOCKED** with a named successor owner, not satisfied by legacy execution or an invented document state.


## 23. October 16, 2026 planner-first Planned Corpus hard stop and generic BSS demand clarification (binding prospective over conflicting §§15, 21–22)

**Authority:** user-directed planning realignment after discussion of per-batch SEM-CUTOVER and independent reconciliation preparation. This is **not GO, CK PASS or permission to edit approved implementation**. [Full decision and code inventory](../feedback/IDSER-SEMANTIC-PLANNER-HARD-STOP-20261016.md).

- **Process-agnostic BSS-V2-005 desired policy:** existing generic `ProviderProcessProfile` / `WorkloadEnvelopeProfile` / deterministic planner remain shared across processes; currently hard-coded `ProcessKind` becomes a controlled, qualified, versioned registered extension under **new planned BSS-V2-005-05**. Authorized change of active process/workload/policy set recalculates and durably activates an immutable desired plan. No plan churn based on transient backlog/usage. Original approved BSS-V2-005-01..04 records stay unchanged.
- **Process-agnostic BSS-V2-006 runtime:** existing **planned** 006-01..04 own actual per-domain fair borrowing among backlogged eligible processes, clamps/cooldowns, protected interactive reserve, one reservation per outbound attempt and new-plan wakeups. Their generic work/admission logic cannot special-case semantic extraction. A read-only versioned effective-safety/eligibility budget seam for corpus sizing is **unproven** and needs bounded BSS owner qualification; do not fake it or pre-reserve capacity.
- **Planner hard stop:** `IDSER-012-02-01` must consume accepted `NormalizedDocument V1` plus authentic BSS-V2-005/006 capacity constraints to produce exact owned/context/REL/media, capability-fit corpus slots, one immutable complete source partition and one **durable `PlannedSemanticCorpusHandoff` per batch**. Zero provider call/work/attempt/reservation, semantic acceptance, reconciliation/preparation or Master effect. A temporary empty quota window waits at BSS-V2-006; do not alter a frozen corpus based on remaining TPM.
- **Bootstrap:** `IDSER-012-02-02` still activates the provider process after -02-01; permit planning with a validated **inactive/prospective** workload envelope and genuine active quota-domain ceiling, not a fictitious active semantic process. If generic BSS cannot provide constraints before activation, STOP `CAPACITY_PROFILE_BOOTSTRAP_GAP` or `BSS006_CAPACITY_READ_GAP`.
- **SEM consumer contract (separate gate):** SEM-CUTOVER will consume one **planned batch corpus** through the same eight-stage engine. Planner-only CK can qualify exact immutable handoff, bounded capacities and read-only **non-SEM** corpus redemption without implementing that consumer. Existing builder still enumerates an entire document; prior provisional context remains a named gap. **Before real batch dispatch**, a separately authorized SEM batch-intake extension and independent CK must prove exact prompt/schema/profile versioning, owned/context/REL/media correctness and per-batch qualified outcome. Do not rewrite frozen v0.4.0 bytes or build a second engine. Planner handoff is **not** the semantic Qualified Handoff.
- **Reconciliation boundary:** after each qualified semantic batch independently enqueue reconciliation *preparation* (future owner); workspace reconciliation is a separate single writer. Document-level full-source accounting must not silently hold back eligible per-batch prepared results. The older `IDSER-012-02-04` document acceptance/SEM RC-DA policy collision **OPEN-A remains unresolved**; no implicit revocation of approved partial/qualified-deferred semantics.

**STOP:** Missing BSS-006 runtime read, BSS process-registry activation, SEM corpus-scope equivalence, or batch-scoped qualified acceptance must be surfaced with a named owner and exact missing proof. Preserve the historical texts above as original context where superseded by this explicitly prospective planning amendment.

## 24. October 16, 2026 runtime provider-policy drift clarification (binding prospective over §23 where less precise)

BSS-V2-005's versioned capacity profile is *not* a promise that Anoman or any future provider retains today's RPM, TPM, RPD, concurrency or per-request structural maximum. Actual `apps/agents-bridge/src/providers/anoman.ts` presently maps 429 to a rate-limited error **without** normalized `Retry-After` or typed limit/remaining/reset feedback; BSS-V2-006-01..04 are planned. [Bounded exact review and negative CK oracles](../feedback/IDSER-SEMANTIC-PLANNER-HARD-STOP-20261016.md).

- **Prospective immediate enforcement = a newly planned, independently qualified BSS-V2-006 runtime-feedback successor:** normalize only trusted feedback; persist scoped lower-limit clamps/cooldowns/unknown-usage pessimism per quota domain/window; deny future inadmissible work with zero transport; bounded, newly reserved probes only. Ambiguous 429 cannot be treated as proof of numeric RPM/RPD, a particular window or account scope. Do not promise to prevent the first silently induced 429.
- **Lasting policy update = BSS-V2-005 authority:** a qualified new provider-capacity/profile version (authorized operator, API/docs or trustworthy qualified observation) causes deterministic DesiredAdmissionProfile re-publication and BSS-V2-006 plan-change wakeup under proposed BSS-V2-005-05. BSS-V2-006 cannot directly rewrite plan truth or increase it from a provider raw observation.
- **Planner coupling:** BSS-V2-006 transient remaining quota, 429/cooldown or RPM/RPD depletion makes an already valid semantic batch *wait*, never silently re-batches it. A proven per-request structural downgrade makes affected immutable requests ineligible; IDSER-012-02-01 re-plans into a **new versioned owned/context partition** from authenticated source, or fails with the exact unfit owned unit. No prompt truncation.
- **Evidence:** BSS-V2-006-03 is withdrawn and supplies no review contract; every 03A-01..06 child requires independent CK PASS before BSS-V2-006-04 may rely on runtime provider-policy drift handling. BSS-V2-005-05 RC-07..08 and IDSER-012-02-01 RC-11 remain prospective, not independently CK-qualified. Approved earlier BSS-V2-005 children and prior GO/CK artifacts remain untouched.

## 25. October 16, 2026 verified interactive/background foundation and consumer-latency seam (prospective)

**Actual implementation evidence:** `apps/agents-bridge/src/process-workload-catalogue.ts` supports server-validated `interactive` / `background` and protection-policy identity. `apps/agents-bridge/src/capacity-planner.ts` validates per-dimension hard interactive targets, subtracts protected capacity from the background pool, and is covered by `capacity-planner.test.ts`. This work is **already in approved BSS-V2-005-02/03**. Planned BSS-V2-006-02 already commits to protected interactive admission ahead of background fairness and no in-flight preemption. **Do not** introduce chat-specific allocation or reopen those approved tickets.

**Still future:** To support a user actually waiting for an interactive chatbot response, BSS-V2-006 must prove a server-authorized class, bounded admission/attempt deadline, persisted cancellation and no late dispatch; if RPM/TPM/RPD/concurrency or pressure makes interactive genuinely unavailable, the caller receives a bounded non-success status, not a fake guarantee or indefinite background-style wait. Interactive may use the protected reserve and otherwise borrow only permitted unprotected capacity; no request bypasses provider safety, reservation/fencing or usage accounting. Background semantic batches remain durable and cannot consume hard interactive reserve. Generic work/admission does **not** own chatbot transport, UI streaming, answer generation or model-specific behavior.

**Ticket-bound proof references:** BSS-V2-005-05 RC-00505-09 preserves existing class/reserve invariants; the approved BSS-V2-006-01 RC-BSSV2-00601-07 and -02 RC-BSSV2-00602-07/08 govern bounded deadlines, cancellation and protected admission, subject to their recorded CK outcomes; planned -04 RC-BSSV2-00604-09/10 remains an independent future integration gate. The new 006-03A uses only its own separately frozen RC IDs. The withdrawn -03 RC-BSSV2-00603-11 is **historical only**, not an active pressure-case closure oracle. Any replacement must freeze its own scope and evidence before use. [Bounded ledger](../feedback/IDSER-SEMANTIC-PLANNER-HARD-STOP-20261016.md).

## 26. October 16, 2026 BSS reusable consumer hard-stop contract (binding prospective)

[Consumer-contract checkpoint](bss-provider-consumer-contract-checkpoint-20261016.md) owns the distinction between **approved BSS-V2-005-04 immutable DesiredAdmissionProfile publication**, the **planned BSS-V2-005-05 authenticated read-only `CapacityPlanningSnapshot/v1`**, and **planned BSS-V2-006-04 `RuntimeCapacityConstraint/v1` read plus `ProviderWorkAdmission/v1` durable operational API**. These are proposed interface labels, not source-code implementations or CK PASS evidence. -005-05 must prove structural/workload/profile/active-plan versions and exact service-class/headroom/reserve without any quota mutation. -006-04 must prove read-vs-reservation isolation, per-attempt fenced admission, typed provider-pressure feedback and conservative accounting across restart through two independent fake background/interactive consumers.

**Non-cyclic dependency sequence (current):** approved BSS-V2-005-04 → approved BSS-V2-006-01/02 → [03A-01 → 03A-02 → 03A-03 → 03A-04 → 03A-05 → 03A-06, each CK PASS] → BSS-V2-005-05 final registry/read/convergence CK → BSS-V2-006-04 integrated shared-service CK. The BSS-V2-005-05 read-only snapshot may be developed/tested against approved -005-04 before the series, but its **final** CK must prove durable wakeup against the qualified child series, not withdrawn -03. IDSER-012-02-01 consumes immutable read constraints with zero reservation and retains per-batch Planned Corpus hard stop; SEM-007A batch runtime via IDSER-012-02-03 consumes **actual BSS-V2-006-04 admitted attempts**, not merely the capacity snapshot. No provider call is justified by reading either snapshot. Any SEM batch corpus intake, qualified handoff, reconciliation preparation or semantic JSON-meaning retry remains separately authorized.
