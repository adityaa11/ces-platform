# SEMIR-002: Atlas Semantic IR v0 Zod schema

- **State:** `awaiting_review`
- **Review batch:** `SEMIR-BATCH-02`
- **Implementation context:** [SEMIR context §§18–33](../../SEMIR-context.md)
- **Start gate:** SEMIR-001 `PASS` and explicit `go`.

## Outcome

Design the smallest Zod-based Semantic IR that represents every frozen corpus case without case-specific schema branches, global canonicalization, or provider calls. The schema defines an untrusted proposal contract; it is not a project-truth, reconciliation, or production semantic contract.

## Required contract

Provide a `SourceSemanticResult` with exact source slot, disposition (`semantic`, `non_semantic`, `needs_review`), optional discourse role, and propositions. Each proposition must preserve source-grounded predicate, bounded argument roles (including constrained `other` plus required description), qualifiers, unresolved aspects, and evidence.

The contract must separately model modality (including nested possibility over obligation), polarity, condition, trigger, temporal relation, quantity/boundary, scope, and state. Evidence must be an authorized `sourceSlot` plus exact normalized-source substring. Unresolved aspects must include aspect, known meaning, missing information, clarification question, and evidence. Generate provider JSON Schema from the Zod source and retain semantic `.describe()` content for later proof.

Do not add global predicate/entity/relation canonicalization, reproduce PropBank/FrameNet, flatten nested modality, conflate condition and trigger, fabricate scope/roles/evidence, mutate corpus meaning, call a provider, change `NormalizedDocument v1`, or import the spike contract into production routes.

## Acceptance and review contract

| Row | Required behavior | PASS condition |
| --- | --- | --- |
| `RC-SEMIR-002-01` | Top-level disposition, discourse role, propositions, and source slot are structurally bounded. | Valid and invalid disposition/discourse/slot examples parse or fail as specified. |
| `RC-SEMIR-002-02` | Proposition dimensions remain independent. | Tests prove modality, polarity, condition, trigger, temporal, quantity, scope, state, unresolved aspects, arguments, and evidence can coexist without flattening. |
| `RC-SEMIR-002-03` | Required semantic invariants are structural where possible. | `other` requires role description; invalid modality recursion/evidence shape/boundary shape fails; no unsupported arbitrary role vocabulary is accepted. |
| `RC-SEMIR-002-04` | Every SEMIR-001 known-good case is representable. | Mapping evidence proves all frozen cases parse without a per-case schema feature or altered corpus expectation. |
| `RC-SEMIR-002-05` | Zod is the provider-schema source with durable descriptions. | Generated JSON Schema succeeds and evidence retains descriptions for dispositions, modalities, unresolved aspects, and evidence constraints. |
| `RC-SEMIR-002-06` | Contract remains isolated and non-authoritative. | Zero provider calls; no production import/route/persistence/old-parser change; affected tests and `git diff --check` pass. |

## Validation and handoff

Create a known-good fixture suite and schema-generation command usable by later tickets. Document any implementation-name deviation from the conceptual context shape and why it preserves every stated separation. Commit the Zod source, deterministic tests, generated ignored diagnostics where needed, and concise report—not credentials or provider output.

## Security readiness

**Status:** `applicable`.

| ID | Readiness item |
| --- | --- |
| `SR-002-IB-01` | The schema accepts untrusted proposal data only; parsing cannot confer semantic or canonical authority. |
| `SR-002-TB-01` | Preserve the future Atlas/provider boundary through explicit source-slot and evidence-reference fields. |
| `SR-002-ES-01` | Keep source contract, schema generation, structural validation, semantic oracle, and later provider runner independently attachable. |
| `SR-002-PC-01` | Do not couple the schema to project-global vocabularies, old semantic-v1 parser, reconciliation, persistence, or production routing. |
| `SR-002-VS-01` | Verify invalid shapes fail closed and all frozen known-good corpus cases parse. |
| `SR-002-UP-01` | Provider request limits, data handling, and canonicalization policy remain unresolved. |

### Mandatory review bindings

| Review ID | Verifies | Review question | Evidence |
| --- | --- | --- | --- |
| `SR-002-RB-01` | `SR-002-IB-01`, `SR-002-TB-01` | Does structural acceptance remain distinct from truth acceptance? | Schema/finalization boundary and negative tests. |
| `SR-002-RB-02` | `SR-002-ES-01`, `SR-002-PC-01` | Is the new contract isolated from existing production/semantic-v1 authority? | Import/dependency/route inspection. |
| `SR-002-RB-03` | `SR-002-VS-01` | Do parsing and generated-schema evidence cover all frozen cases and required descriptions? | Fixture suite and schema-generation output. |

## Handoff

Set `awaiting_review` only when the schema represents the frozen corpus cleanly. If a case requires a case-specific hack or schema begins encoding fixture answers, stop as `SCOPE_CHANGE` for planning authority.
