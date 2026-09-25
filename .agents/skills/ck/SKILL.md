---
name: ck
description: Atlas committed-checkpoint review workflow. Use only when the user invokes `ck` as the Atlas ticket review command or explicitly requests CK review of a bounded Atlas checkpoint.
---

# Atlas CK Workflow

## Purpose

CK reviews a committed implementation checkpoint, creates one consolidated review artifact, and owns review-session convergence. CK uses `.agents/skills/engineering-implementation-review/SKILL.md` for review reasoning; it does not replace or duplicate that skill.

The frozen ticket is the review contract. Review authority does not permit changing or expanding it.

## Execution efficiency

CK must optimize orchestration and output volume without weakening review coverage.

- Resolve the target in one compact read-only pass: current `HEAD`, worktree status, ticket state/batch, latest review artifact, review round, and remediation commit. Do not dump the whole repository or every feedback file.
- Read only the current ticket sections needed for the round. Do not load large implementation-context documents unless a ticket reference or unresolved finding requires them.
- Round 1 may inspect the full ticket-authorized boundary. Rounds 2 and 3 must remain bounded to the prior findings, remediation diff, affected acceptance criteria, and affected review extensions.
- Prefer targeted `git show`, `git diff`, `rg`, and line slices over whole-file output. Keep tool output compact; summarize successful commands instead of replaying their logs into context.
- For Compose validation, start required services once, build the validation image once (`docker compose build --quiet atlas`), then omit `--build` from subsequent `docker compose run --rm --no-deps atlas ...` commands. Do not rebuild for every check.
- When several Compose checks are required, use `.agents/skills/ck/scripts/run-compose-checks.mjs` with a task-local manifest or `--checks-json`. It builds once, runs checks serially, emits pass/fail counts, and can write a compact JSON report with command arguments, durations, exit codes, and output tails. Retain full logs only when a command fails or the review artifact requires an environment limitation.
- Do not run database-mutating checks in parallel. Read-only target resolution, source inspection, and independent static checks may be parallelized when they do not obscure failure attribution.
- Record exact commands and results in the review artifact, but do not include repeated Docker build logs or unchanged diagnostic output.

## Resolve the review target

From repository state, resolve the current ticket and batch, ticket-set README, frozen ticket baseline, dependency checkpoints, implementation evidence, required validation evidence, current committed `HEAD`, prior CK artifacts for this ticket/baseline, and any CFC remediation commit.

CK reviews a committed revision only. Confirm that the ticket is `awaiting_review` and that the recorded checkpoint matches the intended reviewed `HEAD`. Do not use uncommitted changes as implementation or validation evidence. If in-scope working-tree changes exist, the reviewed commit is ambiguous, or the ticket is not review-ready, record a blocking result instead of silently moving the review target.

Read legacy review artifacts without requiring retroactive migration. New artifacts must use the richer format below.

## Determine the review round

Review rounds belong to one ticket/batch and frozen ticket baseline. Find the latest artifact for that baseline and follow its remediation chain.

- No prior review: Round 1.
- Latest result `CHANGES_REQUIRED`, followed by a committed CFC remediation: next round is the previous round plus one.
- Latest result `CHANGES_REQUIRED` with no committed remediation: the current round remains open. Do not re-review the unchanged revision as a new round; return control to the user for CFC or another explicit decision.
- Latest result `PASS`: the review session is closed. Do not start another ordinary round for that accepted revision.
- Latest result `BLOCKED` or `REVIEW_CONVERGENCE_BLOCKED`: stop. CK cannot silently restart the session.
- A legacy artifact with `INCONCLUSIVE`, an unknown result, or insufficient information to establish its baseline/round/commit is not a PASS and cannot safely advance the ledger. Record a preflight `BLOCKED` artifact with round `UNASSIGNED` (it does not consume a CK round), explain the missing information, and request explicit human direction; do not guess a round or silently replace the artifact.
- An explicitly planning-approved ticket baseline or explicitly authorized new implementation revision can establish a new session; preserve the earlier artifacts.

Default `MAX_CK_ROUNDS` is 3. Round 3 is the last review in an ordinary session. A round limit never clears findings or converts unresolved work into `PASS`.

## Review scope by round

### Round 1: full independent review

Apply the complete base review in the engineering implementation review skill. Inspect ticket scope and acceptance, dependencies, authority/architecture boundaries, correctness, negative behavior, required evidence/tests, and regressions within the affected boundary. Inspect the declared review extensions and all mandatory bindings. Report one consolidated set of reasonably discoverable findings.

Round 1 is not limited to the implementation author's claimed changes. Discovery may exceed the ticket; authority may not.

### Rounds 2 and 3: bounded verification

Read the prior review and inspect:

- every prior finding and the evidence claimed to resolve it;
- the CFC remediation delta and its regression risk;
- acceptance criteria affected by remediation; and
- security/frontend extension areas affected by the change or still unresolved.

Do not restart broad exploratory review over already accepted, unrelated areas. If concrete evidence establishes that a ticket violation existed in Round 1's authorized review boundary but was missed, report it as `LATE_DISCOVERY` and explain why it is in scope. A late discovery can block `PASS` and counts in convergence assessment.

For frontend tickets, apply `.agents/skills/frontend-awareness/references/review-gate.md` and the applicable requirements in `project's goal/Atlas_UI_UX_Review_Protocol.md`. UI/UX stakeholder-stage rounds and GO/CK/CFC implementation rounds are separate. CFC verification does not reopen approved design direction.

## Findings and identity

Use the engineering implementation review classifications:

```text
IMPLEMENTATION_DEFECT
SCOPE_DIVERGENCE
PLANNING_GAP
KNOWLEDGE_GAP
```

Assign blocking findings stable session IDs `CK-001`, `CK-002`, and so on. Reuse an existing ID for the same defect in later rounds; do not create a new ID because wording or evidence presentation changed. Assign a new ID only to a distinct finding. On later rounds, new defects missed by Round 1 use origin `LATE_DISCOVERY`.

Every finding must record:

```text
ID
Classification
Origin
Status
Ticket requirement / acceptance criterion
Location
Evidence
Requested observable outcome
```

Allowed origins:

```text
INITIAL_REVIEW
REMEDIATION_INCOMPLETE
REMEDIATION_REGRESSION
LATE_DISCOVERY
```

Use `REMEDIATION_INCOMPLETE` when a prior fix did not resolve its finding. Use `REMEDIATION_REGRESSION` for a defect caused by the remediation. Mark a prior finding `RESOLVED` only when concrete evidence shows the requirement is met. Resolved findings are sticky: reopen them only for `REMEDIATION_INCOMPLETE`, `NEW_EVIDENCE`, or `REMEDIATION_REGRESSION`, and state the evidence. Do not reopen for reviewer preference or stylistic disagreement.

Keep non-blocking advice in a separate advisory section. Advisory observations do not block `PASS`, authorize CFC, or expand the ticket.

## Review result

Use exactly one review-level outcome:

- `PASS`: all in-scope blocking findings are resolved and mandatory review obligations/evidence are satisfied for the reviewed commit.
- `CHANGES_REQUIRED`: one or more open, implementation-repairable `IMPLEMENTATION_DEFECT` findings remain and no planning/knowledge blocker prevents remediation.
- `BLOCKED`: scope divergence, planning gap, material knowledge gap, missing mandatory review input, or unavailable required evidence prevents ordinary implementation remediation.
- `REVIEW_CONVERGENCE_BLOCKED`: Round 3 ends with any blocking finding still open. Explain the convergence failure and return authority to human/planning review.

At Round 3, unresolved blocking findings always produce `REVIEW_CONVERGENCE_BLOCKED`, never `PASS` and never an automatic CFC. CFC and GO must stop after this result unless a human/planning authority explicitly authorizes a new review session or baseline.

If correctable defects and a planning/security blocker coexist, record both; use `BLOCKED` because CFC cannot invent the missing policy or planning decision. If Round 3 still has blockers, use `REVIEW_CONVERGENCE_BLOCKED`.

## Convergence

For every round after Round 1, record one:

- `IMPROVING`: remediation materially closes blockers without equivalent new blockers.
- `STALLED`: the same blocker remains materially unresolved or state does not improve.
- `REGRESSING`: remediation causes new blockers or breaks previously accepted behavior.

Convergence describes evidence; it does not override finding status or change the result rules.

## Persist one consolidated review

Write one new artifact per CK round under `project's goal/feedback/`, following the established `<BATCH>-<COMMIT>-review.md` convention. Do not rewrite prior reviews. Include enough information to reconstruct the session:

```markdown
# Review: <ticket or batch>

- Ticket / batch: `<ticket>` / `<batch>`
- Reviewed commit: `<full or unambiguous commit>`
- Frozen ticket baseline: `<ticket path and baseline/revision>`
- Review round: <1-3>
- Maximum review rounds: 3
- Prior review: `<path or None>`
- Remediation commit: `<commit or None>`
- Result: `PASS | CHANGES_REQUIRED | BLOCKED | REVIEW_CONVERGENCE_BLOCKED`
- Convergence: `IMPROVING | STALLED | REGRESSING` (Round 2 or 3)

## Evidence
...

## Findings
| ID | Classification | Origin | Status | Requirement | Location | Evidence | Requested outcome |
|---|---|---|---|---|---|---|---|

## Advisory observations
...

## Decision
...
```

Record only commands actually run, exact outcomes, test counts/skips, and environment limitations. Do not claim a test or extension passed when it was not applied. Keep implementation fixes out of the review artifact and do not edit the ticket baseline during review.

## Final rule

CK may judge the committed work, but cannot implement it, waive a blocking finding, or extend the review loop beyond Round 3.
