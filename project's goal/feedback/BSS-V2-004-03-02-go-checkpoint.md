# BSS-V2-004-03-02 GO checkpoint

- **Ticket:** BSS-V2-004-03-02 — Provider proposal Zod and PROMPT-003 production compiler
- **Batch:** BSS-V2-BATCH-04.03-02
- **State:** `awaiting_review`
- **Review target:** this bounded implementation commit
- **Predecessors:** BSS-V2-004-03-01 CK `PASS`; PROMPT-003 integrated offline qualification CK `PASS`

## Bounded implementation

`@atlas/skills` now exposes a provider-neutral Semantic V1 extraction profile,
provider-proposal Zod projection, portable derived JSON Schema, deterministic
prompt compiler, provenance, and the frozen PROMPT-003 cross-field policy.
Proposal semantic fields are picked from the approved canonical Semantic V1
Zod schemas; Atlas IDs, evidence, source inventory identity, persistence,
reconciliation, and accepted truth remain excluded.

The compiler accepts only an Atlas profile and proposal schema. It emits no
provider selection or transport behavior and has no spike-runtime dependency.
Schema-derived sections trace to the current 03-01 schema descriptions; the
static policy is independently retained at the historical PROMPT-003 policy
SHA-256. Production prompt/schema/provenance identities are intentionally new
and deterministic rather than historical PROMPT-003 byte identities.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence and outcome | Status |
| --- | --- | --- | --- |
| RC-BSSV2-0040302-01 | Proposal schema and descriptions derive only from approved 03-01 canonical Semantic V1 Zod. | `semantic-prompt.ts` uses canonical candidate/question/classification schemas; `semantic-skills.test.ts` parses proposal-only data, rejects Atlas bookkeeping, and records ZOD-vs-static provenance. | PROVEN |
| RC-BSSV2-0040302-02 | Provider-neutral compiler preserves qualified structural composition and is deterministic from identical inputs. | `semantic-skills.test.ts` invokes two builds, asserts prompt/schema equality and the qualified section ordering/ownership; static inspection rejects provider-specific compiler names and provider identity. | PROVEN |
| RC-BSSV2-0040302-03 | Provider compatibility schema is generated while local Zod remains authoritative. | `atlasProviderExtractionProposalV1JsonSchema` is generated through `toAtlasJsonSchema`; the test validates the same proposal through Zod and the Atlas JSON-schema validation seam. | PROVEN |
| RC-BSSV2-0040302-04 | Frozen policy is byte-identical; no spike implementation or qualification-only runtime dependency. | `semantic-skills.test.ts` asserts policy SHA-256 `2f2e13a0cce0d0ad578718bb52e69d69abfbd9bb0d6dfb593ab6b010d930cb10` and rejects spike-path, DocumentStore, and provider-specific compiler seams. | PROVEN |

Required validation passed:

```text
pnpm --filter @atlas/skills test
pnpm --filter @atlas/skills typecheck
pnpm --filter @atlas/contracts test
pnpm --filter @atlas/contracts typecheck
pnpm --filter @atlas/agents-bridge typecheck
pnpm --filter @atlas/agents-bridge test
docker compose build atlas
docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/skills test
docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/skills typecheck
docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/contracts test
git diff --check
```

The agents-bridge test suite passed its generic provider and Gemini regressions;
its four existing Compose-only perception/worker tests remain skipped because
the required external Compose database/worker setup is not active. They are
not modified by this offline schema/compiler ticket.

Internal readiness: READY_FOR_CK
