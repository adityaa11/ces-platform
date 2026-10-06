# CK review: IDSER-002 / IDSER-BATCH-02

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-002-semantic-contracts-and-production-skills.md` / `IDSER-BATCH-02`
- Reviewed commit: `f4b65f08c949d223a690ca0c3c1b6e98e7b797ff` (`feat(contracts): add semantic skill contracts`)
- Frozen ticket reference: IDSER-002 at `awaiting_review`, recorded at HEAD `f173ebe82f82974d6628e13470a8a9eea36ac250`; its implementation checkpoint names the reviewed commit.
- Dependency: IDSER-001 is approved at `a64c62b122c1f3aba1ab11058f05e1495fcaba30`, with its CK verification recorded as `PASS`.
- Review type: first consolidated CK review.
- Result: `CHANGES_REQUIRED`

## Review preconditions and evidence

- `HEAD` is `f173ebe82f82974d6628e13470a8a9eea36ac250`; the recorded implementation commit `f4b65f08c949d223a690ca0c3c1b6e98e7b797ff` is an ancestor. The intervening HEAD commit records the ticket checkpoint. No tracked worktree changes are present; existing untracked review/context artifacts do not alter the reviewed commit. No prior `IDSER-BATCH-02` review artifact was present.
- Reviewed the frozen ticket's contract requirements, acceptance criteria, validation obligations, and mandatory `REV-READY-IDSER-002-01`/`02`/`03` bindings, along with its cited implementation context and approved IDSER-001 dependency checkpoint.
- Inspected the committed semantic schemas/parsers, extraction and reconciliation skill definitions, package exports, and committed semantic tests at the named implementation commit.
- `git diff --check f4b65f0^..f4b65f0` passed.
- Compose validation was rerun after obtaining Docker engine access. `docker compose ps` returned successfully with no services running; `docker compose build atlas` succeeded. These commands then passed: `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/contracts test` (6 tests, 0 failed/skipped), `... @atlas/contracts typecheck`, `... @atlas/skills test` (1 test, 0 failed/skipped), and `... @atlas/skills typecheck`. The passing suites still lack the explicit fixture matrix required by the ticket; passing the currently registered tests does not resolve CK-004.

## Findings

| ID | Ticket authority | Evidence and affected location | Required correction |
|---|---|---|---|
| CK-001 | IDSER-002 contract requirements, source accounting and evidence (`43–50`); acceptance criterion 4; `REV-READY-IDSER-002-02` | `packages/atlas-contracts/src/semantic.ts:21,23–24,53–64`. The evidence schema permits `text_block` and `table` references without an excerpt, although text-based evidence requires one. Extraction integrity checks ensure inventory destinations point to existing candidate IDs, but do not require every candidate ID to be accounted for by any inventory row; a candidate can be omitted from inventory and still pass. | Require excerpts for text-based locators, and enforce bidirectional local-ID accounting so each candidate is represented by source inventory. Add positive/negative parser fixtures for these cases. |
| CK-002 | IDSER-002 handoff and limits (`71`); validation (`87`); `REV-READY-IDSER-002-01` | `packages/atlas-contracts/src/semantic.ts:19,23,34`. `jsonValue` limits only the immediate array/object size. Array items and object values use unconstrained `{}` schemas, so arbitrarily deep nested payloads and nested arrays are accepted as long as the aggregate byte cap is not exceeded. This does not declare finite nested payload limits as required. | Bound recursive JSON payload depth and nested collection sizes (or use an equivalent bounded validator), and test values at and beyond those limits, including a payload still below the aggregate byte cap. |
| CK-003 | IDSER-002 handoff and limits (`69`); acceptance criteria 3 and 4; `REV-READY-IDSER-002-01` | `packages/atlas-contracts/src/semantic.ts:33,49`. `parseSemanticExtractionContext` validates the scope and normalized document independently but never checks that `scope.documentId` equals `normalizedDocument.artifactId`. A context carrying another document's normalized source therefore passes the public parser. | Add the cross-field document identity check in the extraction-context parser and a negative test for a mismatched document ID. |
| CK-004 | IDSER-002 validation (`85–88`); acceptance criterion 2; mandatory `REV-READY-IDSER-002-02` evidence | `packages/atlas-contracts/tests/semantic.test.ts:9–23` and `packages/atlas-skills/tests/semantic-skills.test.ts:5`. The committed fixtures exercise one semantic kind (`rule`) and one relationship (`new`); they do not provide the required positive/negative fixtures for each required kind and relationship, nor the listed empty/non-fact-only, ambiguity, same-document contradiction, count-cap, excessive-payload, and malformed-envelope matrix. The ticket's checkpoint summary reports the two suites passing but does not satisfy these explicit coverage cases. | Add and register the prescribed positive/negative schema and boundary fixtures, including the semantic kind/relationship matrix and source-accounting/reconciliation cases; run them in the authoritative Compose environment and record exact results. |

## Scope-change observations

None. The findings are implementation repairs within the frozen IDSER-002 contract and validation scope.

## Decision

IDSER-002 / `IDSER-BATCH-02` receives `CHANGES_REQUIRED` at `f4b65f08c949d223a690ca0c3c1b6e98e7b797ff`. Keep the ticket at `awaiting_review`. CFC may address only CK-001 through CK-004; IDSER-003 remains gated on a later IDSER-002 `PASS`.
