# BSS-QAP-001 publisher blocker-resolution addendum

**Date:** 2026-10-29 (Asia/Bangkok)
**Mode:** read-only investigation and bounded planning amendment
**Authority amended:** BSS-QAP-001 source audit, §§1–8 and 11–12
**Implementation / DDL:** not performed by this addendum

## Decision

**B — Supported publisher.**

`bridge.publish_converged_desired_admission_profile(text,bigint,text,text,timestamptz,jsonb,jsonb)` is an accepted Bridge-owned publication entry point, not a test-only remnant. It was introduced in `0067_bssv20050503_authorized_desired_plan_convergence.sql` under BSS-V2-005-05-03, and its convergence contract was independently CK-passed in `BSS-V2-BATCH-05-05-03-e4d07b5-verification.md`. Its real-worker wakeup composition was CK-passed in `BSS-V2-BATCH-05-05-04-e76e43f-review.md`.

The BSS-QAP audit's statement that `0091` was the sole effective publisher was therefore incomplete. R1 may resume only under this addendum: `0112` must redefine **both** supported publishers and remove only the obsolete accounting-policy equality predicate from each. The migration must not retire, grant, re-own, or otherwise broaden either entry point.

## Discovered dependency and complete effective inventory

The `atlas_dev` preflight inspected `information_schema.columns`, `pg_depend`, `pg_views`, `pg_proc`, and `pg_trigger` before DDL. It found the two target columns, their inline nonblank checks and NOT NULL constraints, their immutable-row triggers, and two installed procedural bodies containing `quota_accounting_policy_id`:

| Installed function | Introduced / final source | Purpose after inspection | R1 treatment |
| --- | --- | --- | --- |
| `bridge.publish_converged_desired_admission_profile(text,bigint,text,text,timestamptz,jsonb,jsonb)` | `0067`; no later replacement or drop | qualified effective-input convergence, immutable desired-plan creation, direct 005-04 activation and wakeup | Explicit canonical replacement; remove only the accounting-ID equality operand. |
| `bridge.publish_shared_domain_calculated_desired_admission_profile(text,bigint,text,text,timestamptz,jsonb,jsonb,jsonb,jsonb)` | `0091`, with `0093`/`0094` alias repairs | shared-domain calculated candidate publisher | Explicit canonical replacement carrying both alias repairs; remove only the accounting-ID equality operand. |

No installed view, non-internal trigger, or `quotaAccountingPolicyId` procedural body was found. `pg_depend` reported no procedural-body dependency for either function, which confirms why it is insufficient for this preflight; PL/pgSQL body inspection is mandatory. Repository migration inspection likewise finds the current live references in `0067` and `0091`; historical `0078` is not an installed effective function after the successor chain.

The original audit missed `0067` because its historical-publisher review followed the `0091` dropped `publish_effective_policy_converged_*` functions, but did not inventory the separately named convergence publisher that `0091` neither replaces nor drops.

## Actual ownership, callers, and authority

Live-catalog inspection recorded the following facts:

| Function | Owner / execution model | Grant | Authority result |
| --- | --- | --- | --- |
| `publish_converged_desired_admission_profile` | `agents_bridge`; invoker security; no fixed search path | `agents_bridge EXECUTE`; no PUBLIC grant | It creates immutable desired-profile/convergence records and directly calls `activate_desired_admission_profile`. |
| `publish_shared_domain_calculated_desired_admission_profile` | `atlas`; `SECURITY DEFINER`; `search_path = pg_catalog, bridge` | `agents_bridge EXECUTE`; no PUBLIC grant | It publishes an immutable candidate only; it does not invoke activation. |
| `activate_desired_admission_profile` | `agents_bridge`; invoker security | `agents_bridge EXECUTE` | It is the established 005-04 activation and wakeup seam. It rejects the newer shared-domain candidate marker at the parent cutover gate. |
| `resolve_versioned_planning_envelope` | `agents_bridge`; invoker security | `agents_bridge EXECUTE` | Read-only stale/unfit/qualified observation; it does not reference either obsolete column. |

No application-source, scheduled-worker, or operational-script invocation of `publish_converged_desired_admission_profile` was found. Its direct repository callers are `packages/atlas-db/tests/authorized-desired-plan-convergence.integration.test.ts` and `apps/agents-bridge/tests/durable-wakeup-convergence.integration.test.ts`. Those are not disposable fixture dependencies: their CK-passed evidence protects deterministic identical-input handling, stale-writer fencing, immutable history, qualified lower-capacity recomputation, one durable wakeup/claim, replay idempotence, fairness reset, and preservation of in-flight reservation identity. They exercise the real Bridge worker composition, not an alternate production caller.

The function is therefore a supported database entry point even though the repository has no current TypeScript production caller. Its continued callable surface is intentional under the accepted 005-05 path; its authority is different from, not a bypass of, the later shared-domain candidate path. The latter cannot substitute for it: `activate_desired_admission_profile` deliberately blocks profiles marked `shared_domain_calculated_allocation/v2` until the separate parent cutover. Retiring the convergence publisher or redirecting its coverage would require independent authorization for a replacement active-plan/wakeup authority. This addendum does not grant that work.

## Nullable-column analysis

PostgreSQL `a IS DISTINCT FROM b` returns `false` when both operands are `NULL`. Consequently, after R1 drops both NOT NULL constraints, leaving the `0067` predicate unchanged would accept a NULL/NULL workload-capacity pair and allow the supported convergence publisher to create and activate a plan. That is not a safe accidental compatibility behavior: it would leave one supported publisher with an unreviewed R1 contract.

This amendment makes the behavior deliberate and bounded. R1 removes the predicate from `0067` as well as `0091`, so the supported convergence path accepts both legacy nonempty values and ID-free NULL values. It retains every other `0067` condition: complete input, advisory lock, known non-zero four dimensions, exact process/workload version binding, active flags, route membership, expected-activation-revision fence, canonical fingerprint, immutable inserts, and the existing activation/wakeup seam. It does not add a caller, role grant, `SECURITY DEFINER`, candidate marker, resolver, default ID, or new activation route.

## Exact release treatment

### R1 — amended BSS-QAP-001 scope

`0112_bssv2_quota_accounting_policy_deprecation` remains the only new registered migration and must:

1. Drop NOT NULL only from the two obsolete columns, preserving their nonblank checks and rows.
2. Define the final `0091 + 0093 + 0094` shared-domain publisher explicitly, removing only its accounting-ID equality operand and preserving signature, definer settings, owner, grant, aliases, and all remaining guards.
3. Define the final `0067` convergence publisher explicitly, removing only its accounting-ID equality operand and preserving its signature, owner, grant, direct activation behavior, and every listed convergence/qualification/fencing guard.
4. Register `0112` after `0111`; keep `0113` absent from every executable inventory.

R1 must prove ID-free and legacy nonempty capacity/workload writes through both supported publishers' compatible paths, and prove their non-ID negative guards still fail. The convergence regression must keep its concurrency, stale-writer, immutable-history, wakeup, replay, fairness, and reservation-liability observations; the shared-domain regression must keep its candidate, route/authority, effective-mask, fingerprint, idempotence, and revision-fence observations.

### R2 — writer contract cutover

R2 remains responsible for removing obsolete fields from TypeScript parsing/validation, application and test fixtures, and operational scripts. The convergence and durable-wakeup tests must be migrated to ID-free catalog rows while retaining their existing direct supported publisher coverage; they must not be deleted or replaced with a weaker unit double. The existing `capacity-planning-snapshot` compatibility assertions and all other fixtures that write/read the fields are R2 work, not an R1 excuse to retain a permanent field.

### R3 — physical removal

R3 still requires its full precondition set. Its zero-writer and catalog proof is expanded: repository and target-catalog searches must show no executable SQL function body, view, trigger, generated expression, application writer, test fixture, worker, or operational writer references `quota_accounting_policy_id` or `quotaAccountingPolicyId`. It must retain the existing proof that `0113` was not registered before that gate.

## Revised R1 Review Contract and acceptance evidence

`RC-QAP-001-03` is clarified, not split: “final publisher” means both supported installed publisher entry points above. Its proof must inspect both catalog definitions/attributes and run both focused integration harnesses. A passing shared-domain-only test is no substitute.

`RC-QAP-001-06` is amended with this binary closure oracle:

> Against the exact target, a recorded pre-DDL inventory of `pg_depend`, `pg_views`, `pg_proc`, `pg_trigger`, `information_schema.columns`, and repository migration/function sources lists every executable reference. **PASS iff** the only R1 references are the two named publishers and their declared table constraints/triggers, both are covered by the `0112` replacement, and no unplanned external writer or authority path is found.

Required R1 evidence additionally includes:

- an empty replay and an `0111` upgrade through `0112`, repeated migration execution, runner/release inventory, and `migration:check`;
- catalog assertions that both columns are nullable while their nonblank checks remain;
- legacy nonempty and ID-free writes for capacity/workload records;
- focused `authorized-desired-plan-convergence` and `durable-wakeup-convergence` evidence with ID-free rows, preserving their existing qualified, concurrency, wakeup, replay, no-provider-send, fairness, and historical-liability assertions;
- focused shared-domain publisher evidence with ID-free rows plus its non-ID guard negatives; and
- the existing fresh-install Anoman identity/zero-authority and admission, unknown-RPD, reservation/reconciliation, effective-policy, and `CapacityPlanningSnapshot/v2` regressions.

## SecurityReadiness

**Status:** `applicable`.

| ID | Planning result | Mandatory review binding |
| --- | --- | --- |
| `TRUST-QAP001-02` | `agents_bridge` may execute two distinct accepted publisher authorities; neither may gain callers or grants during deprecation. | `REV-QAP001-04`: inspect signatures, owners, definer/configuration, and grants before/after `0112`. |
| `ASSET-QAP001-02` | Immutable desired profiles, activation revisions, durable wakeup records, reservations, and historic seed rows remain protected. | `REV-QAP001-05`: run convergence/wakeup and fresh-install identity regressions. |
| `SEAM-QAP001-02` | Procedural SQL body inspection is the required dependency-detection seam; `pg_depend` alone is incomplete. | `REV-QAP001-06`: retain the exact target preflight result and body-inventory command. |
| `COUPLING-QAP001-02` | Candidate-only shared-domain publication cannot be substituted for the active-plan convergence publisher while its parent activation fence remains. | `REV-QAP001-07`: verify no candidate marker, activation behavior, or release-attestation boundary changes in the `0067` replacement. |
| `PROHIBITED-QAP001-02` | No resolver, default policy ID, extra grant, role change, new publisher, or `0113` registration may be coupled to R1. | `REV-QAP001-08`: migration diff and executable inventory review. |

## Final recommendation

**GO — BSS-QAP-001 R1 MAY RESUME UNDER AMENDED CONTRACT.**

The prior blocker is resolved by recognizing the supported `0067` publisher and explicitly including its bounded replacement in `0112`. This is not authority retirement and does not authorize R2 or R3. Any proposal to retire or redirect the convergence publisher remains a separate, independently authorized planning and implementation decision.
