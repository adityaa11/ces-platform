# IDSER-012-01-01: Staged fair local perception admission and cutover

- **State:** `approved` at `8ac6d47`; **Review batch:** `IDSER-BATCH-12-01-01` (`PASS` in [`IDSER-BATCH-12-01-01-2fbb213-verification.md`](../../../feedback/IDSER-BATCH-12-01-01-2fbb213-verification.md)).
- **Dependencies:** approved BSS-006, BSS-009/01/02, BSS-V2-004-01/02, IDSER-003, IDSER-008, IDSER-010-04/05
- **Parent:** [IDSER-012-01](IDSER-012-01-fair-bounded-local-docling-perception.md)
- **Post-generation planning amendment:** [Provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §21.7

## Outcome

Create the Atlas-owned durable staged-policy perception backlog and race-safe bundle-fair admission transaction. Staged project creation may commit with zero executable perception jobs when both local permits are occupied.

## Owned behavior

- Explicit persisted staged-policy/version marker.
- Staged members begin as durable pending eligibility.
- Durable monotonic bundle admission turn.
- Maximum Atlas local perception permits = 2.
- Never/least-recently-served bundle fairness with stable tie-break.
- Lowest pending manifest sequence inside the selected bundle.
- JIT BSS-009 perception execution/grant/job only on admission.
- Project creation and terminal perception events may invoke the same idempotent gate.
- Legacy sequential bundles are not silently adopted.

## Non-authority

No Docling two-worker requalification, semantic execution, external quota domain, provider admission, reconciliation redesign, or Ready-for-Review change belongs here.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-0120101-01 | Staged policy is explicit and legacy bundles are not silently selected. | PASS iff only staged-policy bundles enter the new gate and an incompatible active legacy scheduler cannot concurrently bypass the same local capacity authority. |
| RC-0120101-02 | Saturated staged project creation may commit with all members pending and no execution/grant/job. | PASS iff project/bundle/documents remain durable and eligible while no expiring source grant or executable job exists until a permit opens. |
| RC-0120101-03 | Admission is race-safe and globally bounded to two non-terminal perception permits. | PASS iff concurrent creation/refill cannot create a third admitted execution and capacity is computed/updated under one Atlas-owned PostgreSQL serialization seam. |
| RC-0120101-04 | Admission is durable bundle-fair with elastic borrowing. | PASS iff A(4)/B(5)/C(2) and one-bundle fixtures prove durable turns, no starvation, lowest pending sequence, and A may use both permits while alone without preemption. |
| RC-0120101-05 | Admission atomically creates execution + fresh BSS-009 grant + pg-boss job + member state. | PASS iff rollback exposes none of those effects, pending work has no grant/job, and no raw PDF/storage path enters queue/admission metadata. |

## Validation and hard stop

Use deterministic DB/queue fixtures, creation/refill races, rollback, grant-expiry negative, permission denial, and IDSER-010-04/05 regressions. Stop before changing Bridge/Docling worker concurrency or executing real multi-document Docling load.

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-0120101-ATLAS` keeps eligibility, lifecycle, and permit authority in Atlas; `BOUNDARY-0120101-PGBOSS` retains pg-boss as the only durable broker; `BOUNDARY-0120101-SOURCE-GRANT` retains BSS-009 exact-byte grant/redemption authority.
- **Trust boundary:** `TRUST-0120101-ADMISSION` is the transition from durable pending eligibility to an admitted execution, fresh source grant, queue job, and member state in one Atlas-owned transaction.
- **Sensitive assets:** `ASSET-0120101-SOURCE-AUTHORITY` covers source-grant material and protected document location/bytes; none may enter backlog or queue metadata.
- **Identity context:** `IDENTITY-0120101-WORK` binds staged-policy version, project, bundle, manifest member, perception execution, grant, job, and durable admission turn.
- **Extension seams:** `SEAM-0120101-STAGED-CUTOVER`, `SEAM-0120101-SERIALIZED-PERMIT`, `SEAM-0120101-FAIR-TURN`, and `SEAM-0120101-JIT-GRANT` keep later policy attachable without changing source authority.
- **Prohibited couplings:** `COUPLING-0120101-MIXED-SCHEDULERS` forbids concurrent legacy/new capacity bypass; `COUPLING-0120101-INMEMORY-PERMIT` forbids process-local durable authority; `COUPLING-0120101-SOURCE-IN-QUEUE` forbids raw bytes or storage paths in admission transport; `COUPLING-0120101-BRIDGE-TRUTH` forbids Bridge mutation of Atlas lifecycle truth.
- **Verification seams:** `VERIFY-0120101-ROLE-ROLLBACK` covers restricted-role and atomic rollback proof; `VERIFY-0120101-RACE-FAIRNESS` covers two-permit races, durable turns, stable tie-breaks, and restart; `VERIFY-0120101-GRANT-EXPIRY` covers JIT creation and expired-grant denial.
- **Unresolved security policy:** `SEC-GAP-0120101-LEGACY-ADOPTION` leaves migration of active legacy bundles unresolved; multi-host, GPU/OCR, host sizing, and user-weight policy remain outside scope.
- **Review bindings:** `REV-READY-0120101-01` verifies `TRUST-0120101-ADMISSION` and `SEAM-0120101-JIT-GRANT` with atomic rollback/role evidence; `REV-READY-0120101-02` verifies `SEAM-0120101-SERIALIZED-PERMIT` and `SEAM-0120101-FAIR-TURN` with concurrent A/B/C fixtures; `REV-READY-0120101-03` verifies all prohibited couplings by queue-payload inspection, restart proof, and mixed-scheduler negatives.

## Workflow evidence

Implementation must close every Review Contract row, record exact Compose commands/counts and scoped DB/queue observations in a compact closure ledger, reach `READY_FOR_CK`, and only then move to `awaiting_review`. This ticket grants no GO by itself.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation | Status |
| --- | --- | --- | --- |
| RC-0120101-01 | Explicit staged marker; legacy bundles excluded from the gate and cannot use a second capacity path. | Migration `0021_idser012_staged_perception_admission.sql`; gate query selects only `staged-fair-local-v1`; dedicated fixture uses staged rows only. | PROVEN |
| RC-0120101-02 | A saturated creation leaves durable pending members with no execution, grant, or job. | Gate counts every non-terminal Atlas perception execution under its serialized row lock and returns without changing a pending staged member when two permits are occupied. | PROVEN |
| RC-0120101-03 | Concurrent refill/creation cannot exceed two non-terminal permits. | Singleton `atlas.perception_admission_gate` is locked `FOR UPDATE`; deterministic fixture asserts exactly two admitted executions. | PROVEN |
| RC-0120101-04 | Durable never/least-recently-served bundle turn, lowest sequence, and lone-bundle borrowing. | `test:staged-perception-admission` proves A(4)/B(5)/C(2): A/B first, C then A by durable turns, lowest sequence, then two A permits when alone. | PROVEN |
| RC-0120101-05 | Admission atomically creates execution, fresh grant, queue job, and member transition; rollback and payload boundaries hold. | The gate reuses `createWithSql` and the existing transactional pg-boss producer. Fixture forces enqueue rollback and observes no execution/grant/member effect; it also asserts no `private/` storage path in queued admission payloads. | PROVEN |

Validation executed:

```text
corepack pnpm --filter @atlas/db typecheck
DATABASE_URL=<isolated PostgreSQL> corepack pnpm --filter @atlas/db test:staged-perception-admission
DATABASE_URL=<isolated PostgreSQL> corepack pnpm --filter @atlas/db migration:check
corepack pnpm --filter @atlas/core test
```

All commands passed. The deterministic admission fixture uses an isolated PostgreSQL database and records the A/B/C, cap, elastic-borrowing, rollback, grant, and payload observations above. No Bridge/Docling concurrency or real multi-document Docling load was run.

Internal readiness: READY_FOR_CK
