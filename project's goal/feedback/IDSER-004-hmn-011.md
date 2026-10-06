# HMN Authorization: IDSER-004

Ticket: `IDSER-004: Semantic context and result authority`
Batch: `IDSER-BATCH-04`
HMN authorization ID: `HMN-IDSER-004-011`
Invocation: explicit user `hmn` delegation
Current workflow state: post-CFC CK verification returned `CHANGES_REQUIRED`; CK-004 has two remaining route-level evidence omissions.

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-004-semantic-context-and-result-authority.md`
Current HEAD: `da7a30e3fd6be63588a3a6814931f8d1478aa3b4` (`test(idser): complete semantic authority evidence`)
Relevant GO commit: `4c2ba356dfe760b3bcfc6c94d017c767d1444b72`
Relevant CK artifact: `project's goal/feedback/IDSER-BATCH-04-7da7a30-verification.md` (`CHANGES_REQUIRED`, CK-004 open)
Relevant CFC commit: `da7a30e3fd6be63588a3a6814931f8d1478aa3b4` (cycle 7; consumed `HMN-IDSER-004-010`)
Prior HMN authorization: `HMN-IDSER-004-010` (`AUTHORIZE_EVIDENCE_REMEDIATION`), consumed by the cycle-7 commit
Worktree state: no tracked modifications. Pre-existing untracked planning and feedback artifacts remain outside this authorization and must be preserved.

## Diagnosis

Cycle 7 supplied the real Compose HTTP request-byte boundary and both terminal race
orders. CK confirms no production authority, migration, schema, or route-contract
regression. However, the serialized-context exact-limit and one-byte-over assertions
run only through the framework-neutral route, not the actual Compose HTTP host, and
the persisted-cancelled context/result/failure responses check status but not their
bodies.

The prior CFC checkpoint's general claim of cancellation redaction is not sufficient
evidence for these missing assertions. The frozen ticket requires bounded serialized
responses and safe error output through the real route path, so this remains a
test/evidence correction only.

## Ticket-authority trace

- IDSER-004 requires response-byte bounds while serializing/streaming and excludes
  sensitive material from errors/logs.
- Its validation requires real route/DB checks for oversized responses and safe error
  output.
- `IDSER-BATCH-04-7da7a30-verification.md` limits CK-004 to the absent Compose-HTTP
  serialized-context boundary and cancellation-body assertions; it found no direct
  production regression.

## Decision

`AUTHORIZE_EVIDENCE_REMEDIATION`

Authorize one final, evidence-only CFC cycle for CK-004. This authorization is newer
than the CK verification it addresses and is consumed by exactly one remediation
commit. It does not authorize any production implementation change.

## Authorized scope

1. In the existing Compose HTTP integration path to the Atlas internal host, request
   an authorized serialized semantic context whose emitted response is exactly at the
   configured limit and assert a successful, usable response; then request one byte
   beyond that serialized response limit and assert fail-closed rejection before any
   trusted continuation or handler effect. Do not substitute a direct
   `createSemanticInternalRoutes` call for either assertion.
2. In the same real route/DB fixture, inspect the context, result, and failure
   responses for a persisted `cancelled` execution. Assert their bodies are bounded
   and contain neither provider payloads, document material, credentials, grants,
   prompts, nor SQL details, while preserving the existing no-handler-effect proof.
3. Retain the cycle-7 real request-boundary, both terminal race orders,
   provisional-write rollback, cancellation lifecycle, and conflicting-delivery
   checks. Do not weaken or replace them.
4. Update the CFC and ticket checkpoints with the exact test locations/assertions for
   each new proof, the exact commands, observed count/skips, and no unsupported
   generalization beyond those results.

## Required validation

- Run the authoritative Compose build, migration application and migration check,
  DB semantic-authority suite, Core route tests and typecheck, DB typecheck, app
  build, and `git diff --check` against the remediation commit.
- Record separate pass/fail evidence for exact-limit HTTP response, one-byte-over HTTP
  response rejection, and all three cancelled-route response bodies, including
  response-size and redaction assertions.

## Forbidden work

- Do not alter production code, database schema/migrations, lifecycle behavior,
  authority/route/credential contracts, limits, selection, completion semantics,
  provider/runtime policy, browser boundary, or downstream-ticket behavior.
- Do not use mocks or framework-neutral direct calls in place of the required Compose
  HTTP response-boundary proof, add services/polling, or start another CFC cycle
  after this commit without CK verification and a fresh explicit `hmn` invocation.
- Do not overwrite, stage, commit, or delete pre-existing untracked artifacts.

## Handoff

CFC may make one test/evidence-only remediation commit consuming
`HMN-IDSER-004-011`, retain `awaiting_review`, and hand that exact commit directly to
CK. No additional HMN authorization is needed before CK reviews that checkpoint.

Expected next command: `cfc IDSER-004`
