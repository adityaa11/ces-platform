# CK verification: IDSER-010-06 / IDSER-BATCH-10-06

- **Ticket:** `IDSER-010-06-integrated-deterministic-compose-regression-checkpoint.md`
- **Ticket state:** `awaiting_review`
- **Review type:** Post-CFC verification of the original consolidated findings
- **Original CK artifact:** `IDSER-BATCH-10-06-101eb42-review.md` (`CHANGES_REQUIRED`)
- **CFC checkpoint:** `IDSER-BATCH-10-06-cfc-checkpoint.md`
- **Reviewed commit:** `dee475d8750c667088e32772865d639a16756d38` (`test(idser): close 010-06 CK evidence findings`)
- **Remediation base:** `101eb423f429fe6d400550b6262cc304b1eb12fc`
- **Result:** `PASS`

## Bounded verification scope

This verification checks only original clauses `CK-001.a` and `CK-001.b`, the CFC remediation diff, their required evidence, and direct regressions in behavior needed to evaluate those clauses. The target commit is `HEAD` and contains the CFC checkpoint and its evidence. The frozen ticket remains `awaiting_review`. Existing unrelated worktree changes do not modify the reviewed harness, CFC checkpoint, committed outputs, or screenshot directory.

## Original finding outcomes

| Original clause | Outcome | Frozen oracle evidence |
|---|---|---|
| `CK-001.a` | `RESOLVED` | The committed `.codex-tools/idser-010-06-cfc-compose.out` contains separate A, B, C-supports, C-duplicates, D, and E evidence records. Each includes safe scoped IDs and the recorded DB, relationship, ordered member, execution, queue, and provider observations. The same output ends with `IDSER-010 controlled Compose scenarios A/B/C/D/E/F/H passed.` The CFC checkpoint links the corresponding approved child evidence. The recorded required command is `node apps/agents-bridge/tests/idser-010-compose.mjs` (exit 0). |
| `CK-001.b` | `RESOLVED` | The committed Compose output records `postgres`, `atlas`, `agents-bridge`, `agents-bridge-worker`, and `mistral-mock` as healthy. The committed browser output records the IDSER-009-04 lifecycle and visual/keyboard tests and `11 passed`. Ten fresh light/dark desktop, collapsed, tablet, mobile, and reflow PNGs are committed under `.codex-tools/idser-010-06-cfc-screenshots/`. The recorded required command is `docker compose exec -T atlas corepack pnpm --filter @atlas/app test:browser` (exit 0, 11/11). |

## Remediation diff and direct regressions

The diff from `101eb42` to `dee475d` adds per-scenario evidence collection and emits Compose health in `apps/agents-bridge/tests/idser-010-compose.mjs`; it also adds the checkpoint, Compose/browser outputs, and fresh screenshot artifacts. No production behavior changed in this remediation diff. The recorded deterministic Compose and browser validations pass, and no direct regression was found in the authorized evidence and regression scope.

The CFC checkpoint records these completed validations: `node --check apps/agents-bridge/tests/idser-010-compose.mjs`, `node apps/agents-bridge/tests/idser-010-compose.mjs`, the IDSER-010-06 browser command above, and `git diff --check`. Their committed output artifacts were inspected; the Compose and browser commands were not independently rerun during this CK verification.

As a supplemental formatting diagnostic, `git diff --check 101eb423f429fe6d400550b6262cc304b1eb12fc dee475d8750c667088e32772865d639a16756d38` reports a new blank line at EOF in the CFC checkpoint. This does not alter either frozen oracle or introduce a behavior regression, so it does not change the bounded result.

## Decision

Both original frozen clauses are `RESOLVED`, and no direct remediation regression was identified. `IDSER-BATCH-10-06` receives `PASS`. This is the post-CFC verification result; no new findings were introduced and no further CFC cycle is authorized by this artifact.
