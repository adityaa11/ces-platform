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
