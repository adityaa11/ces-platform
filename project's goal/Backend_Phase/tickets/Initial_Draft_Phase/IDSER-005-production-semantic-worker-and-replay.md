# IDSER-005: Production semantic worker and replay

- **State:** `awaiting_review`
- **Review batch:** `IDSER-BATCH-05`
- **Depends on:** IDSER-001, IDSER-002 and IDSER-004 `PASS`.
- **Baseline:** SRC-IDSER-01 sections 12-15, 24-25, 32-35, 41.3/41.6/41.7, 43; AC-07/08/09/25/28/38/41. See [README](README.md).
- **Execution environment:** Existing Compose-managed `agents-bridge-worker`; deterministic tests remain secret-free.

## Outcome

Replace TestRuntime for production semantic background jobs with a dispatcher
that obtains Atlas-authorized context, runs the existing Mistral structured
adapter, stages the result durably, and delivers it to Atlas with replay safety.

## Inspected seams and edit scope

- Extend `apps/agents-bridge/src/worker-main.ts`, `worker.ts`, `runtime.ts`, `queue.ts` and package/config wiring as required.
- Add semantic dispatcher, bounded Atlas semantic HTTP client and Bridge replay adapter alongside `atlas-perception-client.ts` and `perception-result-replay.ts`.
- Reuse `providers/mistral.ts` `structured(...)`, `loadBridgeConfig()` and approved usage/provenance normalization; retain existing OCR `perceive(...)` wiring.
- Extend only the semantic structured-result/failure seams of the generic worker. Preserve BSS foundation TestRuntime tests and existing interactive behavior.

## Execution contract

```text
strict semantic job -> fenced Bridge claim -> load staged result, if any
  staged: redeliver unchanged -> Atlas acknowledgement
  absent: fetch bounded Atlas context -> production skill -> structured(...)
          -> schema validation -> durable replay stage -> Atlas delivery
-> fenced Bridge logical completion -> safe replay cleanup
```

- Accept only `atlas.semantic.extract/v1` and `atlas.semantic.reconcile/v1` on this production semantic dispatcher; unsupported skill/version fails closed. No arbitrary job-supplied model/provider/endpoint selection.
- Use `bridge-background-execution-v1`, the existing worker service and existing BSS-006 lease/fencing/idempotency authority. pg-boss still owns retries, backoff, concurrency, acknowledgement and worker coordination.
- Thread AbortSignal through context fetch, Mistral call, staging/delivery where applicable and shutdown. Map timeout/cancellation/provider failures to safe typed errors.
- Stage validated structured output and provenance before Atlas delivery in the IDSER-001 Bridge replay record. A staged result is immutable for the execution/fingerprint; conflicting staging must fail rather than overwrite it.
- On lost acknowledgement or worker restart after staging, redeliver the exact staged envelope without fetching completed context or calling Mistral again. The guarantee concerns durable staged output; crashes before staging retain at-least-once provider semantics.
- Clean replay only after Atlas acknowledgement and fenced Bridge completion. Keep crash windows between these steps recoverable. A superseded worker lease cannot overwrite the winning result or retire another worker's replay record.
- Retryable delivery failure must not become semantic ambiguity. Deliver authorized terminal failures to Atlas through IDSER-004; retain durable notification retry responsibility if Atlas is unavailable, within existing queue/worker infrastructure.
- Instantiate the configured real MistralProvider in production. Missing/invalid credentials yield bounded configuration/provider failure and never fall back to mocks or TestRuntime. Keep keys exclusively in the inherited Bridge environment/secret boundary.
- Logs/operational errors contain bounded codes and identities, not full JSON results, prompts, PDF content, grants or API/service credentials.

## Acceptance criteria

1. Production semantic jobs invoke the correct skill through `MistralProvider.structured(...)`; unknown jobs fail closed and OCR still uses the existing perception handler.
2. Acknowledgement loss after Atlas acceptance causes identical staged replay with one provider call for that staged execution.
3. Lease fencing, concurrent claims, duplicate queue jobs and restart cannot produce duplicate logical effects or replace staged content.
4. Completed semantic jobs require successful Atlas handoff, not merely a `complete` runtime event. Unimplemented acceptance handlers fail delivery.
5. Missing credentials, invalid credentials, timeout, cancellation, unavailable provider and malformed output have bounded failure behavior and no fallback runtime.
6. No additional service, queue technology or direct Atlas semantic SQL is introduced.

## Validation

- Compose worker integration with mocked HTTP Mistral responses exercising the actual MistralProvider structured path and both real skill definitions. Mocks control provider responses, not Atlas persistence authority.
- Assert provider call counts across acknowledgement loss, delivery outage, restart after staging, restart after Atlas acceptance and restart before cleanup.
- Race tests for duplicate jobs, lease expiry/fencing and conflicting replay staging; inspect Bridge ledger/replay and Atlas handler invocations.
- Test unknown skills, missing/invalid credentials, malformed JSON/schema, request/response limits, timeout, cancellation and orderly worker stop.
- Run existing Bridge service/provider/worker/perception tests. Register focused semantic scripts; keep deterministic tests runnable without secrets. Final real-provider proof belongs to IDSER-011.

## Security Refactor Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** BSS-006 atomic-idempotency amendment, BSS-008 provider config, BSS-009 perception handler and service-credential handoff.
- **Trust boundaries / assets:** queue -> worker -> Atlas context -> external provider -> replay -> Atlas; credentials, prompts, structured output and provenance.
- **Identity context:** logical stage key, execution/skill/version, lease generation and completion fingerprint.
- **SEAM-IDSER-005-01:** Provider-neutral dispatcher and injected client/provider/replay interfaces permit policy and failure testing at each transition.
- **SEAM-IDSER-005-02:** Durable immutable replay and fenced cleanup preserve retry safety without adding truth authority.
- **COUPLING-IDSER-005-01:** No TestRuntime production fallback, model override, direct Atlas SQL, unbounded provider error or credential persistence.
- **Unresolved security policy:** retain BSS privacy/ZDR configuration; no new deployment privacy approval is inferred.
- **Planning findings:** PLAN-IDSER-03 is resolved by explicit structured dispatch/result delivery, not text-event interpretation.

| Mandatory review binding | Readiness reference | Question / evidence |
|---|---|---|
| REV-READY-IDSER-005-01 | SEAM-IDSER-005-02 | Do restart/ack-loss tests prove staged replay without another provider call and safe fenced cleanup? Worker/DB evidence. |
| REV-READY-IDSER-005-02 | COUPLING-IDSER-005-01 | Does production always use the configured adapter and fail closed without leaking secrets? Composition and failure tests. |
| REV-READY-IDSER-005-03 | SEAM-IDSER-005-01 | Are limits/cancellation enforced across provider and HTTP calls? Client/provider integration evidence. |

## Review checkpoint

**Question:** Does the existing worker perform bounded production semantic
reasoning with durable replay and no duplicate Atlas logical completion?

**Implementation checkpoint:** Implemented the production semantic dispatcher at
`0209921f5bc0cc1aaed6d74b2c30098f3e68b9b8`. The existing
`bridge-background-execution-v1` worker now admits only the strict semantic
job shape for the `atlas.semantic.*` namespace, sends the two authorized
skill IDs through the configured `MistralProvider.structured(...)` boundary,
fetches only the authenticated Atlas context, locally revalidates structured
output, and stages the envelope in immutable Bridge replay storage before
Atlas delivery. A staged result is redelivered without a new provider call;
the replay row is retired only after fenced Bridge logical completion. Provider
or schema failures send a bounded typed failure to Atlas; unavailable result
handoff remains retryable through the existing worker/pg-boss path. Existing
OCR and generic foundation-runtime behavior remain separately wired.

**Compose evidence:** PostgreSQL and the Atlas service were healthy.
`docker compose run --rm --no-deps atlas corepack pnpm --filter
@atlas/agents-bridge typecheck` passed. The focused semantic suite passed 2/2:
production structured dispatch with staged acknowledgement-loss replay, and
malformed/unknown semantic work failing closed. The complete Bridge suite then
passed 28/28 tests, including existing provider, worker/lease, perception
replay, and negative-authority coverage. `git diff --check` passed before the
implementation commit. Deterministic tests use mock provider responses; no
live Mistral credential was required or used. The final live-provider proof
remains IDSER-011.

**Next state:** `awaiting_review`; stop for CK verification.

## CFC remediation checkpoint

- **CK source:** `project's goal/feedback/IDSER-BATCH-05-0209921-review.md`
  (`CHANGES_REQUIRED`).
- **Addressed finding:** `CK-001`. Semantic replay staging now receives the
  BSS-006 lease owner/generation, verifies it against the current Bridge claim,
  persists that fence on the replay record, and performs cleanup only when the
  same fenced claimant completes. A same-execution staged winner is redelivered
  unchanged rather than converted into an Atlas terminal failure by a stale
  claimant. The additive migration is `0017_idser005_semantic_replay_fencing`.
- **Remediation commit:** `6bdc2d285538f758a3fd6d7dbde3e72159558d6e`.
- **Validation:** Compose applied migration `0017`; Bridge typecheck passed;
  the focused semantic suite passed 3/3, including stale-claim winning-envelope
  redelivery with no terminal failure; `git diff --check` passed.
- **Remaining CK scope:** `CK-002` requires the specified real mocked-HTTP,
  Bridge-ledger, Atlas-route, restart/fencing, and configuration integration
  matrix. This checkpoint does not claim that evidence; it remains subject to
  the same consolidated CK finding.
- **Next state:** `awaiting_review`; CK verification is required.

## HMN-009 authorized evidence remediation checkpoint

- **Authorization consumed:** `HMN-IDSER-005-009`
  (`AUTHORIZE_EVIDENCE_REMEDIATION`).
- **CK source:** `project's goal/feedback/IDSER-BATCH-05-17ce58d-verification.md`
  (`CHANGES_REQUIRED`, frozen original `CK-002.a`--`CK-002.e`; `CK-001` stays
  resolved and closed).
- **Remediation:** the registered Compose semantic-worker integration now
  reads the actual queued records from `pgboss.job`, inspects their stored data
  and output through recursive serialization, and captures errors thrown by
  `runSemanticJob` before rethrowing the same error to pg-boss. Redaction checks
  now serialize plain objects and inspect Error name/message/cause rather than
  coercing objects to `[object Object]`. The real semantic job's required
  `contextCapability` remains present in its contract field; queue-payload
  inspection checks the rest of the stored payload and output, while public
  responses, stored errors, and thrown errors are checked for that capability
  and other configured sensitive sentinels.
- **Finding Closure Matrix:**

  | Frozen clause | Status | Closure evidence |
  | --- | --- | --- |
  | `CK-002.a` | `PROVEN` | The conflict case reads actual pg-boss rows for winner and loser, checks their serialized payload/output, preserves separate winner/loser provider counts, and checks redaction of the captured failed winner-delivery error, responses, and stored error before/after recovery. Existing lifecycle, lease, envelope, and cleanup assertions remain. |
  | `CK-002.b` | `PROVEN` | The context-bound case checks the stored pg-boss payload/output and captured thrown context error; zero provider calls, bounded outcome, lifecycle/fence, no replay, response, and stored-error assertions remain. |
  | `CK-002.c` | `PROVEN` | The post-stage result-bound case checks the stored pg-boss payload/output and captured thrown handoff error; rejection synchronization, unchanged replay envelope, retained fence, no terminal failure, retry identity, response, and stored-error assertions remain. |
  | `CK-002.d` | `PROVEN` | At the pre-stage stop boundary, the test checks the stored job payload/output, captures and redacts the thrown cancellation error, asserts the exact bounded `Provider request was cancelled.` value, and preserves provider/failure counts, lifecycle/fence, no replay/acceptance, and successor retry assertions. |
  | `CK-002.e` | `PROVEN` | At the active post-stage stop boundary, the test checks the stored pg-boss payload/output and captured interrupted-delivery error, then preserves replay identity, provider/acceptance/failure counts, lifecycle/fence, completion, and cleanup proof through fresh-worker recovery. |

- **Direct-regression boundary:** no production source, resolved `CK-001`,
  replay/fencing behavior, queue policy, Atlas authority, contracts, skills,
  deployment, or downstream ticket was changed. Existing production-path
  scenarios and response/stored-error assertions remain in place.
- **Remediation commit:** this HMN-009 CFC handoff commit; the exact review
  target is the commit containing this checkpoint and the integration-test
  evidence above.
- **Validation:** Docker Compose services were healthy (`docker compose ps`).
  These exact commands completed successfully in this CFC run:
  `docker compose exec atlas corepack pnpm --filter @atlas/agents-bridge typecheck`;
  `docker compose exec atlas corepack pnpm --filter @atlas/agents-bridge test:semantic-integration`
  (1/1 passed against Compose PostgreSQL, actual pg-boss, Bridge rows, and
  loopback Atlas/Mistral HTTP);
  `docker compose exec atlas corepack pnpm --filter @atlas/agents-bridge test:semantic`
  (semantic worker 4/4 and semantic client integration 1/1 passed);
  `docker compose exec atlas corepack pnpm --filter @atlas/agents-bridge test`
  (all registered Bridge test commands completed successfully); and
  `git diff --check` passed. Provider traffic used loopback HTTP and synthetic
  credentials; no live Mistral credential was used.
- **Internal readiness:** `READY_FOR_CK` for only frozen original
  `CK-002.a`--`CK-002.e`.
- **Next state:** `awaiting_review`; hand this exact remediation commit to CK
  for bounded verification. CK-001 is not reopened.

## HMN-007 final production-path evidence remediation checkpoint

- **Authorization consumed:** `HMN-IDSER-005-007` (`AUTHORIZE_EVIDENCE_REMEDIATION`).
- **CK source:** `project's goal/feedback/IDSER-BATCH-05-1bc3fba-verification.md` (`CHANGES_REQUIRED`, unresolved original `CK-002` only).
- **Remediation commit:** this CFC handoff commit (`fix(idser): complete semantic worker evidence matrix`).
- **Remediation:** completed the existing Compose-backed `semantic-worker.integration.test.ts` matrix using real pg-boss workers, PostgreSQL Bridge effects/replay rows, the configured default-fetch `MistralProvider`, loopback Fastify `createSemanticInternalRoutes`, and `PostgresSemanticAuthority`. Shutdown now aborts the active semantic signal so pre-stage cancellation returns to its fenced retry path rather than issuing an Atlas failure. Replay preserves structural result validation but applies the envelope transport limit only at the Atlas handoff, so a schema-valid oversized envelope stages immutably and remains retryable.
- **Finding Closure Matrix:**

  | Frozen clause | Production-path observation | Status |
  | --- | --- | --- |
  | `CK-002.a` conflicting idempotency/stage | An unavailable result route stages winner A; execution B with the same Bridge key cannot replace A, has no provider call or accepted effect, and A alone later completes and cleans up. | `PROVEN` |
  | `CK-002.b` Atlas context bound | An oversized real context response makes no provider request, creates no replay or accepted effect, and records a redacted bounded Bridge error. | `PROVEN` |
  | `CK-002.c` result envelope bound after stage | A schema-valid oversized provenance envelope stages once, has zero Atlas acceptance/failure calls, keeps its replay row and non-completed fenced effect after client rejection, and does not re-invoke the provider. | `PROVEN` |
  | `CK-002.d` semantic-worker cancellation | `worker.stop()` interrupts a real active provider request before stage: no replay or Atlas acceptance exists, the effect remains pending with a fenced lease and redacted diagnostics, and a fresh worker later accepts the retry. | `PROVEN` |
  | `CK-002.e` orderly in-flight stop/fresh worker | The result route is blocked after immutable stage, `worker.stop()` occurs while active, and a fresh worker redelivers once, completes one Atlas effect, and cleans replay without a second provider call. | `PROVEN` |
  | Existing `CK-002` cases | Extract/reconcile, acknowledgement loss, completion/cleanup fault, unavailable handler, expired successor, delivery outage, Atlas timeout, duplicate job, missing/rejected credential, malformed/schema-invalid result, provider timeout, and request/response bounds remain registered. Their assertions cover provider/effect/replay outcomes and redacted errors; bounds retain explicit zero/one provider-call behavior. | `PROVEN` |

- **Validation:** rebuilt `agents-bridge` and `agents-bridge-worker`; healthy Compose `postgres`, `atlas`, `agents-bridge`, and `agents-bridge-worker`; `@atlas/db migration:check`; Bridge typecheck; `test:semantic-integration`; `test:semantic`; full Bridge suite; Atlas Core suite; Atlas DB `test:semantic-authority`; contracts; skills; and `git diff --check`. Deterministic loopback HTTP mocks and synthetic credentials were used; no live Mistral credential was read or used.
- **Direct-regression boundary:** resolved `CK-001` fencing/schema and prior production cases remain closed; this change is limited to frozen `CK-002` cancellation and oversized-envelope replay behavior.
- **Internal readiness:** `READY_FOR_CK`.
- **Next state:** `awaiting_review`; hand the one bounded CFC commit to CK for original `CK-002` verification only.

## HMN-008 production-path evidence remediation checkpoint

- **Authorization consumed:** `HMN-IDSER-005-008` (`AUTHORIZE_EVIDENCE_REMEDIATION`).
- **CK source:** `project's goal/feedback/IDSER-BATCH-05-e8a9b3d-verification.md` (`CHANGES_REQUIRED`, unresolved frozen original `CK-002.a`--`CK-002.e` only). `CK-001` remains closed and was not changed.
- **Remediation commit:** this CFC handoff commit (`test(idser): complete semantic evidence assertions`).
- **Remediation:** extended only `semantic-worker.integration.test.ts`, retaining its real PostgreSQL roles, pg-boss worker, Bridge effect/replay tables, configured default-fetch `MistralProvider`, loopback `createAtlasSemanticClient`, and `createSemanticInternalRoutes`. The fixture now records per-execution provider calls and public-route response surfaces, reads Atlas lifecycle plus Bridge status/owner/generation/error state, captures replay envelope identity, and asserts redaction. The cancellation successor is explicitly submitted to the fresh real worker and only the intentionally interrupted first provider request is delayed, making the pre-stage cancellation/recovery boundary deterministic.
- **Finding Closure Matrix:**

  | Frozen clause | Required production-path evidence now asserted | Status |
  | --- | --- | --- |
  | `CK-002.a` | Separate Mistral counts prove winner A = 1 and loser B = 0; winner replay envelope/identity and stage fence stay immutable while delivery is unavailable; winner/loser Atlas lifecycle, acceptance/failure counts, Bridge owner/generation/status, redacted error, recovered completion, and cleanup are observed. | `PROVEN` |
  | `CK-002.b` | Oversized context produces zero provider calls, zero accepted output, queued Atlas lifecycle, a bounded redacted Bridge error with pending status/owner/generation, and no replay row. The test records the actual public context response rather than asserting absence of a bounded context failure outcome. | `PROVEN` |
  | `CK-002.c` | The oversized schema-valid result stages before handoff rejection; the test waits for the bounded rejection, compares persisted envelope before/after, proves one provider call, zero terminal failure/acceptance, running Atlas lifecycle, retained fenced Bridge effect, and redacted error. | `PROVEN` |
  | `CK-002.d` | At the active pre-stage cancellation boundary, the test proves one provider call, zero trusted replay/acceptance/terminal failure, running Atlas lifecycle, pending fenced Bridge effect with bounded redacted error, then explicitly drives the fresh worker to one accepted retry. | `PROVEN` |
  | `CK-002.e` | At the active post-stage stop boundary, the test compares the replay envelope before/after stop, records pending status and Bridge/replay owner/generation plus redaction, then proves fresh-worker replay reaches exactly one provider call, one acceptance, zero failure, completed Atlas lifecycle/fenced Bridge effect, and cleanup. | `PROVEN` |

- **Direct-regression boundary:** production source, resolved `CK-001` fencing/schema, replay technology, queue policy, Atlas authority, contracts, skills, deployment configuration, and downstream tickets were not modified. Existing registered semantic scenarios remain in the full Bridge suite.
- **Validation:** Docker/Compose was available. Rebuilt `agents-bridge` and `agents-bridge-worker`, started healthy `postgres`, `atlas`, `agents-bridge`, and `agents-bridge-worker`, and rebuilt/recreated `atlas` before running its copied test source. The following commands completed successfully: `docker compose build agents-bridge agents-bridge-worker`; `docker compose up -d postgres atlas agents-bridge agents-bridge-worker`; `docker compose ps`; `docker compose exec atlas corepack pnpm --filter @atlas/db migration:check`; `docker compose exec atlas corepack pnpm --filter @atlas/agents-bridge typecheck`; `docker compose exec atlas corepack pnpm --filter @atlas/agents-bridge test:semantic-integration`; `docker compose exec atlas corepack pnpm --filter @atlas/agents-bridge test:semantic`; `docker compose exec atlas corepack pnpm --filter @atlas/agents-bridge test`; `docker compose exec atlas corepack pnpm --filter @atlas/core test`; `docker compose exec atlas corepack pnpm --filter @atlas/db test:semantic-authority`; `docker compose exec atlas corepack pnpm --filter @atlas/contracts test`; `docker compose exec atlas corepack pnpm --filter @atlas/skills test`; and `git diff --check`. All semantic integration traffic used loopback HTTP and synthetic credentials; no live Mistral credential was read or used.
- **Internal readiness:** `READY_FOR_CK`.
- **Next state:** `awaiting_review`; this one bounded CFC handoff is ready for CK verification of only original `CK-002.a`--`CK-002.e` and direct regressions.

## HMN-authorized production-path evidence remediation checkpoint

- **Authorization consumed:** `HMN-IDSER-005-003`
  (`AUTHORIZE_EVIDENCE_REMEDIATION`).
- **Addressed findings:** remaining evidence for original `CK-001` and
  `CK-002` in `project's goal/feedback/IDSER-BATCH-05-b4af1f5-verification.md`.
- **Remediation:** added and registered
  `apps/agents-bridge/tests/semantic-worker.integration.test.ts` as
  `test:semantic-integration` and in the complete Bridge suite. It uses
  role-specific PostgreSQL connections, actual pg-boss `createBackgroundWorker`,
  Bridge effect/replay rows, loopback Fastify Atlas semantic routes backed by
  `PostgresSemanticAuthority`, and loopback HTTP Mistral through configured
  default clients. It drives both authorized skills through acknowledgement
  loss, completion/cleanup faults, handler unavailability, and stale-successor
  redelivery.
- **Concrete repair:** the integration suite showed that a redelivery can
  complete under a newer Bridge lease while its immutable staged envelope
  retains the original stage lease. Cleanup incorrectly required those leases
  to match, leaving a replay row after acknowledgement loss. Fenced completion
  now owns exact-execution cleanup and retries cleanup in its
  committed-completion window; stale claimants cannot reach cleanup because
  they cannot fence completion.
- **Evidence:** normal Compose PostgreSQL, Atlas, Bridge, and Bridge worker
  services were healthy. The focused production-path suite passed 1/1: one
  provider call and one Atlas logical effect for acknowledgement-loss recovery,
  a later completed effect lease, and eventual replay cleanup. Handler
  unavailability retained replay and did not complete Bridge or Atlas; an
  expired successor redelivered the same envelope without another provider call,
  completed it once, then cleaned it. The registered full Bridge suite passed;
  Core semantic-route, DB semantic-authority, contract, and skill suites also
  passed. Existing provider/client/worker tests cover bounded configuration,
  malformed output, timeout/cancellation, and unknown-skill failure without
  live credentials or sensitive-payload leakage.
- **Commands:** `docker compose up -d postgres`; `docker compose ps`; Bridge
  typecheck; focused semantic tests; the registered full Bridge suite; consumed
  Core/DB semantic authority, contract, and skill suites; and `git diff --check`.
  All deterministic runs used loopback mocks and no live Mistral credential.
- **Remediation commit:** `35784b0c45ff27c504b61a55cc16c99466873614`
  (`fix(idser): recover semantic replay cleanup`).
- **Next state:** `awaiting_review`; stop for CK verification of only original
  `CK-001` and `CK-002`.

## HMN-authorized fixture-regression remediation checkpoint

- **Authorization consumed:** `HMN-IDSER-005-004`
  (`AUTHORIZE_DIRECT_REGRESSION_REPAIR`).
- **CK source:** `project's goal/feedback/IDSER-BATCH-05-35784b0-verification.md`
  (`CHANGES_REQUIRED`, original `CK-001` and `CK-002` only).
- **Remediation:** removed the unavailable/private
  `canonicalSemanticFingerprint` import from
  `semantic-worker.integration.test.ts`. The fixed fixture now derives its
  literal capability fingerprint locally with Node SHA-256 over
  `JSON.stringify(capability)`, matching the authority's canonical result for
  that string without changing the Atlas DB public API or production code.
- **Remediation commit:** `56cbb8063f9e771ddef502b263ab03820ad1e20c`
  (`test(idser): repair semantic fixture import`).
- **Validation:** normal Compose PostgreSQL was healthy; Bridge typecheck,
  `test:semantic-integration` (1/1), `test:semantic` (4/4), and the complete
  Bridge suite passed. The integration suite reached its existing assertions:
  acknowledgement-loss recovery observed one provider call, one Atlas logical
  effect, later completed lease, and replay cleanup; handler unavailability
  retained the replay without completing Bridge or Atlas; the expired successor
  redelivered the same stored result with no additional provider call, completed
  once, and cleaned the replay row. `git diff --check` passed.
- **Next state:** `awaiting_review`; stop for CK verification of original
  `CK-001` and `CK-002` only.

## HMN-authorized CK-002 delivery/replay remediation checkpoint

- **Authorization consumed:** `HMN-IDSER-005-005` (`AUTHORIZE_NEXT_CFC`).
- **CK source:** `project's goal/feedback/IDSER-BATCH-05-56cbb80-verification.md`
  (`CHANGES_REQUIRED`, unresolved original `CK-002` only).
- **Remediation:** extended the registered Compose-backed semantic worker
  fixture with isolated document/bundle identities for acknowledgement-loss,
  completion/cleanup fault, unavailable handler with expired successor,
  delivery outage, Atlas result timeout after immutable staging, and duplicate
  queue delivery. The fixture runs real pg-boss claims, Bridge
  `background_effects` and `semantic_result_delivery` rows, the configured
  HTTP `MistralProvider`, and loopback Fastify Atlas internal routes for both
  production skills. `runSemanticJob` now treats every error after successful
  immutable staging as retryable: it returns that error to pg-boss and never
  sends `client.fail` for the durable envelope.
- **Scenario evidence:** acknowledgement loss/restart, completion before
  cleanup, and cleanup fault produced one provider call and one Atlas logical
  effect, later fenced completion, then replay cleanup. Handler unavailability
  retained its replay row; an expired successor redelivered it without a second
  provider call and cleaned it. Delivery outage and Atlas timeout each retained
  the staged row, made zero Atlas failure-route calls, replayed once to one
  accepted effect, and cleaned the row. Duplicate queue messages made one
  provider call, one logical effect, and left no replay row. The full Bridge
  suite also passed its existing provider cases for missing/invalid
  credentials, malformed data, request/response bounds, timeout/cancellation,
  and generic worker orderly-stop cases; deterministic runs used only local
  HTTP mocks and no Mistral credential.
- **Validation:** rebuilt `agents-bridge` and worker Compose images, started
  PostgreSQL/Atlas/Bridge dependencies, then passed Bridge typecheck,
  `test:semantic-integration`, `test:semantic`, the complete Bridge suite, and
  `git diff --check`. The Compose integration command supplied its explicit
  local Bridge database URL; it never used a `--no-deps` PostgreSQL-free run.
- **Remediation commit:** this CFC handoff commit
  (`fix(idser): retain staged semantic delivery retries`).
- **Next state:** `awaiting_review`; stop for CK verification of only original
  `CK-002`.

## HMN-006 semantic matrix continuation checkpoint

- **Authorization consumed:** `HMN-IDSER-005-006` (`AUTHORIZE_NEXT_CFC`).
- **Remediation:** extended the same registered Compose semantic-worker
  harness with explicit worker replacement at both post-stage and
  post-acceptance/pre-completion boundaries, plus configured missing/rejected
  credential, malformed JSON, schema-invalid output, provider-timeout, and
  provider request/response-bound paths. Each uses an isolated Atlas execution
  and Bridge effect/replay identity and asserts bounded failure or single
  replayed completion without secret-bearing diagnostics.
- **Validation:** rebuilt the Bridge image; Bridge typecheck and the complete
  Compose `test:semantic-integration` matrix passed with PostgreSQL available.
- **Remediation commit:** this CFC handoff commit.
- **Next state:** `awaiting_review`; CK verification remains limited to
  original `CK-002`.

## HMN-authorized evidence remediation checkpoint

- **Authorization consumed:** `HMN-IDSER-005-002`
  (`AUTHORIZE_EVIDENCE_REMEDIATION`).
- **Remediation commit:** `b4af1f50688ffa07f7f15f0059448b2e2903cea1`.
- **Addressed evidence:** registered `test:semantic` now runs deterministic
  configured `MistralProvider.structured(...)` coverage for both production
  skill schemas and authenticated semantic context/result HTTP-client handoffs,
  alongside the replay worker tests. Compose Bridge typecheck passed; the
  registered semantic suite passed 4/4; `git diff --check` passed.
- **Limitation:** this evidence does not yet exercise the complete real Atlas
  route host, Bridge replay ledger/lease database state, or all restart and
  configuration scenarios required by CK-002. It must not be read as a PASS.
- **Next state:** `awaiting_review`; CK verification is required.

## HMN-007 CFC in-progress checkpoint

- **Authorization:** `HMN-IDSER-005-007` (`AUTHORIZE_EVIDENCE_REMEDIATION`).
- **Finding Closure Matrix (legacy frozen CK-002):**
  - `CK-002.a` conflicting idempotency/stage: `IMPLEMENTED_UNPROVEN`; the
    Compose harness now stages a real winning execution during a result-route
    outage, submits a distinct losing execution with the identical Bridge key,
    and asserts winner immutability, zero loser effect/provider calls, and
    winner-only recovery/cleanup. The complete matrix has not passed.
  - `CK-002.b` Atlas context bound: `IMPLEMENTED_UNPROVEN`; the Compose
    harness now drives an oversized response through the real semantic context
    route and asserts no provider call/replay/acceptance plus bounded ledger
    diagnostics, but the complete matrix has not passed.
  - `CK-002.c` result-envelope bound after stage: `UNRESOLVED`; the current
    replay validator rejects an oversized envelope before durable stage, which
    conflicts with the frozen required post-stage observation and needs an
    in-scope determination/repair before this row can be proven.
  - `CK-002.d` semantic-worker cancellation: `IMPLEMENTED_UNPROVEN`; the
    harness now stops a real worker while its configured provider request is
    active and checks the Bridge ledger/replay boundary, but the required
    successor and uniform observation evidence is incomplete.
  - `CK-002.e` orderly in-flight stop and fresh worker: `IMPLEMENTED_UNPROVEN`;
    the harness now creates a post-stage in-flight result-route boundary before
    `worker.stop()` and requires fresh-worker replay, completion, and cleanup;
    the focused Compose run has not completed.
- **Direct regression boundary:** resolved `CK-001` fencing/schema work is not
  modified. Existing ACK-loss, completion/cleanup fault, delivery outage,
  duplicate-job, and provider failure cases are preserved.
- **Validation attempted:** Bridge typecheck and `git diff --check` passed.
  Compose PostgreSQL, Atlas, Bridge, and Bridge worker services were rebuilt
  and healthy. The focused `test:semantic-integration` process started against
  that environment but did not complete in the available execution window, so
  it is not evidence of a passing matrix.
- **Internal readiness:** `CFC_NOT_READY_FOR_CK`. No CFC commit, checkpoint
  handoff, or HMN-007 authorization consumption has occurred.

## HMN-authorized CFC checkpoint

- **Authorization consumed:** `HMN-IDSER-005-001` (`AUTHORIZE_NEXT_CFC`).
- **CK source:** `project's goal/feedback/IDSER-BATCH-05-6bdc2d2-verification.md`
  (`CHANGES_REQUIRED`).
- **Remediation commit:** `924d556cb23a99c55b50af39a80b067bd3ddd3a9`.
- **Addressed state transition:** a `SemanticReplayLeaseLostError` now causes
  Bridge to reload and deliver an already-durable same-execution envelope. If
  no winner exists it remains a retryable worker error. It no longer reaches
  the terminal Atlas failure route, so a stale claimant cannot invalidate the
  winning replay payload.
- **Validation:** rebuilt Compose image; Bridge typecheck passed; focused
  semantic suite passed 3/3; `git diff --check` passed.
- **Limitation:** the required CK-002 real HTTP/Atlas/Bridge-ledger integration
  matrix has not yet been completed, so this checkpoint does not claim the
  comprehensive HMN evidence package is satisfied.
- **Next state:** `awaiting_review`; CK verification is required.
