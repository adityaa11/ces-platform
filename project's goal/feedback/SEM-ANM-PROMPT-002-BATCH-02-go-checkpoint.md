# SEM-ANM-PROMPT-002-BATCH-02 GO checkpoint

- **Ticket:** `SEM-ANM-PROMPT-002-02` — Deterministic extraction-prompt compiler
- **Batch:** `SEM-ANM-PROMPT-002-BATCH-02`
- **Ticket state:** `awaiting_review`
- **GO status:** `READY_FOR_CK`; CK has not issued a terminal result
- **Predecessor:** `SEM-ANM-PROMPT-002-01` CK `PASS`, review `SEM-ANM-PROMPT-002-BATCH-01-b538b43-review.md`, target `b538b431edc1c1acd3d2547135c5f430c5328914`
- **Review target:** `cb84f7aac2c9715eadf5f820696415914da5a97a` — `feat: compile deterministic Anoman extraction prompt`
- **Scope:** deterministic offline rendering from the approved provider-schema projection and frozen Zod descriptions, combined with the fixed policy in `SEM-ANM-PROMPT-002-trimmed-v2-implementation-context.md` §8. No provider call, semantic finalizer, parser integration, reconciliation rendering, or production coupling.

## Implementation evidence

- `scripts/sem-anm-prompt002/prompt-compiler.mts` traverses the public converted JSON Schema, resolves local references, renders the provider shape and Zod descriptions, checks the candidate kind vocabulary against the frozen Zod kind schema, and fails clearly for unsupported forms, missing descriptions, broken references, and cyclic reference chains.
- `scripts/sem-anm-prompt002/prompt-fixed-sections.mts` contains the frozen PROMPT-002 static role, task, reference, multiple-candidate, conflict, general, source-accounting, and output sections.
- `scripts/sem-anm-prompt002/generate.mts` emits the extraction prompt, provider schema, provenance, and hashes. Provenance records each generated section's source property, exact source descriptions, and static/dynamic ownership.
- `scripts/sem-anm-prompt002/prompt-compiler.test.mts` checks all 16 frozen kinds and their exact descriptions, classification and field coverage, primary-kind/facet and unresolved distinctions, fixed policy, reconciliation-description exclusion, provenance traceability, deterministic bytes/hashes, and negative schema cases.
- Generated artifacts are `scripts/sem-anm-prompt002/generated/system-prompt.txt`, `provider-schema.json`, `prompt-provenance.json`, and `hashes.json`.
- Frozen reference SHA-256: `67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083`.
- Provider schema SHA-256: `c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b`.
- Generated prompt SHA-256: `80935e3f64f77a0569ff91e30ce7c7d7d08d1c78747dbbee304c28de88a538c5`.

## Validation

| Command | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt002/generate.mts` (two consecutive runs) | PASS both times; frozen reference, provider schema, and prompt hashes were identical: `67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083` / `c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b` / `80935e3f64f77a0569ff91e30ce7c7d7d08d1c78747dbbee304c28de88a538c5`. |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt002/prompt-compiler.test.mts` | PASS; deterministic output, semantic/policy coverage, exact provenance mappings, and negative form/reference checks passed. |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt002/test.mts` | PASS; predecessor frozen-reference integrity and schema projection remain valid with unchanged hashes. |
| `git diff --check` (staged ticket paths) | PASS; recorded after staging. |

## Review Contract Closure

| Row | Ticket authority | Pass condition and required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- | --- |
| `RC-PROMPT2-02-001` | Frozen ticket Outcome and Acceptance row; parent context §§7–9 | Output shape and semantic sections are rendered from the converted frozen schema and its descriptions. | `prompt-compiler.mts`, generated prompt, and source-linked provenance; compiler test checks exact Zod kind descriptions and generated field content. `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt002/prompt-compiler.test.mts` — PASS. | PROVEN |
| `RC-PROMPT2-02-002` | Frozen ticket Acceptance row | All 16 current extraction kinds and `candidate`/`non_fact` are represented; the PROMPT-001 three-kind model is not used. | Frozen-kind equality guard; generated prompt and test assertions for exact 16 kind values, classifications, and candidate fields. Same compiler test — PASS. | PROVEN |
| `RC-PROMPT2-02-003` | Frozen ticket Acceptance row; parent context §§5, 8.6, 9 | Primary-kind and overlapping-facets behavior is preserved with no false `rule XOR constraint` implication. | Frozen kind description rendered verbatim; test checks primary-role and overlap language. Same compiler test — PASS. | PROVEN |
| `RC-PROMPT2-02-004` | Frozen ticket Acceptance row; parent context §6 | `unresolved` and `needs_resolution` remain orthogonal; a specific kind can have `needs_resolution=true`. | Frozen kind and field descriptions appear in prompt; deterministic assertions cover both. Same compiler test — PASS. | PROVEN |
| `RC-PROMPT2-02-005` | Frozen ticket Acceptance row; parent context §8.1–8.8 | Fixed role, task, reference, multiple-candidate, conflict, general, source-accounting, and output rules use the frozen PROMPT-002 wording. | `prompt-fixed-sections.mts`, generated prompt, and required policy assertions. Same compiler test — PASS. | PROVEN |
| `RC-PROMPT2-02-006` | Frozen ticket Acceptance row; parent context §10 | Reconciliation schemas/definitions are not rendered into the extraction prompt; extraction remains separate. | Compiler consumes only `atlasProviderExtractionProposalV1Schema`; test compares converted frozen reconciliation descriptions against prompt and checks the projected extraction schema has no reconciliation relationship field. Same compiler test — PASS. The extraction `relationship` description retains its source-authored incidental contrast, as allowed by parent context §10. | PROVEN |
| `RC-PROMPT2-02-007` | Frozen ticket Acceptance row; SecurityReadiness `SR-PROMPT2-02-ID-01` | Every generated semantic section has a source property, source description, and static-versus-Zod ownership trace. | `generated/prompt-provenance.json` maps generated text to source schema/property and exact descriptions; compiler test verifies trace text occurs in its section. Same compiler test — PASS. | PROVEN |
| `SR-PROMPT2-02-IB-01` | Frozen ticket SecurityReadiness | Frozen reference is unchanged; prompt remains derived and non-authoritative. | Generator verifies reference SHA-256; no semantic reference changes are staged. Generator command — PASS. | PROVEN |
| `SR-PROMPT2-02-TB-01` | Frozen ticket SecurityReadiness | Generation remains offline and distinct from model/provider execution. | Implementation contains no provider client or call; generation and tests run locally. Scope inspection and local commands — PASS. | PROVEN |
| `SR-PROMPT2-02-ID-01` | Frozen ticket SecurityReadiness | Generated semantic content retains attribution to Zod property and description. | Generated provenance plus traceability assertions. Compiler test — PASS. | PROVEN |
| `SR-PROMPT2-02-ES-01` | Frozen ticket SecurityReadiness | Conversion, traversal, filtering, policy, rendering, and provenance remain inspectable seams. | Separate provider-schema, fixed-policy, compiler, generator, and provenance files; bounded implementation diff. Dependency/diff inspection — PASS. | PROVEN |
| `SR-PROMPT2-02-PC-01` | Frozen ticket SecurityReadiness | No semantic invention, description bypass, reconciliation definitions, or live/production coupling is introduced. | Frozen reference hash, reference-derived rendering, negative reconciliation checks, and offline-only implementation. Compiler test — PASS. | PROVEN |
| `SR-PROMPT2-02-VS-01` | Frozen ticket SecurityReadiness | Fixed wording, semantic distinctions, reconciliation exclusion, and deterministic output are verified. | Ticket-local compiler test and two identical generation runs — PASS. | PROVEN |
| `SR-PROMPT2-02-UP-01` | Frozen ticket SecurityReadiness | Provider governance/retention/route qualification remains outside this offline ticket. | NOT APPLICABLE: parent/ticket explicitly leave provider policy unresolved and no provider is called. | NOT_APPLICABLE |
| `SR-PROMPT2-02-RB-01` | Frozen ticket SecurityReadiness review binding | Offline derived-artifact boundary and frozen semantic authority are preserved. | Scope inspection, reference hash, frozen fixed-section output, and no provider dependency/call — PASS. | PROVEN |
| `SR-PROMPT2-02-RB-02` | Frozen ticket SecurityReadiness review binding | Semantic descriptions and fixed policy can be traced and the reconciliation boundary is verified. | Generated provenance, compiler traversal/negative checks, and reconciliation exclusion assertion — PASS. | PROVEN |

No provider credentials, responses, or confidential source inputs were used or recorded. The generated prompt and schema remain derived artifacts. GO proposes no terminal `PASS`; CK owns that result.

Internal readiness: READY_FOR_CK
