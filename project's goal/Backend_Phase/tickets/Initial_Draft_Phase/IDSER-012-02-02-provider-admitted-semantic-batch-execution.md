# IDSER-012-02-02: Provider-admitted semantic batch execution and staged finalization

- **State:** `planned`
- **Review batch:** `IDSER-BATCH-12-02-02`
- **Dependencies:** IDSER-012-02-01 CK `PASS`; BSS-V2-006-04 CK `PASS`; BSS-V2-004-03-06 CK `PASS` with qualification `PASS`
- **Parent:** [IDSER-012-02](IDSER-012-02-provider-admitted-multi-batch-semantic-extraction.md)

## Outcome

Register every semantic batch as external provider work, let BSS-V2-006 decide admission, execute only admitted batches through the already-qualified provider-neutral extraction path, and stage validated batch fragments without yet accepting a document result.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-0120202-01 | Every semantic batch becomes one idempotent provider-work item bound to the document execution, batch ID, quota domain, fairness key and RequestResourceEnvelope. | PASS iff retries/restart cannot create duplicate logical batch work and no raw provider secret/source body enters admission metadata. |
| RC-0120202-02 | No batch reaches StructuredReasoningProvider transport without BSS-V2-006 admission/reservation. | PASS iff capacity-denied/deferred batches remain waiting and transport count is zero until admitted. |
| RC-0120202-03 | Admitted batches use the existing qualified route/provider-neutral worker and preserve proposal validation, exact source accounting and deterministic finalizer semantics. | PASS iff worker/lifecycle code does not inspect Anoman identity and invalid provider output cannot become a staged fragment. |
| RC-0120202-04 | Batch staging is idempotent/fenced and does not materialize Atlas document candidates/evidence yet. | PASS iff duplicate/ack-loss execution yields one staged fragment per batch and Atlas trusted extraction state remains unchanged until complete aggregation. |
| RC-0120202-05 | Terminal batch failure contains the document semantic execution and releases provider capacity correctly. | PASS iff failed work cannot falsely mark another batch/document complete, reservation is reconciled/terminal, and no reconciliation work is emitted. |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-0120202-ADMISSION` requires BSS-V2-006 reservation before transport; `BOUNDARY-0120202-ROUTE` keeps qualified route selection server-controlled and provider-neutral; `BOUNDARY-0120202-ATLAS-TRUTH` prevents staged Bridge fragments from becoming accepted candidates/evidence; `BOUNDARY-0120202-PGBOSS` retains retry/fencing authority.
- **Trust boundaries:** `TRUST-0120202-ADMISSION-TRANSPORT` is the authorized transition from waiting provider work to executable transport; `TRUST-0120202-PROVIDER-FRAGMENT` is untrusted provider output through proposal validation/finalization into a staged, non-truth fragment.
- **Sensitive assets:** `ASSET-0120202-PROVIDER-CREDENTIAL`, `ASSET-0120202-SOURCE-REQUEST`, and `ASSET-0120202-STAGED-FRAGMENT` must remain out of admission metadata and ordinary logs/evidence.
- **Identity context:** `IDENTITY-0120202-BATCH-ATTEMPT` binds document execution, plan/hash, batch ID, logical work/attempt, route qualification, quota domain, fairness key, envelope, reservation, execution job, and staged fragment/fence.
- **Extension seams:** `SEAM-0120202-PROVIDER-WORK-REGISTRATION`, `SEAM-0120202-PRETRANSPORT-GATE`, `SEAM-0120202-NORMALIZED-USAGE`, and `SEAM-0120202-STAGED-FENCE` keep admission and provider policy independently replaceable.
- **Prohibited couplings:** `COUPLING-0120202-ADMISSION-BYPASS` forbids direct worker transport; `COUPLING-0120202-PROVIDER-BRANCH` forbids Anoman-specific lifecycle behavior; `COUPLING-0120202-SENSITIVE-METADATA` forbids secrets/source bodies in provider-work state; `COUPLING-0120202-EARLY-TRUTH` forbids candidate/evidence/reconciliation effects before complete aggregation.
- **Verification seams:** `VERIFY-0120202-TRANSPORT-COUNT`, `VERIFY-0120202-REPLAY-FENCE`, `VERIFY-0120202-ROLE-ISOLATION`, and `VERIFY-0120202-FAILURE-RECONCILE` cover denied/deferred transport, duplicate/ack-loss, restricted writes, and terminal capacity release.
- **Unresolved security policy:** `SEC-GAP-0120202-PROVIDER-DATA-POLICY` leaves future privacy/residency/retention/legal controls and alternate-route fallback outside scope.
- **Review bindings:** `REV-READY-0120202-01` verifies pre-transport admission and identity attribution; `REV-READY-0120202-02` verifies provider-neutral validation/staging and sensitive-data exclusion; `REV-READY-0120202-03` verifies replay/failure capacity reconciliation and zero early Atlas/reconciliation effects.

## Workflow evidence

Implementation must close every Review Contract row, record exact Compose commands/counts plus redacted reservation/job/transport/staging observations in a compact closure ledger, reach `READY_FOR_CK`, and only then move to `awaiting_review`. This ticket grants no GO by itself.
