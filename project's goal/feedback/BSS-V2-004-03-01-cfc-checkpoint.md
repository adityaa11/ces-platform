# BSS-V2-004-03-01 CFC checkpoint

- **Ticket:** BSS-V2-004-03-01 — Canonical Atlas Semantic V1 Zod authority
- **Batch:** BSS-V2-BATCH-04.03-01
- **Source CK review:** `BSS-V2-BATCH-04.03-01-2e5dd35-review.md`
- **Reviewed base:** `2e5dd350a1737414d9f1701c8b9ced10bec1c886`
- **State:** `awaiting_review`

## Frozen-clause remediation progress

| CK clause | Status | Closure evidence and frozen-oracle result |
| --- | --- | --- |
| CK-001.a | PROVEN | `packages/atlas-contracts/src/semantic.ts` imports `atlasSemanticContextCandidateV1JsonSchema` and uses that generated projection for both reconciliation candidate arrays; its generated definitions are carried into the enclosing schema for Ajv reference resolution. `packages/atlas-contracts/tests/semantic.test.ts` asserts both production candidate items deep-equal the canonical projection. **Oracle: passed.** |
| CK-001.b | PROVEN | Versioned data-only approved-V1 oracle: `packages/atlas-contracts/tests/fixtures/semantic-v1-approved-parity.ts`. `semantic.test.ts` differentially exercises all 16 kinds, all 10 reconciliation relationship types, strict unknown fields, source-accounting/evidence invariants, payload and candidate/UTF-8 byte bounds, and all public parser APIs against that explicit accepted/rejected oracle. **Oracle: passed.** |
| CK-001.c | PROVEN | Docker Compose validation below passed on the remediation worktree. Contract projection/Ajv checks are in `semantic.test.ts`; the Bridge suite includes Gemini adapter and BSS-V2-001/002 boundary regressions. **Oracle: passed.** |

## Required Docker Compose validation

```text
docker compose run --rm --build --no-deps atlas sh -lc "corepack pnpm --filter @atlas/contracts typecheck && corepack pnpm --filter @atlas/contracts test && corepack pnpm --filter @atlas/skills test"
```

Passed: `@atlas/contracts` typecheck; 14 contract tests (2 execution, 2 perception, 10 semantic); 1 `@atlas/skills` test.

```text
docker compose run --rm --build --no-deps agents-bridge sh -lc "corepack pnpm --filter @atlas/agents-bridge typecheck && corepack pnpm --filter @atlas/agents-bridge test"
```

Passed: `@atlas/agents-bridge` typecheck; 54 tests, with 4 pre-existing opt-in Compose/PostgreSQL integration tests skipped by their explicit existing gates and no failures. The pass set includes Gemini adapter coverage and retained BSS-V2-001/002 provider, route, perception, worker, and client boundaries.

```text
git diff --check
```

Passed before the bounded remediation commit.

## Internal readiness

All three frozen CK-001 closure oracles are proven with the required Compose harness and direct regressions. No prompt, provider call, source-unit, worker-execution, transport, or reconciliation-execution behavior changed.

**Internal readiness: READY_FOR_CK**
