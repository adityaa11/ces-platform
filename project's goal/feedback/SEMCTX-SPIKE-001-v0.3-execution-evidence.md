# SEMCTX-SPIKE-001 v0.3 — execution evidence

- **Ticket authority:** `project's goal/Backend_Phase/SEMCTX-SPIKE-001-v0.3-planning-proposal.md`
- **GO authorization:** user request `GO — SEMCTX-SPIKE-001 v0.3`
- **Branch / starting HEAD:** `codex/new-atlas-backend` / `633d19f712570ae06db8050c2362fdca95c63b59`
- **Oracle checkpoint:** `bbca5e89c6b5ee97a5cc7ee1a6b9969fa8f69da4`
- **CK authority:** `project's goal/feedback/SEMCTX-SPIKE-001-v0.3-bbca5e8-oracle-review.md` (`PASS`)
- **Validation-contract amendment:** `project's goal/feedback/SEMCTX-SPIKE-001-hmn-004.md` (`AUTHORIZE_BOUNDED_VALIDATION_CONTRACT_AMENDMENT`)

## Pre-implementation checks

- Both named commits resolved as commits and are ancestors of the starting HEAD.
- `git diff --check` passed before implementation.
- The pre-existing unrelated untracked paths were preserved. The v0.3 implementation paths did not exist before this GO work.
- The frozen oracle was unchanged between `bbca5e8` and the starting HEAD. The runner independently verified every raw/canonical manifest member hash and manifest self-hash before dynamically importing planner logic. Verified manifest self hash: `197cb2e827ce7d6825958954e09ef56b77fa6384cd2f9cc304e57c26b3796111`.

## Isolated simulator validation

Command:

```powershell
node scripts/semctx-spike-001-v0.3/run.mjs
```

Result: **passed**. The runner compared complete canonical F1–F3 outputs to the frozen `gold/expected-output.json`, verified A-01 through A-10, N-01 through N-09, all frozen payload byte counts and SHA-256 values, ten replays per fixture, source-order perturbation, Node-built-in/local-only imports, and zero forbidden-effect counters.

| Matrix | Result |
| --- | --- |
| A-01 through A-10 | all `PROVEN` |
| N-01 | `INTEGRITY_REJECTED` / `FORGED_LOCATOR` |
| N-02 | `INTEGRITY_REJECTED` / `HASH_SUBSTITUTION` |
| N-03 | `DETERMINISTIC_EQUAL` / `7e004e9e301e653dc52e03c3ca45f14570fafc2cd7dc2383c38e05850613b6e7` |
| N-04 | `INTEGRITY_REJECTED` / `CONTEXT_OWNER_OVERLAP` |
| N-05 | `INTEGRITY_REJECTED` / `SOURCE_CONTENT_HASH_MISMATCH` |
| N-06 | `INTEGRITY_REJECTED` / `ESSENTIAL_DEPENDENCY_CYCLE` |
| N-07 | `INTEGRITY_REJECTED` / `COVERAGE_OR_ACCEPTANCE_MISREPRESENTATION` |
| N-08 | `INTEGRITY_REJECTED` / `INVENTORY_GAP` |
| N-09 | `INTEGRITY_REJECTED` / `ESSENTIAL_CLOSURE_INCOMPLETE` |
| F1/F2/F3 replays | 10 each, canonical output identical; reversed source order identical |
| forbidden effects | provider `0`, image reads `0`, DB writes `0`, queue/job `0`, admission `0`, production mutations `0` |

The exact frozen request bounds/hashes were matched: F3-D is 396 bytes (`2730591a975754ac62e185e3bf58146c66ffd6c23714a1d97f0d131e1010c42e`) and F3-C plus F3-D is 4551 bytes (`93e9b1c3a7b449bad5ef802fe137eb03ccc5e35dfdea85f05fa4541a2359947f`).

## Baseline and regression checks

The three legacy baseline hashes listed in `scripts/semctx-spike-001/gold/checksums.json` matched:

- `packages/atlas-skills/src/semantic-source-packet.ts`: `0b0fbf9f65f108c477f72980fb06c46e66c1a3611be05d6cd57198c0bcd8305d`
- `packages/atlas-skills/src/semantic-prompt.ts`: `be9817c4aa9c09d7748847abd621bb14cb0c8d2425f79b56d90a84cd30fac902`
- `packages/atlas-contracts/src/semantic-v1.ts`: `b481d1f6b2b178fdb572e7a8a7e565814456489183fbcc7a9f2560da5c9bf825`

Required legacy regression command:

```powershell
pnpm --filter @atlas/fixtures test
```

Result: **failed with the documented baseline-equivalent pre-existing exception**. Forty tests passed; `workflow skills enforce the review-contract handoff boundaries` failed because its required expression expects the exact sequence `` `IMPLEMENTED_UNPROVEN`, or `BLOCKED_AUTHORITY` row``, while `.agents/skills/go/SKILL.md` contains an additional `` `BLOCKED_ENVIRONMENT` `` before `row`. `SEMCTX-SPIKE-001-hmn-004.md` independently reproduced this exact one-failure result at the untouched starting commit, verified the relevant canonical source identities, confirmed the candidate adds no failure, and recorded the directly relevant legacy contract/skills checks. The suite remains failed; the amendment accepts this identity only as alternative proof that SEMCTX introduced no legacy regression.

Additional non-authoritative diagnostic: the pre-existing untracked `scripts/semctx-spike-001/run.mjs` also fails its historical F3 expectation (`[F3-A, F3-B]` versus emitted `[F3-A, F3-B, F3-D]`). It is not a committed test surface and was not changed or used as v0.3 authority.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence | Status |
| --- | --- | --- | --- | --- |
| RC-001 | v0.3 §§2–4 | Pure ownership, closure, bounds, ledger, coverage behavior matches frozen outputs | `node scripts/semctx-spike-001-v0.3/run.mjs` | `PROVEN` |
| RC-002 | v0.3 §5 | A-01–A-10, N-01–N-09, exact hashes, replays, and zero forbidden effects | `node scripts/semctx-spike-001-v0.3/run.mjs` | `PROVEN` |
| RC-003 | user GO Verification, as amended by `HMN-SEMCTX-SPIKE-001-004` | Existing legacy regression tests and baseline integrity | Baseline-equivalent suite failure verified at `633d19f`; focused legacy contract/skills checks recorded; candidate has no additional failure | `PROVEN` (bounded alternative proof; suite is not green) |
| RC-004 | user GO strict boundaries | No production or frozen-oracle changes | authorized-path audit and manifest check | `PROVEN` |

## Disposition

`READY_FOR_CK` under `HMN-SEMCTX-SPIKE-001-004` only.

The v0.3 experiment is proven in isolation. The required legacy regression suite is **not green**: its one pre-existing workflow-skill/test mismatch is accepted solely as the amendment's baseline-equivalent alternative proof of no newly introduced regression. No production, legacy, fixture, gold, or workflow-authority file was changed to hide it. This is implementer readiness for CK, not a CK `PASS`; `SCHEMA_FIT_BLOCKED` remains open.
