# PERC-RESET-002 CK review — c9c4a2f

- **Ticket:** `PERC-RESET-002` — Sole normal RUN-003 perception route
- **Batch:** `PERC-RESET`
- **Review type:** first independent CK review
- **Ticket state:** `awaiting_review`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Perception_Reset_Phase/PERC-RESET-002-normal-run003-route-activation.md`
- **Reviewed target commit:** `c9c4a2ff7cf641f624f6d31a3a9698752442e1fd`
- **Checkpoint binding commit:** `2b97865fceb6cfa7ba86ed80f919a2a0b06ef877` records the reviewed target SHA; it changes only the checkpoint record.
- **Result:** `CHANGES_REQUIRED`

## Target and authority

The frozen ticket and implementation are present at the reviewed target. The target includes the committed RUN-003 Compose/route changes and the ticket. The checkpoint binding commit identifies that exact target. Reviewed source, test, Compose, ticket, and checkpoint paths have no worktree modifications. Other dirty and untracked workspace paths do not overlap this target and were not consumed.

Authority is the frozen PERC-RESET-002 ticket, its named PERC-RESET implementation context, the approved `IDSER-012-01-03-01/02` interfaces, and the approved PERC-RESET-001 amendment-v1 qualification. The PERC-RESET-001 records show the inspected cache volumes were empty and make no model-readiness or cache-preservation claim. This review makes no physical-cache reuse claim; PERC-RESET-002 did not start Docker, and PERC-RESET-004 owns model-readiness qualification.

## Review Contract

| Row | Ticket authority | Required proof | Evidence and status |
|---|---|---|---|
| RC-PERC-RESET-002-01 | Scope runtime identities; R2-01 | Effective normal Compose aligns Atlas, Bridge service, and worker to one RUN-003 identity. | Rendered Compose assertions and `route-registry.test.ts` canonical configuration test verify the one route, both Bridge declarations, Atlas identity, and worker profile. **PROVEN** |
| RC-PERC-RESET-002-02 | Scope qualification-ref-backed approval and fail-closed behavior; R2-02 | With `qualificationOnly=false`, the specifically approved RUN-003 route is permitted and mismatched/unqualified route identity is rejected. | RUN-003 profile and capability-identity mismatches are rejected, but `assertConfiguredRouteAdapter` does not bind `qualificationVersion` or `qualificationRef` to the approved RUN-003 qualification; route parsing requires only nonempty values. **UNRESOLVED — CK-001.a** |
| RC-PERC-RESET-002-03 | Scope no fallback; R2-03 | One normal perception mapping, no old route or automatic fallback. | Rendered Compose and the canonical route test show one identical Docling route on both Bridge processes; Compose has no old profile or qualification-only flag. **PROVEN** |
| RC-PERC-RESET-002-04 | Outcome; R2-04 | Perception remains perception-only and accepted work terminates at `perceived`. | The change updates only route configuration/identity and route admission. The existing Atlas terminal boundary is unchanged; no semantic route or execution activation was added. **PROVEN** |
| RC-PERC-RESET-002-05 | Scope Docling cache mount; PERC-RESET-001 amendment-v1 qualification | Normal Compose maps the Docling cache to `/root/.cache`; do not claim an old protected cache was reused absent evidence it exists. | Rendered Compose retains the `docling-models` volume mount on `docling-serve`. The approved PERC-RESET-001 amendment records empty inspected cache volumes and defers model readiness to PERC-RESET-004. No runtime or volume was created. Static requirement **PROVEN**; physical cache reuse is not applicable to the accepted predecessor state. |

## Validation and evidence

- `node node_modules/.pnpm/jiti@2.7.0/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/route-registry.test.ts` — **PASS**, 9 tests.
- `docker compose -f docker-compose.yml config --format json` with PowerShell assertions for the single RUN-003 mapping, matching Bridge route declarations, Atlas identity, worker profile, and absence of `AGENTS_BRIDGE_QUALIFICATION_ONLY` — **PASS**.
- `git diff --check 49936d486d8266bcbd61532395c214bb206d3023 c9c4a2ff7cf641f624f6d31a3a9698752442e1fd` — **PASS**.
- `node node_modules/.pnpm/jiti@2.7.0/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/docling-provider.test.ts` — **BLOCKED** by the existing unresolved `@atlas/contracts` workspace link (`MODULE_NOT_FOUND`). This test was not required to substitute for the passing route/config checks.
- No Docker runtime was started.

## Finding CK-001 — RUN-003 approval metadata is not pinned by route admission

**Authority:** PERC-RESET-002 Scope requires a specific qualification-ref-backed RUN-003 approval; R2-02 requires the exact reviewed route and fail-closed rejection of mismatched or unqualified route/profile/identity values. The GO checkpoint identifies the approved route as `qualificationVersion=idser-012-01-03-02-local` and `qualificationRef=qualification://idser-012-01-03-02-local`, corresponding to the consumed approved IDSER-012-01-03-02 interface.

**Evidence:** `apps/agents-bridge/src/route-registry.ts` validates `qualificationVersion` and `qualificationRef` only as nonempty during parsing. `assertConfiguredRouteAdapter` verifies the Docling service/model/adapter/profile/capability identity/image digest, but does not compare the route's qualification version or reference with the approved RUN-003 qualification. The new negative cases in `apps/agents-bridge/tests/route-registry.test.ts` cover profile and capability-identity mismatch, not qualification metadata mismatch. A route carrying a different nonempty qualification reference/version can therefore pass admission while using the RUN-003 profile.

### Frozen Finding Closure Matrix

| Clause | Ticket authority | Unsatisfied evidence | Observable correction and binary closure oracle |
|---|---|---|---|
| **CK-001.a** | PERC-RESET-002 Scope and R2-02 | Startup admission does not establish that RUN-003 is backed by the specifically approved qualification; arbitrary nonempty qualification metadata is accepted. | **Required state:** with normal `qualificationOnly=false`, the route using `qualificationVersion=idser-012-01-03-02-local` and `qualificationRef=qualification://idser-012-01-03-02-local` is admitted, while changing either value causes `assertConfiguredRouteAdapter` to reject the route. **Proof location:** focused assertions in `apps/agents-bridge/tests/route-registry.test.ts`, executed with the route-registry Jiti command above. **Direct-regression boundary:** normal Docling `atlas.document.perceive` route admission only; preserve other capabilities and the approved IDSER implementations. |

## Decision

The normal Compose identities, one-route mapping, no-fallback configuration, and perception-only boundary are supported. The exact qualification-backed approval is not enforced at route admission, leaving one implementation-repairable ticket violation. Result: **`CHANGES_REQUIRED`**. Keep `PERC-RESET-002` at `awaiting_review`; any remediation must close only frozen clause `CK-001.a` before bounded post-CFC verification.
