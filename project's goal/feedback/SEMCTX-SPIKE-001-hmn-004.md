# HMN Validation-Contract Amendment: SEMCTX-SPIKE-001 v0.3

Ticket: `SEMCTX-SPIKE-001 v0.3`
Batch: `SEMCTX-SPIKE-001`
HMN authorization ID: `HMN-SEMCTX-SPIKE-001-004`
Invocation: explicit user `HMN — SEMCTX-SPIKE-001 v0.3` delegation
Current workflow state: `PLANNING_DECISION_REQUIRED`

Frozen ticket reference: `project's goal/Backend_Phase/SEMCTX-SPIKE-001-v0.3-planning-proposal.md`
Frozen oracle review: `project's goal/feedback/SEMCTX-SPIKE-001-v0.3-bbca5e8-oracle-review.md` (`PASS` for oracle materialization only)
Relevant GO evidence: `project's goal/feedback/SEMCTX-SPIKE-001-v0.3-execution-evidence.md`
Prior HMN authorization: `HMN-SEMCTX-SPIKE-001-003`
Starting HEAD: `633d19f712570ae06db8050c2362fdca95c63b59`
Candidate worktree: this checkout, with the isolated v0.3 implementation still uncommitted when this amendment was evaluated.

## Diagnosis

The isolated simulator's ticket-derived rows (`RC-001`, `RC-002`, and `RC-004`) are proven by the frozen runner. The only unproven GO row was the required legacy fixture-suite regression check (`RC-003`): `pnpm --filter @atlas/fixtures test` exits `1` because a fixture test expects a historical exact phrase that the already-existing GO skill no longer contains.

This is not a successful legacy suite. It is one pre-existing legacy contract/skill-test mismatch. The user has explicitly authorized a versioned, additive alternative proof only if its identity is reproduced on the untouched start commit, its relevant sources are equivalent, no additional candidate failures exist, and directly relevant legacy tests are recorded.

## Ticket-authority trace

- v0.3 §5 requires legacy regression evidence before `READY_FOR_CK`; v0.3 §4 makes the named legacy baseline hashes observation-only guards and prohibits changing them to make a check pass.
- The user-provided HMN authorization is the planning decision that selects one bounded alternative proof for the pre-existing fixture failure. It does not change F1–F3 behavior, the frozen oracle, production acceptance, or the legacy test/skill contract.
- The shared Review Contract permits only ticket-derived rows and requires `READY_FOR_CK` to have proven required validation. This amendment supplies the sole accepted alternative proof for `RC-003`; it is not a general waiver.

## Baseline-equivalence evidence

### Untouched start-commit reproduction

An independent detached worktree was created at `633d19f712570ae06db8050c2362fdca95c63b59`, before using the candidate implementation. In that worktree:

```text
pnpm --filter @atlas/fixtures test
exit: 1
tests: 41; pass: 40; fail: 1; cancelled: 0; skipped: 0; todo: 0
```

The sole failure is exactly:

```text
test: workflow skills enforce the review-contract handoff boundaries
location: packages/atlas-fixtures/tests/workflow-review-contract.test.mjs:28:1
expected: /MUST NOT hand off with a known `UNRESOLVED`,\s*`IMPLEMENTED_UNPROVEN`, or `BLOCKED_AUTHORITY` row/
actual GO text: `IMPLEMENTED_UNPROVEN`, `BLOCKED_AUTHORITY`, or `BLOCKED_ENVIRONMENT` row
```

### Source identity

The relevant committed Git object hashes are identical at the start commit and in the candidate worktree:

| Source | Canonical Git blob SHA-1 |
| --- | --- |
| `.agents/skills/go/SKILL.md` | `1b5f07b1a699a69c61c5219ed6a36a1b5cd06625` |
| `packages/atlas-fixtures/tests/workflow-review-contract.test.mjs` | `aef200d6b8c0271ea262bdacf459b5cf12f69061` |

The test file's raw SHA-256 is also identical in both worktrees: `e2788be4d2f536ec75f1ccf02bd3ee54689dd784ba2389176aed44ae8a9ced0d`. The detached checkout represented the GO skill with CRLF while the candidate checkout represented it with LF; `git diff --no-index` reports no content difference, and the canonical Git blob hash above is the validation identity. The semantic failure is therefore not attributable to the candidate.

### Candidate comparison

The same full fixture command in the candidate returned the same one failure, at the same test and assertion, with `40` passes and `1` failure. There were no additional failures. `git diff --name-only 633d19f -- .agents/skills/go/SKILL.md packages/atlas-fixtures/tests/workflow-review-contract.test.mjs` was empty.

## Preserved original fixture-suite result

The untouched-start suite generated and validated `packages/atlas-fixtures/generated/safara-golden-bundle.json`; the test-runner result was:

```text
PASS  skills mode defaults to codex and accepts only documented repository-wide values
PASS  skills mode cannot silently enable an unconfigured Agents Bridge
PASS  fixture scenarios cover each required role and major prototype state
PASS  repository lifecycle counts describe the same fixture-owned PRD records
PASS  project routes resolve fixture-owned projects and workspaces only by stable ID
PASS  project creation request produces one extracting fixture record and matching job by stable ID
PASS  project intake retries a colliding Initial Draft ID and fails without a usable token
PASS  SFE-002 completes the persisted saf-24aysgyw4su6 workspace only after page-grounded accounting
PASS  SFE-002 persisted extraction passes the application structural gate and rejects an unmarked duplicate
PASS  SFE-002 persisted extraction has unique inventory IDs and explicit repeated candidate links
PASS  SFE-002 persisted extraction keeps fragmented information and end-to-end acceptance criteria atomic
PASS  SFE-002 persisted extraction splits registration history, registration gates, and quota calculation
PASS  workspace review projections are isolated, source-language, and candidate-only
PASS  workspace review projections retain a differently worded source without phrase rules
PASS  workspace creation is transient, Master-rooted, collision-safe, and unavailable while extracting
PASS  workspace creation accepts the fixture inventory's stable Master branch ID
PASS  a supplied Ready-for-review fixture workspace becomes selectable and openable
PASS  workspace selector inventory is fixture-owned, stable-ID keyed, and exposes availability
PASS  SFE-003 resolves the completed Initial Draft route from its stable fixture identities
PASS  SFE-003 resolves any completed modal record and keeps Master empty
PASS  project-card stress inputs stay isolated from accepted scenarios and cover each planned field limit
PASS  source-grounded fixture records keep quote, document, page, and relationships
PASS  every fixture cross-link and source-accounting destination resolves in the shared workspace
PASS  main workflow fixtures preserve ordered groups, semantic pages, and node provenance
PASS  golden Safara fixture uses the verified incremental PRD metadata and reciprocal reading links
PASS  the generated bundle records schema-valid envelopes for every shared skill stage
PASS  semantic identity, supersession, dependencies, and staged changes remain explicit
PASS  verification proves every required architectural invariant before publication
PASS  GLF-003-02 accounts for exactly the eleven authoritative Safara pages
PASS  each inventory statement has one destination and every candidate keeps exact provenance
PASS  all branch facts and projections resolve to inventory-backed candidates
PASS  negative publication cases preserve the last valid bundle
PASS  reconciliation counts are derived from fixture data
PASS  every Atlas skill manifest parses and validates representative valid and invalid data
PASS  skill contracts reject malformed evidence, modes, branches, proposals, projections, and checks
PASS  every shared skill is candidate or advisory only and carries execution provenance
PASS  SFE-002 extraction stays candidate-only and supplies a validated repository handoff
PASS  workspace review contract accepts the persisted complete extraction
PASS  SFE-002 repository candidate and verification preserve an empty Master
PASS  GO, CK, CFC, and HMN use one canonical Review Contract protocol
FAIL  workflow skills enforce the review-contract handoff boundaries

tests 41
pass 40
fail 1
cancelled 0
skipped 0
todo 0
exit status 1
```

The complete failure identity and expected-versus-actual text are retained in the preceding baseline record. No test output is represented as a suite pass.

## Directly relevant legacy contract/skills validation

| Command | Actual result |
| --- | --- |
| `node --test packages/atlas-fixtures/tests/workflow-review-contract.test.mjs` | `1` pass, `1` failure: the same baseline-equivalent handoff-boundary assertion. |
| `node --test packages/atlas-fixtures/tests/skill-contracts.test.mjs` | `6` passes, `0` failures. |
| `node --test packages/atlas-fixtures/tests/contracts.test.mjs` | `25` passes, `0` failures. |
| `pnpm --filter @atlas/fixtures test` in the detached baseline | `40` passes, `1` failure: the exact assertion above. |
| `pnpm --filter @atlas/fixtures test` in the candidate | `40` passes, `1` failure: the exact assertion above; no additional failures. |

## Independent protocol review

The GO workflow ordinarily forbids handoff with `BLOCKED_AUTHORITY` unless the frozen ticket permits skipping the validation and defines accepted alternative proof. The user has supplied that explicit, bounded planning decision. The alternative does not claim the fixture suite passes: it proves no newly introduced fixture-suite regression only because the full failure identity and its sources are baseline-equivalent and the candidate adds no failure.

The CK workflow remains unchanged. A future CK reviews the committed isolated checkpoint against the frozen v0.3 contract plus this amendment as the selected evidence method for `RC-003`; it must still verify the simulator evidence, the scope-limited diff, the exact exception, and absence of direct regressions. This amendment is neither a CK `PASS` nor a change to the fixture/skill contract. It creates no new CFC target and does not authorize production integration or canonical acceptance.

## Decision

`AUTHORIZE_BOUNDED_VALIDATION_CONTRACT_AMENDMENT`.

`RC-003` is `PROVEN` only under this exact alternative proof:

1. the baseline commit is `633d19f712570ae06db8050c2362fdca95c63b59`;
2. the failure is only `workflow skills enforce the review-contract handoff boundaries` at `workflow-review-contract.test.mjs:28:1`, with the recorded expected regex and actual GO phrase;
3. the canonical source hashes above remain equal;
4. the candidate full suite has exactly `40` passes and that one failure, with no additional failure; and
5. the focused legacy results and all frozen v0.3 oracle evidence remain as recorded.

Any changed source identity, changed assertion, additional failure, or failed frozen oracle revokes this alternative proof and returns the ticket to `BLOCKED_AUTHORITY` / `PLANNING_DECISION_REQUIRED`.

## Authorized scope

Commit only the isolated v0.3 planner, runner, README, execution evidence, and this amendment. This amendment accepts a documented baseline-equivalent pre-existing fixture failure as evidence only for no newly introduced legacy regression. It does not modify, suppress, or redefine that failure.

## Required validation

Before commit, rerun the frozen v0.3 runner and retain its exact manifest hash, A-01–A-10 and N-01–N-09 outcomes, replay results, and forbidden-effect counters. Reconfirm the candidate fixture-suite result and directly relevant legacy contract/skill tests above. Audit the staged path list against the authorized inventory.

## Forbidden work

Do not modify `.agents/skills/go/SKILL.md`, `packages/atlas-fixtures/`, any frozen v0.3 fixture, expected output, profile, manifest, or negative case, production code, Semantic V1 contracts, providers, databases, queues, reconciliation, acceptance, or `SCHEMA_FIT_BLOCKED`. Do not claim the complete legacy fixture suite passes. Do not authorize production integration, canonical acceptance, or downstream work.

## Handoff

Expected next command: `ck` against the committed isolated SEMCTX v0.3 checkpoint. The implementer readiness disposition may be `READY_FOR_CK` only while every condition in this amendment continues to hold. `SCHEMA_FIT_BLOCKED` remains open.
