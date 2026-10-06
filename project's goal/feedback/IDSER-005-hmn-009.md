# HMN Authorization: IDSER-005

Ticket: `IDSER-005: Production semantic worker and replay`  
Batch: `IDSER-BATCH-05`  
HMN authorization ID: `HMN-IDSER-005-009`  
Invocation: explicit user `hmn` delegation  
Current workflow state: post-CFC CK verification returned `CHANGES_REQUIRED`.
Only frozen original clauses `CK-002.a` through `CK-002.e` remain unresolved;
`CK-001` remains resolved and closed.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-005-production-semantic-worker-and-replay.md`  
Current HEAD: `17ce58d6d1a0a1b18f51b9f6f83eafa3e85dd575` (`test(idser): complete semantic evidence assertions`)  
Relevant GO commit: `0209921f5bc0cc1aaed6d74b2c30098f3e68b9b8`  
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-05-17ce58d-verification.md` (`CHANGES_REQUIRED`)  
Relevant CFC commit: `17ce58d6d1a0a1b18f51b9f6f83eafa3e85dd575`  
Prior HMN authorization: `HMN-IDSER-005-008`, consumed by `17ce58d`  
Worktree state: HEAD is the exact checkpoint CK reviewed. The IDSER-005 test
and ticket have no uncommitted changes. Preserve all unrelated modified
generated Safara fixtures and pre-existing untracked planning/feedback
artifacts. No partial IDSER-005 CFC work is present.

## Diagnosis

CK verified the exact HMN-008 remediation commit and reported `CHANGES_REQUIRED`
only for frozen original clauses `CK-002.a`--`CK-002.e`. Its verification says
the provider, lifecycle, fencing, retry, and replay assertions are present, but
the existing production-path cases do not inspect queued job payloads and
thrown errors for redaction. The cancellation case also lacks an assertion of
the bounded cancellation error value at the pre-stage boundary. CK found no
direct production behavior regression and did not reopen `CK-001`.

This is a ticket-authorized evidence gap under the ticket's requirement for
bounded/redacted operational errors and its existing production-path semantic
worker validation. It is limited to completing the observations CK names in
the existing cases. The CK verification reports the previous checkpoint's
required Compose commands as successful; it does not identify those results
as an open finding. This authorization does not add validation requirements
beyond the changed assertions and their registered suites.

## Ticket-authority trace

- IDSER-005 execution contract: operational errors must be bounded and must
  not expose results, prompts, PDF content, grants, or credentials.
- IDSER-005 validation: semantic worker behavior is proved through the
  existing Compose production-path harness with mocked HTTP Mistral responses.
- Frozen CK matrix: only original `CK-002.a`--`CK-002.e` remain open. CK's
  `17ce58d` verification identifies the missing queued-job and thrown-error
  redaction observations for these cases, plus the bounded cancellation error
  assertion in `.d`.
- HMN-008 authorized the five cases and uniform observations; this decision
  narrows follow-up work to CK's reported gaps and does not create or strengthen
  a Review Contract row.

## Decision

`AUTHORIZE_EVIDENCE_REMEDIATION`

Authorize exactly one new bounded CFC cycle for frozen clauses
`CK-002.a`--`CK-002.e`. It may complete only the evidence gaps recorded in
`IDSER-BATCH-05-17ce58d-verification.md`. It does not authorize production
redesign, new scenarios, or reopening resolved `CK-001`.

## Authorized scope

Modify `apps/agents-bridge/tests/semantic-worker.integration.test.ts` and the
IDSER-005 CFC checkpoint only as needed to express and record CK's existing
required observations. Keep the current real Compose/PostgreSQL, pg-boss,
Bridge ledger/replay, configured `MistralProvider`, loopback Atlas client, and
Atlas semantic route harness. Keep synthetic credentials and loopback/mock
provider traffic; do not replace the harness with injected fetches, doubles,
or unit tests.

| Frozen clause | Authorized evidence completion |
| --- | --- |
| `CK-002.a` | In the existing conflict and recovery case, inspect the actual pg-boss `job.data` for winner and loser and capture/redact the errors thrown by the existing `runSemanticJob` callback during conflict and failed delivery/recovery. Preserve current winner/loser, provider-count, lifecycle, fence, envelope, and cleanup assertions. |
| `CK-002.b` | In the existing context-bound case, inspect the actual pg-boss `job.data` and capture/redact the error thrown by `runSemanticJob`. Preserve the existing bounded context-failure outcome, zero provider calls, lifecycle/fence, response, stored-error, and no-replay assertions. |
| `CK-002.c` | In the existing post-stage envelope-bound case, inspect the actual pg-boss `job.data` and capture/redact the error thrown by `runSemanticJob`. Preserve handoff rejection synchronization, replay identity, retry, and fenced-effect assertions. |
| `CK-002.d` | At the existing pre-stage cancellation boundary, capture the actual error thrown by `runSemanticJob`, assert that its value is the bounded cancellation outcome, then check it for redaction; inspect the actual pg-boss `job.data` there as CK requires. Preserve existing provider/failure counts, lifecycle, fence, no-replay/no-acceptance, and successor retry assertions. |
| `CK-002.e` | At the existing active stop and fresh-worker recovery boundaries, inspect the actual pg-boss `job.data` and capture/redact errors thrown by `runSemanticJob` during the interrupted delivery/recovery. Preserve current active-stop, envelope identity, provider/acceptance counts, lifecycle/fence, and cleanup assertions. |

To observe thrown errors, wrap the existing test callback around
`runSemanticJob`, record its caught error for the execution, and rethrow the
same error so pg-boss retry behavior is unchanged. Inspect the actual `job.data`
received by that callback. Serialize plain job objects recursively (for
example, with `JSON.stringify`) and inspect an error's name/message and any
string cause; do not use `String(object)` as proof because it yields
`[object Object]` and does not inspect nested fields. Apply the existing
redaction assertion to those serialized surfaces at each named boundary,
without printing sensitive values into test output. Keep current public-route
response and stored-error checks.

Redaction assertions must cover the ticket-listed sensitive categories on the
named operational surfaces: credentials, prompts, grants, source content/path,
and result bodies. Do not create a new scenario or broaden the claimed
observations beyond these CK clauses.

Production source may change only if one of these exact assertions proves a
direct violation of the frozen execution contract; any correction must be
minimal, within the existing ticket edit seams, and accompanied by a direct
regression assertion. Record that evidence and any such change in the CFC
checkpoint. No production defect is currently evidenced by CK.

## Required validation

Run the changed assertions on the required Compose production-path harness,
then run the existing registered semantic and Bridge suites and whitespace
check. Record literal commands and actual outcomes in the CFC checkpoint; do
not represent an unexecuted command as passing.

1. `docker compose exec atlas corepack pnpm --filter @atlas/agents-bridge test:semantic-integration`
2. `docker compose exec atlas corepack pnpm --filter @atlas/agents-bridge test:semantic`
3. `docker compose exec atlas corepack pnpm --filter @atlas/agents-bridge test`
4. `git diff --check`

The semantic integration matrix must use the existing PostgreSQL-backed
Compose services, without a PostgreSQL-free or `--no-deps` substitute. Do not
claim Docker/Compose was available unless verified in this CFC run.

## CK handoff readiness gate

Do not mark this remediation `READY_FOR_CK` or hand it off while any of the
following is absent: for each of `CK-002.a`--`.e`, the existing production-path
case asserts redaction over recursively serialized actual `job.data` and
captured `runSemanticJob` thrown-error values at the boundary CK identified;
`.d` also asserts the actual bounded cancellation error value before
redaction. Preserve the already recorded public-response and stored-error
checks and the existing lifecycle, provider, fence, replay, and cleanup proof.
Record these observations clause by clause in the CFC checkpoint, with exact
validation commands and outcomes. The production-path integration run and
both registered suites above must pass; `git diff --check` must pass. Any
unresolved observation, failed validation, or direct regression means the
checkpoint is not ready for CK.

This gate restates the open frozen CK clauses and the shared
`READY_FOR_CK` rule; it adds no acceptance criterion and does not predetermine
CK's result. CK retains authority to verify the committed evidence and direct
regressions within its frozen scope.

## Forbidden work

- Do not modify resolved `CK-001` replay fencing/schema, queue technology,
  provider policy, Atlas truth authority, semantic contracts/skills,
  deployment configuration, or downstream IDSER-006--011.
- Do not add or redesign scenarios, services, pollers, migrations, credential
  handling, or unrelated code. Do not use live Mistral credentials.
- Do not weaken existing assertions, replace the production-path harness,
  overwrite a replay envelope, unfenced-clean a row, or terminally fail a valid
  staged envelope.
- Preserve all unrelated worktree changes and untracked artifacts.

## Handoff

CFC may make exactly one remediation commit consuming `HMN-IDSER-005-009` and
retain IDSER-005 as `awaiting_review`. CK then verifies only frozen original
`CK-002.a`--`CK-002.e`, the remediation diff, the evidence above, and any
direct regression introduced by the remediation. Any later `CHANGES_REQUIRED`
requires a fresh explicit user `hmn` invocation.

Expected next command: `cfc IDSER-005`
