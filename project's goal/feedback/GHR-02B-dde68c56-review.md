# GHR-02B CK review

- **Ticket:** GHR-02B — Atomic NDV1 acceptance integration and pointer-only pg-boss publication
- **Ticket state at review:** `awaiting_review`
- **Reviewed implementation commit:** `dde68c561b0c2e189f8543ad6d9adeed3644045b` — `feat(ghr): publish accepted NDV1 handoff pointer`
- **Checkpoint correction commit:** `0bad251a`; documentation-only correction that records `dde68c56` as the review target.
- **Frozen ticket:** [GHR-02B atomic NDV1 acceptance and pg-boss publication](../Backend_Phase/tickets/GHR_Phase/GHR-02B-atomic-ndv1-acceptance-and-pg-boss-publication.md)
- **Source authority:** incorporated GHR v0.6 §§5.1, 6, and 8–10 in [the GHR implementation context](../Backend_Phase/atlas-generic-handoff-router-implementation-context-v0.6-review.md)
- **GO checkpoint:** [GHR-02B GO checkpoint](GHR-02B-go-checkpoint.md)
- **Dependency:** GHR-02A CK `PASS` for `5bdac8c2`, recorded in [its CK review](GHR-02A-5bdac8c2-review.md)

## Review preconditions

The GO checkpoint records `awaiting_review` and names `dde68c56` as its
implementation target. That target resolves to the committed implementation
revision. The later `0bad251a` commit changes only the checkpoint's target
text. The current worktree includes unrelated pre-existing tracked and
untracked work outside the GHR-02B implementation, ticket, checkpoint, and
this review artifact, so the reviewed revision is unambiguous.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence / validation | Status |
| --- | --- | --- | --- |
| GHR-02B-RC-01 | A real accepted NDV1 must atomically commit accepted state, one GHR-02A intent, and one pointer-only job; injected failure must roll back all three. The frozen ticket requires this on the protected logical clone through the normal project-card/PDF acceptance path, with canonical-source and clone identities recorded. | The focused protected-clone PostgreSQL integration passed commit, exact pointer-job, repeat/restart, and injected-rollback assertions, but it creates its staged fixture and invokes the authority directly. Separately, a signed-in normal project-card/PDF run was performed on the canonical Compose deployment under the user's explicit canonical-write authorization and produced one committed intent/job. That canonical run is useful corroboration, but it is not the ticket's required isolated clone proof. The clone's Atlas app never opened its port, so no normal card/PDF clone run or clone-path injected rollback was obtained. | **UNPROVEN — CK-001** |
| GHR-02B-RC-02 | Live Perception-derived facts must produce the sole frozen GHR-02A contract; producer or fact tampering cannot change the issued intent. | `PostgresPerceptionAuthority.deliver()` derives the issuer facts from persisted accepted lifecycle state while its transaction remains open. `ghr-02b-atomic-publication.integration.test.ts`, `test:ghr-02b-boundary`, GHR-02A boundary coverage, and both package typechecks passed. | PROVEN |
| GHR-02B-RC-03 | Repeated completion or producer restart preserves the original intent and singleton job identity, without reissue/polling/mode change. | The protected-clone PostgreSQL test passed repeat/restart and one-intent/one-job assertions; `GenericHandoffJob/v1` is sent with the GHR-02A idempotency key as pg-boss singleton identity. | PROVEN |
| GHR-02B-RC-04 | Queue metadata contains only `GenericHandoffJob/v1` and `handoffId`; no consumer, receipt, lease, or Bridge-owned delivery state exists. | `apps/agents-bridge/src/queue.ts` sends the pointer-only object; `worker.ts` initializes the queue but registers no consumer. Boundary test and live canonical queue inspection confirm pointer-only job metadata and no semantic/Bridge delivery state. | PROVEN |
| GHR-02B-RC-05 | Positive and failure paths create zero receiver/ACK/resolver/planner/BSS/SEM/provider/reconciliation/projection effects. | Focused PostgreSQL integration and static boundary test passed their zero-downstream-effect assertions; implementation exports only transactional producer integration and no receiver/consumer path. | PROVEN |

## Validation record

```text
pnpm --filter @atlas/db typecheck                 PASS
pnpm --filter @atlas/agents-bridge typecheck      PASS
pnpm --filter @atlas/db test:ghr-02b-boundary     PASS (1 test)
pnpm --filter @atlas/db test:ghr-02a-boundary     PASS (1 test)
pnpm --filter @atlas/db test:ghr-02b              PASS (protected-clone PostgreSQL integration)
git diff --check dde68c56^ dde68c56               PASS
```

## Finding

### CK-001 — Required isolated normal-path acceptance proof is absent

The frozen **Required real-source validation environment** and
`GHR-02B-RC-01` require a protected logical clone created from the canonical
source, then a fresh normal signed-in project-card creation using a
`docs/example/` PDF, with the clone's atomic commit and injected-failure
rollback evidence. The available protected-clone test is direct/test-harness
activation, which the ticket explicitly excludes as a substitute. The normal
project-card/PDF proof was instead obtained in canonical under explicit user
authorization after the clone app could not be made reachable. That is not a
failure of the committed atomic publication code, but it leaves the frozen
RC-01 evidence condition unsatisfied.

## Frozen Finding Closure Matrix

| Finding / clause | Ticket authority | Unsatisfied evidence | Binary closure oracle | Direct regression boundary | Status |
| --- | --- | --- | --- | --- | --- |
| CK-001.a | Required real-source validation environment; GHR-02B-RC-01 | No fresh normal signed-in project-card/PDF acceptance run on the named protected logical clone, and no clone-path injected rollback proof. | From a PostgreSQL-supported snapshot of `atlas-canonical-perception`, restore an explicitly named isolated writable clone and point Atlas/Bridge at that clone. A signed-in normal project-card upload of a `docs/example/` PDF must create a fresh project/workspace/bundle/document/execution and yield exactly one GHR-02A intent plus exactly one `GenericHandoffJob/v1` pointer job. A controlled failure inside that same clone acceptance transaction must leave no accepted state, intent, or job. Record canonical-source and clone identities. | Re-run `pnpm --filter @atlas/db test:ghr-02b`, `test:ghr-02b-boundary`, and both typechecks; preserve the normal clone run's DB/queue evidence. | OPEN |

## Scope-change observation

The user's explicit authorization to write the canonical database/volume
authorized the canonical runtime validation that was performed. It does not
amend the frozen ticket's clone-only evidence requirement. If canonical proof
is intended to replace that requirement, planning authority must make that
amendment explicitly; this CK review does not infer one.

## Decision

**CHANGES_REQUIRED** — `CK-001.a` is an implementation-repairable
qualification/evidence gap within the frozen ticket. The next bounded workflow
is CFC; no Bridge consumption, receipt/lease, semantic work, or ticket-scope
expansion is authorized by this result.
