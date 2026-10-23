# BSS-V2-006-06 — Public admission authority cutover

- **State:** `awaiting_review`; GO implementation is complete and pending independent CK review.
- **Owner:** BSS-V2-006.
- **Dependencies (frozen):** BSS-V2-006-04-02 CK `PASS`; BSS-V2-006-04-06 CK `PASS`; and BSS-V2-014-04-02 CK `PASS` / its accepted bigint route-authority contract.
- **Explicit non-dependency:** BSS-V2-014-04-03. This ticket neither changes nor waits on that blocked borrowing ticket, and BSS-V2-014-04-03 does not depend on this ticket. Its release condition is instead this ticket's independent CK `PASS` followed by a successful rerun of the corrected historical fairness validation.

## Objective

Restore the existing active `ProviderWorkAdmission/v1` public ingress by an in-place SQL consumer cutover from the retired route-text binder call to the accepted bigint `bridge.bind_provider_work_route(text, integer, bigint)` consumer. The change consumes already published authority; it does not publish, resolve, activate, or invent authority.

The existing authenticated server-selected principal/process/quota-domain/route identity, idempotency fence, attempt registration, request fencing, response shape, route-aware admission, reservation, pg-boss dispatch, transport claim, and worker path remain in place. There is one public ingress and one execution lane.

## Frozen authority source and deterministic selection

`authority_version` is a publisher-issued bigint from `bridge.qualified_provider_route_authority`; it is never accepted from the client, inferred from a route ID, constructed from a model identifier, or chosen by revision ordering.

Within the existing SQL admission transaction, after the existing server-selected identity and active desired-plan snapshot have been validated, the public function must select exactly one authority reference as follows:

1. For an active calculated v2 plan, select the `authority_version` from the exact immutable `bridge.desired_admission_profile_route_binding_v2` row keyed by the server-selected quota domain, active desired-profile version, and server-selected route ID. Join that version to `bridge.qualified_provider_route_authority` and require the complete identity: `routeId`, `providerId`, `modelOrProcessorId`, `adapterVersion`, `qualificationRef`, `qualificationVersion`, and `capability`.
2. For an active historical `plan-v1`, select only a publisher-issued bigint whose complete immutable tuple exactly matches the already server-selected domain/route and its active capacity-profile associated-route tuple. The match must return exactly one authority record. Zero or multiple matches are authority failure; neither `MAX`, `MIN`, “latest”, nor route-only selection is permitted.
3. Pass that one bigint directly to the existing bigint binder in the current public admission transaction. The binder, existing reservation trigger, and final transport claim continue to validate and carry the same immutable tuple/version.

For both cases, the active capacity association, process capability/eligibility, publisher record, desired-plan binding where required, and complete tuple must agree. Missing, foreign, stale, revoked, ambiguous, mismatched, or incomplete authority fails closed before reservation. Calculated v2 authority may not fall back to the historical selection rule.

## Binary Review Contract

| ID | PASS iff / direct negative | Required validation and evidence |
| --- | --- | --- |
| `RC-00606-01` — Public ingress preservation | The existing `ProviderWorkAdmission/v1` endpoint retains authenticated server-selected principal/process identity, idempotency, attempt registration, request fencing, and its existing public response semantics. A successful call follows the existing route-aware admission → reservation → pg-boss → transport-claim chain. | Exercise the actual service/API with its existing Bridge and PostgreSQL fixtures; compare idempotency/replay, attempt, response-state, and durable reservation/job/claim identities before and after the in-place consumer cutover. |
| `RC-00606-02` — Exact authority resolution | The sole new input to the existing binder is exactly one publisher-issued bigint selected by the frozen rule above. The complete route/model/adapter/qualification/capability identity and active domain/process/plan identity match it. A calculated v2 plan uses its exact immutable desired-plan route binding. Missing, foreign, stale, revoked, ambiguous, mismatched, or incomplete authority is rejected; model identity is never derived from route ID and no arbitrary revision is selected. | Add focused public-API positive coverage for a valid calculated v2 binding and negative matrix for each named invalid state, including duplicate/multiple matching historical candidates. Each negative proves zero reservation, dispatch, pg-boss job, transport claim, and provider transport artifact. |
| `RC-00606-03` — Historical boundary | The corrected historical `plan-v1` fairness fixture succeeds through the existing bigint binder and preserves its current fairness behaviour. No route-text overload, legacy compatibility mechanism, or second binding path is restored. Historical success never permits incomplete active calculated v2 authority. | Rerun `packages/atlas-db/tests/policy-aware-runtime-admission-fairness.integration.test.ts` through its corrected `@atlas/db` command. Include a mixed historical/active-calculated-v2 negative proving an incomplete v2 authority has no operational artifacts. |
| `RC-00606-04` — Regression and sole-path proof | Rejected authority creates zero reservation, dispatch, job, and provider transport artifacts. No second binder, resolver, scheduler, reservation, worker, send lane, endpoint replacement, adapter, compatibility path, or provider-specific branch is introduced. | Run the existing public API/DB/Bridge integration fixtures plus the focused authority matrix. Provide a source/SQL/TypeScript entrypoint inventory showing one public ingress, the existing bigint binder, one route-aware admission transaction, one reservation family, one pg-boss job name/consumer, one claim, and one outbound transport input. |

## Authorized implementation boundary after GO only

One forward SQL change may evolve the existing `bridge.admit_provider_work_admission_v1` implementation in place so it performs the frozen deterministic lookup and calls the existing bigint binder. It may add only the migrations and focused fixtures necessary to prove this consumer cutover. It must preserve the existing endpoint contract and its existing public service route.

No code, migration, interface, predecessor ticket, or acceptance criterion is modified by this freeze.

## Prohibited scope

- Do not modify BSS-V2-014-04-02 or BSS-V2-014-04-03.
- Do not restore `bridge.bind_provider_work_route(text, integer, text)` or any other text/legacy binder.
- Do not create an adapter, endpoint replacement, dual admission path, compatibility lane, provider-specific branch, resolver, scheduler, reservation family, worker, queue, or direct send.
- Do not publish/re-publish authority at public-admission time, relax authenticated server selection, or pass client-selected authority/model identity.
- Do not change BSS-V2-014-04-03 implementation or acceptance criteria.

## Required validation after GO

```text
pnpm --filter @atlas/db migration:check
pnpm --filter @atlas/agents-bridge exec jiti tests/provider-work-admission.integration.test.ts
pnpm --filter @atlas/agents-bridge exec jiti tests/provider-admitted-worker.integration.test.ts
pnpm --filter @atlas/db exec jiti tests/policy-aware-runtime-admission-fairness.integration.test.ts
pnpm --filter @atlas/agents-bridge typecheck
```

The implementation must add a named focused calculated-v2 public-admission authority matrix to the validation record. CK evidence must name that fixture and its zero-artifact assertions.

## SecurityReadiness

- **status:** `applicable`.
- **inheritedBoundaries:** `SR-00606-B1` preserves the CK-approved `ProviderWorkAdmission/v1` authenticated ingress and sole BSS admission/claim/send chain; `SR-00606-B2` consumes, without reopening, BSS-V2-014-04-02's publisher-issued bigint authority and complete immutable tuple boundary.
- **trustBoundaries:** `SR-00606-T1` is authenticated server-selected public identity → active desired plan → publisher-issued authority version → existing bigint binder; `SR-00606-T2` is bound authority → existing reservation/pg-boss claim → bounded outbound transport input.
- **sensitiveAssets:** `SR-00606-A1` covers the authority bigint, complete qualified tuple, active desired-plan route binding, server principal/process identity, idempotency/attempt fence, and durable reservation/job/claim identities.
- **identityContext:** `SR-00606-I1` requires quota domain, desired-profile/activation revision, process/profile, service class, route, provider, model-or-processor, adapter, qualification ref/version, capability, authority version, logical work, attempt, and reservation identity to remain distinguishable through the existing path.
- **extensionSeams:** `SR-00606-E1` is only the current SQL binder callsite in `bridge.admit_provider_work_admission_v1`; `SR-00606-E2` is the existing bigint binder/claim validation. No new policy or transport seam is authorized.
- **prohibitedCouplings:** `SR-00606-C1` prohibits route-only/model-derived/revision-ordered authority selection; `SR-00606-C2` prohibits publishing, a second resolver/binder, legacy fallback, dual ingress, compatibility lane, and all extra execution lanes.
- **verificationSeams:** `SR-00606-V1` requires public API plus real DB/Bridge/pg-boss evidence; `SR-00606-V2` requires every authority rejection to show zero reservation, dispatch, job, claim, and send artifacts; `SR-00606-V3` requires the historical fairness rerun.
- **unresolvedSecurityPolicy:** none within this bounded consumer-cutover scope. Provider authorization policy and authority publication remain predecessor-owned.
- **planningFindings:** none. The required in-place consumer seam exists; any implementation that needs a compatibility lane or cannot prove a unique authority is a hard stop, not a scope expansion.
- **reviewBindings:** `SR-00606-R1` verifies `SR-00606-T1` via `RC-00606-02` with SQL/public-API tuple and zero-artifact evidence; `SR-00606-R2` verifies `SR-00606-T2` via `RC-00606-01` and `RC-00606-04` with durable chain/inventory evidence; `SR-00606-R3` verifies `SR-00606-C1` and `SR-00606-C2` via `RC-00606-03` and `RC-00606-04` with historical regression and sole-path evidence.

## Hard stop and release gate

Stop for separate planning authority if the existing public transaction cannot select exactly one complete publisher-issued authority, if the calculated v2 binding cannot be read from the active immutable desired plan, or if preservation would require any compatibility or alternate execution lane.

`BSS-V2-014-04-03` remains blocked. It may proceed only after this ticket receives independent CK `PASS` and the corrected historical fairness validation reruns successfully. This ticket itself requires separate GO authorization before implementation.
