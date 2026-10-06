# BSS-V2-004-03-02 CFC checkpoint

- **Ticket:** BSS-V2-004-03-02 — Provider proposal Zod and PROMPT-003 production compiler
- **Frozen CK artifact:** `BSS-V2-BATCH-04.03-02-d78e05a-review.md`
- **HMN authorization consumed:** `HMN-BSSV2-004-03-02-001`
- **State:** `awaiting_review`
- **Internal readiness:** `READY_FOR_CK`

## Frozen closure matrix progress

| Clause | Status | Closure evidence and oracle outcome |
| --- | --- | --- |
| CK-001.a | PROVEN | `packages/atlas-skills/tests/semantic-skills.test.ts` compares the immutable qualified PROMPT-003 section inventory with the production order, asserts static-policy placement and byte identity, preserves authority/leakage exclusions, adds schema-derived `OUTPUT SHAPE`, maps the historical `GENERAL RULES` semantic behavior to current canonical schema rendering plus authorized static policy, and adds the authorized static multiple-candidate policy. `pnpm --filter @atlas/skills test` passed. |
| CK-001.b | PROVEN | Compiler provenance records each ZOD-owned section's supplied `proposalSchema` path and rendered SHA-256, alongside the approved `472fd2ca2c002db2b47bdf16dc085a4f43629f20` canonical authority identity. The focused provenance assertion passed. |
| CK-002.a | PROVEN | `compileExtractionPrompt` now returns the exact supplied proposal schema used for prompt rendering. The distinguishable injected-schema test proves both artifacts describe one input and passed. |
| CK-002.b | PROVEN | Provenance cryptographically binds canonical-authority, compiler, frozen-policy, generated-provider-schema, and prompt SHA-256 identities into `artifactSha256`; deterministic two-build and binding assertions passed. |
| CK-002.c | PROVEN | Negative tests cover candidate-without-candidates and non-fact-with-candidates/reason/questions: portable JSON Schema accepts their representable shape while canonical local Zod rejects the cross-field violations. Valid data passes both. |

## Required validation

```text
pnpm --filter @atlas/skills test                    PASS (6 tests)
pnpm --filter @atlas/skills typecheck               PASS
pnpm --filter @atlas/contracts test                 PASS (14 tests)
pnpm --filter @atlas/contracts typecheck            PASS
pnpm --filter @atlas/agents-bridge typecheck        PASS
pnpm --filter @atlas/agents-bridge test             PASS (four existing Compose-dependent integration tests skipped)
git diff --check                                    PASS
```

No provider call, provider branching, Semantic V1 change, historical artifact
rewrite, or later-ticket work was performed. This checkpoint is ready only for
the frozen CK verification; CFC does not issue a PASS.
