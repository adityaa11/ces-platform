# SEM-CUTOVER-001 — Actual-HEAD inventory and frozen conflict ledger

**Status:** `approved` · **Size:** S · **Work class:** read-only contract/evidence inventory · **Dependency:** accessible current local repository and PERC-RESET-008 decision evidence. **GO:** explicit `GO SEM-CUTOVER-001` only.

## Exact objective

Freeze a reviewer-reproducible truth map for `RUN-003 -> stepwise -> BSS-V2-004-03-05` before any contract or code change. Inspect actual *local* worktree, not only the historical remote `07304cb` snapshot. Inventory current RUN-003 runtime/CI identities, existing semantic default/call sites, stepwise compiler/version/hash, REL-01/02 provenance schema, REL-03 protected candidate, 03-05 CK-001.a/b and downwind legacy-parity clauses.

## Ownership and permissions

Permitted: **new** `project's goal/feedback/SEM-CUTOVER-001-*.md/json` inventory + optional ticket status checkpoint, after verifying the chosen paths are not already present/dirty. No source code, test, Docker, DB, PDF, historical ticket, review artifact, `.env`, or REL-03 changes. Read-only `git status`, `git log`, `git diff`, `git show`, file inspection and existing evidence parsing permitted; keep sensitive material redacted. Stage exact new paths only, not `git add -A`.

## Review contract

| ID | Binary PASS oracle | Mandatory negative |
|---|---|---|
| RC-001-01 | Record full HEAD, branch/dirty paths, independent CK PASS evidence for PERC-RESET-008 and REL-01/02, exact `03-05 CHANGES_REQUIRED` review SHA/finding IDs | Stale remote or documentation `READY_FOR_CK` is not treated as actual approval |
| RC-001-02 | Trace runtime extraction `worker-main -> runSemanticJob -> buildSemanticSourcePacket -> compileExtractionPrompt()` and frozen v0.3.1 alternate; inventory provider-neutral multipart seams | No invented production stepwise dispatch or fallback behavior |
| RC-001-03 | Exact frozen-clause ledger for 03-05 RC-03, 08-01-04, 08-02-01, 08-03-02/03 RC-03, IDSER-012-02-01; label `HISTORICAL_ONLY`, `KEEP`, `PROPOSED_SUPERSESSION`, `BLOCKED` | No old CK verdict edited or retired merely on reviewer opinion |
| RC-001-04 | Identify REL-03 candidate refs, dirty/untracked files, existing canonical Compose resources by read-only evidence; name protection barriers | Cannot infer local candidate absent because remote doesn't show it |
| RC-001-05 | Enumerate source/relationship/visual representability gaps, with exact call sites and owners; separate hard technical failure from deferred epistemic uncertainty | No new design/acceptance claim without evidence |

## GO instructions

1. Confirm actual `git status --short`, branch SHA, prior artifact pointers and local ownership of files; stop if current state is inaccessible or contradicts evidence.
2. Read, do not modify, prior CK/HMN records, source packet builder, finalizer, worker, v0.3.1 compiler, REL-01/02/03. Recalculate only existing published hashes where needed.
3. Fill `TEMPLATE-SUCCESSOR-CLAUSE-LEDGER.md` into a ticket-owned new evidence record; quote **exact** conflicting clauses, file path, row ID and reviewer SHA.
4. Submit bounded change inventory and `READY_FOR_CK` for independent documentary review. No cleanup, git reset, Docker mutation or real provider call.

**Stop:** `BASELINE_UNVERIFIED`, `LOCAL_STATE_UNRESOLVED`, missing CK evidence, protected candidate ambiguity. **Terminal:** independent CK PASS unlocks preparation of the bounded HMN, not implementation authorization.
