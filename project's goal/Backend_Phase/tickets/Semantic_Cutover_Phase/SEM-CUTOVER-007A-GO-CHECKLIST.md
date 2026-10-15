# SEM-CUTOVER-007A GO checklist

Status: **ready for CK**. The scoped closure checkpoint and immutable 007A-only commit are prepared.

## Completed and evidenced

- [x] Removed implicit legacy-profile selection. `compileExtractionPrompt()` and `buildSemanticSourcePacket()` require an explicit legacy profile.
- [x] Added an audit proving ordinary extraction and worker-main cannot import or select the legacy compiler/packet.
- [x] Production pg-boss integration requests canonical stepwise context for text-only executions.
- [x] Added ordinary-worker image coverage: Atlas grant issuer, PostgreSQL derived-image authority, internal media redemption, and Anoman multipart loopback capture.
- [x] Exported `PostgresSemanticDerivedImageAuthority` for production composition.
- [x] Captured exact wire observations in the successful durable integration run:
  - Fake prompt hash: `b99d5a99fa33e498a9cb72411ad5116c4d7d8cbb7a44bdd308bce4d50b3b7fc0`
  - Anoman prompt hash: `b99d5a99fa33e498a9cb72411ad5116c4d7d8cbb7a44bdd308bce4d50b3b7fc0`
  - Fake schema hash: `4f6007d947e4c8f4afcc6daf1c29e31db7a50ad24a584d9cacece952f434b300`
  - Anoman schema hash: `4f6007d947e4c8f4afcc6daf1c29e31db7a50ad24a584d9cacece952f434b300`
- [x] Durable production integration completed successfully:
  - Command: `corepack pnpm --filter @atlas/agents-bridge test:semantic-integration`
  - Evidence: `.codex-tools/sem-cutover-007a-production-integration-20261015-154200/run.json`, `completion.json`, `stdout.log`, and `stderr.log`
  - Result: exit code `0`; 2 passed, 0 failed, 0 skipped.
- [x] Re-ran D1/RUN-003 perception regression: 2 passed, 0 failed.
- [x] Re-ran semantic-client integration regression: 1 passed, 0 failed.
- [x] Re-ran reconciliation protections: IDSER-007 passed (1 passed, 0 failed). The fixture now cleans its own staged-perception resources and uses IPC shutdown on Windows.
- [x] Confirmed cleanup after reconciliation validation: 0 active perception executions and 0 remaining reconciliation fixture projects.
- [x] Typechecks passed: `@atlas/contracts`, `@atlas/core`, `@atlas/db`, and `@atlas/agents-bridge`.

## In progress: closure work

- [x] Review the final 007A diff and separate it from unrelated dirty-worktree files.
- [x] Run the final agreed focused test matrix against the exact staged candidate; record command, result, and duration in the closure checkpoint.
- [x] Write the full RC-007A closure checkpoint with every review-contract row marked PROVEN and linked to its evidence.
- [x] Include the durable integration paths, exact fake/Anoman hashes, D1/RUN-003 result, reconciliation result, and non-blocking notices.
- [x] Stage only 007A paths; verify `git diff --cached --check` and staged-path scope.
- [x] Create the required immutable 007A-only commit.

## CK gate

- [x] Confirm the immutable commit contains only 007A-authorized paths.
- [x] Set the closure checkpoint to `Internal readiness: READY_FOR_CK` only after all rows above are proven from the staged commit.
- [x] Submit the checkpoint and commit as the CK review input.

## Guardrails

- Do not treat a running process, partial logs, or a command-window timeout as test evidence.
- Preserve unrelated staged, unstaged, and untracked worktree files.
- Do not create a checkpoint or immutable commit until the scoped staged diff is reviewed.
