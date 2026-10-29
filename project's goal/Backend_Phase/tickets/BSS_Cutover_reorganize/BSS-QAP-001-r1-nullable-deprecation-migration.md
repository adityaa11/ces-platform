# BSS-QAP-001: R1 nullable deprecation migration and publisher preservation

- **State:** `planned`
- **Review batch:** `BSS-QAP-BATCH-01`
- **Depends on:** closed Scope 01B replay history; target-database catalog preflight before DDL
- **Source authority:** [Removal Mechanism Audit](../../BSS-Re-organize/BSS_QUOTA_ACCOUNTING_POLICY_MIGRATION_REMOVAL_MECHANISM_AUDIT.md) §§1–8, 11–12, and its [BSS-QAP-001 Publisher Blocker-Resolution Addendum](../../BSS-Re-organize/BSS_QAP_001_PUBLISHER_BLOCKER_RESOLUTION_ADDENDUM.md)

## Outcome

Create and register only `0112_bssv2_quota_accounting_policy_deprecation`. It makes both obsolete columns nullable and replaces each supported publisher—the shared-domain `0091` + `0093` + `0094` publisher and the accepted `0067` convergence publisher—with its current canonical body minus only the `quota_accounting_policy_id IS DISTINCT FROM` equality operand. R1 must preserve historical replay, both existing authority models and non-ID guards, and compatibility for both legacy and ID-free writes.

## Scope

- Add the transactional `0112` successor after `0111`. Drop `NOT NULL` on `bridge.provider_capacity_profile.quota_accounting_policy_id` and `bridge.workload_envelope_profile.quota_accounting_policy_id`; leave their nonblank `CHECK`s and existing row values intact.
- Define the shared-domain publisher explicitly with canonical `CREATE OR REPLACE FUNCTION`; carry forward the candidate-table alias corrections from `0093`/`0094`, signature, `SECURITY DEFINER SET search_path = pg_catalog, bridge`, owner `atlas`, and `agents_bridge` execute grant.
- Define the supported `0067` convergence publisher explicitly with canonical `CREATE OR REPLACE FUNCTION`; retain its signature, `agents_bridge` owner and execute grant, direct 005-04 activation/wakeup behavior, and invoker-security execution model.
- Retain complete-input/advisory-lock, exact tuple, allocation-shape, qualified-capacity, route/authority/effective-mask, workload/route-membership, expected-activation-revision, fingerprint/idempotence/revision-fence, immutable insert, activation, and wakeup guards. Remove no condition from either publisher except the obsolete equality operand.
- Register `0112` in the canonical migration array and release artifact. Add focused fresh-replay, 0111-upgrade, publisher, and migration-registration evidence.
- Before DDL, query the exact target catalog for dependencies in `pg_depend`, `pg_views`, `pg_proc`, `pg_trigger`, and `information_schema.columns`, and inspect every installed procedural body plus repository migration/function sources for `quota_accounting_policy_id` and `quotaAccountingPolicyId`; stop for a bounded amendment if an unplanned dependency or external writer contract is found.

## Forbidden work

- Do not modify historical migrations, the `0076` Anoman seed, immutable profile rows, candidate history, activations, reservations, ledger/runtime functions, snapshots, TypeScript contracts, or operational scripts, except for the two expressly scoped canonical publisher replacements above.
- Do not add, register, ship, or execute `0113` in `migrate.mjs`, a release artifact, or an alternate executor.
- Do not replace the canonical function body through `pg_get_functiondef` text substitution; do not change its signature, ownership/security attributes, or grants.
- Do not add a dummy/default policy ID, resolver, registry, or replacement policy.

## Review Contract

| Row | Exact bounded behavior | Required proof and binary closure oracle | Direct regression boundary |
| --- | --- | --- | --- |
| RC-QAP-001-01 | Only `0112` is newly registered after `0111`; `0113` is absent from every executable migration inventory. | Inspect runner/release inventories and execute the R1 chain. **PASS iff** `0112` applies once and no execution path can apply `0113`. | migration runner and release packaging |
| RC-QAP-001-02 | Both columns accept `NULL` after 0112 while historical non-empty values remain valid. | Disposable 0111 upgrade: retain existing rows, insert legacy non-empty values and omit each value in new capacity/workload writes. **PASS iff** all accepted writes succeed without rewriting history. | provider/workload schema and fixtures |
| RC-QAP-001-03 | Both final supported publishers remove only the obsolete equality predicate and keep their distinct effective safeguards and authority attributes. | Focused shared-domain and convergence/wakeup integration assertions plus function/catalog inspection. **PASS iff** legacy and ID-free compatible inputs publish through their supported paths; every named non-ID guard, signature, owner, grant, definer/search-path setting where applicable, alias correction, expected-revision fence, direct activation/wakeup behavior, concurrency result, replay result, fairness observation, and reservation-history observation remains present. | calculated desired-admission publication and qualified convergence/wakeup |
| RC-QAP-001-04 | Fresh replay preserves the exact canonical Anoman seed and zero-authority invariant. | Empty disposable PostgreSQL replay through 0112 and fresh-install contract/identity query. **PASS iff** one canonical seed remains and approvals, enforcement policies, route authorities, process/workload profiles, candidates, activations, and reservations are zero. | Scope 01B fresh-install contract |
| RC-QAP-001-05 | Directly affected accounting behavior remains unchanged. | Required focused regression evidence for billing/weighted rejection, unknown RPD, TPM reservation/reconciliation, effective policy, and snapshot compatibility. **PASS iff** each retains its pre-R1 behavior. | admission, reservation, reconciliation, snapshot |
| RC-QAP-001-06 | Target DDL has no unreviewed live catalog dependency or executable procedural reference. | Record the target-specific `pg_depend`, `pg_views`, `pg_proc`, `pg_trigger`, and `information_schema.columns` query/result plus installed-body and repository-source inventory before DDL. **PASS iff** the only R1 references are the two named publishers and declared table constraints/triggers, both publishers are covered by this ticket, and no unplanned external writer or authority path exists; otherwise implementation stops for planning authority. | target database schema and publisher authority |

## Validation and handoff

- Use disposable PostgreSQL databases for an empty replay and an upgrade baseline at `0111`; run `pnpm --filter @atlas/db migrate`, `pnpm --filter @atlas/db test:bss-fresh-install-contract`, focused shared-domain publisher coverage, `pnpm --filter @atlas/db test:authorized-desired-plan-convergence`, `pnpm --filter @atlas/agents-bridge exec jiti tests/durable-wakeup-convergence.integration.test.ts`, and `pnpm --filter @atlas/db migration:check`.
- Prove a repeat R1 migration runs once; record exact commands, target/catalog identity, output, migration list/release inventory, and the accepted/rejected write observations for each contract row.
- R1 is NO-GO for any `0113` registration, catalog dependency or executable procedural reference outside scope, seed/authority-count drift, failure of either legacy or ID-free writes, a publisher/accounting-invariant regression, or a convergence/wakeup authority, concurrency, replay, fairness, or historical-liability regression.
- On CK `PASS`, hand off the committed nullable R1 schema and evidence to BSS-QAP-002. No TypeScript or writer change belongs to this checkpoint.

## Security Refactor Readiness

**Status:** `applicable`.

- `BOUNDARY-QAP001-01`: migration runner name registration is the authority boundary; every listed pending name executes in order.
- `TRUST-QAP001-01`: a privileged DDL/function migration changes the shared publisher and two production schema columns.
- `TRUST-QAP001-02`: `agents_bridge` may execute the supported `0067` convergence publisher while `atlas` owns the shared-domain `SECURITY DEFINER` publisher; R1 must preserve, not merge or broaden, those authority models.
- `ASSET-QAP001-01`: immutable schema history, profile rows, publisher security attributes, grants, and migration records must remain intact.
- `SEAM-QAP001-01`: the target-catalog preflight detects out-of-repository dependencies before privileged DDL.
- `SEAM-QAP001-02`: procedural SQL body inspection is mandatory because `pg_depend` does not expose every PL/pgSQL column reference.
- `COUPLING-QAP001-01`: never couple R1 to physical removal by registering `0113`; never use textual function rewriting that loses patched aliases or security properties.
- `COUPLING-QAP001-02`: do not substitute the candidate-only shared-domain publisher for the supported convergence publisher while the former's parent activation gate remains in force.
- `SEC-GAP-QAP001-01`: target-specific external dependency information is intentionally unresolved until the recorded preflight; it is not inferred from repository search.
- `REV-READY-QAP001-01` (ref `RC-QAP-001-01`): verify migration registration/release inventory contains `0112` only. Evidence: committed inventory and executed migration log.
- `REV-READY-QAP001-02` (ref `RC-QAP-001-03`): verify replacement publisher preserves security attributes and non-ID guards. Evidence: function definition/catalog inspection and focused integration assertions.
- `REV-READY-QAP001-03` (ref `RC-QAP-001-03`): verify the convergence publisher retains its owner/grant, direct activation/wakeup, qualified-input, concurrency, replay, fairness, and reservation-liability behavior. Evidence: catalog inspection and focused real-worker integration assertions.
- `REV-READY-QAP001-04` (ref `RC-QAP-001-06`): verify privileged DDL used a recorded target-catalog and procedural-body preflight. Evidence: parameterized query output and repository inventory attached to checkpoint.
