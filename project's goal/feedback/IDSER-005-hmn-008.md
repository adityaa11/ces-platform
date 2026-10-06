# HMN Authorization: IDSER-005

Ticket: `IDSER-005: Production semantic worker and replay`  
Batch: `IDSER-BATCH-05`  
HMN authorization ID: `HMN-IDSER-005-008`  
Invocation: explicit user `hmn` delegation  
Current workflow state: post-CFC CK verification returned `CHANGES_REQUIRED`.
`CK-001` remains resolved. Only frozen original `CK-002.a` through
`CK-002.e` remain unresolved.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-005-production-semantic-worker-and-replay.md`  
Current HEAD: `e8a9b3d73c0f1e442b664e90761f4966fda9771d` (`fix(idser): complete semantic worker evidence matrix`)  
Relevant GO commit: `0209921f5bc0cc1aaed6d74b2c30098f3e68b9b8`  
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-05-e8a9b3d-verification.md` (`CHANGES_REQUIRED`)  
Relevant CFC commit: `e8a9b3d73c0f1e442b664e90761f4966fda9771d`  
Prior HMN authorization: `HMN-IDSER-005-007`, consumed by `e8a9b3d`  
Worktree state: `HEAD` is the exact CFC handoff commit. Modified generated
Safara fixtures and pre-existing untracked planning/feedback artifacts are
outside IDSER-005 and must be preserved. There is no partial IDSER-005 CFC
worktree change to continue.

## Diagnosis

The committed production-path harness contains all five newly required cases,
but post-CFC CK found that their assertions do not establish the uniform
evidence already required by `HMN-IDSER-005-007`. The remaining defect is
therefore evidence, not production behavior or ticket scope: the current
integration cases must observe their existing real HTTP, pg-boss, Bridge, and
Atlas boundaries explicitly.

`IDSER-BATCH-05-e8a9b3d-verification.md` identifies only unresolved frozen
`CK-002.a`--`CK-002.e` clauses. Its Docker-access limitation is recorded as a
verification limitation, not a new requirement or a conclusion that the
reported Compose matrix failed. The next bounded remediation must close the
listed assertion gaps and report the exact executed validation commands.

## Ticket-authority trace

- IDSER-005's execution contract requires immutable staged output, fenced
  Bridge completion/cleanup, bounded typed failures, cancellation handling,
  and redacted operational errors.
- Its validation requires mocked-HTTP `MistralProvider` calls through the real
  production worker and Atlas paths, with provider-call counts, Bridge
  ledger/replay, restart/fencing, bound, cancellation, and orderly-stop
  evidence.
- The original CK review froze `CK-002`; HMN-007 selected its five remaining
  production-path cases and the uniform per-case observation contract.
- The latest CK verification ties every open gap to that frozen authority:
  separate conflict counts and lifecycle/fence observations (`CK-002.a`),
  context-bound failure/lifecycle/redaction observations (`CK-002.b`),
  post-stage rejection and immutable retry observations (`CK-002.c`),
  cancellation boundary and bounded outcome observations (`CK-002.d`), and
  active-stop/successor lifecycle, fence, identity, failure, and redaction
  observations (`CK-002.e`).

## Decision

`AUTHORIZE_EVIDENCE_REMEDIATION`

Authorize one new, bounded CFC cycle to complete evidence for frozen clauses
`CK-002.a`--`CK-002.e`. This is a post-CFC authorization newer than the CK
event at `e8a9b3d`; it authorizes one remediation commit only. It does not
reopen `CK-001` or add a Review Contract row.

## Authorized scope

Modify `apps/agents-bridge/tests/semantic-worker.integration.test.ts` and the
IDSER-005 CFC checkpoint only as needed to express and record the existing
production-path observations. Production source files may change only if a
named assertion exposes a direct violation of the frozen execution contract;
such a correction must be minimal, retain a direct regression assertion, and
be described in the checkpoint.

For each case, retain the existing real PostgreSQL roles, pg-boss worker,
`bridge.background_effects`, `bridge.semantic_result_delivery`, configured
default-fetch `MistralProvider`, loopback `createAtlasSemanticClient`, and
`createSemanticInternalRoutes` harness. Do not replace these with injected
fetches, doubles, or unit coverage.

| Frozen clause | Permitted evidence completion |
| --- | --- |
| `CK-002.a` | Assert provider calls separately for winner A and loser B; Atlas acceptance and failure counts and execution lifecycle for both; winner Bridge status, lease owner/generation, completion and cleanup; unchanged envelope; and redaction during conflict and recovery. |
| `CK-002.b` | Assert zero provider calls; the bounded context-failure/effect outcome and Atlas lifecycle; Bridge status, owner, generation, completion and no replay; plus job, public-response, stored-error, and thrown-error redaction. Do not retain an assertion that falsely requires absence of the required bounded failure outcome. |
| `CK-002.c` | Synchronize on the Atlas handoff rejection; compare the persisted envelope before and after it; assert retained replay, non-completed fenced effect including owner/generation, zero terminal failure, and retry identity/redaction. |
| `CK-002.d` | At the pre-stage cancellation boundary, assert provider and failure-handler counts, Atlas lifecycle, Bridge status/owner/generation/completion, bounded cancellation outcome, no trusted replay/acceptance, and all required redaction before the existing successor retry evidence. |
| `CK-002.e` | At the active post-stage stop and fresh-worker recovery boundaries, assert Atlas lifecycle and acceptance/failure counts, Bridge owner/generation/completion, replay-envelope identity across the stop, cleanup, and required redaction, while retaining the one-provider-call and one-logical-effect proof. |

Update the CFC checkpoint with a clause-by-clause table naming the asserted
observations and the exact validation commands actually run. It must state
whether Docker/Compose validation was available, must not represent an
unexecuted command as passing, and must retain the secret-free loopback/mock
arrangement.

## Required validation

Run the existing production-path environment and registered tests, without a
PostgreSQL-free or `--no-deps` substitute for the semantic integration matrix:

1. `docker compose build agents-bridge agents-bridge-worker`
2. `docker compose up -d postgres atlas agents-bridge agents-bridge-worker`
3. `docker compose ps`
4. `docker compose exec atlas corepack pnpm --filter @atlas/db migration:check`
5. `docker compose exec atlas corepack pnpm --filter @atlas/agents-bridge typecheck`
6. `docker compose exec atlas corepack pnpm --filter @atlas/agents-bridge test:semantic-integration`
7. `docker compose exec atlas corepack pnpm --filter @atlas/agents-bridge test:semantic`
8. `docker compose exec atlas corepack pnpm --filter @atlas/agents-bridge test`
9. `docker compose exec atlas corepack pnpm --filter @atlas/core test`
10. `docker compose exec atlas corepack pnpm --filter @atlas/db test:semantic-authority`
11. `docker compose exec atlas corepack pnpm --filter @atlas/contracts test`
12. `docker compose exec atlas corepack pnpm --filter @atlas/skills test`
13. `git diff --check`

The CFC checkpoint must give the literal commands actually used and their
outcomes. Docker unavailability may be reported truthfully as an environment
limitation; it is not authority to substitute a smaller harness.

## Forbidden work

- Do not redesign or modify resolved `CK-001` replay fencing/schema,
  queue technology, provider policy, Atlas truth authority, semantic
  contracts/skills, deployment configuration, or downstream IDSER-006--011.
- Do not add a service, poller, direct Atlas SQL from Bridge, live credential,
  speculative migration, unrelated refactor, or a new acceptance scenario.
- Do not weaken, omit, or fake a named observation; overwrite a replay
  envelope; unfenced-clean a row; or terminally fail a valid staged envelope.
- Do not redesign already proven CK-002 scenarios beyond adding the narrowly
  necessary observations to their existing production-path cases.
- Do not overwrite, stage, commit, or delete pre-existing untracked artifacts
  or the unrelated generated fixture modifications.

## Handoff

CFC may make exactly one remediation commit consuming `HMN-IDSER-005-008`,
retain IDSER-005 as `awaiting_review`, and hand that exact commit to CK. CK is
limited to frozen original `CK-002.a`--`CK-002.e` and direct regressions from
this remediation. A later `CHANGES_REQUIRED` result requires another explicit
user `hmn` invocation.

Expected next command: `cfc IDSER-005`
