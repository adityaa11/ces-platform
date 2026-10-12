# PERC-RESET-002 GO checkpoint — normal RUN-003 route activation

- **Ticket:** `PERC-RESET-002` — Sole normal RUN-003 perception route
- **Batch:** `PERC-RESET`
- **State:** `awaiting_review`
- **Dependency:** PERC-RESET-001 CK `PASS` under its amendment-v1 qualification (`PERC-RESET-BATCH-01-a653008-verification.md`)
- **Consumed approved interfaces:** `IDSER-012-01-03-01` RUN-003 capture/mapping and `IDSER-012-01-03-02` Atlas-owned derived-asset handoff, both approved. Their scopes were not reopened.
- **Review target:** this bounded GO checkpoint and its committed source/config/test changes

## Bounded implementation

Normal `docker-compose.yml` now exposes exactly one enabled `atlas.document.perceive` route: `docling-run-003-capture`, qualified by `qualification://idser-012-01-03-02-local`. The Atlas D1 capability identity, both Bridge route declarations, and the worker's `DOCLING_OPTION_PROFILE` now use `atlas-digital-pdf-run-003-capture-v1` and its full `docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1` identity.

The obsolete normal-route `qualificationOnly` rejection was removed from the Docling route assertion. The assertion still rejects any route whose profile, capability identity, pinned versions, adapter, or image digest does not match the configured qualified route. Normal Compose does not set `AGENTS_BRIDGE_QUALIFICATION_ONLY`; the historical isolated qualification override remains untouched. No Docker runtime was started, no cache volume was created or changed, no fallback route was enabled, and no semantic interface was changed.

## Changed files

- `docker-compose.yml`
- `apps/agents-bridge/src/route-registry.ts`
- `apps/agents-bridge/tests/route-registry.test.ts`
- `apps/agents-bridge/tests/docling-provider.test.ts`
- `project's goal/Backend_Phase/tickets/Perception_Reset_Phase/README.md`
- `project's goal/feedback/PERC-RESET-002-go-checkpoint.md`

## Validation evidence

```text
node node_modules/.pnpm/jiti@2.7.0/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/route-registry.test.ts
# PASS — 9 tests, including normal Compose route/identity assertions and RUN-003 mismatch negatives.

docker compose -f docker-compose.yml config --format json | node -e "<assert Atlas identity, worker profile, identical one-route Bridge/worker declarations, no qualification-only flag>"
# PASS — canonical RUN-003 Compose assertions passed.

git diff --check
# PASS
```

The standard pnpm test/typecheck entrypoints could not begin because their automatic dependency check received `EACCES` reading an existing `node_modules/.pnpm/.../kysely/package.json`; direct Jiti execution of the focused `docling-provider.test.ts` is also blocked by the existing unresolved `@atlas/contracts` workspace link. These are not required runtime scenarios for this ticket: the ticket directs static/isolated non-Docker config assertions, which ran successfully above. No Docker fallback or transient stack was started to work around the environment.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / command | Status |
| --- | --- | --- | --- | --- |
| RC-PERC-RESET-002-01 | R2-01; Scope normal Compose identities | Effective intended Compose aligns Atlas, Bridge, and worker to one RUN-003 identity | Rendered Compose equality assertion; `route-registry.test.ts` canonical Compose test | PROVEN |
| RC-PERC-RESET-002-02 | R2-02; Scope exact approval and fail-closed behavior | With `qualificationOnly=false`, exact approved RUN-003 is allowed; any mismatched route/profile/identity fails | `normal RUN-003 admission permits only its exact pinned route identity` test; route-registry adapter assertion | PROVEN |
| RC-PERC-RESET-002-03 | R2-03; Scope no fallback | One normal perception mapping only; no old route or automatic fallback is selected | Rendered Compose assertion verifies one identical Docling route on both Bridge processes and no qualification-only flag; source test rejects mismatched identities | PROVEN |
| RC-PERC-RESET-002-04 | R2-04; Outcome and Scope | Perception route remains perception-only and accepted work terminates at `perceived` | No semantic route was added; normal route capability remains exactly `atlas.document.perceive`; existing D1 `perceived` terminal boundary is unchanged | PROVEN |

Internal readiness: READY_FOR_CK. This is not a self-issued CK `PASS`; GO stops here.
