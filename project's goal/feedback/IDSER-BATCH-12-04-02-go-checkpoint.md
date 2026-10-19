# GO checkpoint: IDSER-012-04-02 / IDSER-BATCH-12-04-02

- **Ticket:** `IDSER-012-04-02` — Complete SEM candidate-request estimator.
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-04-02-complete-sem-candidate-request-estimator.md`.
- **Dependencies consumed:** `IDSER-012-04-01` CK `PASS`, recorded in `IDSER-BATCH-12-04-01-f530280-review.md`; the approved `buildStepwiseSourcePacket()` selection and canonical bytes/hash boundary; existing `RequestResourceEnvelope` parser.
- **Implementation commit:** `3de09b92996abef5bde7832530f3c12bdf0b2f5d` (`feat(idser): add complete SEM request estimator`).
- **Ticket state:** `awaiting_review`.

## Bounded implementation

`estimateCompleteSemCandidateRequest()` measures precisely one already-selected
`StepwiseSourcePacket`. It reuses the actual SEM relationship-envelope request
composition for its system prompt, canonical source-specification bytes, and
response schema. It applies the frozen `ConservativeLogicalRequestBytes/v1`
formula, separates `inputTokens` from `reservedOutputTokens`, and inserts the
reservation once into the existing four-field request-resource envelope.

Configuration and selected-media allowances are explicit, pinned inputs.
The estimator validates their identities, bounds, canonical source hash, and
exact selected visual accounting before returning an immutable result. Its
provenance holds only identities, hashes, counts, and measured values; it does
not persist source content, media, prompts, schemas, or a provider body.

This change adds no BSS prospective read or write, partitioning, plan record,
GHR effect, SEM call, provider call, or execution path. The existing
per-locator estimator and partitioner remain unchanged for their separately
owned later-ticket replacement work.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation locator | Exact command and outcome | Status |
| --- | --- | --- | --- | --- |
| `RC-0120402-01` | Actual canonical packet plus actual SEM prompt/schema identities are measured once; fixed overhead and selected source content are not counted again. | `complete-sem-candidate-request-estimator.ts` calls `buildStepwiseRelationshipEnvelopeRequest()` over the approved packet and counts UTF-8 prompt, source specification, canonical response schema, framing, media transport, and byte margin in one request. Test `measures one actual composed...` verifies the exact component arithmetic and packet hash provenance. | `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/complete-sem-candidate-request-estimator.test.ts` — PASS (4 tests, 0 failures). | `PROVEN` |
| `RC-0120402-02` | Frozen byte/token formulas apply; output reservation is excluded from inputs, enters the BSS resource envelope once, and invalid/overflow configuration fails closed. | The estimator computes `ceil(textBearingRequestBytes / inputBytesPerToken)`, then input/image/safety tokens, and then separate prospective demand. It builds the existing envelope with `tokenUnits = prospectiveTokenDemand`. Focused tests assert the distinction/one insertion and invalid configuration rejection. | Focused estimator command above — PASS (4 tests, 0 failures). `corepack pnpm --filter @atlas/agents-bridge typecheck` — PASS. | `PROVEN` |
| `RC-0120402-03` | Changed canonical packet, selected media, framing/schema allowance, or pinned estimator configuration changes deterministic measurement with versioned provenance. | The changed-input fixture changes packet selection, framing policy, and selected visual allowance; it asserts changed request measurements and packet/configuration provenance hashes. Schema and prompt hashes are returned from actual composed request inputs. | Focused estimator command above — PASS (4 tests, 0 failures). | `PROVEN` |
| `RC-0120402-04` | Logical sizing makes no exact-provider claim and has zero BSS reads/writes, plan records, GHR effects, SEM calls, or source-content storage. | The implementation imports only the approved in-memory SEM request composer and envelope parser. The focused test inspects imports to fence BSS prospective reader, partition, capacity, queue, provider, and semantic-worker seams. Result provenance is hashes/counts/measurements only. | Focused estimator command above — PASS (4 tests, 0 failures). `corepack pnpm --filter @atlas/skills test` — PASS (18 tests, 0 failures). | `PROVEN` |

## Validation and limitation

- `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/complete-sem-candidate-request-estimator.test.ts` — **PASS** (4 tests, 0 failures).
- `corepack pnpm --filter @atlas/agents-bridge typecheck` — **PASS**.
- `corepack pnpm --filter @atlas/skills test` — **PASS** (18 tests, 0 failures).
- `git diff --check -- apps/agents-bridge/package.json apps/agents-bridge/src/complete-sem-candidate-request-estimator.ts apps/agents-bridge/tests/complete-sem-candidate-request-estimator.test.ts` — **PASS** before the implementation commit.
- `corepack pnpm --filter @atlas/agents-bridge test` reaches the new focused estimator test successfully, then stops at pre-existing `tests/docling-provider.test.ts` assertion `Docling route requires its immutable service, runtime, adapter, and profile identity`: `Route docling-digital-pdf does not name the approved RUN-003 qualification.` The failing test and route-registry path are unchanged from `HEAD` by implementation commit `3de09b9`; this is an unrelated baseline failure, not a direct regression in this ticket.

Internal readiness: `READY_FOR_CK`.

This is GO implementation readiness only, not a self-issued CK `PASS`. Control returns to independent CK for this frozen ticket. No downstream BSS fit/partition, persistence, GHR, reconstruction, provider execution, semantic acceptance, reconciliation, publication, Master, or CES work is authorized.
