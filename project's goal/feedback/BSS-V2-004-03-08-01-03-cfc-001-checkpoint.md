# BSS-V2-004-03-08-01-03 CFC checkpoint — CK-001 evidence remediation

- **Ticket:** `BSS-V2-004-03-08-01-03`
- **Batch:** `BSS-V2-BATCH-04.03-08.01-03`
- **State:** `awaiting_review`
- **Reviewed implementation candidate:** `c8609301396da49dd00ce737230b1c0ccd550ff5` (`test(atlas): prove source-input negative boundaries`)
- **Reviewed GO commit:** `45bf0f137d0fb460cc7bb927bc7284b20046b410`
- **CK artifact / frozen oracle source:** `project's goal/feedback/BSS-V2-BATCH-04.03-08.01-03-45bf0f1-review.md`
- **HMN authorization consumed:** `HMN-BSS-V2-004-03-08-01-03-001`

## Bounded remediation

Only `packages/atlas-skills/tests/semantic-skills.test.ts` changed for the two frozen `CK-001` clauses. The existing source-input Zod contract and stage-authority map are unchanged. No validator, prompt compiler, packet builder, provider adapter, relationship service, production workflow, or Semantic V1 contract was added or altered.

## Review Contract Closure

| Clause | Status | Exact evidence / frozen-oracle result |
| --- | --- | --- |
| `CK-001.a` | `PROVEN` | Named test `v0.3.1 keeps attributable ambiguous title and legend hypotheses context-only and rejects unattributed proposals` parses an attributable `atlas.context-provenance/v1` legend hypothesis only as `proposed`, with a context-only slot and null authorization, and verifies that omitting required proposal attribution fails `atlasSemanticSourceInputV031Schema` validation. This is schema/specification evidence only; it does not claim runtime relationship authorization, semantic correctness, or human approval. |
| `CK-001.b` | `PROVEN` | Named test `v0.3.1 treats adversarial source content as evidence without mutating fixed stage authority` supplies explicit source text attempting policy override, authority reassignment, untrusted-relationship acceptance, and canonical-kind/output-rule redefinition through the existing offline source-packet boundary. It compares before/after fixed section IDs, owners, policy text, and rendered hashes, verifies the exact content remains source-slot evidence, and verifies the map hash. This is specification-level isolation only, not a live-model prompt-injection or future compiler-security claim. |

Resolved rows `RC-01`, `RC-02`, and `RC-03` were not reopened. Direct-regression boundaries were the source-input schema/authority map and focused skills tests. The legacy source-packet test continued to pass unchanged.

## Exact validation results

| Command | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/skills typecheck` | PASS |
| `corepack pnpm --filter @atlas/skills test` | PASS — 13 tests, including both named CK-001 negatives |
| `corepack pnpm --filter @atlas/contracts typecheck` | PASS |
| `corepack pnpm --filter @atlas/contracts test` | PASS — 14 tests |
| `corepack pnpm --filter @atlas/agents-bridge typecheck` | PASS |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-capabilities-boundary.test.ts` | PASS — 2 tests |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-worker.test.ts` | PASS — 5 tests |
| `git diff --check` | PASS — no whitespace errors |

## Preserved legacy identities

| Preserved contract | SHA-256 |
| --- | --- |
| `packages/atlas-contracts/src/semantic-v1.ts` | `b481d1f6b2b178fdb572e7a8a7e565814456489183fbcc7a9f2560da5c9bf825` |
| `packages/atlas-skills/src/semantic-prompt.ts` | `be9817c4aa9c09d7748847abd621bb14cb0c8d2425f79b56d90a84cd30fac902` |
| `packages/atlas-skills/src/semantic-source-packet.ts` | `0b0fbf9f65f108c477f72980fb06c46e66c1a3611be05d6cd57198c0bcd8305d` |

No external provider calls, image hydration, semantic/perception jobs, admission reservations, reconciliation, or publication occurred. Unrelated modified and untracked files remain unstaged and unchanged.

Internal readiness: `READY_FOR_CK`

**Handoff:** Stop for independent CK verification of `CK-001.a` and `CK-001.b`; this checkpoint does not declare CK PASS.
