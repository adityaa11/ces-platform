# BSS-V2-004-03-02 CFC checkpoint — remediation 2

- **Ticket:** BSS-V2-004-03-02 — Provider proposal Zod and PROMPT-003 production compiler
- **Frozen CK artifact:** `BSS-V2-BATCH-04.03-02-d78e05a-review.md`
- **Latest CK verification:** `BSS-V2-BATCH-04.03-02-f23b5ea-verification.md`
- **HMN authorization consumed:** `HMN-BSSV2-004-03-02-002`
- **State:** `awaiting_review`
- **Internal readiness:** `READY_FOR_CK`

## Frozen closure matrix progress

| Clause | Status | Closure evidence and oracle outcome |
| --- | --- | --- |
| `CK-001.a` | PROVEN | `packages/atlas-skills/tests/semantic-skills.test.ts`, test `production prompt has the frozen PROMPT-003 structure and static policy`, deterministically extracts heading boundaries from `scripts/sem-anm-prompt003/generated/system-prompt.txt`, asserts its actual ordered sequence, derives production order by removing only `GENERAL RULES`, and proves the preserved adjacent clarification/cross-field/classification placement in both sequences. The same test retains static-policy byte/placement, authority/leakage exclusions, and asserts the authorized current-schema/static-policy mapping for the historical `GENERAL RULES` behavior without adding a production `GENERAL RULES` section. `pnpm --filter @atlas/skills test` — PASS (6 tests). **Frozen oracle passed.** |
| `CK-001.b` | PROVEN | `packages/atlas-skills/tests/semantic-skills.test.ts`, test `ZOD-owned sections resolve their provenance against default and injected schemas`, resolves every recorded ZOD provenance path against the exact schema passed to `compileExtractionPrompt`, independently renders the expected section text (including independently key-sorted JSON and the `anyOf` kind representation), extracts actual prompt section text, and checks rendered SHA-256. It repeats the proof with distinguishable root, source-result, candidate, kind, questions, and classification descriptions. `pnpm --filter @atlas/skills test` — PASS (6 tests). **Frozen oracle passed.** |

## Protected resolved clauses

| Clause | Status | Regression retained |
| --- | --- | --- |
| `CK-002.a` | RESOLVED — regression retained | The existing distinguishable supplied-schema coherence test passed. |
| `CK-002.b` | RESOLVED — regression retained | The existing deterministic identity-binding test passed. |
| `CK-002.c` | RESOLVED — regression retained | The existing portable-schema-versus-canonical-Zod negative proof passed. |

## Prompt-stability evidence

The remediation changes only focused test/evidence and workflow records. `git diff --quiet f23b5ea2a67b8b97eb5cfb276cab575daace71fa -- packages/atlas-skills/src/semantic-prompt.ts` passed, so the production compiler source is byte-identical to the pre-remediation base. The canonical schema and static policy are likewise absent from this remediation diff. The compiled identities before/after are therefore identical:

```text
promptSha256         a79ac1174807a635f6a8820ea6cc8073457fba7534a61b55014cde76fa287458
providerSchemaSha256 20e53795dcf9edddf998dc7b621a1230a7abb33c6d370bfefd62e0e4a1ee62f3
crossFieldPolicySha256
                     2f2e13a0cce0d0ad578718bb52e69d69abfbd9bb0d6dfb593ab6b010d930cb10
```

## Required validation

```text
pnpm --filter @atlas/skills test                    PASS (6 tests)
pnpm --filter @atlas/skills typecheck               PASS
pnpm --filter @atlas/contracts test                 PASS (14 tests)
pnpm --filter @atlas/contracts typecheck            PASS
pnpm --filter @atlas/agents-bridge typecheck        PASS
pnpm --filter @atlas/agents-bridge test             PASS (53 tests; four pre-existing Compose-dependent integration tests skipped)
git diff --check                                    PASS
```

No provider call, prompt/compiler behavior change, canonical Semantic V1 change,
provider/runtime change, historical qualification-artifact change, or later-ticket
work was performed. CFC does not issue a PASS; this checkpoint stops for CK
verification of `CK-001.a`, `CK-001.b`, this bounded diff, and direct regressions.
