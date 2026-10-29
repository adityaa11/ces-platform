# BSS Quota Accounting Policy — Necessity & Implementation Audit

**Audit date:** 29 October 2026 (Asia/Bangkok)  
**Mode:** read-only audit; no application, migration, test, database, or contract change was made.  
**Scope:** `quotaAccountingPolicyId` / `quota_accounting_policy_id`, including `anoman-quota-tokens-v1`.

## 1. Executive Verdict

### **B — REDUNDANT ABSTRACTION** (high confidence)

**PROVEN:** the running BSS accounting path computes and enforces RPM, TPM, RPD, and concurrency from the request resource envelope, provider capacity limits/window policies, effective-enforcement policy, and physical usage ledger. It never resolves, reads, evaluates, or versions a quota-accounting-policy definition. The final candidate publisher only requires that the workload and provider profile carry the *same string* ([`0091_bssv20140202_shared_domain_calculated_allocation_publication.sql:174-190`](../../../packages/atlas-db/migrations/0091_bssv20140202_shared_domain_calculated_allocation_publication.sql#L174)).

**PROVEN:** no authoritative accounting-policy registry, definition schema, publisher, resolver, compatibility resolver, or executable algorithm was found in `apps/`, `packages/`, or `scripts/`. The only searched production representations are non-empty text fields, TypeScript string fields, a supplied `Set<string>`, and equality tests.

**INFERRED:** the intended safety goal—preventing a billing/weighted value from becoming TPM—remains necessary. However, it is presently enforced by strict input shapes and the four-dimension envelope, not by the accounting-policy identifier. A matching arbitrary ID cannot establish the unit semantics of either side.

Therefore this is not a recommendation to remove the field immediately. It is a conclusion that the *independently versioned policy abstraction* has no demonstrated runtime implementation. The smallest coherent future change is a separately authorized contract migration that removes the identity pair and retains/reinforces explicit unit and envelope validation.

**Contradictory evidence:** the original BSS-V2-005 tickets explicitly called for an independently versioned accounting identity and its equality is a fail-closed publication condition. That proves historical intent and a structural compatibility gate, but not executable semantics or a safety guarantee beyond the string match. See [BSS-V2-005-01:12,20-22](../tickets/Stack_Setup_V2/BSS-V2-005-01-external-quota-domain-provider-capacity-catalogue.md#L12) and [BSS-V2-005-02:33-35](../tickets/Stack_Setup_V2/BSS-V2-005-02-process-workload-envelope-catalogue.md#L33).

## 2. Historical Origin

| Finding | Evidence | Status |
|---|---|---|
| The field began in the provider-capacity catalogue at commit `84f4452b` (8 Oct). | Its first schema was a `text NOT NULL` / non-blank column, with no FK or definition table ([`0023...sql:2-18`](../../../packages/atlas-db/migrations/0023_bssv200501_provider_capacity_catalogue.sql#L2)); its TypeScript parser required only a non-empty string ([`capacity-catalogue.ts:98-124`](../../../apps/agents-bridge/src/capacity-catalogue.ts#L98)). | PROVEN |
| The workload-side field began at commit `38787e15` (15 Oct). | Same representation: non-blank text in `workload_envelope_profile` ([`0028...sql:18-30`](../../../packages/atlas-db/migrations/0028_bssv200502_process_workload_catalogue.sql#L18)) and a non-empty string parser ([`process-workload-catalogue.ts:142-151`](../../../apps/agents-bridge/src/process-workload-catalogue.ts#L142)). | PROVEN |
| The stated original problem was separation of provider quota units from billing/cost weighting. | The frozen ticket says weighted billing metadata must not become TPM without explicit accounting authority ([BSS-V2-005-01:20-22](../tickets/Stack_Setup_V2/BSS-V2-005-01-external-quota-domain-provider-capacity-catalogue.md#L20)); the workload ticket repeats that condition ([BSS-V2-005-02:33-35](../tickets/Stack_Setup_V2/BSS-V2-005-02-process-workload-envelope-catalogue.md#L33)). | PROVEN (intent) |
| No accounting algorithm, definition, or resolution process was introduced by either originating commit. | The complete first-commit diffs add parsers, text columns, and tests; no policy table/function/implementation exists. Current static search likewise finds none. | PROVEN |
| `anoman-quota-tokens-v1` first appears in the initial TypeScript fixtures/units and later in the Anoman seed commit `788c930f` (18 Oct). | The seed stores it as the capacity column value only ([`0076...sql:19-49`](../../../packages/atlas-db/migrations/0076_bssv200501_anoman_capacity_profile.sql#L19)). | PROVEN |
| No functional version change exists. | Git history for the literal has only the initial catalogue commits and the seed; no change introduces a new accounting-policy version, migration rule, or calculation. | PROVEN |
| Original acceptance tests prove shape validation, `Set` membership, and string presence—not policy execution. | Billing tests only reject unrecognised input keys ([`capacity-catalogue.test.ts:36-39`](../../../apps/agents-bridge/tests/capacity-catalogue.test.ts#L36)); the workload test only accepts/rejects membership in a caller-supplied string set ([`process-workload-catalogue.test.ts:45-52`](../../../apps/agents-bridge/tests/process-workload-catalogue.test.ts#L45)). | PROVEN |

The baseline correctly states that the retained `0076` seed is not qualification evidence or executable route authority ([`atlas_bss_pipeline_baseline_function_first_v4.md:94-109`](atlas_bss_pipeline_baseline_function_first_v4.md#L94)); this audit additionally finds that it is not evidence of an implemented accounting policy.

## 3. Complete Dependency Inventory

Static search used the exact identifiers across `apps/`, `packages/`, and `scripts/`; it found **117 textual occurrences**: 15 production/schema occurrences, 100 fixture/test occurrences, and 2 qualification-script fixture occurrences. No production occurrence is classified as `Runtime execution`, `Version resolution`, or `Authority validation` of an accounting-policy definition.

| Location | Classification; input → output | Actual behaviour and consequence if absent | Functional? |
|---|---|---|---|
| [`capacity-catalogue.ts:18-32,98-124`](../../../apps/agents-bridge/src/capacity-catalogue.ts#L18) | Parsing/storage; profile input → `ProviderCapacityProfile`. | Allows the field and requires non-empty text. It neither parses policy semantics nor consults it. Removing it breaks parser/type compatibility only. | Structural |
| [`process-workload-catalogue.ts:36-46,142-151`](../../../apps/agents-bridge/src/process-workload-catalogue.ts#L36) | Parsing/storage; workload input → `WorkloadEnvelopeProfile`. | Same non-empty validation only. | Structural |
| [`process-workload-catalogue.ts:69-76,161-175,222-232`](../../../apps/agents-bridge/src/process-workload-catalogue.ts#L69) | Supplied-set identity validation; caller's `Set<string>` + workload ID → success/error. | A caller supplies the entire “authority” set. There is no policy source or semantic operation; omission causes activation/resolution compatibility failure. | Structural |
| [`0023...sql:2-18`](../../../packages/atlas-db/migrations/0023_bssv200501_provider_capacity_catalogue.sql#L2) and [`0028...sql:18-30`](../../../packages/atlas-db/migrations/0028_bssv200502_process_workload_catalogue.sql#L18) | Storage; text column → immutable row. | Non-empty constraint only; no FK, check of ID vocabulary, or rules. Removing needs a schema migration and historical-row plan. | Structural |
| [`0076...sql:19-49`](../../../packages/atlas-db/migrations/0076_bssv200501_anoman_capacity_profile.sql#L19) | Seed storage. | Persists `anoman-quota-tokens-v1`; it creates neither approval nor policy definition. | Structural |
| [`0067...sql:101-125`](../../../packages/atlas-db/migrations/0067_bssv20050503_authorized_desired_plan_convergence.sql#L101), [`0078...sql:148-160`](../../../packages/atlas-db/migrations/0078_bssv20060502_effective_plan_publication_convergence.sql#L148), [`0091...sql:174-190`](../../../packages/atlas-db/migrations/0091_bssv20140202_shared_domain_calculated_allocation_publication.sql#L174) | Identity matching; workload ID + capacity ID → publisher accepts/rejects. | All three compare strings using `IS DISTINCT FROM`. `0091` is the effective successor publisher; no calculation receives the value. Removing loses a mismatch gate and causes migration/schema compatibility work, but does not change numeric accounting. | Structural compatibility gate |
| [`capacity-catalogue.test.ts:5-39`](../../../apps/agents-bridge/tests/capacity-catalogue.test.ts#L5), [`process-workload-catalogue.test.ts:5-52`](../../../apps/agents-bridge/tests/process-workload-catalogue.test.ts#L5), [`registered-process-policy.test.ts:8-40`](../../../apps/agents-bridge/tests/registered-process-policy.test.ts#L8), [`capacity-planner.test.ts:7-8`](../../../apps/agents-bridge/tests/capacity-planner.test.ts#L7), [`weighted-capacity-allocation.test.ts:16-23`](../../../apps/agents-bridge/tests/weighted-capacity-allocation.test.ts#L16) | Test fixtures / parser structural tests. | Use arbitrary labels (`quota-v1`, Anoman label) and do not attach a definition. | Test-only |
| Agent Bridge integration fixtures: [`calculated-capacity-snapshot-v2...:53,57`](../../../apps/agents-bridge/tests/calculated-capacity-snapshot-v2.integration.test.ts#L53), [`capacity-planning-snapshot...:59,64`](../../../apps/agents-bridge/tests/capacity-planning-snapshot.integration.test.ts#L59), [`constraint-convergence...:68,70`](../../../apps/agents-bridge/tests/constraint-convergence-structural-replan.integration.test.ts#L68), [`durable-wakeup...:88,91`](../../../apps/agents-bridge/tests/durable-wakeup-convergence.integration.test.ts#L88), [`generic-multi-consumer...:84,90`](../../../apps/agents-bridge/tests/generic-multi-consumer-compatibility.integration.test.ts#L84), [`interactive-provider...:55,59`](../../../apps/agents-bridge/tests/interactive-provider-work-admission.integration.test.ts#L55), [`model-route-authority...:47`](../../../apps/agents-bridge/tests/model-route-authority.integration.test.ts#L47), [`provider-admitted-worker...:168-171,269`](../../../apps/agents-bridge/tests/provider-admitted-worker.integration.test.ts#L168), [`provider-wakeup-worker...:52,64`](../../../apps/agents-bridge/tests/provider-wakeup-worker.integration.test.ts#L52), [`provider-work-admission...:67-68,328,434-437`](../../../apps/agents-bridge/tests/provider-work-admission.integration.test.ts#L67), [`runtime-capacity-constraint...:66,70`](../../../apps/agents-bridge/tests/runtime-capacity-constraint.integration.test.ts#L66), [`weighted-process-baseline...:45,49`](../../../apps/agents-bridge/tests/weighted-process-baseline-admission.integration.test.ts#L45), [`weighted-process-borrowing...:40,44`](../../../apps/agents-bridge/tests/weighted-process-borrowing.integration.test.ts#L40) | Test fixture. | Both corresponding columns receive the same arbitrary label so the publisher/admission setup can pass. | Test-only |
| Database integration fixtures: [`process-workload-catalogue...:12-19`](../../../packages/atlas-db/tests/process-workload-catalogue.integration.test.ts#L12), [`provider-capacity-catalogue...:13-14`](../../../packages/atlas-db/tests/provider-capacity-catalogue.integration.test.ts#L13), [`authorized-desired-plan-convergence...:45,48`](../../../packages/atlas-db/tests/authorized-desired-plan-convergence.integration.test.ts#L45), [`effective-plan-publication-convergence...:28,55,64,78`](../../../packages/atlas-db/tests/effective-plan-publication-convergence.integration.test.ts#L28), [`desired-admission-profile-publication...:22-23`](../../../packages/atlas-db/tests/desired-admission-profile-publication.integration.test.ts#L22), [`fair-admission-atomic-dispatch...:18,39`](../../../packages/atlas-db/tests/fair-admission-atomic-dispatch.integration.test.ts#L18), [`provider-work-reservation-window...:29-30,111,121`](../../../packages/atlas-db/tests/provider-work-reservation-window.integration.test.ts#L29), [`provider-route-bound-operational-runtime...:34-35,86-87,100-107,132-133,167-168,211-215,297-301`](../../../packages/atlas-db/tests/provider-route-bound-operational-runtime.integration.test.ts#L34), plus remaining fixture-only occurrences under `packages/atlas-db/tests/` returned by the audit query. | Test fixture. Values such as `quota`, `quota-v1`, and `quota-v2` have no backing policy and prove that any same string is sufficient. | Test-only |
| [`scripts/idser-012-04-07/qualify-real-data.mts:92-95`](../../../scripts/idser-012-04-07/qualify-real-data.mts#L92) | Qualification-script fixture. | Inserts the same arbitrary `qualification-quota-v1` string in each row; its actual enforcement policy is a different `provider_enforcement_policy` record. | Fixture / structural |

`0067` and `0078` remain historical definitions; `0091` replaces the public publisher and is therefore the relevant effective definition. No later migration adds a policy-definition lookup.

## 4. Actual Runtime Accounting Flow

| Stage | Effective implementation | Accounting source | Accounting-policy-ID involvement |
|---|---|---|---|
| Request construction / estimation | The SEM estimator computes token demand as input estimate + reserved output and makes it `tokenUnits` ([`complete-sem-candidate-request-estimator.ts:151-176`](../../../apps/agents-bridge/src/complete-sem-candidate-request-estimator.ts#L151)). | Estimator configuration and reserved output; four-dimension parser ([`process-workload-catalogue.ts:154-159`](../../../apps/agents-bridge/src/process-workload-catalogue.ts#L154)). | None |
| Planning | `capacity-planner` uses provider limits, an effective enforcement policy, structural input bound, and output reservation; its TPM planning cost is `maxInputTokens + maxOutputTokens` ([`capacity-planner.ts:229-280`](../../../apps/agents-bridge/src/capacity-planner.ts#L229)). | Capacity profile limits, enforcement policy, workload bound/reservation. | None |
| Candidate publication | Final shared-domain publisher binds route authority, effective enforcement mask, process/workload versions, then compares the two accounting ID strings ([`0091...sql:139-190`](../../../packages/atlas-db/migrations/0091_bssv20140202_shared_domain_calculated_allocation_publication.sql#L139)). | Effective enforcement policy and calculated allocation. | Equality only |
| Admission | `ProviderWorkAdmission/v1` accepts exactly four positive integer dimensions and passes them to BSS ([`provider-work-admission.ts:39-64`](../../../apps/agents-bridge/src/provider-work-admission.ts#L39)); SQL revalidates the same envelope and reserves it ([`0069...sql:60-99`](../../../packages/atlas-db/migrations/0069_bssv20060402_provider_work_admission_boundary.sql#L60)). | `request_resource_envelope`, active constraint/revision. | None |
| Runtime admission | Effective dimensions are derived from the enforcement policy; current usage and next envelope are tested against real vectors ([`0083...sql:5-58`](../../../packages/atlas-db/migrations/0083_bssv20060504_policy_aware_runtime_admission_fairness.sql#L5), [`0101...sql:120-153`](../../../packages/atlas-db/migrations/0101_bssv20140403_background_idle_borrowing.sql#L120)). | Enforced dimensions, profile vectors, ledger. | None |
| Reservation/window accounting | A reservation holds the per-dimension envelope in physical windows ([`0083...sql:118-153`](../../../packages/atlas-db/migrations/0083_bssv20060504_policy_aware_runtime_admission_fairness.sql#L118)). | `window_policies` and `request_resource_envelope`. | None |
| Feedback/reconciliation | Qualified feedback permits RPM/RPD settlement and reconciles reported TPM as `spent_units`, retaining a deficit when actual exceeds held; incomplete/may-have-started consumption remains held ([`0071...sql:36-75`](../../../packages/atlas-db/migrations/0071_bssv20060403_operational_outcome_feedback_projection.sql#L36)). | Provider-reported normalized usage and ledger. | None |
| Subsequent admission | Current usage sums `GREATEST(held_units, spent_units)`, adds legacy unresolved reservations, and fails closed for unsupported window semantics ([`0083...sql:72-110`](../../../packages/atlas-db/migrations/0083_bssv20060504_policy_aware_runtime_admission_fairness.sql#L72)). | Physical ledger and capacity window policy. | None |
| Planning snapshot | The v2 snapshot derives qualification from enforcement/allocation/bounds; revisions and sizing omit the quota-accounting ID ([`0107...sql:78-107`](../../../packages/atlas-db/migrations/0107_bssv201406_candidate_allocation_fingerprint_fencing.sql#L78)). | Enforcement policy, allocation baseline, structural/output bounds. | None |

**Critical verification — PROVEN:** Two otherwise identical capacity/workload profiles with two different non-empty IDs cannot publish together because of the equality predicate, but two profiles with any identical non-empty ID produce the same planner result, candidate allocation, admission vector, reservation, ledger entries, feedback reconciliation, and snapshot. There is no computational branch on the value.

## 5. Responsibility Overlap Matrix

| Component | Independently implemented responsibility | Remaining accounting-policy responsibility |
|---|---|---|
| Capacity profile | Provider RPM/TPM/RPD/concurrency values and provenance ([`capacity-catalogue.ts:18-31`](../../../apps/agents-bridge/src/capacity-catalogue.ts#L18)). | Stores label only. |
| Window policy | Fixed/rolling/token-bucket/reset semantics and parameter validation ([`capacity-catalogue.ts:74-95`](../../../apps/agents-bridge/src/capacity-catalogue.ts#L74)). | None. |
| Estimator | Computes input and prospective tokens ([`complete-sem-candidate-request-estimator.ts:151-168`](../../../apps/agents-bridge/src/complete-sem-candidate-request-estimator.ts#L151)). | None. |
| Output reservation | Bounds output and contributes to planning cost ([`capacity-planner.ts:271-276`](../../../apps/agents-bridge/src/capacity-planner.ts#L271)). | None. |
| Provider adapter | Supplies bounded qualified operational feedback ([`provider-operational-runtime.ts:146-162`](../../../apps/agents-bridge/src/provider-operational-runtime.ts#L146)). | None. |
| Admission / ledger | Holds, spends, releases, and reconciles four resource dimensions. | None. |
| Quota Accounting Policy | A string equality gate at catalogue/candidate construction. | **No demonstrated independent computational or authority responsibility.** |

## 6. Policy Definition and Versioning Findings

| Capability | Finding |
|---|---|
| Create / define / validate a quota-accounting policy | **NOT FOUND.** No table, migration, type, API, or SQL function represents an accounting policy apart from the ID fields. |
| Publish a version / choose latest compatible version | **NOT FOUND.** There is no resolver, lifecycle, FK, or version-column pair for the ID. A suffix such as `-v1` is unconstrained text. |
| Bind semantic policy to a profile | **INFERRED only.** The string is persisted in profile rows and equality is checked; it does not bind to a semantic definition. |
| Execute or preserve accounting rules across changes | **NOT FOUND.** Physical-window rows preserve capacity profile/window policy and held/spent amounts, not accounting-policy ID or implementation. |

This finding is deliberately distinct from the real **Effective Enforcement Policy**. That policy has authoritative approval/provenance and determines active dimensions; it is a separate concept, visible in the runtime check at [`0083...sql:11-42`](../../../packages/atlas-db/migrations/0083_bssv20060504_policy_aware_runtime_admission_fairness.sql#L11). It cannot be used as evidence that `quota_accounting_policy_id` has semantics.

## 7. Test Coverage vs Real Behavior

**Structural coverage — PROVEN:**

- non-empty ID parsing and test fixtures;
- supplied `Set<string>` membership;
- SQL non-null/non-blank storage;
- equality of workload and capacity profile IDs at candidate publication;
- strict parser allowlists reject `weightedTokens` and `billingWeight`.

**Behavioral coverage — NOT FOUND for accounting-policy versions:** no test demonstrates that two valid accounting-policy IDs cause different TPM calculation, reservation, provider-usage normalization, reconciliation, admission, or historical-liability result. The existing “authority” test does not resolve authority: it creates `new Set(["anoman-quota-tokens-v1"])` in the caller ([`process-workload-catalogue.test.ts:45-52`](../../../apps/agents-bridge/tests/process-workload-catalogue.test.ts#L45)).

The weighted/billing tests are still useful **parser-boundary tests**. They do not prove a policy is present: the parser rejects unsupported fields before an accounting-policy value can be interpreted ([`capacity-catalogue.test.ts:36-39`](../../../apps/agents-bridge/tests/capacity-catalogue.test.ts#L36)).

The audit executed the two relevant pure unit files without changing data:

```text
pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-catalogue.test.ts
  3 passed, 0 failed
pnpm --filter @atlas/agents-bridge exec jiti tests/process-workload-catalogue.test.ts
  5 passed, 0 failed
```

These results validate the stated structural behavior only; they are not evidence of a runtime accounting-policy algorithm. Database integration tests were inspected statically and not run, to preserve the audit's no-mutation restriction.

## 8. Hypothetical Removal Impact

| Surface | Impact classification | Finding |
|---|---|---|
| Provider and workload TypeScript types/parsers | Compilation / parser compatibility break | Field/type and allowlists must change; no numeric behaviour changes. |
| PostgreSQL profile schemas and all fixture inserts | Schema compatibility break | Two immutable historical columns require a forward migration; old rows/migrations cannot be rewritten. |
| `0091` candidate publisher | Identity check disappears | A workload could be paired with a capacity profile that formerly had a different arbitrary string. No calculation changes. |
| Runtime admission and physical ledger | Actual accounting behaviour | **No impact found.** Neither reads the field. |
| Calculated allocations and `CapacityPlanningSnapshot/v2` | Actual accounting behaviour / public contract | **No impact found.** Snapshot already omits it. Do not change snapshot API. |
| Existing tests / scripts | Fixture compatibility break | Remove or adapt dummy values and column lists; preserve all real envelope/window/feedback assertions. |
| Historical audit trail | Historical data compatibility | Keep the old columns/values through a compatible deprecation period or retain read-only historical schema; do not alter immutable history. |
| Billing-to-TPM safety | Potential regression if removal is careless | Preserve strict field allowlists, integer four-dimension envelope validation, estimator/output provenance, and explicit effective enforcement policy. The ID itself does not currently provide this protection. |

## 9. Safety and Regression Risks

1. **Do not equate removal with permission to accept weighted/billing input.** Preserve the strict parser allowlists ([`capacity-catalogue.ts:56-58,101-124`](../../../apps/agents-bridge/src/capacity-catalogue.ts#L56)) and the exact four-value admission envelope ([`provider-work-admission.ts:46-64`](../../../apps/agents-bridge/src/provider-work-admission.ts#L46)).
2. **Do not alter physical liability semantics.** The ledger carries held, spent, deficit, and state ([`0047...sql:4-17`](../../../packages/atlas-db/migrations/0047_bssv200603a_physical_window_accounting.sql#L4)); ID removal must never convert liabilities or reset counters.
3. **Do not weaken fail-closed enforcement.** Unknown/non-enforced dimensions remain governed by Effective Enforcement Policy, not this identifier ([`0083...sql:14-42`](../../../packages/atlas-db/migrations/0083_bssv20060504_policy_aware_runtime_admission_fairness.sql#L14)).
4. **Do not treat `0076` as approval.** It is a provider-profile seed, as the accepted baseline states, and is only a label-bearing row.

## 10. Recommended Minimal Change

**NO implementation in this audit.** If a future ticket is authorized, scope it narrowly:

1. Preserve the existing numerical path and public `ProviderWorkAdmission/v1` / `CapacityPlanningSnapshot/v2` contracts unchanged.
2. Establish an explicit semantic source for TPM units in the existing resource envelope / estimator-output-reservation contract, rather than a free-form accounting-policy ID.
3. Remove the two required ID fields and the `0091` equality predicate only through a forward-compatible migration plan that preserves immutable historical records.
4. Replace structural ID assertions with regression tests proving: a billing/weighted field is rejected; a normal request’s TPM is `estimated input + reserved output`; reported TPM reconciles held/spent/deficit correctly; and two otherwise identical profiles cannot change accounting merely through an unrelated label.
5. Add no registry merely to make the historical string meaningful. A registry is justified only if a separately approved future requirement introduces provider-specific accounting rules that cannot be owned by estimator, output reservation, adapter normalization, window policy, or enforcement policy.

## 11. Final GO / NO-GO / INCONCLUSIVE Recommendation

### **NO-GO for treating Quota Accounting Policy as an independently implemented, versioned accounting authority.**

The implementation does not support that claim. The appropriate planning conclusion is **B — Redundant Abstraction**, with high confidence.

### **GO for preserving the proven accounting safety path.**

Keep the request envelope, bound estimator/output reservation, provider window policy, Effective Enforcement Policy, ledger reconciliation, and strict billing-field rejection intact. Any removal/deprecation must be a new, bounded, forward-compatible contract ticket; this audit authorizes no mutation.

### Remaining uncertainties

- An external, uncommitted operational document or service could define `anoman-quota-tokens-v1`; none is referenced or invoked by this repository. Such material would not change the present runtime conclusion unless it is wired into execution.
- The intended provider semantics for every future adapter may eventually require a distinct accounting transformation. No current adapter or provider feedback path demonstrates one.
- A production database may contain historical arbitrary values beyond the checked-in seed. This does not establish semantics; it matters only to a future data-deprecation plan.
