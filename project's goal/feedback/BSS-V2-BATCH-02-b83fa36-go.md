# GO Checkpoint — BSS-V2-BATCH-02 — b83fa36

- Ticket: `BSS-V2-002`, [BSS-V2-002-qualified-route-registry.md](../Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-002-qualified-route-registry.md)
- Batch: `BSS-V2-BATCH-02`
- Implementation commit: `b83fa36` (`feat(bridge): add qualified route registry`)
- Ticket state: `awaiting_review`
- Dependency: BSS-V2-001 approved at CK `PASS`, commit `76e9b21`.

## Bounded implementation

Added a server-configured capability route registry with explicit deployment profiles, pinned provider/model/adapter and qualification identities, effective windows, enabled state, and extension fields. Interactive requests, semantic worker jobs, and perception jobs resolve capabilities through the registry. `TestRuntime` is selected only by the explicit `test` profile. Development without a usable qualified route returns a stable unavailable error; live readiness requires the required qualified routes and available adapters. Mutable `*-latest` model aliases require an explicit per-route qualification-policy reference.

No provider adapter or live qualification was added. With the local Compose development profile's empty route list, provider execution is unavailable. This preserves BSS-V2-003/004 ownership of adapter work and live qualification.

## Review Contract Closure

| Row | Ticket authority and pass condition | Required proof and evidence locator | Exact validation and outcome | Status |
| --- | --- | --- | --- | --- |
| RC-BSSV2-002-01 | Ticket Review Contract row 01: resolve one enabled qualified route or a stable unavailable/invalid outcome; unknown, disabled, expired, duplicate, and unqualified mappings cannot execute. | Resolver matrix in `apps/agents-bridge/tests/route-registry.test.ts`: rejects unknown and unqualified capabilities, duplicate capability maps, and expired/disabled routes; development execution without a route returns `provider_unavailable` without calling the provider. `apps/agents-bridge/tests/provider-capabilities-boundary.test.ts` verifies both worker capability lookups use the registry. | `docker compose run --rm --no-deps agents-bridge corepack pnpm --filter @atlas/agents-bridge test` — passed; route-registry and worker-boundary cases passed. | PROVEN |
| RC-BSSV2-002-02 | Ticket Review Contract row 02 and `BOUNDARY-BSSV2-002-ROUTING` / `COUPLING-BSSV2-002-CLIENT-MODEL`: provider/model/route selection remains server-controlled; caller payload cannot select vendor, model, or endpoint. | `apps/agents-bridge/tests/route-registry.test.ts` verifies caller-supplied vendor/model/endpoint fields do not affect route selection or reach the provider; `apps/agents-bridge/tests/provider-capabilities-boundary.test.ts` inspects both composition roots. | `docker compose run --rm --no-deps agents-bridge corepack pnpm --filter @atlas/agents-bridge test` — passed; boundary and payload tests passed. | PROVEN |
| RC-BSSV2-002-03 | Ticket Review Contract row 03 and `REV-READY-BSSV2-002-01`: validate profile, route capability, pinned identity, qualification reference, adapter availability, and effective window before a live profile is ready; reject `*-latest` unless an explicit qualifying policy is configured. | `apps/agents-bridge/tests/route-registry.test.ts` covers profile parsing, adapter/model/version mismatch, live route and adapter readiness, expired routes, and `*-latest` rejection/explicit policy; `apps/agents-bridge/tests/service.test.ts` proves a non-ready live profile returns HTTP 503 while process health remains HTTP 200. | `docker compose run --rm --no-deps agents-bridge corepack pnpm --filter @atlas/agents-bridge test` — passed. `docker compose config --quiet` — passed. Live readiness test returned 503; local `/readyz` under development returned `{"status":"ready","version":"0.1.0"}`. | PROVEN |
| RC-BSSV2-002-04 | Ticket Review Contract row 04: `TestRuntime` is available only in the explicit test profile; missing live credentials/routes cannot produce deterministic success in development/live profiles. | `apps/agents-bridge/tests/provider-capabilities-boundary.test.ts` verifies both composition roots select `TestRuntime` only when `deploymentProfile === "test"`; `apps/agents-bridge/tests/route-registry.test.ts` proves development without a route emits unavailable and makes zero provider calls. | `docker compose run --rm --no-deps agents-bridge corepack pnpm --filter @atlas/agents-bridge test` — passed; explicit profile and missing-route cases passed. | PROVEN |

## Validation and Compose evidence

- `docker compose config --quiet` — passed.
- `docker compose build agents-bridge agents-bridge-worker` — passed.
- `docker compose up --build -d agents-bridge agents-bridge-worker` — passed; current Bridge API and worker containers were recreated from the changed source/config and are healthy.
- `docker compose run --rm --no-deps agents-bridge corepack pnpm --filter @atlas/agents-bridge typecheck` — passed.
- `docker compose run --rm --no-deps agents-bridge corepack pnpm --filter @atlas/agents-bridge test` — passed. The deterministic route/profile/readiness cases and existing runtime/SSE, semantic-worker, and perception-worker tests passed. Five existing opt-in PostgreSQL/Compose integration cases skipped because their explicit test-enablement variables were not set.
- Local Bridge config summary was inspected without printing secrets: profile `development`, zero configured qualified routes. `/readyz` returned ready for the development service; route-level execution without a configured route is separately proven unavailable by RC-BSSV2-002-01 and RC-BSSV2-002-04.
- Worker health was healthy. Read-only PostgreSQL inspection confirmed pg-boss schema version 41, the existing Bridge effect/replay tables, and both Bridge queue definitions. No document fixture or provider call was created.
- No unrelated worktree changes were staged or included in the implementation commit.

Internal readiness: READY_FOR_CK
