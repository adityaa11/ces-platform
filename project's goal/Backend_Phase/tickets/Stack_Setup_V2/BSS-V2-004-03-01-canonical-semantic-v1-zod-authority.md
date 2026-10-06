# BSS-V2-004-03-01: Canonical Atlas Semantic V1 Zod authority

- **State:** `planned`; **Review batch:** `BSS-V2-BATCH-04.03-01`
- **Dependencies:** BSS-V2-004-02 CK `PASS`; approved Semantic V1 behavior and existing BSS-V2-001/002/003 contracts; explicit `go`
- **Implementation context:** [Semantic V1 Zod + Anoman productionization context](../../atlas-semantic-v1-zod-anoman-productionization-implementation-context.md) §§3–5, 9.01, 11–13
- **Current seam:** `packages/atlas-contracts/src/semantic.ts` owns Semantic V1 parser entry points, bounds and hand-maintained JSON Schema shapes; `packages/atlas-contracts` currently does not use Zod for this authority.

## Outcome

Move production Semantic V1 semantic meaning and result validation authority to canonical Zod schemas with `.describe()` while preserving accepted V1 behavior and existing public parser APIs. Derive TypeScript types and plain JSON Schema compatibility exports from that authority.

## Scope and forbidden work

Own the production Zod dependency and canonical shared schemas for semantic kinds/payloads, evidence, semantic meaning/candidate components, source classification/inventory, questions, extraction result, and shared reconciliation vocabulary/result. Implement `toAtlasJsonSchema(...)`, generated compatibility exports, parser migration, and differential parity evidence.

Do not build prompts or source units; add an Anoman adapter; redesign `semantic-worker`; change Docling or `NormalizedDocument v1`; migrate semantic job/context/envelope transport; redesign reconciliation execution; or call any provider. Preserve semantic V1 version, all current limits and public parser behavior. Do not leave a second production-maintained JSON shape beside the canonical Zod definition. JSON Schema refinements that cannot be represented portably remain enforced by Atlas's local Zod/parser boundary.

## Review Contract

| Row | Exact bounded behavior | Proof and binary closure | Direct regression |
| --- | --- | --- | --- |
| RC-BSSV2-0040301-01 | Canonical Zod is the single production meaning/result authority; TS types and compatibility JSON Schema are derived. | Import/export and source-boundary checks plus generated-schema checks. **PASS iff** no duplicate hand-maintained Semantic V1 shape remains for the migrated authority. | contracts parser/schema tests |
| RC-BSSV2-0040301-02 | Preserve all 16 semantic kinds, all 10 reconciliation relationship types, source-accounting/evidence invariants, payload and byte/count bounds, strict unknown-field behavior, and parser APIs. | Differential fixtures compare old accepted behavior with the approved V1 oracle. **PASS iff** every frozen parity dimension matches. | extraction/reconciliation parser tests |
| RC-BSSV2-0040301-03 | Generated JSON Schema compiles through the existing Atlas validation seam and Gemini remains compatible. | Ajv/current schema-consumer checks and retained adapter regressions. **PASS iff** no downstream consumer requires a manually synchronized shape. | BSS-V2-003 Gemini; BSS-V2-001/002 boundaries |
| RC-BSSV2-0040301-04 | This change remains offline and semantic-schema-only. | Bounded diff/import inspection. **PASS iff** no prompt, provider, source-unit, worker execution, transport, perception or reconciliation-execution change is present. | n/a |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundary:** `BOUNDARY-BSSV2-0040301-ATLAS-SEMANTIC-AUTHORITY` — only Atlas canonical validation determines accepted semantic shape; provider schemas are advisory projections.
- **Trust boundary:** `TRUST-BSSV2-0040301-UNTRUSTED-STRUCTURED-OUTPUT` — all external structured values remain untrusted until canonical local parsing and deterministic invariants pass.
- **Sensitive asset:** `ASSET-BSSV2-0040301-SEMANTIC-V1-CONTRACT` — semantic meaning, evidence requirements and bounds are versioned Atlas contract material.
- **Extension seam:** `SEAM-BSSV2-0040301-PORTABLE-SCHEMA-PROJECTION` — provider-compatible JSON Schema is generated from Zod; nonportable refinements remain local validation.
- **Prohibited coupling:** `COUPLING-BSSV2-0040301-DUPLICATE-SCHEMA` — no parallel manually-maintained JSON schema or provider-owned semantic definition.
- **Verification seam:** `VERIFY-BSSV2-0040301-DIFFERENTIAL-PARITY` — compare current approved acceptance/rejection behavior and generated schema compilation.
- **Unresolved policy:** `SEC-GAP-BSSV2-0040301-PROVIDER-ENFORCEMENT` — how each future provider enforces schema hints remains route-specific qualification, not semantic authority.
- **Review binding:** `REV-READY-BSSV2-0040301-01` verifies schema ownership and parity using source inspection, differential fixtures and adapter regressions.

## Validation and handoff

Run affected `@atlas/contracts` schema/parser tests and typecheck in the repository's Docker Compose validation environment; run the direct BSS-V2-001/002/003 regressions named above. Record exact commands and counts. On proven closure, mark `awaiting_review` and stop for CK. No prompt generation or provider call is authorized. A mismatch in approved Semantic V1 behavior is a planning/scope finding, not a reason to weaken parity.
