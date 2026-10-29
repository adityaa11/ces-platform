# BSS-QAP-002: R2 ID-free writer contract cutover

- **State:** `approved`
- **Review batch:** `BSS-QAP-BATCH-02`
- **Depends on:** BSS-QAP-001 `PASS`
- **Source authority:** [Removal Mechanism Audit](../../BSS-Re-organize/BSS_QUOTA_ACCOUNTING_POLICY_MIGRATION_REMOVAL_MECHANISM_AUDIT.md) §§1, 9, 11–12
- **Active bounded amendment:** [Local Docker acceptance-boundary amendment 001](../../../feedback/BSS-QAP-LOCAL-DOCKER-ACCEPTANCE-AMENDMENT-001.md). It supersedes only the production-wide evidence portion of `RC-QAP-002-04` for the confirmed local-development environment; the historical CK result remains unchanged.

## Outcome

Deploy an ID-free application writer contract against the BSS-QAP-001 nullable schema. Remove the obsolete TypeScript fields, parser/set validation, integration-fixture columns, and operational-script inserts, then prove every deployed writer—including out-of-repository integrations—can no longer write either column. The columns remain physically present and nullable; `0113` remains unregistered.

## Scope

- In `capacity-catalogue.ts`, remove `quotaAccountingPolicyId` from types, accepted keys, required-string parsing, and returned values while retaining capacity dimensions, source/provenance, non-secret checks, and window validation.
- In `process-workload-catalogue.ts`, remove the field, `quotaAccountingPolicyIds` authority input, membership loop, and resolver argument while retaining process/workload compatibility, active qualified-route checks, and four-dimension envelope parsing.
- Remove only parser-driven obsolete construction from planner/admission tests; do not alter production planning/admission accounting behavior.
- Remove obsolete columns/values from SQL integration fixtures and operational qualification writers, including `scripts/idser-012-04-07/qualify-real-data.mts`; replace quota-authority tests with tests of the real parser safety boundary.
- Re-run the publisher-caller search before landing; any newly added production caller is part of the writer inventory and must be ID-free or is a release blocker.
- Produce a release inventory for application revisions, workers, jobs, scripts, one-off tools, migration executors, and external integrations that can write either table.

## Forbidden work

- Do not register, ship, execute, or otherwise expose `0113`; do not physically drop either column.
- Do not change R1 migration/function behavior, historical SQL, the Anoman seed, runtime admission, effective enforcement policy, planner cost, ledger, candidate fingerprint/revisions, or `CapacityPlanningSnapshot/v2`.
- Do not manufacture a hardcoded/default policy ID or compatibility resolver, and do not use an unverified external integration as a reason to leave a hidden effective writer.
- Do not treat a repository-only `rg` result as proof that external writers are absent; record the deployment/integration inventory.

## Review Contract

| Row | Exact bounded behavior | Required proof and binary closure oracle | Direct regression boundary |
| --- | --- | --- | --- |
| RC-QAP-002-01 | Capacity catalogue accepts and returns no obsolete accounting-ID contract field. | Run its focused TypeScript parser tests against R1 schema. **PASS iff** ID-free valid capacity input succeeds and unsupported billing/weighted fields still reject. | capacity catalogue parser |
| RC-QAP-002-02 | Process/workload catalogue has no obsolete ID-set authority or resolver dependency. | Run focused parser/route compatibility tests. **PASS iff** valid structural/estimator/output contracts create independent dimensions and existing route/compatibility validation remains. | process/workload parser |
| RC-QAP-002-03 | All repository fixtures and operational writers use ID-free insert/serialization shapes. | Focused integration/script tests plus release-payload search. **PASS iff** no effective reference remains outside an explicit immutable-history/audit allowlist. | SQL fixtures and qualification scripts |
| RC-QAP-002-04 | Every deployed writer is ID-free before R3 eligibility. | Record deployment inventory and monitored rollout evidence for applications, jobs, workers, tools, integrations, and migration executors. **PASS iff** no active old revision or external writer can write either column. | release/deployment estate |
| RC-QAP-002-05 | Existing safety/accounting behavior remains unchanged while R1 nullable compatibility is in effect. | Run publisher, admission/reservation/reconciliation, effective-policy/unknown-RPD, and snapshot suites against R1. **PASS iff** all named scenarios pass with no dummy/default ID. | BSS runtime/accounting contracts |
| RC-QAP-002-06 | The R3 boundary remains closed during application cutover. | Inspect committed runner, release payload, and migration records. **PASS iff** `0113` is absent/unexecuted and both physical columns remain nullable. | migration runner and R1 schema |

## Validation and handoff

- Run `pnpm --filter @atlas/agents-bridge exec jiti tests/capacity-catalogue.test.ts` and `pnpm --filter @atlas/agents-bridge exec jiti tests/process-workload-catalogue.test.ts`, plus the audit-required publisher, admission, reservation-window, reconciliation, effective-policy, snapshot, and affected SQL integration suites against an R1 database.
- Use `rg -n "quota_accounting_policy_id|quotaAccountingPolicy(Id|Ids)|anoman-quota-tokens-v1" apps packages scripts` with a documented allowlist limited to immutable historical migrations and audit materials. Record the output and every external-writer inventory decision.
- R2 is NO-GO for a remaining writer, an unverified external integration, an old active binary/job/worker, a failed regression, an `0113` registration, or any dummy/default policy workaround.
- On CK `PASS`, attach the immutable release inventory and affected regression evidence to BSS-QAP-003. Do not drop the columns in this ticket.

## Security Refactor Readiness

**Status:** `applicable`.

- `BOUNDARY-QAP002-01`: BSS-QAP-001's nullable schema is the sole compatibility interface; it does not authorize a permanent application-visible legacy contract.
- `TRUST-QAP002-01`: parsers and operational tools turn supplied data into privileged profile/workload writes.
- `ASSET-QAP002-01`: capacity/envelope dimensions, provenance, route authority, effective policy, reservation/usage behavior, and snapshots are sensitive operational contracts.
- `SEAM-QAP002-01`: a release inventory spans repository and external writers so physical removal has an auditable authority boundary.
- `COUPLING-QAP002-01`: do not couple parser acceptance to a fabricated ID; do not collapse writer-inventory proof into a source-only search.
- `SEC-GAP-QAP002-01`: out-of-repository integration inventory remains an explicit deployment-evidence requirement, not a repository inference.
- `REV-READY-QAP002-01` (ref `RC-QAP-002-01` and `RC-QAP-002-02`): verify parser removal preserves real structural and negative-field boundaries. Evidence: focused test assertions.
- `REV-READY-QAP002-02` (ref `RC-QAP-002-04`): verify all writer authorities are inventoried and retired from the obsolete columns. Evidence: release manifest and rollout observation.
- `REV-READY-QAP002-03` (ref `RC-QAP-002-05`): verify cutover did not alter effective policy or resource-accounting behavior. Evidence: named regression results.
