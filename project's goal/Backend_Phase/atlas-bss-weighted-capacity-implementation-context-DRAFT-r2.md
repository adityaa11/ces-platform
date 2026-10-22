# Atlas BSS V2 — Weighted Class/Process Capacity & Route/Model Handoff

**Implementation Context — Approved for Ticket Generation**  
**Date:** 22 October 2026  
**Revision:** r2 — Authorized unknown/not_enforced dimensions clarified; Anoman RPD regression gate added.  
**Repository:** `adityaa11/ces-platform`  
**Inspected branch:** `codex/new-atlas-backend`  
**Inspected head:** `4183c445fee6dc5b9691d8a811e00af40b289024`  
**Status:** `APPROVED_FOR_TICKET_GENERATION`  
**Authority:** Approved architectural and planning baseline for BSS V2 successor ticket generation.  
**Execution boundary:** Ticket generation only. No GO, implementation, or production activation is authorized by this document.  
**Location:** Standalone implementation context; not yet committed to the repository.

> **Purpose:** Establish the agreed production capacity-allocation contract and implementation direction based on the inspected BSS/IDSER code. Codex is authorized to derive bounded implementation tickets with explicit dependencies, frozen-ready Review Contracts, acceptance criteria, and regression obligations.
>
> The architectural decisions in this document are authoritative for ticket generation. Codex MUST reuse existing BSS execution boundaries and MUST NOT introduce parallel planning/admission paths, legacy compatibility layers, unauthorized fallbacks, or architectural redesign.
>
> Each generated ticket remains `planned` until its contract is reviewed and frozen. Implementation requires separate GO authorization.
>
> **Mandatory regression invariant:** Anoman RPD `unknown` MUST NOT block capacity planning or admission when the existing EffectiveEnforcementPolicy explicitly authorizes `not_enforced`. Authorized unknown dimensions remain excluded from numeric allocation and enforcement; unauthorized exclusions must fail closed.
>
> Codex MUST verify the current branch HEAD before generating tickets and report any concrete incompatibility with this baseline rather than silently expanding scope.

## 0. Codex execution guardrails — binding for later ticket drafting

**STOP / NO-GO RULE:** Codex must implement only the exact frozen successor ticket and its named acceptance rows. This draft **does not authorize implementation**. When invoked for later work, Codex must inspect the current branch, compare the frozen contract against actual interfaces, and **STOP for GO/HMN or a new human planning decision** whenever a gap would require an additional route, execution path, compatibility mechanism, or new requirement. It must not “helpfully” invent one.

**Single-path invariant — DO NOT create:**

- a second capacity planner, parallel calculation service, consumer-specific TPM/slot calculator, or private reimplementation of `normalizedWeight`;
- a second fair-admission scheduler, queue, DB reservation/admission function family, worker/send lane, or bypass of the existing pg-boss admitted-job → provider-transport-claim boundary;
- a second authenticated snapshot endpoint/read pipeline simply to carry calculated route/model limits; evolve the **existing capacity-planning read seam** using a frozen versioned contract and one server-controlled authority;
- a new alternative route registry/resolver or provider/model-specific execution branch for Anoman/OpenAI/IDSER; route/model metadata flows through the existing qualified registry and operational binding;
- a second source-packet/request builder, tokenizer, estimator, serializer, SEM execution path, or persistent request-body store; IDSER must reuse its existing full-request estimator and locator/hash handoff;
- any **implicit capacity fallback** (missing **enforced** process budget → provider TPM, missing **required** concurrency capacity → RPM heuristic, missing **required** qualified model bound → default, unsuccessful active read → prospective structural-only read) that converts unavailable/invalid **required authority** into eligible work. This prohibition **does not apply to an unknown dimension explicitly approved as `not_enforced` by the existing `EffectiveEnforcementPolicy`**: such a dimension must be excluded rather than forced to zero, treated as infinite, or used to block unrelated enforceable dimensions. In particular, Anoman's approved RPD `unknown/not_enforced` remains valid.

**No new legacy compatibility:** Do **not** add v1↔v2 adapters, compatibility shims, dual-read/dual-write, legacy acceptance branches, alias RPCs, old-schema mirror tables, defaulted legacy profiles, or a temporary compatibility scheduler merely to keep tests or historical workflows passing. A versioned successor **replaces the active consumer contract after an explicit bounded cutover**; it must not become a permanently parallel legacy pathway. **Preserving immutable old records, their physical quota liabilities, and already-approved historical behavior is not permission to implement new legacy support.** Existing historical code is not a mandate for proactive cleanup either: remove/retire only the exact old active consumer references required by the frozen cutover, without sweeping unrelated legacy components.

**Edit and scope constraints:** New numbered DB migrations may extend the established tables/functions, but never rewrite applied migrations or silently mutate historical immutable plans. Prefer editing/reusing existing planner, registry, authenticated read, and atomic admission entrypoints. New *schema artifacts* or versions are permitted only where proven required for these existing paths and explicitly frozen, not as a new operational lane. No deployment/provider profile change, no OpenAI live integration, no `ATLAS_BSS_MODE=dev`, no unrelated refactor, no changes to approved predecessor tickets, no authorization to GO/CK by inference.

**Fail-closed escalation:** If the current code cannot meet an acceptance row without a new operational lane, dual-version compatibility, broadened model fan-out, or modifying an unrelated approved contract: stop, record the specific file/function, why existing code cannot be reused, minimum proposed correction, and human decision required. Do not code around the gap. Every frozen ticket must restate these guardrails and include a binary review row proving **zero** new parallel send/planner/admission paths, **zero** new legacy compatibility branches, and **zero** unauthorized missing-required-bound-to-eligible fallbacks. **Do not call an authorized `unknown/not_enforced` dimension an invalid fallback.**

---

## 1. Intended outcome and non-negotiable decisions

BSS must be the **single authority** for both **planning capacity** and **runtime admission**. An operator registers a process with its `serviceClass`, qualified route/workload references and a **weight**; the operator **does not manually enter a separate RPM, TPM, or concurrency entitlement** for each process. Provider capacity and qualified model constraints remain separately versioned sources of truth.

The user-approved policy is:

1. **Class allocation:** 10% safety headroom, 20% protected interactive capacity, and 70% shared background capacity. Apply by quota domain and by individually enforced dimension (RPM, TPM, concurrency, and RPD **only if known/enforced**). **Approved `unknown/not_enforced` dimensions are absent from all allocation vectors and must not block the remaining enforced dimensions.**
2. **Process allocation:** within each service class, use the **existing normalized-weight algorithm**: `weight / sum(active process weights in the same domain/class)`. The normalized weight is applied **once**, to create each process's **baseline allocation**.
3. **Concurrent routes:** the same calculated process allocation drives both planner handoff and fair-admission entitlement for concurrency seats. No RPM→concurrency inference.
4. **Request sizing strategy: `Maximum Eligible Request`**. Never divide process TPM by its concurrency seats to produce a per-request hard token cap. Size the **complete** input (text + selected images + framing) plus reserved output against an authoritative per-request bound.
5. **Borrowing stays in fair admission.** A background process with `mayBorrowIdleCapacity=true` may exceed its *baseline usage* by consuming idle capacity from other background processes while respecting domain/class constraints, explicit hard caps and active demand of lenders. Headroom and protected interactive capacity cannot be borrowed by background. No preemption of already admitted work.
6. **Handoff:** BSS returns the qualified route/model identity **plus its calculated, version-pinned effective request-sizing bounds**. IDSER does not guess or hardcode the capacity allocation.
7. **Provider quota scope:** account-level or gateway-shared RPM/TPM is one `quotaDomainId`; giving two routes the same quota **does not duplicate the quota**. Additional genuinely independent model-specific limits must be qualified and enforced at runtime before being offered as a usable handoff.
8. **Production first.** `ATLAS_BSS_MODE=dev`, full-domain dev sizing, and single-in-flight dev chokepoint are **not in this work**.

### Boundaries that must not move

- BSS owns provider quotas, process policy, route qualification, planning capacities, admission reservations, RPM/TPM/window/concurrency accounting, pressure and transport dispatch.
- IDSER owns deterministic corpus selection, full logical SEM request estimation and structural partitioning; it persists **locators/hashes/versioned measurements only**, never the complete prompt, image payload, credentials, or send permit.
- SEM owns faithful reconstruction from locators and later authorized execution consumption; BSS is the **final send/admission authority**.
- GHR owns reference-only handoff routing; no new GHR or semantic result contract is introduced here.
- Approved BSS-V2-005 and -006 history remains immutable. Implement only **additive, versioned successors**.

## 2. Verified code inventory and actual gaps

This section is grounded in inspected files at the stated branch head. **Tests were read, not executed; no production DB was queried.**

| Existing source (branch path) | What actually exists | What is missing for this contract |
| --- | --- | --- |
| `apps/agents-bridge/src/capacity-planner.ts` | Pure `planEffectiveDesiredAdmissionProfile`; headroom/resource-vector subtraction; interactive reserve targets; shared `backgroundCapacity`; `normalizedWeight`; `planningCost`; optional caps in output. | Versioned **10/20/70 percentage policy**, integer class/process allocation, process RPM/TPM/seats, shared allocation handoff. |
| `apps/agents-bridge/tests/capacity-planner.test.ts` | Fixture provider **10,000 TPM**, headroom **1,000**, interactive **2,000**, computed background **7,000**; weighted 1:3 fixture. | Test literals **are not production policy**. Add 10/20/70 and 3:1 acceptance fixtures, without pretending to read provider state. |
| `packages/atlas-db/migrations/0076_bssv200501_anoman_capacity_profile.sql` | Anoman `anoman-shared-prod`, **20 RPM**, **40,000 TPM**, **25 concurrency**, RPD unknown. | No active 10/20/70 production plan is proven. **Do not overwrite this production seed** with the OpenAI simulation. |
| `packages/atlas-db/migrations/0077_bssv20060501_authorized_enforcement_policy_provenance.sql` | Explicit approval `anoman-rpd-not-published-approval-2026-10-18` binds Anoman RPD `unknown` to `not_enforced`; RPM/TPM/concurrency remain enforced. | All successors must preserve approved exclusion end-to-end; do not reinterpret RPD absence as zero, unlimited, missing mandatory config, or an automatic blocker. |
| `apps/agents-bridge/src/process-workload-catalogue.ts` | Registered process/profile/workload; **background** weight, `mayBorrowIdleCapacity`, `capPolicyId`; interactive protection identity; structural max request bytes/input; output reservation. | Interactive has no generic weight field; add the required weight through the existing process registration/parser in a new frozen schema version; **no parallel legacy registration or adapter**. Workload parser does not itself formally expose all context/prompt fields expected by the IDSER prospective consumer. |
| `apps/agents-bridge/src/route-registry.ts` | `QualifiedRoute` pins `routeId`, `providerId`, **`modelOrProcessorId`**, adapter and qualification; one active route per capability. | Route/model identity not yet fully propagated into BSS durable authority. Do not promise multiple active routes for the same capability without an independently approved resolver change. |
| `apps/agents-bridge/src/provider-operational-runtime.ts` | Calls `publish_qualified_provider_route_authority(routeId, capability, adapterVersion, qualificationVersion)` then binds route to attempt. | **Model ID is absent from the shown publication call**. Versioned DB identity and mismatch rejection are required. |
| `packages/atlas-db/migrations/0029_bssv200504_desired_admission_profile_publication.sql` | Immutable desired plan and active activation pointer. | New allocation revision must use these primitives, not mutate old plan JSON. |
| `packages/atlas-db/migrations/0078_bssv20060502_effective_plan_publication_convergence.sql` | Effective policy publication is bound to a **single `route_id`**; `desired_admission_profile_policy_binding` PK is `(quota_domain_id, desired_profile_version)`. | One desired plan cannot yet authoritatively express an arbitrary set of separately qualified route/model bindings. Requires versioned domain/route publication evolution, not cloned provider quotas. |
| `packages/atlas-db/migrations/0082_bssv20060503_authenticated_effective_capacity_snapshot.sql` and `apps/agents-bridge/src/capacity-planning-snapshot.ts` | Authenticated read-only `CapacityPlanningSnapshot/v1`; active read may include plan; **prospective** view is `status=inactive` with `plan=null`. | New authenticated **active calculated allocation handoff**, keeping prospective bootstrap truthful and separately labeled. |
| `apps/agents-bridge/src/idser-prospective-capacity-snapshot.ts` and `idser-multimodal-structural-fit-partition.ts` | IDSER validates prospective `inactive/plan=null` and structural constraints including context; full-request token demand includes output reservation. | No effective background/process allocation is consumed as the authoritative token ceiling. Preserve structural-only bootstrap until a separately qualified active view is introduced. |
| `packages/atlas-db/migrations/0083_bssv20060504_policy_aware_runtime_admission_fairness.sql` | Shared-domain runtime usage, background pool clamp, weighted virtual-usage lane ordering, atomic route-aware admission, interactive protection, one admitted pg-boss path. | In the examined admission path, **no separate per-process baseline RPM/TPM/seats enforcement or `mayBorrowIdleCapacity` check is visible**. New admission logic must use same plan allocations. |
| `packages/atlas-db/migrations/0084_bssv20060505_policy_revision_operational_recovery.sql` | Waiting-work replan/stale activation recovery, historical in-flight liability preservation. | New allocation and route/model revisions must integrate without rebasing reserved/claimed liabilities. |
| `project's goal/Backend_Phase/IDSER-012-05 IMPLEMENTATION CONTEXT.md` | In-memory complete SEM request / image-aware estimator, immutable v3 locator/hash reconstruction handoff. | BSS successor must not introduce a second payload store, new SEM transport or false persistence of complete requests. |

Primary architecture sources to keep authoritative:

- `project's goal/Backend_Phase/atlas-core-architecture-checkpoint-v3.md`
- `project's goal/Backend_Phase/atlas-backend-production-baseline-v2.md`
- Current approved BSS-V2-005/-006 tickets, rather than obsolete planning prose in older contexts.

## 3. Freeze-target policy: class and process allocation

### 3.1 Units and eligibility

The allocation scope is the **quota domain**, not an independent quota per route. Inputs are the exact immutable provider capacity profile, server-derived effective enforcement policy, registered active process/workload policies, qualified route identities, and new versioned `ClassAllocationPolicy/v1`.

Default policy shares are expressed as **basis points** to avoid floating-point drift:

```text
headroomBps    = 1000    // 10%
interactiveBps = 2000    // 20%
backgroundBps  = 7000    // 70%
SUM            = 10000
```

Do not emit numeric entitlements for excluded dimensions. In particular, unknown Anoman RPD stays unknown/not enforced **because the existing policy approval explicitly authorizes its exclusion**, not because `unknown` implicitly means unbounded. Concurrency cannot be inferred from RPM/TPM. If no real provider concurrency bound exists, an explicitly approved internal, conservatively enforced concurrency ceiling is a **separate versioned configuration**, not a derived account quota.

### 3.1A Authorized unknown vs missing required capacity — MUST preserve existing policy

The inherited `EffectiveEnforcementPolicy/v1` is the **only authority** that determines whether a provider dimension participates in allocation and admission:

| Provider dimension state + policy | Required behavior | Example |
| --- | --- | --- |
| `known` + `enforced` | Include its exact numeric bound in class shares, process baselines, handoff, and atomic runtime checks. | Anoman RPM=20, TPM=40,000, concurrency=25. |
| `unknown` + **explicitly approved** `not_enforced` | Exclude the dimension from numeric vectors, allocation denominator, planning fit and runtime quota-window/ledger checks. Preserve unknown state plus approval provenance; **do not block** the other dimensions. | **Anoman RPD** authorized by `anoman-rpd-not-published-approval-2026-10-18`. |
| `unknown` without a valid, unrevoked approval for `not_enforced` | Reject/return `unknown` or `stale` as appropriate; do not invent an exclusion or a numeric value. | Unapproved unknown RPD. |
| `known/enforced` but required derived process baseline missing, wrong revision, negative, or otherwise invalid | Fail closed for the affected active calculated-capacity plan/read/admission. Do not substitute provider/global class TPM. | Missing calculated Semantic TPM. |
| Required model/structural request bound absent or route/model qualification stale | Return typed `unfit`/`unknown`/`stale` and disallow production-sized request. | Unqualified context/output limit. |

**Anoman invariants:** Existing migration `0077` records the approval ID and the effective RPD policy decision. Under that approved policy, the exact enforced allocation dimensions are `rpm`, `tpm`, `concurrency`; `rpd` **must not** appear as a numeric `0`, `Infinity`, or an invented daily quota in class/process vectors, request-fit denominators, or provider-window reservation/ledger accounting. An API may carry RPD metadata as `{state:"unknown", mode:"not_enforced", approvalRef:"..."}`; that metadata is **not** a numeric admission dimension. Existing request envelopes may retain their generic `dayUnits` field, but runtime must not establish an RPD ledger or reject admission on `dayUnits` when RPD is officially excluded.

**No blanket rule that all `unknown` blocks.** Only an unknown dimension that is required to be enforced without an authorized exception, or a required missing source of capacity/structural fit, must block. An approved excluded RPD must never cause a fallback to a less-authoritative profile or a second scheduler.


### 3.2 Integer-conserving deterministic class split

For each known and enforced dimension `d` of a domain capacity `C[d]`:

```text
H[d] = ceil(C[d] * 1000 / 10000)
I[d] = ceil(C[d] * 2000 / 10000)
B[d] = C[d] - H[d] - I[d]
U[d] = C[d] - H[d]

assert H[d] >= 0 and I[d] >= 0 and B[d] >= 0
assert H[d] + I[d] + B[d] == C[d]
```

`H` never admits work; `I` is non-lendable to background; `B` is the maximum pool available to background, including its own internal borrowing. This makes fractional concurrency rounding conservative. A zero baseline for any resource essential to an active work type must be reported as **unfit**; don't fabricate a seat. If strict 10/20/70 fractional percentages cannot be represented with integers, the documented rounding rule controls.

### 3.3 Normalized weights and process baselines

For every active process in the same `(quotaDomainId, serviceClass)`:

```text
normalizedWeight(process) = process.weight / sum(weight of active peers in same class)
processBaseline[d]        = classCapacity[d] * normalizedWeight(process)
```

All process allocations must be integer and conserve the class total. Use **floor + largest fractional remainder** to distribute left-over RPM/TPM/concurrency units. Tie-break deterministically by canonical `(processId, profileVersion)` ascending. The output includes the exact normalized rational share and allocated integer units. A process is counted **once** even if several qualified routes reference it; the same process budget is not multiplied by the number of routes.

For background, reuse the existing `allocationPolicy.background.weight` as the source. For interactive, introduce the minimal **versioned interactive-weight registration** required by the new active allocation contract; do not pretend the current parser already accepts it. **Do not add a legacy interactive-weight shim, v1 acceptance fallback, or a dual process-registry path.** Preserve the old desired profiles and any held physical liabilities immutably; cut over only the explicitly authorized active process registrations. When the process set or weight changes, publish a new desired-profile version through the existing activation/epoch lifecycle; live policy must not change under a stable plan identity.

Explicit `backgroundCaps`, when present, are **hard upper bounds**, independently enforced, including during borrowing. Baseline entitlement must never automatically override such a cap. If a cap cuts below a calculated baseline, record the remainder as unused within the background class (subject to explicit borrowing), never silently give it to another class.

### 3.4 Numerical oracle — OpenAI-like account fixture

The following is a **synthetic quota-domain fixture**, not a new Atlas production account configuration or proof of a live OpenAI organization limit:

| Capacity | RPM | TPM |
| --- | ---: | ---: |
| Account/shared quota | 5,000 | 2,000,000 |
| Headroom 10% | 500 | 200,000 |
| Interactive 20% | 1,000 | 400,000 |
| Background 70% | 3,500 | 1,400,000 |
| Semantic, background weight 3 of 4 | **2,625** | **1,050,000** |
| Reconciliation, background weight 1 of 4 | **875** | **350,000** |

If there is **separately qualified** provider/internal concurrency `C=40`: headroom 4 seats, interactive 8, background 28; Semantic gets **21** baseline seats, Reconciliation **7**. The `40` is explicitly hypothetical. **No `1,050,000 / 21` per-slot token formula exists.**

Anoman production-profile fixture (still **not evidence of active plan**): `20 RPM, 40,000 TPM, 25 concurrency`, **RPD `unknown` with existing approved `not_enforced`** -> `H=2 RPM,4,000 TPM,3 seats`, `I=4 RPM,8,000 TPM,5 seats`, `B=14 RPM,28,000 TPM,17 seats`. RPD receives **no** numeric class/process share or provider-window ledger. With only Semantic background process: Semantic gets all `B`. With Semantic weight 3 and Reconciliation weight 1: Semantic gets **21,000 TPM**, Reconciliation **7,000 TPM**; seats **13/4** after largest-remainder allocation. Tied RPM fractional remainders are resolved by canonical process ID.

## 4. Request sizing: Maximum Eligible Request, not per-slot division

`maxEligibleCompleteRequestTokens` is a **stable planning ceiling**, not a live token-remaining observation, execution promise, context window, or per-slot partition.

A complete request needs all of the following to fit:

```text
fullRequestTokenUnits = conservativeTextTokens
                      + conservativeSelectedImageTokens
                      + conservativeFraming/OverheadTokens
                      + reservedOutputTokens

fullRequestTokenUnits <= processBaseline.tpm
inputTokens           <= workloadAndModelMaxInputTokens
inputTokens + reservedOutputTokens <= qualifiedModelMaxContextTokens
reservedOutputTokens <= qualifiedModelMaxOutputTokens
requestBytes          <= qualifiedWorkload/RouteMaxRequestBytes
promptBytes           <= qualifiedPrompt/TransportBound (when required)
requestUnits          <= process's positive RPM capacity
route/adapter/qualification/estimator/revisions match active policy
```

If any required structural bound is unknown, fail closed with a typed planning reason; never substitute the raw provider TPM for model context or treat model output ceiling as TPM. Use the existing actual conservative full-request estimator for text/image/bytes; don't design a second tokenizer in BSS.

**Borrowing and sizing must not be conflated:** the immutable IDSER plan uses the process's **baseline** as its stable per-request ceiling. Borrowing is then available at runtime to admit **more aggregate requests**, or use more aggregate TPM/seats, when a peer's class share is idle. A request *larger than baseline* does not become automatically plannable just because borrowing might someday be possible. If later product requirements demand oversized borrow-dependent immutable requests, that needs an explicit, separately versioned conditional-planning contract and a no-indefinite-wait guarantee; **not included in v1**.

A request with 120,000 total tokens fits a Semantic baseline of 1,050,000 TPM **only if** every qualified per-request model/route bound permits it. At runtime, `floor(1,050,000 / 120,000) = 8` is at most a theoretical no-prior-usage **TPM-window throughput bound**, not the number of concurrently executable calls. RPM, seats, window age, other usage and pressure remain separate constraints.

## 5. BSS consumer boundary — evolve the EXISTING read seam (proposed, versioned)

**No second read pipeline.** Deliver the calculated route/model capacity through the existing server-authenticated `CapacityPlanningSnapshot` reader/DB projection boundary, with a deliberately versioned successor shape (working name **`CapacityPlanningSnapshot/v2`**; exact naming is a later freeze decision). The payload concept is a route/model capacity handoff, **not** a new endpoint, independently authenticated service, or separate client call. The v2 active consumer must be cut over from v1 in bounded scope; **do not introduce a legacy v1→v2 adapter, dual-read, dual-write, fallback or parallel long-lived service**. Existing v1 prospective/inactive semantics are historical facts; they cannot be relabeled qualified, and any temporarily still-authorized prospective bootstrap remains out of the active calculated-capacity consumer pathway. If safe cutover needs non-ticket compatibility support, STOP for human authority rather than inventing it. `RuntimeCapacityConstraint/v1` remains the existing independent runtime eligibility read, not an alternative planning-budget source. Exact field names and versions are freeze targets, not current implemented exports.

```json
{
  "apiVersion": "CapacityPlanningSnapshot/v2",
  "status": "qualified",
  "readIsNotAdmissionPermit": true,
  "identity": {
    "quotaDomainId": "example-account",
    "processId": "semantic",
    "processProfileVersion": "<exact-version>",
    "serviceClass": "background",
    "capability": "atlas.semantic.extract",
    "routeId": "<server-qualified-route>",
    "providerId": "<server-qualified-provider>",
    "modelOrProcessorId": "<exact-qualified-model>",
    "adapterVersion": "<exact-version>",
    "qualificationVersion": "<exact-version>"
  },
  "revisions": {
    "capacityProfileVersion": "<exact-version>",
    "enforcementPolicyVersion": "<exact-version>",
    "allocationPolicyVersion": "<exact-version>",
    "processRegistryVersion": "<exact-version>",
    "desiredProfileVersion": "<exact-version>",
    "activationRevision": 1,
    "workloadProfileVersion": "<exact-version>",
    "estimatorVersion": "<exact-version>"
  },
  "allocation": {
    "effectiveDimensions": ["rpm", "tpm", "concurrency"],
    "classBaseline": {"rpm": 3500, "tpm": 1400000, "concurrency": 28},
    "processBaseline": {"rpm": 2625, "tpm": 1050000, "concurrency": 21},
    "normalizedWeight": {"numerator": 3, "denominator": 4}
  },
  "sizing": {
    "maxEligibleCompleteRequestTokens": "<derived-integer>",
    "maxEligibleInputTokens": "<derived-integer>",
    "maxRequestBytes": "<qualified-integer>",
    "maxContextTokens": "<qualified-integer>",
    "reservedOutputTokens": "<pinned-integer>"
  },
  "borrowing": {
    "mayBorrowIdleCapacity": true,
    "scope": "same-background-class",
    "runtimeOnly": true
  }
}
```

This JSON is **a contract-shape example, not valid production data or a frozen parser**. Placeholders must be replaced by authoritative, provenance-bound fields before freeze. Required production fields additionally include qualification references, accounting/window policy, safety and media-estimator identities, optional explicit caps, typed reject reasons, and a canonical snapshot fingerprint. No bytes/content/credentials/transports or live counters appear in the result. The Anoman-shaped `effectiveDimensions` deliberately excludes RPD **only because** the effective policy has the exact approved `unknown/not_enforced` decision. That exclusion must retain the source state and approval reference elsewhere in the handoff provenance (do not add a numeric RPD field).

### Handoff invariants

- Caller cannot select a foreign quota domain, process ID/class, route, model or activation; those are server-bound through the authenticated principal.
- Return qualified only when the process, workload, **exact route+model+adapter+qualification**, effective domain-wide enforcement policy, new allocation version and active desired plan are mutually consistent.
- `prospective` mode from today's `CapacityPlanningSnapshot/v1` remains explicitly **inactive with `plan=null`**. It must not masquerade as an active weighted capacity allocation merely to make IDSER pass. A genuine active, qualified view is necessary for final production sizing.
- Multiple eligible routes of the same process **reference the same process allocation**; all routes sharing a quota domain reference the same provider limit. Existing resolver's one-route-per-capability restriction remains unless separately changed.
- `readIsNotAdmissionPermit=true`. Any status other than qualified (`unknown`, `stale`, `unfit`, `inactive`) is not a numeric fallback. **Approved `unknown/not_enforced` RPD is not itself a reason to downgrade an otherwise qualified read**; effective mask and approval provenance are authoritative.
- Enforced model-specific rate limits require real runtime accounting of the corresponding model/quota scope. If the runtime cannot enforce one, don't publish an optimistic effective numeric allowance; reject that route or defer the capability under explicit ticket authority.

## 6. Fair admission with weighted process entitlements and borrowing

**Preserve** the existing transaction fence and execution path: `bridge.admit_next_provider_work_attempt` → `bridge.admit_route_aware_provider_work_attempt` → durable exact reservations/window ledgers → pg-boss admitted job → provider transport claim. This is an additive per-process **check within the same atomic admission**, not a second scheduler.

### 6.1 Default, no borrowing

Under the domain lock, a background attempt must simultaneously satisfy:

1. Version-pinned process/profile/route/model and desired-plan activation identity.
2. Workload/structural request sizing; request resource envelope (independent RPM, TPM, RPD **only when approved `enforced`**, concurrency) accurately accounts for full request plus output reserve. An authorized `unknown/not_enforced` RPD is excluded and must not create daily accounting or a blocker.
3. **Process** remaining baseline for each enforced dimension; explicit hard per-process cap where configured.
4. **Background-class** remaining shared pool and protected interactive reserve.
5. **Quota-domain** physical remaining capacity, accurate held/spent liabilities, window state, pressure clamp, cancellation and fairness eligibility.

Keep the existing weighted dominant-resource virtual-time selection across lanes. Changing process weight must change both its baseline entitlement **and** selection weight from the same immutable plan.

### 6.2 Borrowing from idle background allocations

If a process requests beyond its remaining baseline, BSS may grant that excess only when:

- the borrower's exact pinned profile enables `mayBorrowIdleCapacity`;
- aggregate class and global remaining capacity suffice in **every enforced dimension**;
- unused entitlement from *other background peers* can be proven under the **same atomic window/seat accounting**; and
- active, eligible waiting lenders are not unfairly denied their entitlement by a new above-baseline borrower admission.

Borrowing is decided **at admission time**, not recorded as a guaranteed future planner budget. Borrowing may increase the admitted request count/aggregate usage above the baseline but **never exceeds model limits, process hard caps, class pool or actual shared-domain quota**. Already sent/reserved work is not recalled; its exact physical liabilities remain until normal release/reconciliation. When a lender returns, stop granting new above-baseline borrowing that would continue to deprive its current eligible demand; priority/fairness recovery applies to future admission only.

An `idle share` must be evidenced by the authoritative per-process held/spent window counters and eligible waiting demand. A low previous-turn virtual cost alone is **not proof of an idle token balance**. Reuse authoritative reservation/window records; any supplementary per-process accounting projection must reconcile exactly to the existing domain ledger. The token usage of a completed call remains spent until its window resets; releasing a concurrency seat does not refund already spent TPM.

### 6.3 Interactive and headroom

Interactive receives a protected class baseline of 20%, weighted among active interactive processes. Preserve the approved interactive-priority path and existing permitted use of non-headroom global idle capacity; **do not silently remove its behavior**. Background can borrow only from the 70% background class; the 20% interactive protection is never a background loan. Headroom is excluded from both classes' admission ceiling.

### 6.4 Process/route revision safety

A new weight/process/model/policy version publishes an immutable successor and changes activation revision. Waiting work is handled by established stale-work/replan rules (`0084`); held/claimed work remains version-pinned and its physical cost cannot disappear or be rebased. Incompatible pending oversized requests must emit a typed `REPLAN_REQUIRED`/`UNFIT` result, not an infinite waiting loop or silent fallback send.

## 7. Concrete implementation workstreams (successors, not authorized tickets yet)

**Do not assign final ticket IDs or call GO until the full Review Contract is frozen.** Sequence preserves existing owners and narrows review scope.

| Proposed successor | Owner | Concrete work and expected artifact | Hard stop |
| --- | --- | --- | --- |
| **A. Allocation contract/policy** | BSS-V2-005 | Versioned 10/20/70 policy, interactive weights via the existing process registration path (no legacy shim), pure per-class/per-process integer allocation, deterministic normalization and optional cap handling. New types + unit fixtures; reuse current `capacity-planner.ts`. | No database writes or runtime send changes. |
| **B. Route/model authority + immutable publication** | BSS-V2-005 | Add model/qualification binding to BSS route authority, shared-domain multi-route plan binding where needed, provenance/fingerprint verification, immutable publication/activation of exactly derived process allocation. Integrate with `0029`, `0077`, `0078`. | No legacy row mutation; no forged/duplicated model quota. |
| **C. Authenticated calculated handoff** | BSS-V2-005 | Evolve the **existing** authenticated `CapacityPlanningSnapshot` reader/SQL projection to a new versioned **active** capacity handoff shape; reuse existing authenticated principals, exact constraints/statuses, and side-effect-free proof. Existing prospective-only use must never be upgraded by fallback. | Zero second reader/endpoint, no v1/v2 compatibility shim, zero attempts, reservations, quota mutation, job creation, transports. |
| **D. Atomic per-process admission + borrowing** | BSS-V2-006 | Enforce process RPM/TPM/seats and caps in existing `0083`-successor transaction. Borrow only verified idle same-class capacity; use existing fairness and physical window accounting; preserve interactive protection and `0084` recovery. | One admission authority, no parallel queue or new transport. |
| **E. IDSER calculated-capacity consumer** | IDSER successor | Read active qualified BSS handoff; calculate maximum complete SEM request using shared estimator; deterministic structural fit and typed replan; preserve immutable v3 locator/hash-only persistence and SEM reconstruction contract. | No SEM provider send; no request-body DB storage; no GHR payload redesign. |

**Dependency order:** A → B → C and D (D consumes exact allocation profile from B) → E (E can build against C's frozen interface; production acceptance needs D to enforce same limits). Changes to the production Anoman profile are **not needed** for the demonstration; fixtures may substitute an OpenAI-like `5,000 RPM / 2,000,000 TPM` provider profile. **Regression ownership:** A proves effective-dimension exclusion, C proves the read-only authorized handoff, D proves actual DB admission/window behavior, and E proves IDSER doesn't treat excluded RPD as a structural failure.

### File-level starting points

- Planner/types/tests: `apps/agents-bridge/src/capacity-planner.ts`, `process-workload-catalogue.ts`, `capacity-catalogue.ts`; `apps/agents-bridge/tests/capacity-planner.test.ts` and profile catalogue tests.
- Route/model: `apps/agents-bridge/src/route-registry.ts`, `provider-operational-runtime.ts`, current BSS qualified-route DB definition; provider qualification/adapter model binding.
- DB plan: migrations `0029`, `0067`, `0077`, `0078`, `0079`–`0081`; create **new numbered migration**, do not edit applied migrations.
- Read: migration `0082`, `apps/agents-bridge/src/capacity-planning-snapshot.ts`; add new API/version and integration tests.
- Runtime: migrations `0083`, `0084`, provider admitted worker and `packages/atlas-db/tests/policy-aware-runtime-admission-fairness.integration.test.ts`; use **new successor migration**, no replay of old historical schema.
- IDSER: `idser-prospective-capacity-snapshot.ts`, `idser-multimodal-structural-fit-partition.ts`, `complete-sem-candidate-request-estimator.ts`, `IDSER-012-05 IMPLEMENTATION CONTEXT.md`.

## 8. Frozen-review candidate acceptance matrix (split per owner at ticket freeze)

| ID | Binary evidence / pass condition |
| --- | --- |
| **WCA-01** | 10/20/70 computes exact dimension-wise integer class allocations for OpenAI-like 5,000/2,000,000 and Anoman 20/40,000/25 fixtures. Authorized `unknown/not_enforced` RPD stays excluded and **nonblocking**; invalid required enforced input fails closed. |
| **WCA-02** | Semantic:Reconciliation weight 3:1 produces **75%/25%** baseline. Adding/removing/disable/reweighting one process changes exact immutable plan identity; reordered inputs produce identical output. |
| **WCA-03** | Integer concurrency/RPM largest-remainder allocation conserves class total, deterministic on ties, reports zero-seat process unfit, and never infers concurrency from RPM. |
| **WCA-04** | Interactive process weights are supported on the **existing** process registration path; no new v1 shim, dual registry or parallel allocator. Previously admitted/immutable historical state is not rewritten. |
| **WCA-05** | Two qualified routes in one quota domain share **one** provider capacity and one process allocation; publishing model/route mismatches or conflicting enforcement policies fails closed. |
| **WCA-06** | Model/adapter/qualification version survives registry → DB publication → authenticated read → admission; forged or stale model identity blocked before send. |
| **WCA-07** | New read-only handoff provides same pinned class/process/route/model limits as active desired plan, plus model/context/bytes/output safety and exact revision fingerprint; foreign principal, stale plan, missing constraints fail closed; side-effect counters stay zero. |
| **WCA-08** | No TPM-per-concurrency division. Large complete request fits only if conservative input+images+output <= process TPM baseline **and** model/workload constraints; too-large request returns typed REPLAN/UNFIT. |
| **WCA-09** | DB-backed process baseline RPM/TPM/seats, optional caps, background and global limits are all independently enforced in existing atomic admission. Saturating any one enforced resource yields no send. |
| **WCA-10** | Two background processes: borrower enabled/disabled scenarios, lender active vs idle, exhausted peer share, borrower in-flight; no borrowing from interactive/headroom; exact per-window accounting. |
| **WCA-11** | Returning lender gets fair subsequent admission without preempting in-flight borrower; all held/spent liabilities remain and shared quotas never overshoot. |
| **WCA-12** | Weight/route/model/profile revision cannot rewrite historical admitted work; stale waiting work uses existing replan/stop pathway; no unauthorized provider send. |
| **WCA-13** | IDSER consumer sizes full request using BSS handoff; immutable plan persists only locator/hash/versioned measurements; SEM reference reconstruction parity remains exact. |
| **WCA-14** | Production ticket set creates no `ATLAS_BSS_MODE=dev`, second scheduler, second planner/read/send path, new legacy compatibility shim/dual-write/dual-read, content persistence, provider switch, or unrelated CK requirement. Codex records a before/after entrypoint inventory. |
| **WCA-15** | **Mandatory Anoman RPD regression (existing BSS-V2-006-05 authority):** Given `anoman-shared-prod` RPM=20/TPM=40,000/concurrency=25/RPD=`unknown` and the valid nonrevoked approval `anoman-rpd-not-published-approval-2026-10-18`, capacity allocation, authenticated active calculated handoff, IDSER request-fit consumer and actual DB atomic fair admission succeed for an otherwise fitting request **without numeric RPD allocations or RPD ledger/window reservations**; RPM/TPM/concurrency still enforced independently. Negative twin: absent/revoked/mismatched RPD approval fails closed; no fabricated RPD=0 or unlimited and no fallback path. Verify exact unchanged approval/reference and effective mask; do not require live provider calls. |

For each later executable ticket, copy **only the rows assigned to that owner**, specify exact commands/fixtures and expected evidence, and use existing GO → CK → CFC/HMN protocol. Do not let a future CK invent additional global requirements from this context.

### 8.1 Concrete WCA-15 regression execution contract

Run **separate isolated fixtures** against the actual existing BSS catalogue/enforcement/publication/admission SQL and the shared authenticated read/IDSER consumer seams (as each owner lands). This is not a mock-only assertion and does not require any real Anoman API call.

1. **Positive policy:** source profile contains RPD `{state:"unknown"}`; effective policy contains `rpd.mode="not_enforced"`, matching `approvalRef="anoman-rpd-not-published-approval-2026-10-18"`, plus enforced `rpm/tpm/concurrency`. Derive and publish the weighted 10/20/70 plan. Assert canonical allocation vectors have only the three enforced dimension keys, with values conserving provider/class totals.
2. **Positive handoff/IDSER:** bind the exact server-authorized process, qualified route/model and active plan. Read the **existing** authenticated read seam's successor active planning snapshot and size one full SEM request whose RPM/TPM/seats and model/structural bounds fit. Assert result is eligible/qualified with valid approved-RPD provenance, not a failure from missing RPD. Assert planning produces no reservation, work dispatch or provider send.
3. **Positive runtime:** register/submit one fitting, properly authorized background attempt under the plan through the **existing** atomic fair-admission path. Assert admitted or eligible according to existing workflow, with exact RPM/TPM/concurrency quota reservations but **zero RPD provider-window ledger rows**. Do not infer that `dayUnits` implies RPD is enforced.
4. **Negative enforcement approval:** in a separate fixture omit, mismatch or revoke the RPD exclusion approval. Derivation/publication/read/admission MUST fail closed at its authoritative gate; do not silently proceed by treating RPD as zero/unlimited, skipping the policy check, or switching to prospective structural-only fallback.
5. **Preservation:** assert no new alternate reader, compatibility shim, scheduler, queue or send lane and no mutation to historical migration `0077` or Anoman seed `0076`. Existing approved BSS-V2-006-05 compatibility regressions must remain green.

**Gate placement:** WCA-15 must appear in the frozen BSS-005 allocation/policy and handoff tickets, BSS-006 admission successor, and IDSER consumer successor with only the proofs that each ticket owns. Nobody may convert an authorized excluded dimension into a mandatory field as a condition for CK PASS.

## 9. Compatibility and explicit non-goals

- **No production seed mutation:** `0076` remains 20 RPM / 40,000 TPM / 25 concurrency with RPD `unknown`; migration `0077` existing Anoman RPD exclusion approval remains authoritative. OpenAI Build Luna is a **fixture**.
- **No provider discovery promise:** model availability, model context ceilings and per-model quotas must be supplied by qualified source, not presumed from the sample name.
- **No new legacy compatibility:** historical prospective `CapacityPlanningSnapshot/v1` returns inactive with null plan; do not reinterpret it. Upgrade the existing read seam and cut the active consumer over to a single versioned contract. No shim or parallel v1/v2 active path; any migration need not explicitly authorized is a STOP condition.
- **No concurrency miracle:** concurrency seat count controls active calls; TPM window controls total spend; both are checked without static TPM/slot subdivision.
- **No optimistic borrowing in immutable planner:** borrowed capacity is transient runtime opportunity, not guaranteed future request size.
- **No blanket unknown blocker:** explicitly authorized `unknown/not_enforced` (Anoman RPD) does not block otherwise qualified planning/admission; missing/unauthorized **required** dimensions still fail closed. No zero or unlimited RPD substitute.
- **No new BSS admission path:** update the existing DB atomic dispatch, provider admitted worker and physical quota ledger.
- **No source/result authority drift:** Atlas truth, NormalizedDocument, Semantic V1, reconciliation and publication stay in their existing domains.
- **No old-ticket rewrite:** existing approved implementation and evidence are dependencies, not work to reopen.
- **No branch write:** this draft is not a repository commit; neither docs nor code were changed by creation of this local file.

## 10. Freeze checklist (planning review, not a user questionnaire)

Before generating GO-authorized tickets (also carry forward every §0 Codex guardrail):

- [ ] Approve the class 10/20/70 split and exact ceiling/rounding treatment.
- [ ] Approve same-class normalized weight once, process baseline semantics and direct interactive weight support on the existing registry, without a compatibility shim.
- [ ] Approve `Maximum Eligible Request`: **no per-slot token split**, stable request ceiling bounded by process baseline + qualified model/route constraints.
- [ ] Approve background-only runtime borrowing with lender return protection and without cross-class loans.
- [ ] Freeze the route/model qualification authority and shared-domain publication migration seam.
- [ ] Freeze exact new handoff parser/field names only after confirming whether existing structural/max-context policy needs a dedicated model-bound table/profile.
- [ ] Prove one canonical capacity-planning reader, one existing admission scheduler/transport chain, and no newly introduced legacy compatibility, **unauthorized** fallback or duplicate process allocation calculator.
- [ ] Freeze and prove **WCA-15**: Anoman `unknown` RPD with the existing valid `not_enforced` approval is nonblocking for 10/20/70 planning, authenticated handoff, IDSER fit and DB fair admission; no numeric RPD allocation/ledger. Negative fixture with missing/revoked approval must fail closed.
- [ ] Produce bounded BSS-005, BSS-006 and IDSER successor tickets with non-overlapping review contracts and explicit test/DB evidence, then request GO separately.

**End state:** A new operator-registered Semantic process with weight 3 can receive an authoritative, versioned route/model capacity handoff generated from the quota-domain profile and 10/20/70 class policy; IDSER sizes complete requests with that computed baseline; fair admission independently enforces weighted process/concurrent resource allocation and safely borrows demonstrably idle background capacity, all without a second scheduler or per-slot token subdivision.
