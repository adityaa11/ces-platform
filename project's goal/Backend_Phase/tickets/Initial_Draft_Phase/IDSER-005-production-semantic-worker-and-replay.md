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
