# CK verification: IDSER-009-02 / IDSER-BATCH-09-02

- **Review type:** post-CFC verification
- **Ticket:** `IDSER-009-02-deterministic-production-card-projection.md`
- **Ticket state:** `awaiting_review`
- **Reviewed remediation commit:** `64f7072` (`fix(atlas): enforce failure-card reason`)
- **Original reviewed commit:** `e0696328f50658c35ab7cd582a9b59d8b3fab9b9`
- **CFC checkpoint:** `IDSER-BATCH-09-02-cfc-checkpoint.md`
- **Original frozen CK artifact:** `IDSER-BATCH-09-02-e069632-review.md`
- **Result:** `PASS`

This is bounded verification of the original frozen clause, the remediation diff, its required evidence, and direct regressions introduced by that remediation. No new review finding is added.

## Frozen clause outcomes

| Original clause | Outcome | Verification against its frozen oracle |
|---|---|---|
| `CK-001.a` | **RESOLVED** | `apps/atlas/lib/home-project-read-service.ts` now requires the exact `Processing needs attention.` reason when state is `needs-attention`, and rejects an attention reason on every other state. `apps/atlas/tests/home-projects.test.mjs` proves acceptance of the exact reason and rejection of an omitted or different reason. |

## Direct remediation regression

No direct regression was found within the frozen boundary. The focused test also retains passing assertions for the permitted non-failure card shape, extra private transport fields, invented states, and the fixed internal-read URL. The remediation diff is limited to the read-model parser, its deterministic transport assertions, and the CFC checkpoint; mapper and lifecycle persistence behavior were not changed.

## Checks performed

- Confirmed `64f7072` is `HEAD` and its changes correspond to the supplied CFC checkpoint and frozen clause `CK-001.a`.
- Inspected the remediation diff from `e0696328f50658c35ab7cd582a9b59d8b3fab9b9` through `64f7072` against the original closure oracle.
- `docker compose run --rm --build --no-deps atlas sh -lc 'cd apps/atlas && node --test --test-concurrency=1 tests/home-projects.test.mjs'` — **passed**, 4/4 tests, 0 failures, 0 skipped.
- `git diff --check e0696328f50658c35ab7cd582a9b59d8b3fab9b9..HEAD` — **passed**.

## Decision

Record `PASS` for IDSER-009-02 / IDSER-BATCH-09-02 at remediation commit `64f7072`. The original frozen clause is resolved and no direct remediation regression remains. This verification does not authorize another CFC cycle.
