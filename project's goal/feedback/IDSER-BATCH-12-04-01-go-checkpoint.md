# GO checkpoint: IDSER-012-04-01 / IDSER-BATCH-12-04-01

- **Ticket:** `IDSER-012-04-01` — Canonical SEM batch packet builder.
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-04-01-canonical-sem-batch-packet-builder.md`.
- **Dependencies consumed:** approved `IDSER-012-03-02-03` structural-fit corpus-partition closure, CK `PASS` recorded in `IDSER-BATCH-12-03-02-03-a3111a3-verification.md`; existing accepted-document and SEM source-packet interfaces.
- **Implementation commit:** `f5302803` (`feat(idser): add canonical batch packet selection`).
- **State:** `awaiting_review`.

## Bounded implementation

`buildStepwiseSourcePacket()` now accepts additive `ownedLocators` and
`contextOnlyLocators` inputs. If both remain absent, its established
whole-document behavior and bytes remain unchanged. A selected batch resolves
every locator against the parsed accepted `NormalizedDocument V1`, rejects
malformed, foreign, missing, duplicate, overlapping, and unauthorized
relationship selections before packet emission, and emits selected slots only
in canonical document order. Context-only slots remain non-owning.

Selected source content is copied from the already verified NormalizedDocument
without reserialization, including the `atlas-docling-grid-v1` content carried
by table `content`. Selected visual assets retain only their verified identity;
no image bytes are read, hydrated, stored, or logged. The existing builder
remains the sole source-specification serializer, with its existing UTF-8
serialization and SHA-256 return values. No BSS, storage, GHR, provider, or
execution path is imported or called.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / validation locator | Exact command and outcome | Status |
| --- | --- | --- | --- | --- |
| `RC-0120401-01` | Same verified document, authorized selection, media, and relationship authority produce byte-identical packet bytes/hash; a changed selection changes the packet. | `packages/atlas-skills/tests/stepwise-source-packet.test.ts` constructs reordered exact selections and asserts identical `sourceSpecification`/SHA-256, then asserts a changed selection has a different hash. | `corepack pnpm --filter @atlas/skills exec jiti tests/stepwise-source-packet.test.ts` — PASS (10 tests, 0 failures). | `PROVEN` |
| `RC-0120401-02` | Foreign, missing, duplicate, malformed, unauthorized owned/context selection and invalid media/relationship inputs fail before emission. | The same focused test covers each locator rejection, overlapping ownership, missing selected visual identity, mismatched media identity, and reversed relationship authority. `stepwise-source-packet.ts` validates selection before it forms slots or serializes. | `corepack pnpm --filter @atlas/skills exec jiti tests/stepwise-source-packet.test.ts` — PASS (10 tests, 0 failures). | `PROVEN` |
| `RC-0120401-03` | Selected text/table content, Docling grid metadata, authorized context, deterministic slot/order, and visual identity survive exactly without image-byte persistence. | The focused selected-batch fixture contains `atlas-docling-grid-v1` table content and asserts exact selected slot content, context-only ownership, visual asset identity, canonical document ordering, and presence of the grid marker in the packet. | `corepack pnpm --filter @atlas/skills exec jiti tests/stepwise-source-packet.test.ts` — PASS (10 tests, 0 failures). | `PROVEN` |
| `RC-0120401-04` | Existing whole-document behavior remains passing; there is no second serializer or downstream side effect. | The focused suite compares explicit complete ownership against legacy whole-document bytes/hash. The existing no-side-effect assertion inspects the builder source for provider, persistence, hydration, or finalizer seams. | `corepack pnpm --filter @atlas/skills exec jiti tests/stepwise-source-packet.test.ts` — PASS (10 tests, 0 failures). `corepack pnpm --filter @atlas/skills test` — PASS (18 tests, 0 failures). | `PROVEN` |

## Validation

- `corepack pnpm --filter @atlas/skills exec jiti tests/stepwise-source-packet.test.ts` — **PASS** (10 tests, 0 failures).
- `corepack pnpm --filter @atlas/skills typecheck` — **PASS**.
- `corepack pnpm --filter @atlas/skills test` — **PASS** (18 tests, 0 failures).
- `git diff --check -- packages/atlas-skills/src/stepwise-source-packet.ts packages/atlas-skills/tests/stepwise-source-packet.test.ts` — **PASS** before the implementation commit.

Internal readiness: `READY_FOR_CK`.

This is GO implementation readiness only, not a self-issued CK `PASS`. Control returns to CK for the frozen ticket.
