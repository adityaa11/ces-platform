# SEM-ANM-PROMPT-002-01: Frozen reference and provider-schema projection

- **State:** `awaiting_review`
- **Review batch:** `SEM-ANM-PROMPT-002-BATCH-01`
- **Parent context:** [SEM-ANM-PROMPT-002 implementation context](../../SEM-ANM-PROMPT-002-trimmed-v2-implementation-context.md)
- **Start gate:** The context and supplied reference are frozen in the repository, their stated reference SHA-256 matches, and explicit `go` authorizes this offline ticket.

## Outcome

Place and consume the exact supplied Atlas Semantic V1 Zod reference as the
sole semantic-description authority for PROMPT-002, then generate the
provider-facing JSON Schema through the public `z.toJSONSchema(...)` path.
This ticket establishes the schema-input and conversion seam for the prompt
compiler; it does not render or qualify a live prompt.

The supplied reference is already present at
`SEM-ANM-PROMPT-002-atlas-semantic-v1-zod-reference.ts` in this ticket folder.
Its expected SHA-256 is
`67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083`.
Treat it as immutable. Only mechanical import/path fixes are permitted.

## Frozen scope

- Add an isolated implementation area such as `scripts/sem-anm-prompt002/`.
- Import the exact frozen reference and produce provider JSON Schema with `z.toJSONSchema(...)`.
- Preserve the provider shape and every reference-owned description without maintaining a second semantic glossary.
- Keep extraction candidate vocabulary distinct from reconciliation relationship vocabulary.
- Add deterministic tests for reference integrity, successful schema conversion, required structures, and exact frozen candidate vocabulary.

Do not use Zod private internals (`_def` or private AST/classes), rewrite any
`.describe(...)` content, call a model/provider, add reconciliation rendering,
integrate with Atlas finalization or persistence, or change production
contracts. PROMPT-001 may inform implementation architecture, but its old
`semantic_units[]` field assumptions must not be carried into this schema.

## Acceptance and review contract

| ID | Required behavior | PASS condition |
| --- | --- | --- |
| `RC-PROMPT2-01-001` | Consume the exact frozen reference. | Repository copy hash equals the context's expected SHA-256; no semantic description edits appear in the diff. |
| `RC-PROMPT2-01-002` | Use the public conversion boundary. | Provider schema is produced from `z.toJSONSchema(...)`; no private Zod internals are read. |
| `RC-PROMPT2-01-003` | Preserve provider output structure. | Deterministic structural checks cover `source_results`, classification, candidate fields, non-fact reason, and questions. |
| `RC-PROMPT2-01-004` | Preserve extraction vocabulary and authority boundary. | All 16 extraction kinds and `candidate`/`non_fact` are represented; reconciliation relationships are identifiable separately and not projected as extraction definitions. |
| `RC-PROMPT2-01-005` | Keep the schema seam isolated. | No provider client/call, finalizer, production contract, queue, persistence, or reconciliation integration is added. |

## SecurityReadiness

**Status:** `applicable`.

| ID | Readiness item |
| --- | --- |
| `SR-PROMPT2-01-IB-01` | The frozen reference and existing Atlas authorities remain unchanged; generated schema is a derived proposal artifact only. |
| `SR-PROMPT2-01-ID-01` | Reference integrity and generated-schema identity remain reproducible through source hash and deterministic generation. |
| `SR-PROMPT2-01-ES-01` | Keep the Zod source and public JSON-Schema conversion boundary independently inspectable. |
| `SR-PROMPT2-01-PC-01` | Do not duplicate semantic descriptions, read private schema internals, or couple this artifact to provider/production behavior. |
| `SR-PROMPT2-01-VS-01` | Verify exact source hash, public conversion usage, and provider structure/vocabulary deterministically. |
| `SR-PROMPT2-01-UP-01` | Provider retention, live-route policy, and production privacy remain unresolved because this ticket is offline. |

| Review ID | Verifies | Review question | Expected evidence |
| --- | --- | --- | --- |
| `SR-PROMPT2-01-RB-01` | `SR-PROMPT2-01-IB-01`, `SR-PROMPT2-01-PC-01` | Is the supplied reference unchanged and the generated artifact non-authoritative? | Source hash, diff, import/dependency review. |
| `SR-PROMPT2-01-RB-02` | `SR-PROMPT2-01-ID-01`, `SR-PROMPT2-01-ES-01`, `SR-PROMPT2-01-VS-01` | Can schema output be reproduced from the exact public conversion boundary? | Conversion tests, generated schema, deterministic source/hash evidence. |

## Handoff

Record `PASS` or `CHANGES_REQUIRED`. On `PASS`, commit the bounded schema
implementation and evidence, set this ticket to `awaiting_review`, and stop
for CK. Ticket -02 may start only after CK `PASS` and its own explicit `go`.
