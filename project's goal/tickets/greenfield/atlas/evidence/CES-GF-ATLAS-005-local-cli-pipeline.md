# CES-GF-ATLAS-005 Local CLI Pipeline Evidence

**Validated:** 25 July 2026  
**Status:** Hosted CI passing; real-provider validation pending

## Delivered command surface

- `ces atlas run` ingests Markdown or PDF, invokes a fixture or compatible HTTPS
  provider, and atomically publishes a review bundle.
- `ces atlas resume` imports revision-bound human decisions and emits approved
  packages, review report, core handoff, and graph artifacts.
- `ces atlas inspect` prints the redacted run manifest.
- Exit code `7` means the run is safely paused for human review.

The command groups ingestion, extraction, and review preparation under `run`;
approval import and build under `resume`; and artifact status under `inspect`.

## Safety and review boundary

- Missing human decisions always pause; they never imply approval.
- Provider output remains constrained to candidate review states.
- Secrets are accepted only through `CES_ATLAS_API_KEY`.
- Secret-like CLI flags are rejected before provider invocation.
- Run manifests contain provider/model identifiers and revisions but no
  authorization material or PRD text.
- PDF providers receive normalized text, never original PDF bytes.

## Stale-state behavior

Resume verifies:

- canonical run-manifest revision;
- source-index content hashes and manifest source pins;
- candidate-analysis revision;
- candidate revision and source revision on every human decision;
- clarification-answer source revisions.

Any mismatch fails before output publication.

## Transactional artifact publication

Artifacts are written to a generated sibling staging directory. A valid prior
output is moved to a sibling backup only after all new artifacts are prepared.
The staged directory is renamed into place atomically, and the prior output is
restored if publication fails. Staging data is removed safely.

Tests prove invalid provider output and stale decisions do not replace the last
valid artifact directory.

## Determinism and compatibility

Repeated resume with equivalent inputs produces byte-identical files across:

- Requirement Collection and Requirement Packages;
- review report;
- JSON, Markdown, and Mermaid graph views;
- core-handoff summaries and Policy Manifests;
- completed run manifest.

All 20 pre-existing CLI tests pass unchanged, covering Phase 1 and Phase 2
commands and exit codes.

## Local fixtures

- End-to-end Markdown run, review, resume, and repeat resume.
- Native-text PDF command run with page-provenance artifact.
- Stale decision and failed provider fixtures.
- Secret-argument rejection and redacted inspection.
- Mocked HTTPS transport behavior from the agent-provider SDK suite.
- Human correction and provider self-approval rejection from Atlas review and
  provider suites.

## Local validation

```text
corepack pnpm check

Typecheck: passed
Tests:     219 passed, 0 failed, 0 skipped
Test files: 32 passed
Build:     passed
```

## Hosted validation

- Workflow: `CES repository tests`
- Run: [`30114729732`](https://github.com/adityaa11/ces-platform/actions/runs/30114729732)
- Job: [`89552500118`](https://github.com/adityaa11/ces-platform/actions/runs/30114729732/job/89552500118)
- Result: passed
- Commit: `e7123161123cc35616e6784ed83320c1daa3fdfb`

## Remaining evidence

A manual compatible real-provider run must be recorded without PRD content or
credentials.

Architect implementation remains gated until both items are accepted.
