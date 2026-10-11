# BSS-V2-004-03-08-01-04 GO checkpoint — opt-in eight-stage compiler and legacy coexistence

- **Ticket:** `BSS-V2-004-03-08-01-04`
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-004-03-08-01-04-opt-in-eight-stage-compiler-and-legacy-coexistence.md`
- **State:** `awaiting_review`
- **Implementation commit:** `bce0856e24e424d336fcdd453482d7d1e070c6bf` (`feat(atlas): add opt-in stepwise prompt profile`)
- **Reviewed base:** `00c7ad5` (`docs(bss): approve 08-01-03 after CK verification`)
- **Prerequisites consumed:** `08-01-01` CK PASS in `BSS-V2-BATCH-04.03-08.01-01-7de0276-review.md`; `08-01-03` CK PASS in `BSS-V2-BATCH-04.03-08.01-03-c860930-verification.md`.
- **Runtime:** Node `v24.19.0`; pnpm `11.19.0`; local offline test environment.

## Bounded implementation and changed-file impact

| Path | Contract impact | Classification |
| --- | --- | --- |
| `packages/atlas-skills/src/semantic-prompt.ts` | Adds the explicit `atlas.semantic.extract.stepwise_multimodal/v0.3.1` compiler branch and provenance only. The existing default branch and its legacy return shape remain untouched. | `INTENDED_NEW_PROFILE_ONLY` |
| `packages/atlas-skills/src/index.ts` | Additive exports of the new profile and compiler IDs. | `INTENDED_NEW_PROFILE_ONLY` |
| `packages/atlas-skills/tests/semantic-skills.test.ts` | New eight-stage/provenance, profile-rejection, and old→new→old/concurrent-isolation evidence; existing legacy tests remain unchanged. | `INTENDED_NEW_PROFILE_ONLY` |

No canonical Semantic V1, source-packet, bridge/provider, persistence, job, reservation, transport, UI, or fixture/gold file is in the implementation commit. The separately modified/untracked worktree files are outside this change and were not staged.

## New profile identity

| Identity | SHA-256 / value |
| --- | --- |
| Profile | `atlas.semantic.extract.stepwise_multimodal/v0.3.1` |
| Compiler | `@atlas/skills/semantic-prompt/stepwise-multimodal/v0.3.1` |
| Prompt | `b99d5a99fa33e498a9cb72411ad5116c4d7d8cbb7a44bdd308bce4d50b3b7fc0` |
| Canonical provider-proposal schema | `20e53795dcf9edddf998dc7b621a1230a7abb33c6d370bfefd62e0e4a1ee62f3` |
| Source-input Zod schema | `8b0170dfdbfdecc358a644a6817175b83fe340c74199e83d7b85fa2af32967f7` |
| Frozen stage-authority map | `d7c8e9e5ef044c5329516aff7e82daea721690658979098081852ad76256e72c` |
| Aggregate artifact | `0ecacdf73f105df8248efd2110858afb73719af4d2ffaa96c6f39789370a9167` |

The new profile is selected only by the explicit exported ID. It accepts only the current canonical provider-proposal projection, verifies the frozen source-input authority map before rendering, rejects unknown profiles and altered proposal schemas, and takes no source content, provider, model, transport, image, credential, or runtime input.

Its immutable stage provenance is ordered as: `1 understand_evidence_context`, `2 identify_independent_propositions`, `3 preserve_normalize_meaning`, `4 select_primary_semantic_kind`, `5 assess_uncertainty_clarification`, `6 account_source_slots_context`, `7 verify_semantic_faithfulness`, `8 return_provider_proposal`. Each rendered section records its stage, authority, source, policy hash, rendered hash, and outside-model validator metadata. Canonical and source-input Zod projections are rendered from their current authorities; the existing `crossFieldSemanticCompositionPolicy` is included unchanged with its own legacy source identity.

## Legacy differential evidence

The legacy `compileExtractionPrompt()` default still emits `atlas.semantic.extract.prompt-003/v1`; its prompt SHA-256 is exactly the `08-01-01` baseline value `a79ac1174807a635f6a8820ea6cc8073457fba7534a61b55014cde76fa287458`. The focused test proves old→new→old and concurrent old/new invocations retain identical legacy prompt and provenance, while `buildSemanticSourcePacket()` still selects only the legacy profile. No default dispatch, fallback, import/export mutation, or implicit activation is present.

## Validation evidence

| Exact command | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/contracts typecheck` | PASS |
| `corepack pnpm --filter @atlas/contracts test` | PASS — 14 tests (including 10 Semantic V1 tests) |
| `corepack pnpm --filter @atlas/skills typecheck` | PASS |
| `corepack pnpm --filter @atlas/skills test` | PASS — 15 tests, including explicit stepwise and legacy-isolation cases |
| `corepack pnpm --filter @atlas/agents-bridge typecheck` | PASS |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-capabilities-boundary.test.ts` | PASS — 2 tests |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-worker.test.ts` | PASS — 5 tests, including staged replay with no second provider call |
| `git diff --check` | PASS — no whitespace errors |

All commands use deterministic local test doubles or pure compiler/schema code. `external_provider_attempt_count: 0`; `semantic_job_count: 0`; `unintended_perception_job_count: 0`; `admission_reservation_count: 0`. No image bytes/base64, secret, provider request, retry, reconciliation, or publication was generated or logged. No pre-existing failure occurred in the required lanes.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence/test locator and exact outcome | Status |
| --- | --- | --- | --- |
| `RC-01` | Deterministically compile the new explicit profile through all eight ordered stages from canonical/source-input Zod and reviewed static sections, with inspectable authority and hashes; no provider/runtime reasoning behavior. | `semantic-prompt.ts` freezes and validates the imported stage map and renders the canonical/source-input Zod projections once. `semantic-skills.test.ts`, `explicit stepwise_multimodal profile compiles the frozen eight stages with inspectable provenance`, proves two-build equality, order, sole allowed authority, hashes, canonical schema, and static-policy reuse. | `PROVEN` |
| `RC-02` | Preserve legacy default bytes, schema, section/provenance behavior, text-only packet, and frozen cross-field policy. | `semantic-skills.test.ts`, `legacy prompt-003/v1 remains byte-identical and isolated before, during, and after stepwise compilation`, asserts the immutable baseline prompt SHA, exact old→new→old prompt/provenance equality, and legacy packet selection. All affected skills/contracts/bridge lanes pass. | `PROVEN` |
| `RC-03` | Prove repeatability, old/new concurrency isolation, explicit selection, unsupported-profile/schema rejection, no implicit activation, and source-as-instruction safety. | The named new-profile test verifies deterministic repeat compilation, stage order/hashes, unknown-profile rejection, and rejection of an injected source-instruction schema. The named isolation test runs concurrent old/new compilations and preserves the legacy default. Existing source-input adversarial evidence continues to pass in the same 15-test skills run. | `PROVEN` |
| `RC-04` | Record a changed-file/contract-impact matrix and same-environment legacy-vs-new ledger proving `INTENDED_NEW_PROFILE_ONLY`; block unexpected legacy drift. | Matrix and validation ledger above; implementation diff contains only the three listed skills paths. Legacy SHA and all baseline lanes pass unchanged. | `PROVEN` |

Internal readiness: READY_FOR_CK

**Handoff:** Stop for independent CK of `bce0856e24e424d336fcdd453482d7d1e070c6bf`. This checkpoint is not a CK PASS and does not authorize `08-02-01`.
