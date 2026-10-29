# Atlas BSS - Operator-Managed Pipeline Baseline

**Document role:** Stable project baseline (v3: required matrices restored) for Codex and future narrowly scoped implementation contexts.
**Status:** Planning baseline with mandatory per-scope function contracts, explicit caller/handoff ownership, and honest integration-state reporting; not an implementation instruction or approval to modify code.
**Recorded evidence:** Codex read-only audit dated 2026-10-28, branch `codex/new-atlas-backend`, commit `343c9ad8b0763c7fba985892136638a31223b539`.
**Companion evidence:** `BSS_SQL_SEED_DECOUPLING_AUDIT.md`. The longer `ATLAS_BSS_DECOUPLE_REORGANIZE_ADMIN_IMPLEMENTATION_PLAN.md` is a reference and candidate roadmap, **not** a mandatory all-at-once implementation scope.

## 1. Why we are changing BSS

BSS must no longer depend on SQL-migration-seeded qualification, approval, publication, activation, or environment-declared qualified route authority. After infrastructure migrations, a fresh database should contain only the initial Anoman provider capacity profile as automatically seeded **BSS business configuration**. Authorized operators should progress the lifecycle using Atlas Admin actions, application services, and existing or successor PostgreSQL authority functions.

The work is incremental:

1. Decouple bootstrap business authority from SQL installation and other implicit defaults.
2. Reorganize code into production-capable stage functions with explicit caller, input parameters, return contracts, and handoffs.
3. Introduce missing Bridge-owned application commands, durable evidence, and read models.
4. Expose those commands through protected Admin API routes and wire Admin UI workflows.
5. Prove end-to-end progression and preserve operational admission and IDSER planning contracts.

**We are not moving all SQL logic into TypeScript.** DB authority is intentional and remains necessary.

## 2. Lifecycle to preserve

```text
Provider Profile
  -> [Model/Route Proposal]
  -> Qualification
  -> Route Authority
  -> Policy Approval
  -> Process/Workload Configuration
  -> Allocation Preview
  -> Candidate Publication
  -> Release Approval / Attestation
  -> Activation
  -> Runtime Admission
```

Related planning-only branch:

```text
Qualified candidate (including productionActive=false) or consistent active plan
  -> BSS CapacityPlanningSnapshot/v2
  -> authenticated IDSER v2 consumer
  -> semantic structural-fit batch plan
```

A qualified planning snapshot is not an admission or provider-execution permit. Fair Admission requires active authority. A candidate is not an active profile.

## 3. Stable separation of responsibilities

| Boundary | Owns | Must not do |
|---|---|---|
| Atlas Admin UI | Display lifecycle state, request actions, show errors/history | Directly mutate Bridge tables or manufacture evidence |
| Atlas Admin API | Verify human Better Auth session and operation permissions; validate operator intent; call authenticated Bridge service | Treat a browser session as Bridge service identity |
| Bridge BSS application services | Stage-specific command validation, orchestration, idempotency, evidence and read-model access | Bypass DB constraints or convert planning reads to execution permits |
| PostgreSQL BSS authority | Immutable rows, provenance, exact version/tuple binding, atomic publication, activation epoch, concurrency fences, Fair Admission | Automatically issue operational approvals just because a migration or process started |
| Provider qualification runner | Execute explicitly authorized bounded probes; record verifiable outcomes | Implicitly authorize production execution |
| Runtime Fair Admission | Consume only active, route-bound authority; reserve/account atomically | Publish qualification, approval, candidates, or activation |
| BSS snapshot + IDSER | Read qualified candidate/active planning evidence; bound batch sizing | Substitute an IDSER-owned capacity ceiling or authorize sends |
| Release/promotion authority | Independently attest an exact release candidate according to release policy | Let candidate publication self-attest or allow an Admin button to bypass release gates |

## 4. Fresh-install target and historical-upgrade rule

Immediately after all schema/infrastructure migrations on a disposable fresh database:

- The only seeded BSS business configuration is the Anoman profile from `0076`.
- Qualification evidence, qualified route authorities, policy approvals/policies, process/workload profiles, calculated plans/candidates, release attestations, active pointers, activation history, and admission runtime records are empty.
- Schema objects, migration history, authentication infrastructure, Admin bootstrap coordination, database roles/grants/triggers, and required internal infrastructure remain available.
- Missing authority is a valid *unconfigured* state: rejected operations fail closed; unrelated Admin/Bridge functions should still start where appropriate.
- Existing databases must retain valid historical records. No destructive cleanup and no silent rewrite of already-applied migration history.

The migration-runner strategy for serving both fresh installations and existing installations is **not yet decided**. It is an explicit early design gate. A successor migration alone cannot undo `0077`'s already-run immutable seed on a zero-to-current migration path.

## 5. Evidence-backed starting diagnoses (not implementation assumptions)

- `0076` seeds the allowed Anoman capacity profile; its association has only `routeId` and `providerId`.
- `0077` automatically inserts Anoman enforcement policy approval and policy (not allowed as a fresh-install authority decision).
- `0090` qualified-route publisher requires additional model/adapter/qualification/capability tuple fields and compares account alias against provider ID. First-route publication from the minimal seed fails.
- `provider-operational-runtime.ts` currently publishes route authority as part of binding execution work; publication belongs in a pre-runtime operator stage.
- Admin currently has auth, sign-in, dashboard, and identity but no complete BSS operator workflow endpoints.
- Shared-domain v2 activation is deliberately fenced in `0091`; release-attestation authority and guarded successor activation are not yet implemented.
- Current BSS v2 snapshot SQL uses `min(process baseline TPM, max context tokens)` for `sizing.maxEligibleCompleteRequestTokens`. The authenticated IDSER consumer must validate complete input plus output reservation against the ceiling. `readIsNotAdmissionPermit` stays true.

These findings came from the attached Codex audit, including a disposable PostgreSQL migration run through `0111`. They must be rechecked against the branch/commit when a scoped task executes.

## 5A. Required code classification and file ownership matrices

**These two matrices are part of the permanent baseline and MUST be consulted for every scope.** They describe the full lifecycle classification and proposed organization; they do not authorize implementing all groups simultaneously. The labels A00-A13 are stable group identifiers, not a ticket list.

- **Current anchors** are existing source/SQL identified by the 2026-10-28 Codex audit; verify against the current working branch before implementing.
- **Target entry points and destinations are proposed**, not claims that their functions/files already exist. Names are provisional until a narrow implementation scope locks its typed callable contract.
- For each scoped stage, define the **actual exported function and typed parameters**, who calls it (current or planned), the **actual return/handoff contract**, and which stage consumes it, applying Section 6. Do not substitute fixture-only contracts. A live Admin endpoint is NOT required in a function-only scope.
- The **A03 -> A01 successor -> A04** loop is intentional: the original Anoman seed remains immutable; qualification can establish verified evidence for publishing an updated, fully qualified profile version before route authority publication.
- The **A08 -> A12 -> A13** planning-only branch may operate from a qualified candidate without A09/A10 activation; it never authorizes provider execution.

### Matrix 1 - Lifecycle classification, function entry points, authority, and output handoffs

| ID | Group / owner | Clean entry point (target) | Must read / validate | Atomic authoritative write or output | Next handoff |
|---|---|---|---|---|---|
| A00 | Admin command gateway / Atlas + Bridge | Admin API -> authenticated Bridge operator command | Better Auth admin + persisted Admin authorization; command-specific permission; internal service identity | Operator command audit/idempotency state | Authorized commands to A01-A10 |
| A01 | Provider profile / BSS | `ProviderProfileService.publishVersion` | Existing domain/profile, capacity provenance, immutable version, account alias | `bridge.provider_capacity_profile`; Anoman `0076` seed retained | A02 configuration and A03 qualification |
| A02 | Model/route proposal / BSS | `ProviderRouteProposalService.saveDraft` | Registered provider adapter/capability; account/domain; model and proposed route identity | Proposed durable route configuration only (**NEW design**); no qualified authority | A03 probe input |
| A03 | Qualification / BSS | `ProviderQualificationService.requestRun` and `completeRun` | A01 capacity identity, A02 route proposal, known adapter, bounded permission/policy | Durable qualification request, outcome, evidence hash/reference (**NEW design**) | A01 *successor* fully qualified profile association, then A04 |
| A04 | Qualified route authority / BSS | `QualifiedRouteAuthorityService.publish` | Exact A03 evidence and A01 successor association; correct provider ID vs account alias | `bridge.publish_qualified_provider_route_authority(...)` and immutable `authorityVersion` | A05 approval; A08 route binding |
| A05 | Enforcement policy approval / BSS | `EnforcementPolicyService.approve` / `revoke` | Approved operator; exact profile/version/route; dimension decisions and exclusions | `bridge.provider_enforcement_policy_approval`, policy, revocation; `derive_effective_enforcement_policy` verifies | A07 allocation; A08 candidate checks |
| A06 | Process/workload catalogue / BSS | `ProcessWorkloadService.publish` | Process kind/service class/route eligibility; workload structural/output/estimator/safety policy | Immutable `bridge.workload_envelope_profile`, `bridge.provider_process_profile` | A07 planner and A12 sizing |
| A07 | Allocation preview / BSS | `CapacityPreviewService.preview` | A01, A04, A05, A06 records, expected active revision, class policy | Pure calculated result + preview fingerprint; **no authority mutation** | A08 exact publish payload |
| A08 | Candidate publication / BSS | `CapacityCandidateService.publish` | Recompute/pin exact source versions, route authorities and policy; expected revision/fingerprint | `bridge.publish_shared_domain_calculated_desired_admission_profile(...)` creates immutable plan/allocation/bindings/candidate in one DB transaction | A09 release review; A12 candidate snapshot |
| A09 | Release approval/attestation / release owner | `ReleaseAttestationService.attest` | Exact A08 candidate identity and proof; release policy/approver; cutover tests | Immutable version-bound release attestation (**NEW authority**) | A10 activation |
| A10 | Activation / BSS | `CapacityActivationService.activate` | A09 valid non-revoked attestation, candidate digest, expected current revision, parent release gate | Authorized successor of `bridge.activate_desired_admission_profile` preserves atomic epoch and active pointer | A11 admission; A12 active snapshot |
| A11 | Fair admission / runtime only | Existing `ProviderWorkAdmission/v1` | **Active** desired plan, bound qualified route, pressure/window/process baseline | Existing atomic reservation, dispatch, feedback and usage | Provider transport; operational accounting |
| A12 | Snapshot producer / BSS read-only | `createCapacityPlanningSnapshotReader` -> SQL | Qualified candidate **or** consistent active plan; exact principal, policy, allocation, fingerprint | `CapacityPlanningSnapshot/v2`; includes `maxEligibleCompleteRequestTokens`; never permit | A13 IDSER |
| A13 | IDSER capacity/semantic planner | `createIdserCapacityPlanningSnapshotV2Consumer` -> batch job | Complete request estimate + A12 immutable identity/revisions/sizing | `READY`/`REPLAN`/`BLOCKED` batch plan; not a send permit | Downstream execution governed separately by A11 |

### Matrix 2 - Current code and SQL -> proposed ownership and refactoring

Paths relative to `apps/agents-bridge/src/` unless absolute. SQL migrations remain in `packages/atlas-db/migrations/`.

| Group | Current code and SQL anchors | Proposed owner / entry file | Refactor action |
|---|---|---|---|
| A00 | `apps/atlas/lib/admin-guard.ts`, `app/api/admin/identity/route.ts`; `app.ts`, `main.ts`, `config.ts` | Atlas `lib/bss-admin-client.ts` + API routes; Bridge `bss/operator/command-gateway.ts` | **New** S2S command boundary; keep composition and Admin session separate |
| A01 | `capacity-catalogue.ts`; `0023`, `0076` | `bss/provider-profile/profile-service.ts`, `profile-catalogue.ts` | Retain parser, add successor publisher/read model; keep Anoman seed |
| A02 | `route-registry.ts`, `config.ts`, `providers/*`, `capacity-catalogue.ts` | `bss/route-configuration/route-proposal-service.ts` | Split non-executable proposal from env deployment adapter inventory; do not publish qualified authority here |
| A03 | `live-gemini-qualification.ts`, `live-gemini-qualification-core.ts`, `live-mistral-qualification.ts`, `live-mistral-qualification-core.ts`, adapters | `bss/qualification/qualification-service.ts` and provider-specific runners | Keep bounded tests; add job/evidence authority and first-provider bootstrap path |
| A04 | `provider-operational-runtime.ts:87-127`; `0088`-`0090` | `bss/route-authority/route-authority-service.ts` | Extract lazy publication from runtime; publisher called only from authorized lifecycle command; bind at execution by existing authorityVersion |
| A05 | `0077` approval tables/deriver; policy types in `capacity-planner.ts` | `bss/enforcement-policy/policy-service.ts` | Remove fresh-install approval seeding, add audited operator approve/revoke commands; preserve derivation |
| A06 | `process-workload-catalogue.ts`; `0028` | `bss/process-workload/catalogue-service.ts` | Keep validation; add explicit immutable publisher and read repository |
| A07 | `capacity-planner.ts` | `bss/allocation/allocation-planner.ts`, `capacity-preview-service.ts` | Pure planner remains pure; read durable upstream authority before preview; no DB write |
| A08 | `0091`-`0094`, `0029` (historical foundation), `0067`,`0078`-`0081` (historical publishing) | `bss/candidate-publication/candidate-service.ts` | Add command and result reader, keep current v2 SQL publisher; do not resurrect dropped publishers |
| A09 | No release attestation authority found; `0091` parent release fence | `bss/release-attestation/attestation-service.ts` | **New** durable release approval/attestation mechanism with independent authorized release owner |
| A10 | `0029`, `0091`,`0095`,`0096` activation and repair definitions | `bss/activation/activation-service.ts` | **New successor** guarded activation SQL; old parent fence retained until authorized closure |
| A11 | `provider-work-admission.ts`, `runtime-capacity-constraint.ts`, `provider-operational-runtime.ts`, `provider-admitted-worker.ts`, `provider-wakeup-worker.ts`; `0083`,`0098`-`0102` | `bss/admission/*`, `bss/operational-runtime/*` | Move execution-only code without semantic changes; remove route publication side effect |
| A12 | `capacity-planning-snapshot.ts`; `0097`,`0106`,`0107` | `bss/planning-snapshot/snapshot-reader.ts` | Preserve server principal, candidate/active selection, non-permit and BSS sizing formula |
| A13 | `idser-capacity-planning-snapshot-v2.ts`, `idser-capacity-planning-snapshot-v2-composition.ts`, `idser-structural-fit-corpus-partition.ts`, `complete-sem-candidate-request-estimator.ts`, `idser-semantic-batch-plan-job.ts` | `idser/capacity/*`, `idser/batch-planning/*` | Preserve v2 consumer, worker injection and request estimation; relocation only |

**Location rule:** Keep `apps/agents-bridge/src/app.ts`, `main.ts`, `config.ts`, `worker-main.ts` as thin runtime composition/transport entry points. BSS authority code lives under `bss/`. IDSER code lives under `idser/`. Admin route handlers in `apps/atlas` must never directly own Bridge SQL. Do not move historical migrations or change public API versions as a consequence of moving files.

## 6. Mandatory function-first entry-point and handoff contract rule

**This rule applies to EVERY scoped implementation. "Clear entry point" means a clearly defined production-capable function and its required parameters; "clear handoff" means the exact data contract that function returns or persists for the next caller. It does NOT mean every scoped function must already be attached to a live HTTP route, UI, worker, or downstream service.**

The reorganization builds the pipeline incrementally. Each stage should be implemented as a reusable function/application service that is **ready to be called by real production code**. The actual Admin API, UI, worker, or downstream caller can be wired in a later authorized scope.

### 6.1 Function as the primary stage boundary

Each implementation scope MUST identify or implement a named function (or a service exposing named functions) with a typed, explicit contract. Its shape should be equivalent to:

```ts
// Illustrative only: do not copy this generic contract into every stage.
export async function executeStage(
  input: StageInput,
  dependencies: StageDependencies,
): Promise<StageResult> {
  // Real validation and stage behavior, with production-capable dependencies.
}
```

For each stage Codex MUST declare:

1. **Function entry point:** exact exported function/service name and code path; what operation it owns; how production code will import/invoke it.
2. **Who calls it:** the actual upstream caller when one exists, or the **planned caller and the pending integration scope** when it does not (for example, a protected Admin API handler). Do not invent or register an endpoint solely to claim this function is wired.
3. **Input parameters:** exact TypeScript type/schema, required fields, identity/version/evidence, optional fields, validation, authorization context or trusted server principal, and expected predecessor data. Avoid generic unvalidated `any` or loosely shaped JSON.
4. **Dependencies:** database repository, transaction runner, adapter/qualification runner, external client, and authentication/authorization mechanism as applicable. Dependencies may be injected for tests but must have a real production-compatible implementation or a clearly named later integration prerequisite. Do not hide authority in global state or fixtures.
5. **Function behavior:** deterministic validation/decision rules; write/read boundary; idempotency, locking, concurrency, fail-closed handling, and SQL authority checks when relevant.
6. **Output/handoff contract:** exact return type/schema and status/error variants; durable references, versions, fingerprints and other fields required by the next stage. Specify which next function consumes the output and the exact transformation, if any; do not rely on untyped implicit handoffs.
7. **Integration status:** whether a real caller/consumer is connected **now**, or is planned for a later scope. Be precise about what remains unwired.

### 6.2 Isolated tests and dummy data ARE allowed

**Isolated unit/contract tests using dummy or fixture data are acceptable, including as the main verification for an intentionally function-only scope.** They do not, by themselves, make a scope NO-GO.

The acceptance requirement is that the **implemented function is production-capable and reusable**, and the test data follows the **same input and output contract that real callers and consumers will use later**.

Tests MUST:

- Call the **same exported stage function** intended for production. Do not implement a separate test-only workflow that the application will never use.
- Supply dummy inputs matching the real `StageInput` schema, including representative domain identities, versions, qualification/approval evidence and authorization context when relevant.
- Assert the real `StageResult` shape, including status/error cases, durability identifiers, revisions and fingerprints when applicable.
- Verify that a proposed next-stage consumer can accept that result contract, by a typed contract fixture/consumer test if the real downstream stage is not yet implemented.
- Use mocks/fakes for injected dependencies when appropriate, while keeping their interfaces identical to production dependency contracts. **Do not mock away the validation or authority behavior that the current scope is supposed to implement.**
- Test rejected, missing, stale, mismatched, and repeated inputs as relevant to the scope.

A database-mutating scope should also exercise its real SQL boundary using a disposable database **when that database boundary is part of the scope**. A later Admin-wiring scope must verify that the real route invokes the same function. Neither requirement forces unrelated downstream services or UI into the current scope.

**Dummy data is permitted; dummy contracts are not.** The data may be synthetic, but its structure, types, semantics, constraints and error states must match the planned production handoff.

### 6.3 Distinguish function completion from integration completion

Use these evidence-based statuses; do not demand FULLY WIRED for every incremental scope:

- **CONTRACT-READY / FUNCTION IMPLEMENTED:** Production-capable function exists, exact input/output contracts are defined and tested (isolated dummy/fixture testing is acceptable), authority/dependency boundaries relevant to this scope are real, and the future caller/consumer is documented. No claim that a route or downstream stage is integrated yet.
- **CALLER-INTEGRATED:** A real application entry point (Admin route, internal service, worker, startup, or migration runner) invokes that function and the invocation is tested. Downstream consumer may still be pending.
- **HANDOFF-INTEGRATED / END-TO-END:** The caller, current function, and actual next-stage consumer are connected and exercised at the scope's intended boundary. Full production-lifecycle completion is not implied unless that entire lifecycle was tested.
- **NO-GO / TEST-ONLY:** Implementation is just a fixture helper or mock workflow, has no viable production implementation/dependencies, accepts/returns a contract incompatible with intended real callers, bypasses required authority, or claims unbuilt wiring as complete. **An isolated test alone is NOT a NO-GO reason.**

A scoped task may legitimately finish as **CONTRACT-READY**, and a later scoped task may focus only on making it **CALLER-INTEGRATED**. This is intentional and avoids scope creep.

### 6.4 Scope boundaries and UI timing

- Do not expand the current scope to implement an Admin route/UI simply because a function lacks a registered caller. Record the intended route/caller as a future integration dependency.
- Do not add a second implementation of a stage when UI wiring begins. The Admin handler must call the **same stage function** (through an authenticated Bridge boundary where appropriate) that the isolated tests already validated.
- The browser must not directly mutate Bridge-owned SQL tables, submit fabricated approval/qualification evidence, or use a Better Auth session as service-to-service authorization.
- A function meant for future production execution must be implemented in the real source tree and carry production-safe validation and authority checks, even when it is currently called only from tests.
- Do not claim that a function is currently invoked in production when its caller is still planned.
- No legacy seed-driven or environment-declared authority path may be kept as an alternate production bypass merely to ease the transition.

### Stage acceptance evidence format

Every scope completion report MUST include:

| Evidence | Required answer |
|---|---|
| Function entry point | Real source path + exported function/service name + owned operation |
| Caller | Current real caller, OR explicit future caller and pending wiring scope |
| Input contract | Named type/schema + parameters, identities, evidence, revisions and validation |
| Dependencies/authority | Interfaces + production dependency strategy + DB transaction/SQL checks if in scope |
| Function behavior | Real stage logic, idempotency/concurrency/error handling where applicable |
| Output/handoff | Named return type/schema + statuses + durable IDs/revisions/fingerprints + next consumer |
| Contract tests | Same production function called using synthetic inputs with **production-compatible** types/shapes; failure cases |
| Database/integration tests | Actual SQL/route integration when part of the authorized scope; otherwise explicitly pending |
| Completion status | CONTRACT-READY / CALLER-INTEGRATED / HANDOFF-INTEGRATED / NO-GO, with honest evidence |

**Exception for migration-only scopes:** The migration runner is already the real entry point. Its applied SQL and resulting schema/data state are the handoff; verification should use the actual runner on disposable PostgreSQL, not only a fixture setup. This exception does not force qualification services or Admin routes into the bootstrap scope.

## 7. Clean handoff contract for every lifecycle stage

For each stage, the scoped work context must define:

- **Function entry point:** exported name, owner, parameters and production invocation shape; a live HTTP route is not required until its wiring scope.
- **Caller:** actual function/service caller if implemented, otherwise named planned caller and pending wiring dependency.
- **Inputs:** named type/schema with exact identity tuple, source version, upstream evidence, authorization and allowed state.
- **Validation:** provenance, candidate/current revision, expiry/revocation and fail-closed outcomes.
- **Dependencies/write boundary:** injected production-compatible repositories/adapters, DB operation/transaction owner and immutable/idempotent persistence; or explicitly read-only preview.
- **Return/handoff:** named result type, statuses, durable identifier/revision/fingerprint and all fields required by the next stage.
- **Next consumer:** actual or planned consuming function, with schema/type parity and explicit integration status.
- **Read model:** later Admin UI's status/history contract; browser must not access private SQL directly.
- **Tests:** isolated tests with synthetic production-shaped inputs/outputs are valid; include positive and negative contract cases, plus real DB/HTTP integration when that boundary is the authorized work scope.

Do not freeze exact Admin URLs or table names in this baseline. Those are defined and verified in their respective narrow implementation contexts.

## 8. Implementation sequencing principles

- Start with the **fresh-install authority seed boundary** before attempting operator-created authority from a clean database.
- Next resolve **Anoman profile/route qualification bootstrap**, including durable evidence and immutable successor profile semantics. Do not invent qualification fields in `0076`.
- Isolate lifecycle responsibilities from execution-time binding; do not move a function without preserving callers and behavior.
- Add production-capable, typed application-stage functions before wiring their Admin routes/UI. Isolated contract tests with dummy data are sufficient for a function-only scope; attach real callers and consumers in separately authorized integration scopes.
- Candidate-only publication and planning snapshot qualification can be verified *before* release attestation and activation.
- Treat release attestation plus guarded activation as an independent later workstream, requiring its own authorization design and testable contract. Never remove the activation fence in an unrelated scope.
- Preserve `ProviderWorkAdmission/v1`, fairness/borrowing constraints, and `CapacityPlanningSnapshot/v2` without accidental legacy fallbacks.

## 9. Known design decisions not yet authorized

- **D1:** Fresh-install migration baseline mechanism and historical-upgrade compatibility.
- **D2:** Qualification-only bounded execution and durable evidence model; first-provider bootstrap without active admission.
- **D3:** Immutable profile successor and provider-ID/account-alias identity semantics.
- **D4:** Enforcement policy approval permissions and revocation governance.
- **D5:** Process/workload version selection rules.
- **D6:** Independent release attestation owner, eligibility, evidence schema, and guarded successor activation.
- **D7:** Admin-to-Bridge service authentication, audit provenance, idempotency and operation result shape.
- **D8:** Safe runtime cutover from environment route selection to DB-authorized route read models.

An implementation may expose new evidence that changes the proposed design. Update only the relevant decision and tested contract after review; do not rewrite unrelated lifecycle contracts in that work scope.

## 10. How Codex should use this baseline

For every future work scope:

1. Read this baseline, including BOTH required matrices in Section 5A, to understand the target lifecycle, code ownership, function entry points, and invariants.
2. Read a **separate small implementation context** for only the current task.
3. Inspect the current branch/code and relevant audit evidence. Report discrepancies before expanding scope.
4. Modify only files and contracts authorized by that task; retain unrelated blockers and fences.
5. Report observed results, tests, changes, uncovered constraints, and proposed next scope **using the Stage acceptance evidence ledger in Section 6**. An isolated contract-tested, production-capable function may be declared CONTRACT-READY; do not mislabel it CALLER-INTEGRATED or END-TO-END before wiring exists.
6. Do not use the two matrices or the long roadmap as blanket authorization to implement downstream stages.

**Scope tickets/contexts are written one at a time. This baseline is not an execution ticket.**

## 11. First scope candidate (discussion only; no implementation authorized)

**Fresh-DB bootstrap / SQL seed authority boundary.** Establish the safe fresh-install versus existing-upgrade migration strategy and regression criteria for eliminating `0077`'s automatic approval/policy insertion while retaining `0076` Anoman profile and all SQL schema/validation authority. The first scoped context should be narrow and should not touch qualification, route publishing, Admin APIs/UI, release attestation, activation, or admission.

Decide whether to do this as (a) a small proof/test-and-strategy scope followed by an implementation scope, or (b) one constrained bootstrap implementation scope only if migration compatibility is already fully understood. Neither option is authorized by this baseline alone.
