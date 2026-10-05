# SEM-ANM-PROMPT-001: Zod-driven semantic prompt builder

- **State:** `awaiting_review`
- **Review batch:** `SEM-ANM-PROMPT-BATCH-001`
- **Implementation context:** [SEM-ANM-PROMPT-001 implementation context](../../SEM-ANM-PROMPT-001-implementation-context.md)
- **Start gate:** the frozen manual prompt checkpoint from the implementation context is available, the affected local test baseline passes, and explicit `go` authorizes this bounded offline work.

## Outcome and frozen scope

Build one deterministic, provider-independent prompt-builder artifact that
compiles the frozen provider-facing semantic Zod contract through
`z.toJSONSchema(...)` into a generated system prompt. The generated prompt
must preserve the manual checkpoint's behavioral and semantic meaning without
maintaining a second independent semantic ontology in fixed prompt text.

```text
frozen behavioral scaffold + Zod semantic contract
  -> z.toJSONSchema(...)
  -> deterministic schema traversal and local ref resolution
  -> generated system prompt + provenance/coverage evidence
```

The ticket is local and offline. It does **not** call Anoman or another model,
read `ANOMAN_API_KEY` or `.env`, create provider clients, test response
transport, parse model output, run S1-S4, alter `NormalizedDocument v1`, alter
`atlas.semantic.extract/v1`, alter a semantic finalizer, or modify Atlas
persistence, reconciliation, publication, or production routing. It does not
reopen or amend `SEM-ANM-SPIKE001`.

## Required implementation boundary

Create isolated prompt-builder code under a path such as
`scripts/sem-anm-prompt001/`, including the provider-facing schema, JSON-Schema
conversion, fixed sections, deterministic renderer, provenance/coverage logic,
tests, and frozen fixture. Generated local evidence belongs only under
`.atlas-data/sem-anm-prompt001/` and must remain ignored.

The visible provider contract is frozen as snake_case:

```text
source_results[].slot
source_results[].semantic_units[].semantic_kind
subject, actor, action, object, target
modality
applicability_conditions, temporal_constraints,
quantitative_constraints, scope_constraints
resolution_status, clarification_question
```

It has the frozen enum values `workflow_step | rule | constraint`,
`required | prohibited | permitted | possible | unspecified`, and
`resolved | needs_resolution`. Do not redesign it as a discriminated union,
make null fields optional, shorten definitions, rename fields, optimize token
count, or otherwise change its semantic shape.

## Authority and rendering rules

Fixed human-maintained text owns only the behavioral scaffold:

- system role and task instruction;
- reference, multiple-unit, conflict, and general extraction policies;
- source-slot accounting; and
- the valid-JSON-only output rule.

The Zod contract owns output structure, field and enum meanings, nullability,
resolution semantics, clarification semantics, and the SemanticUnit object
cross-field rule. `OUTPUT SHAPE`, `FIELD DEFINITIONS`, and `SEMANTIC UNIT
RULES` must be rendered from the JSON Schema and descriptions. The fixed source
must not independently define `workflow_step`, `rule`, `constraint`, any
modality, or either resolution status.

Use `z.toJSONSchema(SemanticPromptSchema)` as the stable boundary. Do not read
Zod private internals such as `_def`, schema ASTs, or private node classes. The
traversal must deterministically support the actual emitted `properties`,
`required`, `type`, `enum`, `const`, `anyOf`, `oneOf`, `items`, `description`,
`$defs`, and `$ref` forms. Resolve local refs, detect cycles, and fail clearly
on broken, unsupported recursive, or cyclic semantic schemas; never silently
drop descriptions.

Render sections in this order:

```text
SYSTEM ROLE
TASK INSTRUCTION
OUTPUT SHAPE
FIELD DEFINITIONS
SEMANTIC UNIT RULES
REFERENCE HANDLING
MULTIPLE-UNIT HANDLING
CONFLICT HANDLING
GENERAL RULES
SOURCE ACCOUNTING
OUTPUT RULES
```

Whitespace may differ from the checkpoint. Semantic behavior may not. Do not
emit raw `$schema`, `$defs`, reference plumbing, or other JSON-Schema metadata
as prompt content unless genuinely needed to express the frozen contract.

## Local artifacts and fail-closed gates

Freeze the manual prompt verbatim in
`scripts/sem-anm-prompt001/fixtures/semantic-prompt-checkpoint-v1.txt` and
treat it as immutable in this ticket. Generate, at minimum:

```text
.atlas-data/sem-anm-prompt001/generated-provider-schema.json
.atlas-data/sem-anm-prompt001/generated-system-prompt.txt
.atlas-data/sem-anm-prompt001/generated-system-prompt.sha256
.atlas-data/sem-anm-prompt001/checkpoint-coverage.json
scripts/sem-anm-prompt001/prompt-provenance.md
```

The provenance and coverage artifacts must give every material checkpoint
instruction exactly one intended authority. They must explicitly cover the
role, zero/one/multiple-unit task behavior, output shape, all three
`semantic_kind` meanings, the `possible` versus permission distinction,
timing versus applicability, resolution and clarification behavior, reference
ambiguity, multiple-unit handling, conflict non-reconciliation, source-slot
accounting, and JSON-only output.

Before final rendering, fail locally and deterministically if a description is
missing for any material semantic field or the SemanticUnit object-level rule.
The same schema and fixed scaffold must yield byte-identical text and the same
SHA-256. No fuzzy or model-based prompt-comparison method is permitted.

## Acceptance and review contract

| Row | Required behavior | PASS condition |
| --- | --- | --- |
| `RC-PROMPT-001` | Freeze manual checkpoint V1 as an immutable fixture. | Fixture path and hash are recorded; review confirms no semantic rewrite. |
| `RC-PROMPT-002` | Define the provider-facing semantic contract in Zod with all required field and object descriptions. | Complete-description tests pass and the visible contract remains frozen. |
| `RC-PROMPT-003` | Cross the Zod-to-JSON-Schema boundary without private internals. | Code and tests show `z.toJSONSchema(...)` is the renderer input. |
| `RC-PROMPT-004` | Generate OUTPUT SHAPE from schema structure. | Generated prompt changes structurally with schema-controlled shape; no independent full-object template exists. |
| `RC-PROMPT-005` | Generate field, enum, and cross-field definitions from Zod descriptions. | Provenance and tests show descriptions are rendered; changing one `.describe(...)` changes the prompt without a fixed-text edit. |
| `RC-PROMPT-006` | Keep fixed text to behavioral scaffold and prevent ontology duplication. | Static/behavioral anti-duplication test passes. |
| `RC-PROMPT-007` | Preserve fixed global policies. | Snapshot covers reference, multiple-unit, conflict, general, source-accounting, and JSON-only policies. |
| `RC-PROMPT-008` | Map every material checkpoint instruction to one authority. | Deterministic coverage/provenance audit has no unmapped or multiply-owned material instruction. |
| `RC-PROMPT-009` | Produce deterministic output. | Repeated generation is byte-identical and SHA-256-stable. |
| `RC-PROMPT-010` | Fail closed on incomplete descriptions or invalid references. | Missing-description and broken-ref/cycle negative tests pass. |
| `RC-PROMPT-011` | Preserve the offline and Atlas-authority boundary. | Diff and test review prove no provider call, credential use, finalizer change, or Atlas-contract change. |
| `RC-PROMPT-012` | Maintain repository hygiene. | Affected tests and `git diff --check` pass; generated evidence remains ignored. |

Required tests include successful JSON-Schema generation; required-description
coverage; schema-derived shape/definitions; every critical semantic distinction
from the checkpoint; fixed-policy rendering; determinism and hashing; a
description-change propagation proof; missing-description failure; broken-ref
failure; coverage completion; anti-duplication; and scope/regression hygiene.

## Security readiness

**Status:** `applicable`

| ID | Readiness item |
| --- | --- |
| `SR-PROMPT-IB-01` | Preserve the frozen manual checkpoint, visible provider contract, and existing Atlas semantic authorities; this ticket creates only a spike-local prompt artifact. |
| `SR-PROMPT-TB-01` | Treat the generated prompt and JSON Schema as reviewable derived artifacts, not as authority to call a provider, accept semantic truth, or activate a route. |
| `SR-PROMPT-SA-01` | No credentials, environment configuration, headers, customer content, or provider responses enter the implementation, artifacts, logs, or report. |
| `SR-PROMPT-ID-01` | Preserve fixture, schema, prompt, and hash provenance so the exact derived prompt is independently reproducible. |
| `SR-PROMPT-ES-01` | Keep schema ownership, JSON-Schema conversion, traversal/ref resolution, fixed scaffold, rendering, provenance, and coverage verification as separate seams. |
| `SR-PROMPT-PC-01` | Do not duplicate ontology definitions in fixed text, bypass the JSON-Schema boundary, weaken fail-closed checks, redesign semantics, or couple this artifact to provider transport/finalization. |
| `SR-PROMPT-VS-01` | Verify description completeness, local ref/cycle handling, deterministic bytes/hashes, authority mapping, artifact isolation, and direct regressions. |
| `SR-PROMPT-UP-01` | Provider retention, tenancy, credential handling, live-route policy, production privacy, and economics are intentionally unresolved because this ticket performs no provider interaction. |

### Mandatory review bindings

| Review ID | Verifies | Review question | Expected evidence |
| --- | --- | --- | --- |
| `SR-PROMPT-RB-01` | `SR-PROMPT-IB-01`, `SR-PROMPT-TB-01` | Does the implementation preserve existing authority and remain an offline derived-artifact seam? | Contract diff, import review, and `RC-PROMPT-011` proof. |
| `SR-PROMPT-RB-02` | `SR-PROMPT-SA-01` | Is provider/secret-bearing material absent from code, evidence, logs, and review output? | Artifact inventory, search/diff inspection, and scope tests from `RC-PROMPT-011`/`-012`. |
| `SR-PROMPT-RB-03` | `SR-PROMPT-ID-01`, `SR-PROMPT-ES-01` | Can reviewers reproduce and attribute every generated artifact to its fixture, schema, and renderer? | Fixture/schema/prompt hashes, provenance map, coverage artifact, and `RC-PROMPT-001` through `-009`. |
| `SR-PROMPT-RB-04` | `SR-PROMPT-PC-01`, `SR-PROMPT-VS-01` | Do invalid semantic metadata and schema references fail closed without ontology duplication? | Negative tests, traversal tests, fixed-text anti-duplication test, and `RC-PROMPT-006`/`-010`. |

## Terminal classification and handoff

Record exactly one result:

- `PASS` when all checkpoint semantics are preserved through the defined
  ownership split, coverage is complete, output is deterministic, and all
  required tests pass.
- `PASS_WITH_LIMITS` only when implementation is correct and checkpoint
  semantics remain complete, but a bounded non-semantic limitation is recorded.
- `FAIL` when semantics are lost, descriptions are incomplete, fixed text owns
  ontology definitions, output shape is independently maintained, coverage is
  incomplete, or generation is non-deterministic.

Commit the sanitized review artifact at
`project's goal/feedback/SEM-ANM-PROMPT-001-zod-semantic-prompt-builder.md`.
It must report the terminal result and checkpoint; fixture, schema, and prompt
paths/hashes; fixed-versus-Zod ownership; coverage and completeness results;
determinism; tests; Review Contract closure; and exactly one next
recommendation.

After the terminal result and review artifact are complete, set the ticket to
`awaiting_review` and stop for CK. CK reviews only this frozen offline
contract and direct regressions. CFC may address only an authorized bounded CK
finding. HMN is required for a semantic/schema redesign, removal of checkpoint
behavior, provider/live testing, or scope expansion. A subsequent live Anoman
qualification must be separately authored and authorized.
