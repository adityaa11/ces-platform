# CK review — SEM-CUTOVER-003

- **Ticket:** `SEM-CUTOVER-003` — Nonblocking stepwise source ownership packet
- **Batch:** `SEM-CUTOVER`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/SEM-CUTOVER-003-nonblocking-source-ownership-packet.md`
- **Reviewed implementation commit:** `0f03f8c029f874d2869b12d1f6b1c0b9259e6d82` (`feat(sem-cutover): add nonblocking stepwise source packet`)
- **Reviewed checkpoint commit:** `91b403ee6d9ba0d8568821b9cec99aad67127eaa` (`docs(sem-cutover): hand off 003 for review`)
- **Checkpoint state:** `awaiting_review`
- **Review type:** First independent CK review
- **Result:** `CHANGES_REQUIRED`

## Review preconditions and boundary

The active-ticket tuple is unambiguous: explicit user `ck SEM-CUTOVER-003`, the frozen SEM-CUTOVER-003 ticket, batch `SEM-CUTOVER`, checkpoint `91b403e`, and implementation commit `0f03f8c`. The checkpoint records the required predecessor `SEM-CUTOVER-002` independent CK `PASS` at `330eae8` and consumed HMN authority `HMN-SEM-CUTOVER-002-002`.

The implementation commit changes exactly the three authorized paths:

```text
M packages/atlas-skills/src/index.ts
A packages/atlas-skills/src/stepwise-source-packet.ts
A packages/atlas-skills/tests/stepwise-source-packet.test.ts
```

The checkpoint commit adds only the review handoff artifact. Pre-existing dirty and untracked REL-03, worker, finalizer, fixture, planning, feedback, archive, and temporary paths remain outside scope and are protected. This review covers the frozen ticket's source-packet boundary, its five review-contract rows, and its explicitly named mandatory source-coverage cases. It does not add provider execution, image hydration, semantic jobs, persistence, finalization, publication, or Master requirements; the ticket explicitly forbids those operations for this leaf.

## Review Contract results

| Row | Ticket authority / required proof | Evidence and outcome | Status |
|---|---|---|---|
| `RC-003-01` | A zero-visual RUN-003 input yields deterministic eligible owned text/table slots and a valid empty provisional relationship extension; no image is fabricated or mandatory to start. | `packages/atlas-skills/tests/stepwise-source-packet.test.ts:39-49` proves deterministic zero-visual construction and an empty extension. | **PROVEN** |
| `RC-003-02` | Image-bearing input retains every visual locator, asset reference/hash/role and pending state; provisional relationships retain revision lineage without hidden `non_fact`, guessed joins, or duplicated visual assertions. | `packages/atlas-skills/tests/stepwise-source-packet.test.ts:51-69` and `packages/atlas-skills/src/stepwise-source-packet.ts:171-224` prove mixed image-bearing ownership, pending identity, proposed lineage, and no `non_fact` fallback. | **PROVEN** |
| `RC-003-03` | Missing or uncertain essential context leaves independent packet construction nonblocking; dependent interpretation is provisional/non-trusted and accepted use remains blocked. | `packages/atlas-skills/tests/stepwise-source-packet.test.ts:71-83` proves independent table ownership, provisional unresolved state, and `SOURCE_RELATIONSHIP_BLOCKED` for accepted-context use. | **PROVEN** |
| `RC-003-04` | Exact source SHA, execution/document identity, ownership semantics, deterministic sorted IDs, bounded sources, and fail-closed foreign/duplicate/expired/mismatched/source-instruction handling. | `packages/atlas-skills/tests/stepwise-source-packet.test.ts:85-103` and implementation validation at `stepwise-source-packet.ts:117-159` cover the named negative cases and deterministic source construction. | **PROVEN** |
| `RC-003-05` | Existing accepted-relationship packet behavior is not silently weakened; successor coverage retains shared integrity obligations without legacy fallback or CK-gold rewrite. | `packages/atlas-skills/tests/stepwise-source-packet.test.ts:106-110` plus the unchanged legacy source-packet path and passing regression suite preserve the accepted-relationship boundary. | **PROVEN** |
| `RC-003-06` | The ticket's `## Mandatory source-coverage cases` requires zero-image validity plus explicit image-only, unexamined-image, and missing-essential-legend examples. | Zero-visual, mixed unexamined-image, and missing-essential-legend cases are present, but the submitted test/evidence contains no image-only fixture or assertion proving a visual-only packet remains constructible with exact pending visual identity/reason. | **UNRESOLVED** |

## Findings

### CK-001 — Mandatory image-only source-coverage proof is missing

The implementation appears capable of constructing a visual-only packet, but the frozen ticket explicitly requires an image-only example. The submitted focused suite demonstrates a zero-visual text/table packet and a mixed text/table/visual packet; neither proves the visual-only boundary or that no text/table assumption is introduced when visuals are the complete source inventory.

#### CK-001.a — Add and pass the ticket-required image-only scenario

- **Ticket authority:** `SEM-CUTOVER-003`, `## Mandatory source-coverage cases`: “Zero-image inputs remain valid; test image-only, unexamined image and missing-essential-legend examples.” This also exercises the `RC-003-02` pending visual identity requirement.
- **Unsatisfied evidence:** `packages/atlas-skills/tests/stepwise-source-packet.test.ts:39-49` is zero-visual but contains text/table sources; `:51-69` is image-bearing but also contains text/table sources; `:71-83` is the missing-essential-legend case. No committed image-only fixture/test or checkpoint evidence constructs a packet whose source inventory contains only visual regions.
- **Observable correction:** Add a deterministic focused test within the authorized stepwise source-packet test path using a `NormalizedDocument` with visual regions and matching asset identities but no text blocks or tables. Prove construction succeeds, no text/table slots are fabricated, each visual retains its exact locator and asset identity, and each remains `pending_unexamined_visual` with the required pending reason/role. Do not add provider calls, image hydration, persistence, or downstream semantic behavior.
- **Binary closure oracle:** **PASS** iff the committed focused ticket suite contains and passes an explicit image-only case with the observable state above, while the existing zero-visual, mixed unexamined-image, and missing-essential-context cases remain passing and no protected path changes.
- **Exact evidence location / validation:** The added image-only assertion in `packages/atlas-skills/tests/stepwise-source-packet.test.ts`, the resulting focused command `pnpm --filter @atlas/skills exec jiti tests/stepwise-source-packet.test.ts`, `git diff-tree --no-commit-id --name-status -r <remediation-commit>`, and `git diff --check <parent> <remediation-commit>`.
- **Direct-regression boundary:** `packages/atlas-skills/src/index.ts`, `packages/atlas-skills/src/stepwise-source-packet.ts`, and `packages/atlas-skills/tests/stepwise-source-packet.test.ts` only. No provider, hydration, worker, finalizer, schema authority, database, Docker, canonical RUN-003, REL-03, historical ticket, or CK artifact changes.

## Frozen Finding Closure Matrix

| Clause | Ticket authority | Required observable state | Exact evidence / validation | Direct-regression boundary | Status |
|---|---|---|---|---|---|
| `CK-001.a` | SEM-CUTOVER-003 `## Mandatory source-coverage cases`, with the visual pending portion of `RC-003-02` | A visual-only `NormalizedDocument` with matching asset identities constructs successfully without fabricated text/table slots; every supplied visual retains locator and asset identity and is `pending_unexamined_visual` with the required pending role/reason; existing ticket cases remain green. | Added focused test in `packages/atlas-skills/tests/stepwise-source-packet.test.ts`; focused suite command passes; remediation diff and whitespace check pass. | The three authorized implementation/test paths only. | **UNRESOLVED** |

This clause is frozen by this first CK review. It does not require a provider request or provider-owned semantic result, because the frozen ticket explicitly sets this leaf at the offline source-packet boundary and forbids provider execution and image hydration.

## Validation and evidence performed

| Check | Outcome |
|---|---|
| Reviewed commit identity | PASS; `0f03f8c029f874d2869b12d1f6b1c0b9259e6d82` exists and matches the checkpoint's implementation commit. |
| Checkpoint identity | PASS; `91b403ee6d9ba0d8568821b9cec99aad67127eaa` adds only the committed GO handoff record. |
| `git diff-tree --no-commit-id --name-status -r 0f03f8c` | PASS; exactly the three authorized implementation/test paths. |
| `git diff --check 0f03f8c^ 0f03f8c` | PASS; no whitespace diagnostics. |
| `pnpm --filter @atlas/skills exec jiti tests/stepwise-source-packet.test.ts` | PASS; 7/7 submitted focused tests. |
| `pnpm --filter @atlas/skills exec jiti tests/semantic-skills.test.ts` | PASS; 18/18 legacy and shared-boundary regression tests. |
| `pnpm -r --if-present typecheck` | PASS; all 9 participating workspace projects completed. |
| Frozen ticket and implementation inspection | PASS for RC-003-01 through RC-003-05; the explicit image-only mandatory case is absent from committed evidence. |
| External/runtime boundary | PASS; no provider request, image hydration, semantic job, persistence, admission reservation, finalization, publication, Master mutation, Docker action, or canonical RUN-003 mutation was performed. |

## Scope-change observations

None. The missing image-only case is already explicit ticket authority and is an implementation-repairable evidence gap. Provider-owned result coverage and downstream semantic response handling remain outside this leaf's explicitly bounded source-packet scope.

## Decision

`CHANGES_REQUIRED`. The single frozen `CK-001.a` clause must be closed through the bounded Atlas remediation path before SEM-CUTOVER-003 can receive an independent CK `PASS`. This result does not authorize provider activity, image hydration, semantic execution, persistence, finalization, publication, Master work, REL-03 work, or successor SEM-CUTOVER tickets.
