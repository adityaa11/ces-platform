# CFC checkpoint: IDSER-009-02 / IDSER-BATCH-09-02

- Ticket: `IDSER-009-02-deterministic-production-card-projection.md`
- Remediation base / reviewed commit: `e0696328f50658c35ab7cd582a9b59d8b3fab9b9`
- CK artifact: `project's goal/feedback/IDSER-BATCH-09-02-e069632-review.md`
- Authorized frozen clause: `CK-001.a`
- Scope: the signed `ProjectCardViewModel` read boundary and its deterministic transport proof only.

## Frozen Finding Closure Progress

| Clause | Status | Ticket authority and frozen oracle | Evidence and exact command | Oracle result |
|---|---|---|---|---|
| CK-001.a | PROVEN | IDSER-009-02 `Authority and outcome` paragraph 3; RC-009-02-03 and RC-009-02-05. The read parser must reject `needs-attention` without the exact bounded literal, accept it with `Processing needs attention.`, and preserve omission for non-failure states. | `apps/atlas/lib/home-project-read-service.ts` now requires `attentionReason === "Processing needs attention."` for `needs-attention` and requires omission for every other state. `apps/atlas/tests/home-projects.test.mjs` asserts acceptance of the literal and rejection of both omission and a different value. `docker compose run --rm --build --no-deps atlas sh -lc 'cd apps/atlas && node --test --test-concurrency=1 tests/home-projects.test.mjs'` — passed, 4/4 tests, 0 failures/skips. | PASS |

## Direct regressions checked

- The same focused signed-card parsing test retains its existing assertions for extra private transport fields, invented states, allowed non-failure card shape, and fixed internal-read URL; all passed in the command above.
- No mapper behavior, lifecycle persistence, UI, or unrelated generated artifacts was changed.

Internal readiness: READY_FOR_CK

Ticket state: `awaiting_review`
