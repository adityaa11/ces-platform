# HMN Authorization: SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE

Ticket: `SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE`
Batch: `SEM-CUTOVER`
HMN authorization ID: `HMN-SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE-003`
Invocation: explicit user `hmn` delegation for one bounded direct-regression correction
Current workflow state: `CHANGES_REQUIRED` after post-CFC verification; one direct-regression repair authorized

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE.md`
Current HEAD: `ed0e70198a9ead931d6b8a626be1226a9194d2e6`
Relevant GO commit: `4c528d4e6e23054f04607c210cd159195fba75ce`
Relevant CK artifact: `project's goal/feedback/SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE-ed0e701-verification.md`
Relevant CFC commit: `ed0e70198a9ead931d6b8a626be1226a9194d2e6`
Prior HMN authorization: `HMN-SEM-CUTOVER-007A-DEFERRED-ACCEPTANCE-002`
Worktree state: unrelated pre-existing runtime, generated-fixture, planning, archive, temporary, and ticket material remains dirty/untracked and is preserved outside this authorization.

## Diagnosis

Post-CFC CK verification confirms that the original frozen clauses `CK-001.a` and
`CK-001.b` are resolved. They remain closed and are not eligible for redesign or
reopening. The same verification identifies one direct regression introduced by
`ed0e701`: the mounted Atlas internal plugin owns two HTTP-server `close`
listeners, and both request finalization of the same three resources.

The user has explicitly authorized one narrowly scoped direct-regression repair,
with a stop condition if consolidation would require changing an unrelated
lifecycle or resource-ownership contract.

## Ticket-authority trace

The latest post-CFC CK artifact is the source of the direct-regression finding
and its bounded review target. The explicit user HMN delegation supplies the
additional authorization to repair that regression once. No new product,
routing, data, database-authority, admission, reconciliation, or
deferred-acceptance requirement is created by this record.

## Decision

`AUTHORIZE_DIRECT_REGRESSION_REPAIR` — the post-CFC verification returned
`CHANGES_REQUIRED` solely for a direct regression introduced by the reviewed CFC
commit. The original CK clauses are resolved, and this authorization opens one
bounded corrective CFC cycle without reopening either clause.

Unresolved frozen CK clause IDs: none. The authorized target is the direct
shutdown regression recorded by the latest post-CFC CK artifact, not
`CK-001.a` or `CK-001.b`.

## Authorized scope

- One corrective CFC checkpoint against the reviewed `ed0e701` direct
  shutdown regression.
- Consolidate the owned HTTP-server shutdown lifecycle in
  `apps/atlas/perception-internal.ts` so the three owned resources receive one
  shutdown request each: `semanticQueue.close()`, `perceptionQueue.close()`,
  and `sql.end()`.
- Add only the narrowly necessary focused regression assertion that the mounted
  internal plugin registers one owned shutdown handler and finalizes resources
  without duplicate requests.
- Preserve the user's requested `Promise.allSettled()` cleanup unless concrete
  lifecycle evidence requires another equivalent consolidation.
- Record one immutable corrective checkpoint and hand that checkpoint to
  independent CK for bounded verification of this regression and its direct
  effects.

## Required validation

Use the exact validation set and evidence requirements in the explicit user HMN
delegation, including the qualified deferred-acceptance, extraction-acceptance,
staged-perception-admission, home-projects, typecheck, and migration checks.
Inspect and record the exact diff; it must contain only this shutdown
correction, the focused regression coverage, and the immutable corrective
checkpoint. CFC must report readiness only after all requested checks pass and
must name this HMN authorization in the checkpoint.

## Forbidden work

- Do not reopen, weaken, or redesign `CK-001.a` or `CK-001.b`.
- Do not change semantic routing, accepted data, database authority,
  admission, reconciliation, or deferred-acceptance behavior.
- Do not modify or overwrite historical GO, CK, CFC, or prior HMN artifacts.
- Do not expand into a new CFC cycle, first-review sweep, unrelated lifecycle
  change, main `SEM-CUTOVER-007A` implementation, or GO.
- If the shutdown consolidation requires changing an unrelated lifecycle or
  resource-ownership contract, stop and return the exact dependency instead of
  expanding scope.

## Handoff

Expected next command: one bounded CFC direct-regression repair consuming this
authorization, followed by independent CK. CK must verify only this corrective
diff, the focused shutdown assertion, the required validation evidence, and
direct effects while carrying forward `CK-001.a` and `CK-001.b` as resolved.
`GO SEM-CUTOVER-007A` remains forbidden until the prerequisite independently
receives CK `PASS`.
