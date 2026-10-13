# GO checkpoint — SEM-CUTOVER-005 successor composite accounting

- **Ticket:** `SEM-CUTOVER-005-SUCCESSOR-COMPOSITE-ACCOUNTING`
- **Batch:** `SEM-CUTOVER`
- **Authorization:** `HMN-SEM-CUTOVER-005-001` (`project's goal/feedback/SEM-CUTOVER-005-hmn-001.md`)
- **Frozen authority:** historical SEM-CUTOVER-005 ticket plus its additive successor contract in the HMN authorization.
- **Implementation target:** this checkpoint's commit.
- **Ticket/checkpoint state:** `awaiting_review`

## Bounded implementation

`prepareProvisionalSemanticCompositeAccounting()` is a pure, additive companion
preparation boundary. It leaves `atlas.semantic.provisional-sidecar/v1` and
`prepareProvisionalSemanticSidecar()` unchanged, and introduces the separately
hashed `atlas.semantic.provisional-composite-accounting/v1` record. It consumes
REL-03-shaped descriptors structurally, validates exact scope/request/profile,
source/asset locator, canonical-result, tuple, and immutable relationship
revision identity, and produces no staging, provider, database, publication,
or truth-promotion effect.

The package barrel export is the narrowly necessary public interface change:
`@atlas/skills` exposes only the new preparation function, version, and
structural value types. No `apps/agents-bridge` import or shared cross-package
type was introduced.

## Review Contract Closure

| Row | Authority and required proof | Evidence / validation | Status |
| --- | --- | --- | --- |
| `RC-SCA-01` | HMN composite rules 1–5: independent-only behavior remains compatible; mixed, optional, fully deferred, pending, and genuine non-fact cases are exclusively and truthfully accounted. | `tests/provisional-semantic-sidecar.test.ts`: independent/pending, fully deferred, mixed optional, and genuine non-fact cases; focused command passed 10/10. | `PROVEN` |
| `RC-SCA-02` | HMN composite rules 1–4: every provider tuple is exactly one canonical-independent, optional-independent, or essential-deferred entry; canonical/deferred duplication is forbidden. | Focused positive mixed coverage and negative double-accounting fixture; focused command passed 10/10. | `PROVEN` |
| `RC-SCA-03` | HMN composite rules 3, 6, 7: exact source/asset/request/profile/revision identity and deterministic composite hash; partial V1 has no standalone staging representation. | Focused fully-deferred identity/hash assertions and foreign/missing revision/partial-detachment rejections; focused command passed 10/10. | `PROVEN` |
| `RC-SCA-04` | HMN compatibility/versioning decision: preserve V1 and use a versioned additive companion only. | Existing five V1 sidecar tests remain green; `pnpm --filter @atlas/skills typecheck` passed. | `PROVEN` |
| `RC-SCA-05` | HMN forbidden-work boundary: no REL-03 implementation, worker/provider/routing, durable staging, DB, Master, publication, or acceptance behavior. | Diff is limited to `packages/atlas-skills/src/provisional-semantic-sidecar.ts`, `packages/atlas-skills/src/index.ts`, focused test, and workflow records. Direct packet/request regressions passed. | `PROVEN` |

## Validation

| Command | Outcome |
| --- | --- |
| `pnpm --filter @atlas/skills exec jiti tests/provisional-semantic-sidecar.test.ts` | PASS — 10/10. |
| `pnpm --filter @atlas/skills typecheck` | PASS. |
| `pnpm --filter @atlas/skills exec jiti tests/stepwise-extraction-request.test.ts` | PASS — 5/5. |
| `pnpm --filter @atlas/skills exec jiti tests/stepwise-source-packet.test.ts` | PASS — 8/8. |
| `git diff --check -- packages/atlas-skills/src/provisional-semantic-sidecar.ts packages/atlas-skills/src/index.ts packages/atlas-skills/tests/provisional-semantic-sidecar.test.ts` | PASS. |

Internal readiness: `READY_FOR_CK`.

## Handoff

Request independent `CK SEM-CUTOVER-005-SUCCESSOR-COMPOSITE-ACCOUNTING` against this checkpoint. It must review only this additive companion contract and direct regressions. Historical SEM-CUTOVER-005 and REL-03 PASS records remain closed; SEM-CUTOVER-006 remains blocked until this successor earns its own CK PASS and its independent gates are reconsidered.
