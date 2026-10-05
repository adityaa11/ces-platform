# SEM-ANM-PROMPT-001 GO checkpoint

- **Ticket:** `SEM-ANM-PROMPT-001`
- **Batch:** `SEM-ANM-PROMPT-BATCH-001`
- **Terminal result:** `PASS`
- **Checkpoint:** this implementation commit; the follow-on workflow record identifies its immutable review target.
- **Scope:** deterministic local prompt generation only; no provider client, credential, environment, finalizer, or Atlas-contract change.

## Derived artifacts

| Artifact | Location | SHA-256 |
| --- | --- | --- |
| Frozen manual checkpoint | `scripts/sem-anm-prompt001/fixtures/semantic-prompt-checkpoint-v1.txt` | `baa4217bf4cdbfbde8a1d6d97df5764e72de0414132611ed1cbeb4a0ad3bfb73` |
| Generated provider schema | `.atlas-data/sem-anm-prompt001/generated-provider-schema.json` | `b0316a004d4f1f94a0b9da240bfa730e3b1956e8f52808f3b6b07083dba97fa5` |
| Generated system prompt | `.atlas-data/sem-anm-prompt001/generated-system-prompt.txt` | `5927a2b78903bc043c214f984bbcf3e91fa1971d216b1dd3e088e009e9cc72c4` |

The generated schema, prompt, hash, and coverage audit are intentionally ignored under `.atlas-data/sem-anm-prompt001/`.

## Validation

`corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt001/test.mts` — PASS. This proves JSON-Schema generation from `z.toJSONSchema(...)`; complete descriptions; schema-derived output and definitions; required semantic distinctions and policies; deterministic bytes/hash; description propagation; fail-closed missing-description and broken-reference cases; complete coverage; frozen-text anti-duplication; and fixture presence.

`corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt001/run.mts` — PASS. It wrote the ignored artifact set and reported complete deterministic coverage.

`git diff --check -- scripts/sem-anm-prompt001` — PASS.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / command | Status |
| --- | --- | --- | --- |
| RC-PROMPT-001 | Frozen checkpoint fixture and recorded hash. | Fixture above; local test reads it. | PROVEN |
| RC-PROMPT-002 | Complete described Zod provider contract. | `semantic-schema.mts`; local completeness tests. | PROVEN |
| RC-PROMPT-003 | Renderer input is `z.toJSONSchema(...)`, never private internals. | `prompt-builder.mts`; local tests. | PROVEN |
| RC-PROMPT-004 | Shape derives from JSON Schema. | Recursive renderer plus description-propagation proof. | PROVEN |
| RC-PROMPT-005 | Definitions and enum meanings derive from Zod descriptions. | Schema descriptions, renderer, provenance, propagation proof. | PROVEN |
| RC-PROMPT-006 | Fixed scaffold contains no independent ontology. | `prompt-fixed-sections.mts`; anti-duplication assertions. | PROVEN |
| RC-PROMPT-007 | Fixed global policies are rendered. | Local marker assertions over the generated prompt. | PROVEN |
| RC-PROMPT-008 | Each material checkpoint instruction has one authority. | Generated `checkpoint-coverage.json`; complete. | PROVEN |
| RC-PROMPT-009 | Repeated output is byte/hash stable. | Local repeated-generation SHA-256 assertion. | PROVEN |
| RC-PROMPT-010 | Missing descriptions and broken/cyclic refs fail closed. | Negative assertions and local resolver. | PROVEN |
| RC-PROMPT-011 | Offline/Atlas-authority boundary remains unchanged. | Isolated script-only diff inspection. | PROVEN |
| RC-PROMPT-012 | Affected validation and whitespace hygiene pass. | Commands above; evidence remains ignored. | PROVEN |

Internal readiness: READY_FOR_CK

## One next recommendation

CK should review this frozen offline prompt-builder checkpoint only; live Anoman route qualification remains a separately authorized ticket.
