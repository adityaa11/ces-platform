# IDSER-012-05-03-02 contract freeze 001 — Clean v3 cutover

- **Ticket:** [IDSER-012-05-03-02](../Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-05-03-02-v3-operational-cutover-and-reference-ghr-validation.md)
- **Parent:** [IDSER-012-05-03](../Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-05-03-immutable-v3-multimodal-handoff.md)
- **Action:** bounded planning-contract correction and freeze only.
- **Operator authorization evidence:** explicit operator direction in this task on 2026-10-21, authorizing the clean-v3-cutover contract freeze before GO. No authorization ID is invented.
- **HMN:** none invoked or recorded. This is not a post-CK/CFC remediation cycle and creates no HMN decision.
- **Ticket state:** `planned`; this artifact does not invoke or grant GO.

## Contract alignment

The corrected child, its split-map parent, and the IDSER-012-05 family handoff now agree that only `ImmutableSemanticCorpusPlan/v3` and `PlannedSemanticCorpusHandoff/v3` are active. V1/v2 persistence, parser, and active GHR paths must reject at active boundaries. `NormalizedDocument v1` remains the separate preserved canonical perception contract and is never legacy semantic-plan work.

`IDSER-012-05-03-01` retains independent CK `PASS`, recorded in `IDSER-BATCH-12-05-03-01-ed07f338-review.md` for reviewed commit `ed07f338daf5e7158a5459b427f0fda2f329589b`. The parent preserves the child ordering and does not authorize SEM execution, provider calls, BSS admission, GHR delivery, reconciliation, hydration, transport, grants, or unrelated work.

## Superseded interpretation

The former `RC-01205-0302-01` interpretation requiring a durable `cancelled`, `retired`, or `replan_required` disposition for every v1/v2 row is superseded only for an exclusively proven disposable integration-test fixture population. The replacement row requires exact PostgreSQL/volume identification, complete dependency inspection, an evidence-backed candidate set, transactional explicit dependency-order deletion, rollback on any mismatch, canonical-data preservation, and a zero-legacy-plan postcondition.

No legacy lifecycle/disposition runtime, companion table, writer, parser, or compatibility path is authorized solely to accommodate the disposable fixtures. A legacy row that cannot be proven disposable remains protected and requires a separate explicit planning decision.

## Protected canonical data and controlled execution gate

The protected Compose project is `atlas-canonical-perception`; its protected volumes are `atlas-canonical-perception_postgres-data` and `atlas-canonical-perception_atlas-data`. The existing Safara `NormalizedDocument v1`, visual assets, source relationships, and migration history must remain unchanged. The child ticket now contains the future-only controlled-startup, read-only inventory, deletion-plan freeze, rollback, and postcondition procedure. It forbids uncontrolled migrations/jobs, volume reset/recreation/pruning, `TRUNCATE`, broad or unexamined cascades, and persistent weakening of immutability or FK protections.

## GO readiness

The contract is eligible to receive a separate `GO IDSER-012-05-03-02` because its predecessor CK PASS and planning authority are recorded, and the bounded implementation preflight is frozen. This is **not** GO: before invocation, the executor must revalidate the protected environment, preserve the exact ticket scope, and follow the frozen preflight without starting unrelated services.
