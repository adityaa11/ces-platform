# IDSER-009-01: Authorized persisted lifecycle read

- **State:** `awaiting_review`; **Review batch:** `IDSER-BATCH-09-01`.
- **Depends on:** IDSER-008 `PASS`; frozen PCC-004/005/006 authorization/read boundaries.
- **Consumes:** IDSER-008's accepted completion gate and failure lifecycle without reopening them.
- **Execution environment:** Compose PostgreSQL repository/read-model tests.

## Authority and outcome

Own the server-side, membership-scoped read contract that returns enough persisted lifecycle truth for a later mapper, and nothing browser-facing. The dominant area is `packages/atlas-core/src/project.ts` and `packages/atlas-db/src/project-repository.ts`, with the authenticated home-read boundary changed only if typed handoff requires it.

GO must expose an authorized lifecycle read for each accessible project: project/workspace/bundle identities and persisted states; immutable expected N and completed X; member completion/failure facts needed to validate state; the completion-gate-compatible ready state; and an explicit intact legacy/no-bundle distinction versus malformed or inconsistent new bundle-backed data. A bounded typed technical-failure signal may cross for later safe mapping.

The contract fails closed for impossible counts, missing required records, contradictory bundle/workspace/member state, or untrusted failure payloads. It never returns provider bodies, source prompts, SQL, storage keys, source bytes, capability/execution secrets, or raw internal failure detail.

## Explicit non-authority

This ticket does not map card labels/states/percentages, serialize a browser model, change JSX/CSS, render a card, run browser screenshots, infer progress from queues/timers, or implement lifecycle orchestration. It consumes IDSER-008 semantics and does not change the completion gate, migrations, or PCC create flow.

## Review contract and proof

| Row | Required behavior | Smallest authoritative proof |
|---|---|---|
| RC-009-01-01 | Membership joins precede a lifecycle read; owner and unrelated user cannot see the same project data. | PostgreSQL integration fixtures with two users and an unrelated project. |
| RC-009-01-02 | Valid waiting, processing, terminal technical-failure and completion-gated ready records return truthful typed lifecycle facts, X and N. | PostgreSQL fixtures/query assertions for each state. |
| RC-009-01-03 | Legacy PCC no-bundle/no-downstream records are identified as legacy; invalid/missing/inconsistent new bundle records fail closed. | PostgreSQL malformed and legacy fixture assertions. |
| RC-009-01-04 | Invalid N/X/member/workspace combinations and raw failure detail do not cross as valid lifecycle or unsafe response data. | Repository/read-model negative assertions and returned-shape inspection. |

## Security, CK and repair boundary

**Security readiness: applicable.** Inherited scope is `SEAM-IDSER-009-01` at the authorization/persistence edge, the persisted-lifecycle trust boundary, server-derived identity, and the backend portion of `COUPLING-IDSER-009-01`. CK evaluates only authorized persisted truth, isolation, integrity handling and non-leaking read boundary (`REV-READY-IDSER-009-01`). Normal CFC repairs stay in Core/repository code with the same PostgreSQL harness. HMN, if needed, may resolve only one narrow read-model residual such as an isolation, state-integrity or bounded-data assertion.

## Hard stop

Before `awaiting_review`, GO records every RC row as `PROVEN` with Compose PostgreSQL evidence. The persisted lifecycle read is complete; no browser-safe mapping, JSX, visual proof or IDSER-010 work begins.

## GO checkpoint

- **Implementation checkpoint:** `project's goal/feedback/IDSER-BATCH-09-01-go-checkpoint.md`
- **Implementation commit:** this GO handoff commit; CK remains the sole authority to issue `PASS`.
