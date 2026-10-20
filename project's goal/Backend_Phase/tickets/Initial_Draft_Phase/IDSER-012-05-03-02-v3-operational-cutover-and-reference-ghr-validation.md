# IDSER-012-05-03-02 — V3 operational cutover and reference-only GHR validation

- **State:** `approved`; effective acceptance passed under the ticket-specific procedural exception. See [final CK verification](../../../feedback/IDSER-BATCH-12-05-03-02-f92dc9b0-verification.md).
- **Parent map:** [IDSER-012-05-03](IDSER-012-05-03-immutable-v3-multimodal-handoff.md).

## Sole scope

Establish a clean v3-only semantic-planner cutover:

- retain v3-only active semantic-plan persistence;
- retain v3-only reference-based GHR receiver validation;
- remove only verified disposable legacy semantic-plan integration-test fixtures from the authoritative development PostgreSQL environment; and
- verify v3 planning and reference handoff against preserved canonical Safara perception output.

The ticket does not own a permanent legacy-plan disposition workflow. Legacy semantic-plan v1/v2 compatibility and lifecycle accommodation are not product requirements. A fixture deletion candidate that cannot be proven exclusively disposable must remain untouched and be routed for a separate explicit decision.

## Frozen CK contract

| ID | PASS iff |
| --- | --- |
| `RC-01205-0302-01` | **Verified legacy fixture cleanup.** Identify the exact authoritative PostgreSQL instance and associated Docker volumes; verify every affected v1/v2 record and its foreign-key dependencies; prove every deletion candidate is an exclusively disposable integration-test fixture with no outstanding legitimate work; and delete only those records and exclusively owned dependents in one rollback-safe transaction. Preserve unrelated canonical source data, immutable document content, visual assets, and migration history. Verify no legacy semantic plans remain in the target environment. No `cancelled`, `retired`, or `replan_required` disposition is required for fixtures deleted under this contract. |
| `RC-01205-0302-02` | Active v1/v2 writer/parser/GHR paths and implicit v1 defaults are unavailable; v1/v2/mixed inputs fail at active boundaries while v3 text/table planning remains usable. |
| `RC-01205-0302-03` | Reference-only GHR validation accepts only internally consistent immutable v3 plan/handoff membership and does not dispatch, queue or create a production delivery path. |

## Canonical perception and reconstruction acceptance

The authoritative Compose project is `atlas-canonical-perception`. Its actual protected volumes are `atlas-canonical-perception_postgres-data` and `atlas-canonical-perception_atlas-data`; neither may be deleted, recreated, pruned, or reset. Preserve Safara `NormalizedDocument v1` data and its visual assets. `NormalizedDocument v1` is not a legacy semantic-plan contract.

Using that preserved Safara perception data, produce a fresh v3 semantic plan and prove that IDSER sizing accounts for the selected text and visual content. Verify persisted v3 locator, identity, membership, and reconstruction metadata; reference-only GHR handoff; deterministic SEM reconstruction of the identical intended request including selected images; and applicable request identities and hashes. The complete provider request remains reconstructed in memory and must not be persisted.

No provider call, queue dispatch, BSS admission, semantic extraction execution, reconciliation execution, grant, hydration, transport, or production GHR delivery is authorized.

## GO prerequisites

Before GO, the corrected contract must be frozen through the authorized planning process, with actual planning-authorization evidence recorded without inventing an authorization ID. Verify that `IDSER-012-05-03-01` retains CK PASS; define the bounded cleanup preflight and rollback procedure; and ensure application startup cannot run uncontrolled migrations or jobs during cleanup verification. A separate GO is required for this ticket after those conditions are met.

## Future cleanup preflight and rollback gate

This section is a GO prerequisite and authorizes no current Docker or database action.

1. Resolve the target as Compose project `atlas-canonical-perception`, its PostgreSQL service, and the protected `atlas-canonical-perception_postgres-data` and `atlas-canonical-perception_atlas-data` volumes. Inspect the effective Compose configuration and service state before any start. A similarly named database, fixture database, volume, or Docker project is not an acceptable substitute.
2. Start only the target PostgreSQL service under an explicitly controlled command after GO. Do not start `atlas-migrate`, bootstrap, Atlas, Bridge, workers, or any service that can apply migrations or consume jobs. Confirm those services remain stopped before and after the cleanup verification.
3. In a read-only transaction, enumerate every v1/v2 plan, its plan hash, scope, descendants, FK dependents, execution/job/admission references, and canonical perception/source/asset relationships. The expected `ready-compose-*` population is an investigation lead only: deletion eligibility must be proven by the complete observed row set and dependency graph, not by an ID prefix.
4. Freeze the exact candidate IDs, hashes, dependent row IDs, and pre-delete counts as the deletion plan. Stop without mutation if any candidate has a dependency outside that plan, references legitimate canonical source data or assets, has execution/admission/queue activity, or is not exclusively a disposable integration-test fixture.
5. Execute only the reviewed explicit dependency-order deletes in one transaction. Do not use `TRUNCATE`, broad predicates, unexamined cascade behavior, a reset, or a persistent change to immutability/FK protections. If fixture removal requires any exception to those protections, stop for an explicit GO-scoped maintenance decision rather than weakening them implicitly.
6. Roll back on every mismatch, including unexpected row count, dependency, version, hash, or protected-data observation. Commit only after the exact plan is rechecked; then re-run the inventory and canonical Safara/source/asset integrity checks. The required postcondition is zero legacy semantic plans and unchanged unrelated canonical data.

## Boundaries

No mutation of `-03-01` record schema, runtime SEM resolver, execution grant, hydration, provider transport, BSS admission, reconciliation, or new GHR delivery. Do not add a legacy disposition mechanism solely for disposable fixtures. Preserve generic historical-data protection and schema-integrity guarantees. CFC/HMN is limited to the verified fixture-cleanup contract and reference-only validation.
