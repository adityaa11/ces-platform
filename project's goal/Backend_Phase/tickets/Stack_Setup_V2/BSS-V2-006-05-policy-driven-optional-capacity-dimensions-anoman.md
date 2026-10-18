# BSS-V2-006-05 — Policy-driven optional capacity dimensions (Anoman-first, provider-neutral seam) — split map

- **State:** `planned`; **non-executable family/traceability map**. It is **not** GO, CFC, HMN authority or CK PASS.
- **Review batch:** BSS-V2-BATCH-06-05.
- **Parent:** [BSS-V2-006 durable fair external-provider runtime admission](BSS-V2-006-capability-admission-interactive-protection.md).
- **Predecessors:** BSS-V2-005-01..04, BSS-V2-005-05-01..04, and BSS-V2-006-04-01..06 must retain their independently CK-approved contracts. This is a successor extension, **not** a reopening, weakening, or reassignment of prior CK PASS findings.
- **Real input fixture:** [migration 0076 — canonical Anoman capacity](../../../../packages/atlas-db/migrations/0076_bssv200501_anoman_capacity_profile.sql); quota domain **anoman-shared-prod**, capacity profile **2026-10-18.1**, route **anoman-semantic**.
- **Cross-owner authority:** this ticket is located under BSS-V2-006 for integration and review sequencing, but **BSS-V2-005 owns** provider-profile provenance, planner policy, immutable DesiredAdmissionProfile and authenticated CapacityPlanningSnapshot; **BSS-V2-006 owns** effective constraints, operational windows, fair admission, atomic reservation, transport claims and feedback. Before implementation GO, freeze the specific authorized BSS-005 policy-interface delta and the matching BSS-006 enforcement delta. Location under BSS-006 does not by itself grant unrestricted edits to BSS-005.
- **Downstream handoff:** [IDSER-012-02-01 semantic batch planning](../Initial_Draft_Phase/IDSER-012-02-01-deterministic-semantic-batch-planning.md) (prospective read only), then [IDSER-012-02-02 semantic consumer activation](../Initial_Draft_Phase/IDSER-012-02-02-semantic-provider-profile-activation.md). This ticket **does not activate** either process or the Anoman provider route.

## Split rationale and executable children

The original leaf spans two independently owned authorities (BSS-V2-005 policy/planning and BSS-V2-006 runtime), three durable write/read contracts, SQL fairness/admission semantics, operational recovery, and cross-provider compatibility proof. A single GO → CK → CFC → HMN cycle cannot repair any one of those seams without reopening unrelated authority and evidence. The following leaves keep every requirement below as frozen family authority while making each review cycle bounded.

| Order | Executable child | Sole implementation/proof seam | Frozen review rows discharged |
| --- | --- | --- | --- |
| 1 | [BSS-V2-006-05-01](BSS-V2-006-05-01-authorized-enforcement-policy-provenance.md) | BSS-V2-005 immutable authorized enforcement-selection policy and fail-closed effective-policy derivation | RC-00605-01 |
| 2 | [BSS-V2-006-05-02](BSS-V2-006-05-02-effective-plan-publication-convergence.md) | BSS-V2-005 deterministic eligible-dimension planning, immutable DesiredAdmissionProfile versioning and existing activation/wakeup convergence | RC-00605-02 |
| 3 | [BSS-V2-006-05-03](BSS-V2-006-05-03-authenticated-effective-capacity-snapshot.md) | BSS-V2-005 authenticated planning-only reader for source and enforcement metadata | RC-00605-08 |
| 4 | [BSS-V2-006-05-04](BSS-V2-006-05-04-policy-aware-runtime-admission-fairness.md) | BSS-V2-006 effective-dimension DB admission, pressure and fair scheduling | RC-00605-03, RC-00605-04, admission portions of RC-00605-07 |
| 5 | [BSS-V2-006-05-05](BSS-V2-006-05-05-policy-revision-operational-recovery.md) | BSS-V2-006 stale-policy, replay/retry and 429 lifecycle convergence | RC-00605-05, RC-00605-06 |
| 6 | [BSS-V2-006-05-06](BSS-V2-006-05-06-provider-neutral-compatibility-regression-closure.md) | Schema-only future-provider compatibility plus full four-known-dimension and boundary regression closure | remaining RC-00605-07, RC-00605-09, RC-00605-10 |

**Dependency and completion rule:** each child retains every predecessor named above. `-05-02` requires `-05-01` CK `PASS`; planning snapshot `-05-03` and runtime admission `-05-04` both require `-05-02` CK `PASS` and may then proceed independently; `-05-05` requires `-05-04` CK `PASS`; `-05-06` requires CK `PASS` from `-05-02..05`. Only `-05-06` CK `PASS`, with the sibling evidence it names, closes this family. No child may GO until its specific BSS-V2-005 or BSS-V2-006 delta, ownership, and direct negative controls are frozen. A failure is remediated only in the leaf owning that row; it does not reopen prior independent CK findings.

**Authority preservation:** all Problem/evidence, Outcome, Scope A/B, extension seam, Frozen Review Contract, Evidence and execution gates, and Hard stop text below remains the complete, binding family contract. The child tickets allocate implementation and evidence; they do not delete, relax, reinterpret, or substitute any of those clauses. Parent references in a child mean this frozen text, including its explicit `STOP BLOCKED_AUTHORITY` condition.

## Problem / evidence anchor

Anoman's published account profile currently provides RPM=20, TPM=40,000, concurrency=25, and **RPD=unknown** because no numeric RPD is published. Migration 0076 correctly preserves that uncertainty. In the currently approved implementation:

1. apps/agents-bridge/src/capacity-planner.ts has a four-dimension knownCapacity requirement; unknown RPD prevents DesiredAdmissionProfile derivation.
2. BSS-V2-006 existing SQL admission/fairness requires four numeric vector dimensions; admission_vector_fits and dominant-resource cost divide/compare all four.
3. RuntimeCapacityConstraint/v1 expects four qualified window states; unknown/reset-less daily status blocks eligible-in-principle.
4. Anoman is not made runtime-qualified or semantically active merely by storing a ProviderCapacityProfile.

The defect is a **universal four-known-dimensions assumption**, not an error in the canonical Anoman catalogue. Do **not** substitute RPD=0, Infinity, MAX_SAFE_INTEGER, guessed RPD, a made-up daily reset, or an arbitrary Atlas daily cap.

## Outcome

Qualify a **versioned, provider-neutral enforcement-selection policy** that allows an unknown, genuinely unpublished provider dimension to be explicitly non-enforced while all independently known/required dimensions remain durable, conserved and enforceable. Use Anoman as the first real capacity-profile input (RPM/TPM/concurrency enforced, RPD unknown and explicitly not enforced). Preserve provider truth, immutable versions, BSS-005 publication/activation fencing, BSS-006 single fair admission/send lane, and conservative operational feedback.

This is **not** equivalent to a provider guarantee that RPD is unlimited. Admission eligibility means eligibility under the explicitly qualified Atlas-known policy; previously unknown hidden limits may still result in 429 and scoped cooldown/recovery.

### Proposed contract seam (shape to be frozen at GO)

A separate immutable BSS policy, **not a rewrite of ProviderCapacityProfile**, may express:

~~~json
{
  "quotaDomainId": "anoman-shared-prod",
  "providerCapacityProfileVersion": "2026-10-18.1",
  "policyId": "capacity-dimension-enforcement",
  "policyVersion": "anoman-v1",
  "dimensions": {
    "rpm": { "mode": "enforced", "limitSource": "provider" },
    "tpm": { "mode": "enforced", "limitSource": "provider" },
    "rpd": {
      "mode": "not_enforced",
      "providerState": "unknown",
      "reason": "not_published",
      "approvalRef": "<explicit-policy-authorization>"
    },
    "concurrency": { "mode": "enforced", "limitSource": "provider" }
  }
}
~~~

**Illustrative design input, not an already-implemented schema.** GO must freeze exact schema, storage owner, policy approval/provenance, validation, binding to plan version, and revocation semantics before CFC. In particular:
- Absence of a policy, a missing/invalid approval, unknown dimensions without an authorized exception, unknown accounting/reset for an *enforced* window, and foreign/stale profile/domain/route **fail closed**.
- **Known positive** provider dimensions remain enforced; **known zero** cannot become usable through an exception. Never allow a caller/client or workload to select the effective mask. Authorization is server-side, scoped to an entire effective quota domain and exact version(s).
- Do not allow conflicting masks per route/model within one shared quota domain to bypass a domain-wide known limit. Existing source and provider-limit metadata remain immutable and independently queryable.
- The effective profile must carry both actual provider-state provenance and the selected enforcement decision. An omitted dimension must not be represented as a fabricated numeric positive capacity, fictitious daily refill, or infinite denominator. If representation changes from a four-number vector, make it a versioned compatible public-contract evolution; existing qualified four-known profiles must continue to behave identically.
- Even if an RPD dimension is not enforced, an operator may log safe aggregate usage for diagnostics; that usage is **not** an RPD quota or admission ceiling.

## Scope A — BSS-V2-005 policy and planning authority

1. Resolve the immutable Anoman ProviderCapacityProfile (including activeKeyCount metadata where applicable) and an independently versioned, authorized enforcement-selection policy. Do not edit migration 0076 merely to unblock planning.
2. Derive deterministic effective eligible dimension policy and the associated background/interactive capacity/protection from only eligible, known dimensions; preserve RPM, TPM and concurrency protections, qualified workload structural bounds, estimators and output reservations.
3. Keep the approved DesiredAdmissionProfile publication/activation, historical versions, qualified-change convergence, and per-domain activation revision fence. An effective mask/approval change generates a new version and durable existing wakeup; identical input is a no-op; removed/stale approval blocks future work.
4. Project provider-state plus effective-enforcement metadata through the BSS-005 authenticated, read-only planning interface. A prospective/inactive workload may be **sized** without being activated. This ticket must not invent a direct Bridge table read or a fake consumer-only replacement for a missing production-facing read.
5. BSS-005 alone owns whether the proposed policy can be published/activated; BSS-006 must **consume**, never mint or publish, the effective policy.

## Scope B — BSS-V2-006 enforcement and runtime authority

1. Adapt the existing four-dimensional SQL resource checks, effective-capacity/pressure projection, window qualification, and dominant-resource fairness **without** an optimistic default for skipped RPD. For Anoman only the approved effective dimensions RPM, TPM and concurrency participate in capacity-fit and normalized dominant-resource cost.
2. Maintain exact, independent RPM/TPM window/accounting behavior, concurrency in-flight lifecycle, hard interactive protection, weighted background fairness, waiting-work convergence, idempotency, DB transaction fencing and pg-boss single send lane. A skipped RPD does not waive the requirement for a real RequestResourceEnvelope or excuse any enforced dimension.
3. Preserve conservative rate-limit behavior for ambiguous provider 429: scoped hold/cooldown/probe, retry budget and one fresh reservation per actual new attempt, with no invented provider daily ceiling, reset or BSS-005 publication authority.
4. Revalidate stale/changed policy revision on read, admission and wakeup. Future waiting attempts use current qualified policy; previously reserved or possibly-sent attempts keep their original immutable plan/physical-usage liability; never retroactively relabel historical work or silently send blocked attempts.
5. No provider SDK direct-send bypass, second scheduler/queue, special Anoman fairness code, new transport, or BSS-owned semantic corpus/result parsing.

## Extension seam (OpenAI / Anthropic — design compatibility ONLY)

Ensure the policy vocabulary can later identify **metric kind, accounting unit, scope/group, window/refill policy and provenance** without assuming every provider exposes exactly RPM/TPM/RPD/concurrency. Include fixture-only compatibility shapes for:
- **OpenAI-like:** shared rate-limit group across different qualified routes/models, optional published daily dimensions, versioned token accounting.
- **Anthropic-like:** independently bounded input-tokens-per-minute and output-tokens-per-minute, which cannot be represented correctly as one optimistic total TPM.

This ticket does **not** implement those provider adapters, authenticate their real accounts, activate routes, install additional enforced dimensions in production, or claim five-dimensional runtime readiness. A future GO must separately authorize generalized N-dimensional accounting/fairness/window implementation before any provider whose mandatory limits require it is enabled. The existing four-known-dimension fixture must remain fully enforced.

## Frozen Review Contract — binary pass/fail

| ID | PASS iff (include direct negative controls) |
| --- | --- |
| RC-00605-01 | Real migration-0076 Anoman profile is read with RPD still unknown and exact RPM=20/TPM=40000/concurrency=25; a separate explicitly authorized versioned exclusion is necessary to derive a usable effective policy; absent/forged/stale exclusion **blocks**. |
| RC-00605-02 | BSS-005 produces canonically repeatable effective policy, nonfabricated resource bounds and versioned DesiredAdmissionProfile; preserving all three enforced ceilings plus hard interactive protection. Known RPD remains enforced; known zero, wrong domain, unknown mandatory limit, or unqualified reset **blocks**. |
| RC-00605-03 | Actual BSS-006 DB-backed public read and admission fit RPM, TPM and concurrency independently for qualified Anoman-like fixtures; RPD is not read as an imaginary numeric budget; unknown/nonactive policy does not grant a permit. |
| RC-00605-04 | Contention between background and interactive workloads preserves fair dominant-resource ordering, borrowing, non-lendable hard interactive reserve, exact concurrency seats and atomic reservation with omitted RPD; saturation in any enforced dimension prevents a send. |
| RC-00605-05 | At-least-once wakeup/restart, retry, cancellation, ack loss and concurrent workers give exact deduplicated attempts/reservations/claims/transports; stale/removed policy blocks new sends while old in-flight liabilities persist. |
| RC-00605-06 | Ambiguous 429 while RPD is non-enforced still causes scoped conservative pressure/cooldown/recovery and does not create a fictitious daily quota or automatically republish capacity. |
| RC-00605-07 | Two routes sharing one quota domain cannot apply contradictory masks or exceed shared known ceilings; one independent domain retains isolation. Known-RPD provider fixture remains backwards compatible (including proper reset). |
| RC-00605-08 | Authenticated planning-only reader presents exact source + enforcement + structural/estimator versions for Anoman fixture with **zero** work attempts, reservations, jobs, sends or quota mutation; no direct Bridge table access and no false inactive-to-active promotion. If production callable snapshot does not exist, record an explicit BSS-005 ownership blocker, not a fixture claimed as completion. |
| RC-00605-09 | OpenAI-like shared-scope and Anthropic-like split-token descriptors are representable in separate **schema-only** fixtures; unsupported live dimensions fail closed and produce **zero** transport, without inventing OpenAI/Anthropic runtime compatibility. |
| RC-00605-10 | Approved prior 4-known-dimension BSS planning/admission regression lanes still pass; no direct provider call, Atlas truth write, Docling quota metadata, semantic batch execution, or consumer-specific BSS metadata is introduced. |

## Evidence and execution gates

- Freeze at GO: exact authority of BSS-005 policy owner, schema/version, policy approver, default-deny semantics, effective-dimension math (especially skipped-resource dominant share), window accounting/recovery, persisted plan representation, public consumer schema evolution and stale-policy fencing.
- Test through actual PostgreSQL migrations/roles, BSS-005 desired-plan publication, 03A durable wakeup, public RuntimeCapacityConstraint/v1 and ProviderWorkAdmission/v1, pg-boss claimed-transport stub and feedback; use non-inert positive controls and exact zero-delta negatives. Avoid mock-only CK for DB/worker semantics.
- Reproduce Anoman catalogue input as an immutable profile fixture, but use a fake qualified transport/route for deterministic verification; live Anoman route qualification is separate. Include one known-RPD provider fixture and one separate quota-domain fixture.
- Preserve existing dedicated tests, migration registry, rollback/restart/replay evidence and prior CK history. Add new versioned migrations rather than editing applied migration 0076 or mutating existing immutable profile rows.
- If any required BSS-005 policy/source/snapshot authority, BSS-006 effect ownership, durable accounting invariant, or permissible unknown-exclusion policy cannot be frozen: **STOP BLOCKED_AUTHORITY** with exact missing owner/contract. Do not implement partial fail-open behavior.

## Hard stop / non-authority

This **new ticket is a planned implementation proposal only**. Creating it does not run GO, CK, CFC, HMN, migrations, activation SQL or provider calls. It does **not** publish/activate Anoman DesiredAdmissionProfile, qualify/enable the Anoman route, authorize production credentials/privacy/ZDR, select a semantic model, build semantic batches, invoke SEM-CUTOVER, dispatch provider attempts, or implement OpenAI/Anthropic APIs. The real semantic activation remains under IDSER-012-02-02, after planner, qualified route, real snapshot and all other independently authorized gates.
