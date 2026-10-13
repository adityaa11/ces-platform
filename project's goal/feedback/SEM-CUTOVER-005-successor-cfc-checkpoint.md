# CFC checkpoint — SEM-CUTOVER-005 successor composite accounting

- **Ticket:** `SEM-CUTOVER-005-SUCCESSOR-COMPOSITE-ACCOUNTING`
- **Batch:** `SEM-CUTOVER`
- **Frozen CK authority:** `project's goal/feedback/SEM-CUTOVER-005-0d26fdf-review.md`
- **Remediation target:** this checkpoint's bounded remediation commit.
- **Ticket/checkpoint state:** `awaiting_review`

## Working progress and closure evidence

The initial independent CK returned `CHANGES_REQUIRED`; this is the first
bounded CFC pass, directly authorized by the user CFC invocation. No
post-verification HMN authorization is consumed. Historical SEM-CUTOVER-005
and REL-03 `PASS` records remain closed.

| Frozen clause | Status | Repair and evidence locator | Required validation and outcome | Frozen oracle |
| --- | --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | `packages/atlas-skills/src/provisional-semantic-sidecar.ts` now binds every canonical candidate and inventory destination to a canonical tuple/source and verifies candidate/question evidence against exact canonical request slots. Focused foreign-evidence and detached-candidate assertions are in `packages/atlas-skills/tests/provisional-semantic-sidecar.test.ts`. | `pnpm --filter @atlas/skills exec jiti tests/provisional-semantic-sidecar.test.ts` — PASS, 11/11; `pnpm --filter @atlas/skills typecheck` — PASS. | PASS: valid exact canonical evidence prepares; foreign and detached evidence rejects. |
| `CK-001.b` | `PROVEN` | The composite boundary now requires each deferred tuple in the immutable revision `candidateRefs`, derives its descriptor ID deterministically from scope/tuple/revision, and rejects duplicate descriptor IDs. Focused forged-ID and missing-revision checks are in the same test file. | Focused suite — PASS, 11/11; typecheck — PASS. | PASS: immutable tuple membership and deterministic unique descriptor identity are enforced. |
| `CK-001.c` | `PROVEN` | The composite boundary rejects a ready owned source absent from both canonical inventory and tuple accounting, and rejects unbound canonical candidates/inventory destinations. Focused omitted-source and fully-deferred-detached-candidate checks are in the same test file. | Focused suite — PASS, 11/11; typecheck — PASS. | PASS: ready source coverage is truthful; fully deferred output cannot carry detached canonical state. |

## Direct regressions checked

| Command | Outcome |
| --- | --- |
| `pnpm --filter @atlas/skills exec jiti tests/stepwise-extraction-request.test.ts` | PASS — 5/5. |
| `pnpm --filter @atlas/skills exec jiti tests/stepwise-source-packet.test.ts` | PASS — 8/8. |
| `pnpm --filter @atlas/skills exec jiti tests/semantic-skills.test.ts` | PASS — 18/18. |
| `git diff --check -- packages/atlas-skills/src/index.ts packages/atlas-skills/src/provisional-semantic-sidecar.ts packages/atlas-skills/tests/provisional-semantic-sidecar.test.ts` | PASS. |

Only the authorized composite module, narrow barrel export, focused test, and
this checkpoint are changed. No provider, worker, persistence, database,
REL-03 implementation, publication, Master, admission, Docker, or deployment
path is altered.

Internal readiness: `READY_FOR_CK`.

## Handoff

Request CK verification only for frozen clauses `CK-001.a` through
`CK-001.c`, this remediation diff, the listed evidence, and direct regressions.
Do not reopen resolved historical boundaries or begin another remediation pass.
