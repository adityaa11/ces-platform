# BSS-V2-004-03-08-01-03 GO checkpoint — source-input Zod and v0.3.1 stage-authority map

- **Ticket:** `BSS-V2-004-03-08-01-03`
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-004-03-08-01-03-source-input-zod-and-v0-3-1-stage-authority-map.md`
- **State:** `awaiting_review`
- **Scope owner:** additive source-input description authority and frozen stage-authority specification only
- **Parent / reviewed base:** `58027b1433da5f0ab498bfe79729a79886865a53`
- **Review target:** this checkpoint-introducing commit at `HEAD` when CK is invoked
- **Branch:** `codex/new-atlas-backend`
- **Consumed prerequisite authority:** `08-01-01` CK PASS baseline; `08-01-02` assessment CK PASS; HMN-002 as amended by HMN-003; and `BSS-V2-BATCH-04.03-08.01-02-ced86fa-context-provenance-review.md` CK PASS.

## Bounded implementation and ownership

| Path | Ownership / result |
| --- | --- |
| `packages/atlas-skills/src/semantic-source-input-v031.ts` | New provider-neutral `atlas.semantic.source-input/v0.3.1` Zod description contract, approved `atlas.context-provenance/v1` relationship-description boundary, and eight-stage instruction authority/order specification. This is not a prompt compiler, packet builder, persistence service, or validator implementation. |
| `packages/atlas-skills/src/index.ts` | Additive public exports only. |
| `packages/atlas-skills/tests/semantic-skills.test.ts` | Deterministic schema-description, authority/ordering, per-section identity/hash, no-duplicate-taxonomy, language-agnostic, source-as-instruction, and no-provider-seam assertions. |
| This ticket and checkpoint | Lifecycle and reproducible evidence only. |

The new contract fixes stage identities in this exact order: `understand_evidence_context`, `identify_independent_propositions`, `preserve_normalize_meaning`, `select_primary_semantic_kind`, `assess_uncertainty_clarification`, `account_source_slots_context`, `verify_semantic_faithfulness`, and `return_provider_proposal`.

Each section records an immutable identity, `v0.3.1` version, sole authority (`ZOD_SEMANTIC`, `ZOD_SOURCE_INPUT`, or `STATIC_POLICY`), source reference, rendered text, and SHA-256. Outside-model validators are records in the map rather than provider instructions. The source-input schema preserves independently owned versus context-only sources; title/legend/table and visual context; proposed/accepted/rejected/unresolved relationship states; and negative/not-yet/unknown/unavailable distinctions. A proposed relationship cannot become trusted context, canonical truth, or a visual-owned business assertion.

Canonical Semantic V1 remains the only authority referenced for semantic kind, `payload`, `normalized_meaning`, `semantic_key`, `needs_resolution`, questions, source accounting, and provider proposal semantics. The new module contains no copied 16-kind taxonomy or language-token rule. It is additive and has no runtime path for an untrusted source label, table, or image text to modify system policy.

## Legacy identity comparison

The following unchanged file hashes reproduce the `08-01-01` immutable baseline at the candidate head:

| Preserved contract | SHA-256 | Baseline result |
| --- | --- | --- |
| Canonical Semantic V1 `packages/atlas-contracts/src/semantic-v1.ts` | `b481d1f6b2b178fdb572e7a8a7e565814456489183fbcc7a9f2560da5c9bf825` | unchanged |
| Legacy compiler `packages/atlas-skills/src/semantic-prompt.ts` | `be9817c4aa9c09d7748847abd621bb14cb0c8d2425f79b56d90a84cd30fac902` | unchanged |
| Text-only packet `packages/atlas-skills/src/semantic-source-packet.ts` | `0b0fbf9f65f108c477f72980fb06c46e66c1a3611be05d6cd57198c0bcd8305d` | unchanged |

The existing skills regression proves the legacy `prompt-003/v1` default, prompt bytes/provenance, section ordering and hashes, frozen `crossFieldSemanticCompositionPolicy`, and text-only source-packet behavior remain unchanged. No prompt compiler or source-packet implementation file changed.

## Validation evidence

All validation was local and deterministic at the candidate worktree. There were no external semantic provider calls, image hydration/reads, semantic or perception jobs, admission reservations, reconciliation, or publication.

| Exact command | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/skills typecheck` | PASS |
| `corepack pnpm --filter @atlas/skills test` | PASS — 11 tests, including the two new source-input/stage-authority tests and all 9 legacy skills tests |
| `corepack pnpm --filter @atlas/contracts typecheck` | PASS |
| `corepack pnpm --filter @atlas/contracts test` | PASS — 14 tests, including 10 Semantic V1 tests |
| `corepack pnpm --filter @atlas/agents-bridge typecheck` | PASS |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-capabilities-boundary.test.ts` | PASS — 2 tests |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-worker.test.ts` | PASS — 5 tests; replay has no second provider call |
| `git diff --check` | PASS — no whitespace errors in ticket-owned changes |

`external_provider_attempt_count: 0`; `semantic_job_count: 0`; `unintended_perception_job_count: 0`; `admission_reservation_count: 0`. No pre-existing failure was observed in the required impacted lanes.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- |
| `RC-01` | Provider-neutral source-input descriptions must distinguish modality, ownership/reference context, title/legend/table meaning, relationship uncertainty, and language-agnostic temporal negative/not-yet/unknown/unavailable states. | New Zod parsing and JSON-schema description assertions in `semantic-skills.test.ts`; valid table/visual/proposed-relationship fixture plus invalid-state rejection passed. | `PROVEN` |
| `RC-02` | Every rendered section has one owner; all eight stages are complete, ordered, identity/version/hash stable, validators separate, and no duplicate 16-kind taxonomy or language-keyword rule exists. | Stage-map test proves the exact ordered IDs, unique section identities, valid sole owner, SHA-256 per rendered section, separately recorded validators, absent `semanticKinds` import/taxonomy, and no language token rule. | `PROVEN` |
| `RC-03` | Contract is additive/provider-independent; Canonical Semantic V1 and `prompt-003/v1` remain unchanged against the baseline. | Hash comparison above plus all 9 legacy skills, 14 contracts, and 7 focused bridge tests passed. Diff touches neither canonical semantic Zod nor legacy prompt/packet code. | `PROVEN` |
| `RC-04` | Offline schema/section/stage determinism and temporal/legend/ambiguity/source-as-instruction negatives pass; no provider or image execution. | New focused tests verify deterministic map/hash, not-yet/unavailable distinction, untrusted-source wording, no compiler/packet/provider seam; all commands above passed with zero external effects. | `PROVEN` |

**Known blocks:** none for this bounded leaf. **Forbidden effects:** zero provider/job/admission/reconciliation/publication effects observed. **Next allowed action:** independent CK for `BSS-V2-004-03-08-01-03` only; `08-01-04` remains a separate explicit GO decision.

Internal readiness: READY_FOR_CK
