# BSS-V2-006-03 — Quota Ownership and Accounting Architecture Diagnostic

- **Purpose:** read-only input to the pending HMN decision for `CK-001.b`.
- **Authority boundary:** this is a diagnostic, not a CFC checkpoint, implementation authorization, or HMN artifact.
- **Committed baseline inspected:** `9aac0ae8f707de9fc864cd92d4289b12e3863f05`.
- **Working-tree rule:** the only uncommitted material discussed below is reproduced as a bounded evidence snapshot in [Appendix A](#appendix-a--uncommitted-cfc-evidence-snapshot). It is not cited as approved authority, and this diagnostic does not commit it.

## 1. Executive conclusion

**Immutable selected-route binding alone is not sufficient to close `CK-001.b`.** It is necessary attribution, but the admission path must also evaluate pressure against that immutable route identity. In the committed baseline, pressure persists `route_id`, but capacity, cooldown, reservations, and usage are all evaluated by `quota_domain_id` only. A route-local observation therefore clamps every route in that domain.

The smallest safe authorized change is **Option B**:

1. persist an immutable selected route on the attempt/reservation and dispatch identity;
2. bind dispatch and feedback to that selected route; and
3. evaluate operational pressure at either the selected-route scope or the proven shared-domain scope.

This is not a generalized quota-accounting change. The approved BSS-V2-005 catalogue defines numeric capacity per quota domain; route association is not an independent route-limit ledger. Generalized shared-plus-route-local numeric accounting is therefore not a demonstrated frozen 006-03 obligation and needs separate human authority.

## 2. Authority and evidence classification

| Class | Evidence | Diagnostic consequence |
| --- | --- | --- |
| Approved contract | `9aac0ae:project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-005-01-external-quota-domain-provider-capacity-catalogue.md:10-27` | A quota domain is a server-controlled, non-secret shared-capacity identity; routes may share it. |
| Approved contract | `9aac0ae:project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-01-provider-work-reservation-window-foundation.md:15-34` | Attempt/reservation identity and per-dimension window state are durable and plan-bound. |
| Approved contract | `9aac0ae:project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-02-fair-admission-interactive-protection-atomic-dispatch.md:15-31` | Admission, reservation, and dispatch remain a single per-domain atomic boundary. |
| Frozen 006-03 requirement | `9aac0ae:project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-006-03-provider-usage-runtime-clamp-plan-convergence.md:39-46` | Pressure must affect only the evidenced provider-route/quota-domain scope and dimension/window. |
| Frozen CK finding | `9aac0ae:project's goal/feedback/BSS-V2-BATCH-06-03-9aac0ae-review.md:69-101` | `CK-001.b` explicitly requires supported route/domain scope, bounded recovery, and unaffected unrelated routes. |
| Committed implementation | `9aac0ae:packages/atlas-db/migrations/0037_bssv200603_feedback_pressure_plan_convergence.sql` | Domain-only aggregate accounting and domain-only pressure evaluation are actual implementation, not a proposal. |
| Uncommitted CFC | Appendix A only | Potential remediation evidence; never treated as approved contract or committed implementation. |

## 3. Approved ownership model

The committed TypeScript catalogue makes the ownership model explicit:

- `ProviderCapacityProfile` owns `quotaDomainId`, one `limits` vector, one `windowPolicies` set, and `associatedRoutes` (`9aac0ae:apps/agents-bridge/src/capacity-catalogue.ts:18-30`).
- Catalogue validation prevents one route from belonging to multiple domains while allowing many routes in one domain (`:121-129`).
- The planner consumes one capacity profile and produces one `DesiredAdmissionProfile` with a single `usableGlobalCapacity` vector (`9aac0ae:apps/agents-bridge/src/capacity-planner.ts:23-42`, `:85-154`).

Accordingly, **domain membership establishes the configured accounting scope only for the domain-level profile**. It does not prove that every member route has a separately owned numeric limit, and it does not provide a route-local counter.

## 4. Current persisted accounting schema and transaction flow

### 4.1 Sources of truth

| Concern | Committed table/function | Effective key/scope |
| --- | --- | --- |
| Configured capacity and policy | `bridge.provider_capacity_profile` — `0023...sql:2-16` | `(quota_domain_id, profile_version)` |
| Active plan | `bridge.active_desired_admission_profile` — `0029...sql:72-94` | `quota_domain_id` |
| Attempt | `bridge.provider_work_attempt` — `0030...sql:5-31` | `(logical_work_id, attempt_number)`; domain but no route |
| Reservation | `bridge.provider_work_reservation` — `0030...sql:35-50` | `reservation_id`; plan/envelope but no route |
| Window state | `bridge.provider_quota_window_state` — `0030...sql:55-72` | `(domain, plan, activation, dimension)`; no route |
| Runtime usage | `bridge.provider_runtime_used_capacity` — `0037...sql:37-54` | aggregate of all domain reservations and holds |
| Runtime pressure | `bridge.provider_runtime_pressure` — `0037...sql:23-35` | feedback row stores route, evaluation is domain-only |
| Serialization/fairness | `bridge.provider_admission_domain_state` and advisory lock — `0037...sql:174-188` | one domain |

### 4.2 Committed accounting behavior

`provider_runtime_used_capacity(domain)` sums both live reservation envelopes and unreleased usage-hold envelopes where `quota_domain_id = domain` (`9aac0ae:packages/atlas-db/migrations/0037_bssv200603_feedback_pressure_plan_convergence.sql:37-54`). This is correct for a genuinely shared quota, but it cannot distinguish A usage from B usage.

Reconciliation locks the attempt and reservation, fences a duplicate `feedback_id`, releases definitely untransmitted work, and otherwise converts a live reservation into a held actual/unknown vector (`0037...sql:121-152`). Transmitted RPM/RPD are retained, actual-or-reserved TPM is retained, and concurrency is set to zero in that hold.

Plan activation moves waiting work to the new plan/revision, resets fairness epoch state, and records one deduplicated wakeup without relabeling an existing reservation (`0037...sql:155-171`).

### 4.3 Important boundary defect: dimension/window release

The committed `release_provider_runtime_usage_hold` releases the *entire* held resource vector when **any** quota-window row in the same domain has passed an observed reset boundary (`9aac0ae:packages/atlas-db/migrations/0039_bssv200603_safe_hold_release_and_policy_request.sql:10-18`). It does not match the hold to a dimension, window-policy identity, or route.

Therefore, the persisted model does not yet prove correct independent RPM/TPM/RPD window release, even for domain-only accounting.

## 5. Shared versus route-local capability matrix

| Case | Classification | Evidence and conclusion |
| --- | --- | --- |
| A. Shared quota only | `REPRESENTABLE_BUT_UNPROVEN` | Domain-wide aggregation is the correct shape for truly shared A+B limits. No committed two-route shared-domain fixture proves it. |
| B. Route-local cooldown | `NOT_REPRESENTABLE` | The pressure row stores `route_id`, but `provider_runtime_admission_blocked(domain)` and `provider_runtime_effective_capacity(domain, ...)` filter only by domain (`0037...sql:56-81`). A cooldown from A blocks B. |
| C. Route-local numeric limit | `NOT_REPRESENTABLE` | An A-specific limit would be compared against A+B aggregate usage; no route usage ledger exists. |
| D. Shared plus route-local numeric limits | `NOT_REPRESENTABLE` and `NOT_REQUIRED_BY_APPROVED_CONTRACT` | Correct enforcement needs two atomically reserved constraints per attempt. The approved catalogue has one capacity vector per domain and no independent route-limit contract. |
| E. Different dimensions/windows | `REPRESENTABLE_BUT_UNPROVEN` for configured domain windows; `NOT_REPRESENTABLE` for route-scoped windows | Window rows are per domain/plan/dimension, but held usage has no per-dimension/window identity and releases as a mixed vector. |
| F. Unknown/stale pressure | `REPRESENTABLE_BUT_UNPROVEN` at domain scope | Ambiguous numeric pressure conservatively sets all domain dimensions to zero (`0037...sql:61-71`), but cannot safely isolate a route. |

## 6. Concurrency, rollback, reconciliation, and restart

### Current single-domain behavior

`admit_next_provider_work_attempt` takes `pg_advisory_xact_lock(hashtextextended(domain,602))`, locks domain fairness state, computes aggregate used capacity, chooses/locks a waiting candidate, creates the reservation, updates fairness, enqueues the job, records dispatch, and marks the attempt dispatched (`9aac0ae:packages/atlas-db/migrations/0037_bssv200603_feedback_pressure_plan_convergence.sql:174-188`). The interactive function uses the same domain lock (`:192-201`).

With two workers and one remaining **shared-domain** slot, this serializes admission: the later worker computes usage after the earlier reservation is committed and should not receive a second shared slot. Transaction rollback also removes the reservation, dispatch record, and job enqueue together.

### What this does not prove

- There is no selected route in the reservation, so the dispatch transaction cannot prove which route will be executed.
- There is no multi-constraint lock order; shared-plus-route-local numeric accounting cannot be evaluated atomically.
- Reconciliation does not take the admission advisory lock. Its reservation-to-hold replacement is transactional, but a future multi-counter model must include all affected counters and their deterministic locking in reconciliation as well.
- Restart persists attempts, reservations, holds, pressure, and plan references, but not actual transport-route attribution.

## 7. Option comparison and recommendation

| Option | Real cases supported | Unsafe/unsupported cases | Authority result |
| --- | --- | --- | --- |
| A — route binding only | Auditable attribution for a later consumer | `CK-001.b` scope isolation; route-local cooldown | Insufficient |
| B — route binding plus scoped operational pressure | Shared-domain numeric accounting; route-local cooldown/unavailability; domain scope only when shared ownership is established | Independent route-local numeric quota and layered numeric limits | **Recommended minimum** |
| C — generalized quota-constraint accounting | Independent route-local numeric limits and layered constraints | Requires a new quota-constraint contract, multi-constraint reservation, reconciliation, replay, and migration model | Defer pending explicit authority |
| D — pressure-only smaller change | None adequate | Cannot isolate pressure without immutable route identity on the admitted attempt/reservation | Reject |

### Recommendation

Authorize Option B only. It needs an additive route binding plus a pressure-scope discriminator, route-aware admission evaluation, and feedback/dispatch correlation. It must preserve:

- 006-01 attempt/reservation/plan immutability;
- 006-02 one-domain atomic admission and one-attempt dispatch;
- domain-wide numeric accounting for a proven shared quota; and
- fail-closed rejection of a route-local numeric observation when no independently owned numeric quota contract exists.

## 8. Execution boundary

The committed migration enqueues `bridge-provider-admitted-execution-v1` and provides only `claim_fake_provider_transport` (`9aac0ae:packages/atlas-db/migrations/0035_bssv200602_fair_admission_atomic_dispatch.sql:85-104`). There is no committed execution consumer outside migrations/tests.

The durable admission boundary can presently prove reservation, queueing, plan identity, and fake transport fencing. It cannot prove that a selected route is sent, cannot change after admission, or that feedback identifies the route actually transmitted. That is a later execution-integration obligation; it does not prevent a durable route-binding/pressure-scope repair for `CK-001.b`.

## 9. Required HMN decision

Approve the following bounded scope:

1. immutable selected-route binding for every admitted attempt/reservation/dispatch;
2. route-aware operational-pressure evaluation;
3. explicit distinction between `route` and `quota_domain` pressure scope;
4. preservation of shared-domain numeric accounting and existing 006-01/02 guarantees; and
5. explicit fail-closed/defer behavior for independent route-local numeric limits.

Reject treating route membership as proof of an independent numeric quota. Defer Option C until BSS-V2-005 owns an approved constraint/ownership representation. Do not reopen approved 005-01..04 or 006-01/02.

## 10. Minimum deterministic acceptance matrix

| Scenario | Production operation | Persisted evidence | Exact assertion | Authority |
| --- | --- | --- | --- | --- |
| Shared A+B domain | Concurrent admissions on route A and B | two route-bound reservations, domain aggregate usage | one admission only when one shared slot remains | Required evidence for Option B |
| Route-A cooldown isolation | Record A-scoped pressure then admit B | scoped pressure row; bound A/B attempts | A has zero dispatch; B remains eligible | Required for `CK-001.b` |
| Domain-shared cooldown | Record domain pressure | domain pressure and both route-bound attempts | both routes are blocked until authorized recovery | Required for `CK-001.b` |
| Route-local numeric limit | Admission against A-local numeric constraint | route constraint ledger/holds | compare only A usage | Future Option C only |
| Layered shared + A-local limits | Concurrent two-worker admission | ordered multi-constraint reservation records | no oversubscription, deadlock, double refund, or cross-counter refund | Future Option C only |
| Dimension/window release | Actual/unknown reconciliation and observed reset | per-dimension/window hold attribution | only the matching safe boundary releases that dimension | Required 006-03 accounting evidence |
| Restart/replay | Reconnect after pressure/probe/reconciliation | same reservation, feedback, route identities | no duplicate dispatch, probe, refund, or debt | Required 006-03 evidence |
| Plan transition | Activate new plan with in-flight reservation | old plan/route stays on reservation; waiting work rebased | one wakeup and no in-flight relabel | Required 006-03 evidence |
| Execution integration | Later consumer claims dispatch | dispatch route plus actual feedback correlation | transmitted route equals persisted selected route | Later execution checkpoint |

## 11. Direct answers

**Q1:** No. Immutable selected-route binding alone does not close `CK-001.b`; scoped-pressure evaluation is also required.

**Q2:** No. The current accounting model cannot safely enforce shared-domain plus route-local numeric limits because it aggregates all usage at domain scope.

**Q3:** Option B: immutable selected-route binding plus scoped operational-pressure evaluation, retaining one shared-domain numeric ledger.

**Q4:** Route-local numeric quotas, layered shared/local numeric constraints, generalized multi-counter reservation/reconciliation, and end-to-end execution-consumer route enforcement are optional future extensions.

**Q5:** Human authority should approve Option B, reject route-membership-as-quota proof, and defer Option C until an explicit BSS-V2-005 quota-ownership/constraint contract exists.

## Appendix A — Uncommitted CFC evidence snapshot

This appendix records current working-tree observations only. It is deliberately pasted here rather than referenced as committed implementation or committed separately.

### A.1 Files observed

```text
packages/atlas-db/migrations/0041_bssv200603_bounded_probe_remediation.sql
packages/atlas-db/migrations/0042_bssv200603_probe_admission_fence.sql
packages/atlas-db/migrations/0043_bssv200603_conservative_probe_recovery.sql
apps/agents-bridge/src/provider-operational-feedback.ts
apps/agents-bridge/tests/provider-capabilities-boundary.test.ts
packages/atlas-db/tests/provider-feedback-pressure-plan-convergence.integration.test.ts
```

### A.2 Scope observation

The proposed unknown-pressure table remains keyed by `quota_domain_id`, and the proposed blocker takes only `p_quota_domain_id`; it does not create selected-route persistence or route-local numeric usage accounting.

```sql
CREATE TABLE bridge.provider_runtime_unknown_pressure (
  quota_domain_id text PRIMARY KEY,
  ...
);

CREATE OR REPLACE FUNCTION bridge.provider_runtime_admission_blocked(p_quota_domain_id text)
RETURNS boolean ...
```

### A.3 Probe-splice concern

0041 dynamically injects `consume_provider_runtime_probe(...)` after reservation creation in both admission functions. 0042 again replaces every `RETURNING * INTO reservation;` with another call to the same consumption function. If both migrations are applied as written, the same reservation appears to be consumed twice; the second `ON CONFLICT DO NOTHING` path returns false and releases the reservation. This needs direct migration validation/correction before any CFC readiness claim.

```sql
-- 0041 injection marker
'RETURNING * INTO reservation; IF NOT bridge.consume_provider_runtime_probe(...) THEN ... END IF;'

-- 0042 replacement marker
'RETURNING * INTO reservation; IF NOT bridge.consume_provider_runtime_probe(...) THEN ... END IF;'
```

### A.4 Treatment

These observations are not authority for an architectural expansion. They neither satisfy `CK-001.b` route isolation nor justify Option C.
