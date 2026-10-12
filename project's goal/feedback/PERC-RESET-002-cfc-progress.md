# PERC-RESET-002 CFC progress — CK-001.a

- **Ticket:** `PERC-RESET-002`
- **Batch:** `PERC-RESET-BATCH-02`
- **Frozen reviewed target:** `c9c4a2ff7cf641f624f6d31a3a9698752442e1fd`
- **Checkpoint binding:** `2b97865fceb6cfa7ba86ed80f919a2a0b06ef877`
- **CK authority:** [`PERC-RESET-BATCH-02-c9c4a2f-review.md`](PERC-RESET-BATCH-02-c9c4a2f-review.md), result `CHANGES_REQUIRED`

## Working progress view

| Frozen clause | Current status | Evidence location | Closure oracle source |
|---|---|---|---|
| CK-001.a | UNRESOLVED | `apps/agents-bridge/src/route-registry.ts`; `apps/agents-bridge/tests/route-registry.test.ts` | Original CK artifact, section “Frozen Finding Closure Matrix”; ticket authority is PERC-RESET-002 Scope and R2-02. |

The clause and its oracle remain as frozen in the CK artifact. This progress view tracks implementation and proof locations only.

## Bounded remediation result

- **Clause:** CK-001.a only.
- **Changed files:** `apps/agents-bridge/src/route-registry.ts`; `apps/agents-bridge/tests/route-registry.test.ts`; `project's goal/feedback/PERC-RESET-002-cfc-progress.md` (this bounded CFC record).
- **Implementation:** normal Docling `atlas.document.perceive` admission requires exact equality with the RUN-003 `qualificationVersion` and `qualificationRef`. A mismatch throws `RouteResolutionError` with `invalid_route`. Existing Docling identity, image digest, adapter, processor, and option-profile checks remain in place. The check is scoped to Docling and bypassed for `qualificationOnly === true`.

## Closure evidence

All five cases below invoke `assertConfiguredRouteAdapter` directly in the `normal RUN-003 admission permits only its exact pinned route identity` test, with `qualificationOnly: false`.

| Case | Assertion/evidence | Result |
|---|---|---|
| 1. Exact approved version and reference | `assert.doesNotThrow` for `idser-012-01-03-02-local` plus `qualification://idser-012-01-03-02-local`. | PASS — normal RUN-003 route admitted. |
| 2. Version mismatch only | `assert.throws` with version `idser-012-01-03-01-local`, retaining the approved reference; predicate checks `RouteResolutionError.code === "invalid_route"`. | PASS — rejected. |
| 3. Reference mismatch only | `assert.throws` with reference `qualification://idser-012-01-03-01-local`, retaining the approved version; predicate checks `invalid_route`. | PASS — rejected. |
| 4. Both fields mismatched | `assert.throws` with both altered values; predicate checks `invalid_route`. | PASS — rejected. |
| 5. Existing route protections | Direct admission assertions retain rejection for wrong option profile, capability identity, and image digest. | PASS — profile and capability identity reject as cache-identity mismatch; digest rejects as not the pinned qualified Docling service. |

The same focused suite's `canonical Compose exposes only the approved normal RUN-003 perception route` assertion passed, checking the single approved mapping, qualification reference, profile, identity, both Bridge route declarations, and absence of qualification-only and legacy profile settings.

## Validation and environment note

- `node node_modules/.pnpm/jiti@2.7.0/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/route-registry.test.ts` — **PASS**, 9 tests, 0 failures. This includes the five admission cases and static Compose assertions above.
- `git diff --check` — **PASS**.
- Separately recorded environment limitation: CK had previously attempted `node node_modules/.pnpm/jiti@2.7.0/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/docling-provider.test.ts`; it was **BLOCKED** because the existing `@atlas/contracts` workspace link could not be resolved (`MODULE_NOT_FOUND`). No dependency infrastructure was changed for CK-001.a.
- No Docker startup, pull, or rebuild was run.

**Closure oracle:** PASS for CK-001.a. **Internal readiness: READY_FOR_CK.** Checkpoint state: `awaiting_review`; this record does not issue CK `PASS`.
