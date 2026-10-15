# BSS external-provider consumer interfaces — planning/read and runtime/admission checkpoint (2026-10-16)

- **Authority:** prospective user-directed BSS-V2-005-05 / BSS-V2-006-04 ticket realignment; documentation only, not implementation GO, runtime capability, or CK PASS.
- **Owners:** BSS-V2-005 publishes and resolves **planning/structural policy**; BSS-V2-006 resolves **effective runtime eligibility, fair admission, attempt reservations, accounting and pressure**. Both are Bridge-owned operational boundaries, not Atlas trusted-state writers.
- **Consumer examples:** IDSER-012-02-01 Semantic Batch Planner (read-only); IDSER-012-02-03 / SEM-CUTOVER batch execution (provider work + per-attempt admission + feedback); future interactive chat and CES (same generic contracts and server-authorized service classes).
- **Status:** BSS-V2-005-01..04 approved; -005-05 and BSS-V2-006-01..04 **planned**. The sample names/shapes below are interface requirements, **not claims that TS exports, RPC handlers, SQL read grants, or production endpoints already exist**.

## Hard Stop A — BSS-V2-005 `CapacityPlanningSnapshot/v1` (proposed consumer contract)

BSS-V2-005-04's **already approved hard stop** is atomic, immutable `DesiredAdmissionProfile` publication/resolution and zero provider work. BSS-V2-005-05 must add an explicit **authenticated, versioned, process-neutral read boundary** projecting the following policy inputs; the consumer does not require direct Bridge SQL privileges:

| Category | Required bounded read fields / behavior |
| --- | --- |
| Identity | Server-authorized process ID/kind, service class, eligible route/capability, quota-domain ID and the exact workload/profile versions; disallow caller-chosen foreign quota scope or fake interactive elevation |
| Revision | Active desired-profile ID + monotonic activation revision, capacity-profile source/effective version, process/workload/estimator/accounting/output/safety/headroom policy version; snapshot identity/fingerprint, consistent single-version read |
| Sizing | Real workload/request structural bound (request bytes, input tokens, output reservation, qualified media estimator), independent per-request `RequestResourceEnvelope` dimensions (request, token, day, concurrency), conservatively bounded context/output overhead |
| Capacity policy | Global per-dimension known/zero/unknown RPM/TPM/RPD/concurrency and exact window semantics; approved safety headroom, interactive reserve, background allowance, lane/cap eligibility; **no fabricated single-token-number capacity** |
| Outcome | `qualified`, `inactive_or_unauthorized`, `unknown_required_dimension`, `no_usable_structural_fit`, `stale_revision` with typed reasons, not optimistic defaults |

A caller may **estimate/partition corpus** from this immutable, versioned *structural* capacity policy, but it cannot reserve tokens, infer currently remaining RPD/RPM from this snapshot, dispatch, register attempts, mutate active profiles or treat the response as permission to call a provider. The snapshot is not a provider-specific model response and never carries raw PRD content, credentials, asset bytes or secret account IDs. Active profile changes invalidate incompatible snapshots by version, never rewrite an already durable corpus plan.

**Bootstrap:** an IDSER planner may qualify a separately authorized **inactive/prospective workload envelope** for deterministic sizing with real quota-domain policy *without* activating an unqualified semantic route. This is a distinct explicitly labeled planning view; it is never an active work/admission grant. If unavailable, STOP `CAPACITY_PROFILE_BOOTSTRAP_GAP`, not a guessed capacity.

**Independently testable BSS-V2-005-05 stop:** fake **read-only consumer** can retrieve the exact coherent policy snapshot for at least two unrelated process kinds/qualified routes, select only eligible plan constraints, detect stale/unknown/zero/foreign cases and produce **zero** BSS-V2-006 attempts/reservations/jobs/provider calls. This is a CK proof obligation for -005-05 in addition to registry/plan convergence; it must not wait for SEM-CUTOVER and does not imply runtime eligibility.

## Hard Stop B — BSS-V2-006 generic operational service (proposed `RuntimeCapacityConstraint/v1` + `ProviderWorkAdmission/v1`)

BSS-V2-006 consumes the active, versioned BSS-V2-005 desired plan. Its consumer-facing surface has **two different modes**:

### 1. Read-only effective constraint/eligibility snapshot

- Supply authenticated process, route and quota-domain scope; active plan activation revision, effective-constrain/state revision, conservative per-dimension window/cooldown/clamp status, protected interactive/background eligibility and typed reason (`eligible_in_principle`, `temporarily_pressure_blocked`, `structurally_unfit`, `unknown_policy_blocked`, `inactive_or_unauthorized`).
- **No guarantee of next admission.** Read is a momentary observation; another attempt or new provider-pressure event may change availability before dispatch. Consumer never obtains an unprotected reusable permit or copies raw quota counters into its own scheduler.
- If runtime state is unavailable or a required window/reset is unknown, answer blocked/unknown conservatively. A caller may persist an immutable well-sized corpus under known structural constraints, but **must not send** provider work until actual admission. Transient exhausted RPM/RPD/TPM or cooldown changes **when** a fitting batch runs, not **how its source corpus is split**.
- The first implementation owner is BSS-V2-006-01..03 as its read/persistence/pressure source permits; BSS-V2-006-04 must validate it end-to-end rather than declaring internal runtime counters equivalent to a public read contract.

### 2. Durable work/attempt/admission and provider-feedback boundary

- **Input:** authenticated process/workload/route/quota/fairness identity, immutable source/plan/request-envelope fingerprints and BSS profile references (not source body), logical work ID, idempotency key, explicit attempt ordinal, service class selected by server, and interactive deadline/cancellation only when applicable.
- **Output:** durable typed `waiting`, `reserved`, `dispatched_or_may_have_started`, `terminal_success`, `terminal_provider_failure`, `pressure_limited`, `deadline_expired_or_cancelled`, `policy_or_resource_unfit` with replayable identity/version/fence, bounded safe reason and safe next-eligibility hint only if actually grounded. The names are conceptual; concrete wire names require versioned implementation.
- **Exclusive send authority:** BSS-owned atomic reservation/pg-boss dispatch and lease/fence authorizes **at most one** outbound provider transport per explicit attempt; a consumer/adapter cannot bypass this by reading a capacity snapshot, and BSS must reject stale/incompatible envelope/active policy before send. One 429/timeout/unknown-usage retry requires **another explicit BSS-reserved attempt** and a bounded caller/consumer retry budget; BSS never automatically changes semantic prompts or switches models.
- **Feedback:** provider adapter supplies normalized typed status, trustworthy usage if present, possible transport-start, `Retry-After` and documented limit/remaining/reset observations with source/quota-domain attribution. 429 with insufficient metadata leads to conservative scoped cooldown/probe; durable pressure clamps restrict subsequent admissions, persisted across restarts. Missing usage is not zero; unknown transmitted consumption is reconciled under approved window policy.
- **Results boundary:** BSS emits only *operational outcomes*. Semantic correctness, canonical/deferred acceptance, qualified handoff, reconciliation preparation and publish state belong **outside BSS**. A malformed JSON or semantic qualification failure must not be mislabeled as rate limiting. BSS never invents successful provider output.
- **Service class:** server-authorized interactive work bypasses background fairness when quota genuinely fits and is bounded by deadline/cancellation; background can wait durably but never borrows protected interactive reserve. Reserve cannot guarantee an answer when provider is unavailable.
- **Revisions:** a trusted enduring provider downgrade creates a new BSS-V2-005 policy version; BSS-V2-006 immediately clamps future admission and converges on that revision. In-flight work retains old auditable reservation identity; structurally unfit immutable semantic batches are returned to IDSER for **versioned replan**, not silently truncated/retried.

**Independently testable BSS-V2-006-04 stop:** use only the versioned consumer interfaces with **two independently implemented fake consumers**: a background semantic-like worker (no SEM algorithm) and an interactive chat-like request (no chatbot product). Against real isolated Bridge PostgreSQL/pg-boss and deterministic fake provider transport, prove: policy read without quota mutation, admission positive path, distinct attempts under 429+Retry-After or no metadata, unknown usage, deferred/waiting and cancellation, restart/replay/ack loss, hard interactive protection, shared-domain fairness, another quota-domain isolation, plan downgrade and incompatible structural request rejection. Assertions must include non-inert exact reservation/job/provider-send counters; inspecting only internal helper functions or static status enums is insufficient.

## Dependency order and release gates — avoid cyclic approval

1. Existing BSS-V2-005-01..04 CK PASS provides immutable policy/publishing foundation.
2. BSS-V2-006-01..03 qualify generic work, fair admission, and plan-wakeup/pressure using the approved 005-04 active-policy interface; **they must not depend on BSS-V2-005-05 CK**.
3. BSS-V2-005-05 qualifies general registry, consumer `CapacityPlanningSnapshot/v1` and true plan-convergence/wakeup against independently qualified BSS-V2-006-03. **No SEM-CUTOVER dependency.**
4. BSS-V2-006-04 integrates both BSS-V2-006-01..03 and BSS-V2-005-05 CK PASS and independently proves its read-only runtime and durable admission consumer APIs. Until then its promised hard stop is **planned**, not ready for production consumption.
5. IDSER-012-02-01 consumes **BSS-V2-005-05 planning read** (and BSS-V2-006 qualified effective-constraint read when such eligibility is required) and ends at **per-batch PlannedSemanticCorpusHandoff**. It never calls a provider, creates a reservation or depends on live SEM corpus intake for planner-only CK.
6. IDSER-012-02-03 / SEM-CUTOVER execution must consume **BSS-V2-006-04** runtime work/admission service, not merely `DesiredAdmissionProfile` data; SEM's separately authorized batch intake and qualified outcome remain additional blocking gates. Future chat/CES may reuse the same contracts after their own qualification.

**GO STOP:** If a consumer-facing contract is missing, a "read" implicitly writes reservations/counters, activation/bootstrapping requires a non-existent semantic provider job, a reservation bypass/hidden retry exists, runtime 429 pressure is only text error, or there is a cycle in dependencies, record exact blocking owner/evidence. Never claim CK PASS from this documentation-only alignment.
