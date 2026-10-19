# GO checkpoint: IDSER-012-03-02-02 / IDSER-BATCH-12-03-02-02

- **Ticket:** `IDSER-012-03-02-02` — Conservative corpus demand estimator.
- **State:** `awaiting_review`.
- **Implementation commit:** `e91993ce0980c813a66a50d88533c62cd0c9ad56` (`feat(idser): add conservative corpus demand estimator`).
- **Dependency consumed:** `IDSER-012-03-01-03` CK `PASS` at `719b9d121340a5388805d284d6263c2a549a6790`; the approved `-03-02-01` BSS prospective reader evidence supplies the pinned workload estimator identity `anoman-prospective-estimator@v2` used by the frozen fixtures.

## Bounded implementation

`apps/agents-bridge/src/idser-corpus-demand-estimator.ts` adds a pure deterministic estimator whose only inputs are an already resolved `AcceptedDocumentPlannerResultV1` and a caller-supplied pinned BSS estimator identity/configuration. It canonicalizes source locators as document + page + kind + local ID; it preserves empty sources as deferred and unsafe visual/media/locator/REL cases as explicit unexamined or gap results. It does not read BSS or storage, construct prompts, persist data, enqueue work, call SEM/provider services, or create semantic truth.

For each eligible text, table, or granted labeled visual, the frozen configuration separately measures source bytes, granted-media bytes, system-prompt/schema/context-placeholder/output-reservation overheads, and byte/token safety margins. It emits only the existing finite nonnegative `RequestResourceEnvelope` shape `{requestUnits, tokenUnits, dayUnits, concurrencyUnits}`. A mismatched BSS identity, unsupported bound, foreign media, invalid document binding, fabricated REL state, duplicate locator, or missing required media returns `SEM_BATCH_ESTIMATOR_GAP`; an accepted corpus with no eligible unit returns typed `NO_ELIGIBLE_SOURCE` and no fabricated empty batch.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation locator | Exact command and outcome | Status |
| --- | --- | --- | --- | --- |
| `RC-012030202-01` | Frozen row 01: resolved accepted sources yield deterministic canonical locators and eligible/deferred/unexamined classification; duplicate, foreign, missing, and fidelity-breaking cases stay explicit or reject. | `idser-corpus-demand-estimator.ts`; `idser-corpus-demand-estimator.test.ts` deterministic accepted-result fixture verifies document/page/kind/local-ID ordering, blank deferred state, unexamined visual state, duplicate locator, missing grant, and foreign-media gap cases. The consumed `IDSER-012-03-01-03` CK proof establishes the accepted resolver source boundary. | `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge exec jiti tests/idser-corpus-demand-estimator.test.ts` — PASS (3 tests, 0 failures, 0 skips). | `PROVEN` |
| `RC-012030202-02` | Frozen row 02: measured fixture proves conservative bytes/tokens and every existing envelope dimension for text, tables, context, schema/output allowance, and granted media with pinned identity/version; no page-count sizing. | Focused fixture asserts the exact request-byte/input-token calculation for a granted visual and `{requestUnits, tokenUnits, dayUnits, concurrencyUnits}`. Source bytes are `Buffer.byteLength` values; all configured overhead and safety-margin inputs are finite nonnegative integers. | Focused command above — PASS; `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/agents-bridge typecheck` — PASS. | `PROVEN` |
| `RC-012030202-03` | Frozen row 03: absent REL remains absent; placeholders create no output and cannot create semantic structure or visual facts. | The estimator accepts only `rel.state === 'unavailable'`; the focused test injects a fabricated available REL state and observes a typed gap. It returns locator/classification/demand data only, with no candidate, REL graph, prompt, or semantic-result output. | Focused command above — PASS. | `PROVEN` |
| `RC-012030202-04` | Frozen row 04: empty corpus is typed `NO_ELIGIBLE_SOURCE`; pure estimation causes zero BSS/storage/plan/reservation/GHR/SEM/provider/truth effects. | Empty accepted corpus fixture returns one deferred unit, zero eligible units, and `NO_ELIGIBLE_SOURCE`. The implementation imports only the envelope parser and the resolved-result type; it contains no reader, database, queue, transport, or persistence dependency. | Focused command above — PASS; `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/db migration:check` — PASS (`Atlas database migration check passed`). | `PROVEN` |

## Validation and limitations

- `docker compose ps` reported PostgreSQL `healthy` before Compose validation.
- `git diff --check -- apps/agents-bridge/src/idser-corpus-demand-estimator.ts apps/agents-bridge/tests/idser-corpus-demand-estimator.test.ts apps/agents-bridge/package.json` — PASS.
- `corepack pnpm --filter @atlas/agents-bridge test` was run as a diagnostic and reached an unrelated pre-existing `docling-provider.test.ts` failure: the test expects `docling-digital-pdf` to resolve, while the current route registry rejects it because it lacks the approved RUN-003 qualification. The new estimator suite passed before that unrelated failure; no target path overlaps it.

Internal readiness: READY_FOR_CK. This is GO implementation readiness only, not a self-issued CK `PASS`; control returns to CK for the frozen ticket.
