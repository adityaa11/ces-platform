# SEM-ANM-PROMPT-001 — Zod-Driven Semantic Prompt Builder Implementation Context

## 1. Purpose

`SEM-ANM-PROMPT-001` is a bounded implementation ticket whose only purpose is to build and verify the deterministic semantic prompt builder that will later be used by Atlas semantic extraction.

This ticket does **not** call Anoman.

This ticket does **not** perform live model inference.

This ticket does **not** validate provider semantic quality.

This ticket does **not** implement or modify the Atlas semantic finalizer.

This ticket does **not** modify `atlas.semantic.extract/v1`.

This ticket exists only to prove that Atlas can take one provider-facing Zod semantic contract and deterministically compile it into the desired system prompt shape that matches the current known-good manual semantic prompt checkpoint.

The required architecture is:

```text
provider-facing Zod semantic contract
        |
        v
z.toJSONSchema(...)
        |
        v
deterministic semantic prompt builder
        |
        +-- fixed extraction scaffold
        +-- fixed global extraction policies
        +-- Zod-derived output shape
        +-- Zod-derived field/variant definitions
        |
        v
generated system prompt
```

The generated system prompt must preserve the semantic meaning and behavioral guidance of the frozen manual prompt checkpoint without maintaining a second independent semantic ontology in the fixed prompt source.

---

## 2. Ticket Scope

This ticket is intentionally narrow.

### In scope

Implement and verify:

```text
provider-facing Zod semantic schema
z.toJSONSchema(...) conversion
JSON-Schema traversal needed by the prompt builder
$defs / $ref resolution if generated
deterministic prompt rendering
fixed prompt scaffold
fixed global extraction policies
dynamic output-shape rendering
dynamic field-definition rendering
semantic prompt checkpoint fixture
prompt provenance/ownership map
prompt snapshot/hash testing
description-completeness validation
```

### Explicitly out of scope

Do not:

```text
call Anoman
call Gemini
call OpenRouter
call Groq
call OpenAI
call Anthropic

read ANOMAN_API_KEY
require .env
perform live requests
implement provider client code
test json_object
test JSON fences
parse model responses
run S1-S4 through a model
run HB-01..HB-09
change NormalizedDocument v1
change atlas.semantic.extract/v1
change IDSER persistence
change reconciliation
change publication/review behavior
activate a production semantic route
```

This ticket must finish with a prompt-builder artifact and tests only.

---

# 3. Frozen Manual Prompt Checkpoint

The following manual prompt is the current known-good semantic prompt checkpoint.

Create a fixture containing this prompt exactly, without semantic rewriting, under a path such as:

```text
scripts/
  sem-anm-prompt001/
    fixtures/
      semantic-prompt-checkpoint-v1.txt
```

The checkpoint must remain immutable inside this ticket.

Its role is not to be sent to a provider.

Its role is to serve as the semantic and behavioral comparison target for the generated prompt.

The checkpoint represents the desired prompt behavior at this stage.

```text
You are a semantic extraction component.

Extract the meaning of each supplied source into semantic units.

A source may contain:
- zero semantic units;
- exactly one semantic unit; or
- multiple independent semantic units.

Do not merge independent requirements merely because they appear in the
same sentence or paragraph.

OUTPUT SHAPE

Return exactly one JSON object:

{
  "source_results": [
    {
      "slot": "input slot",
      "semantic_units": [
        {
          "semantic_kind": "workflow_step | rule | constraint",
          "subject": "string or null",
          "actor": "string or null",
          "action": "string or null",
          "object": "string or null",
          "target": "string or null",
          "modality": "required | prohibited | permitted | possible | unspecified",
          "applicability_conditions": ["zero or more strings"],
          "temporal_constraints": ["zero or more strings"],
          "quantitative_constraints": ["zero or more strings"],
          "scope_constraints": ["zero or more strings"],
          "resolution_status": "resolved | needs_resolution",
          "clarification_question": "string or null"
        }
      ]
    }
  ]
}

FIELD DEFINITIONS

semantic_kind

"workflow_step"
  A concrete action or event performed by an actor, system, user,
  component, or process.

"rule"
  Governing business or behavioral logic describing what is required,
  permitted, prohibited, eligible, or applicable.

  A rule is primarily about governing behavior, not about expressing
  a measurable boundary.

"constraint"
  A restriction, bound, invariant, quantity limit, deadline, duration,
  range, scope boundary, or other definite limitation.

  A statement does not become a constraint merely because it contains
  temporal information. Classify according to its primary semantic role.


subject

  The entity, concept, requirement, or behavior the semantic unit is
  primarily about.

  Use null when there is no useful explicit subject.


actor

  The entity explicitly performing the action.

  Use null when the source does not establish the actor.

  Do not infer an actor merely because one would normally exist.


action

  The explicitly stated business action, normalized to a concise verb
  or verb phrase.

  Use null when the unit is not primarily an action.


object

  The business object directly acted upon or produced by the action.

  Use null when none is explicitly established.


target

  The recipient or destination of the action.

  Use null when none is explicitly established.


modality

"required"
  The source definitely requires something.

"prohibited"
  The source definitely forbids something.

"permitted"
  The source explicitly allows something.

"possible"
  Something may or might apply, happen, or be necessary, but the source
  does not establish that it definitely applies.

  Possibility is uncertainty, not permission.

"unspecified"
  The source does not establish one of the modalities above.


applicability_conditions

  Conditions determining WHETHER or UNDER WHAT CIRCUMSTANCES the
  semantic unit applies.

  Preserve logical relationships such as AND, OR, ONLY IF, or nested
  conditions when they materially affect meaning.

  Do not invent missing applicability conditions.


temporal_constraints

  Explicit timing or ordering relationships such as:
  after another event;
  before another event;
  within a duration;
  while a state holds.

  Timing/order is not automatically an applicability condition.


quantitative_constraints

  Explicit numeric limits, minimums, maximums, ranges, counts,
  percentages, amounts, or other quantitative boundaries.

  Preserve exact values and units.


scope_constraints

  Explicit scope boundaries such as:
  per order;
  per customer;
  for verified accounts;
  within a particular object or context.

  Preserve the stated scope rather than broadening it.


resolution_status

"resolved"
  The source contains enough information to faithfully represent the
  requirement that it actually states.

  A source does NOT need resolution merely because it omits incidental
  implementation details.

  Missing information such as method, storage location, implementation
  mechanism, exact timing, downstream behavior, or an unstated actor is
  not automatically a reason for clarification.

"needs_resolution"
  Material ambiguity or missing information prevents safe representation
  of the stated requirement.

  Use this when, for example:
  - multiple plausible referents materially change who or what the
    requirement concerns;
  - the source states that something may apply but omits what determines
    whether it applies;
  - materially different interpretations remain possible.

  Do not guess merely to avoid needs_resolution.


clarification_question

  When resolution_status is "needs_resolution", ask exactly one concise
  question requesting only the missing material information.

  Do not assume the answer.

  When resolution_status is "resolved", use null.


REFERENCE HANDLING

- Resolve pronouns or references when the source establishes a clear
  referent.
- If multiple plausible referents materially change the semantics,
  do not choose one arbitrarily.
- Mark that semantic unit as needs_resolution and ask for clarification.


MULTIPLE-UNIT HANDLING

- One grammatical sentence may express multiple semantic units.
- One paragraph may express multiple semantic units.
- Split units when there are materially independent actions, rules,
  constraints, permissions, prohibitions, or obligations.
- Preserve shared conditions or timing on every semantic unit to which
  they apply.
- Do not collapse several actions into a vague combined action.


CONFLICT HANDLING

- Preserve every source proposition faithfully.
- Do not silently reconcile, weaken, merge, prioritize, or discard
  apparently conflicting requirements.
- Extraction is not conflict resolution.


GENERAL RULES

- Use only information supported by the supplied source.
- Do not invent facts.
- Preserve uncertainty.
- Preserve exact numeric limits.
- Preserve explicit scope.
- Preserve conditions and temporal relationships separately.
- Do not create clarification questions for merely incidental omissions.
- Return one source_result for every supplied slot.
- Preserve the supplied slot exactly.
- Do not create slots that were not supplied.
- Return valid JSON only.
```

---

# 4. Required Ownership Split

The generated prompt must be assembled from two categories of authority:

```text
A. fixed behavioral scaffold/policies
B. Zod-derived semantic/output contract
```

The ticket must preserve this boundary explicitly.

---

## 5. Fixed Prompt Sections

These sections must remain fixed, human-maintained policy text.

They are not semantic field definitions.

### 5.1 SYSTEM ROLE

```text
You are a semantic extraction component.
```

Suggested constant:

```ts
export const SYSTEM_ROLE = `
You are a semantic extraction component.
`.trim();
```

---

## 5.2 TASK INSTRUCTION

Freeze:

```text
Extract the meaning of each supplied source into semantic units.

A source may contain:
- zero semantic units;
- exactly one semantic unit; or
- multiple independent semantic units.

Do not merge independent requirements merely because they appear in the
same sentence or paragraph.
```

Suggested constant:

```ts
export const TASK_INSTRUCTION = `
Extract the meaning of each supplied source into semantic units.

A source may contain:
- zero semantic units;
- exactly one semantic unit; or
- multiple independent semantic units.

Do not merge independent requirements merely because they appear in the
same sentence or paragraph.
`.trim();
```

---

## 5.3 REFERENCE HANDLING

Reference-handling behavior is a global extraction policy.

Freeze the generic behavior:

```text
REFERENCE HANDLING

- Resolve pronouns or references when the source establishes a clear
  referent.
- If multiple plausible referents materially change the semantics,
  do not choose one arbitrarily.
```

Do **not** keep this schema-specific line in the fixed section:

```text
- Mark that semantic unit as needs_resolution and ask for clarification.
```

That exact representation must come from Zod-owned resolution semantics.

Suggested constant:

```ts
export const REFERENCE_HANDLING = `
REFERENCE HANDLING

- Resolve pronouns or references when the source establishes a clear
  referent.
- If multiple plausible referents materially change the semantics,
  do not choose one arbitrarily.
`.trim();
```

---

## 5.4 MULTIPLE-UNIT HANDLING

Freeze:

```text
MULTIPLE-UNIT HANDLING

- One grammatical sentence may express multiple semantic units.
- One paragraph may express multiple semantic units.
- Split units when there are materially independent actions, rules,
  constraints, permissions, prohibitions, or obligations.
- Preserve shared conditions or timing on every semantic unit to which
  they apply.
- Do not collapse several actions into a vague combined action.
```

This is a global extraction policy.

---

## 5.5 CONFLICT HANDLING

Freeze:

```text
CONFLICT HANDLING

- Preserve every source proposition faithfully.
- Do not silently reconcile, weaken, merge, prioritize, or discard
  apparently conflicting requirements.
- Extraction is not conflict resolution.
```

This boundary is important:

```text
semantic extraction != reconciliation
```

Do not move conflict resolution into the Zod field definitions.

---

## 5.6 GENERAL EXTRACTION RULES

Freeze:

```text
GENERAL RULES

- Use only information supported by the supplied source.
- Do not invent facts.
- Preserve uncertainty.
- Preserve exact numeric limits.
- Preserve explicit scope.
- Preserve conditions and temporal relationships separately.
- Do not create clarification questions for merely incidental omissions.
```

The detailed definitions of semantic fields remain Zod-owned.

---

## 5.7 SOURCE ACCOUNTING

Freeze source-slot behavior separately:

```text
SOURCE ACCOUNTING

- Return one source_result for every supplied slot.
- Preserve the supplied slot exactly.
- Do not create slots that were not supplied.
```

This is not a semantic ontology definition.

It is deterministic input/output accounting policy.

---

## 5.8 OUTPUT TRANSPORT RULE

Freeze:

```text
OUTPUT RULES

- Return valid JSON only.
```

No provider-specific JSON-fence behavior belongs in this ticket.

---

# 6. Zod-Owned Sections

The following prompt sections must be generated from the provider-facing Zod contract.

They must not be independently duplicated in the fixed prompt text.

```text
OUTPUT SHAPE
FIELD DEFINITIONS
semantic_kind meanings
subject
actor
action
object
target
modality meanings
applicability_conditions
temporal_constraints
quantitative_constraints
scope_constraints
resolution_status meanings
clarification_question
cross-field resolution behavior
```

---

# 7. Frozen Provider-Facing Semantic Schema

For this ticket, preserve the current manual prompt shape.

Do **not** redesign it into a discriminated union yet.

The purpose of `SEM-ANM-PROMPT-001` is prompt generation parity, not output-shape optimization.

Use a provider-facing Zod model equivalent to:

```ts
const SemanticUnit = z.object({
  semantic_kind: z.enum([
    "workflow_step",
    "rule",
    "constraint",
  ]),

  subject: z.string().nullable(),
  actor: z.string().nullable(),
  action: z.string().nullable(),
  object: z.string().nullable(),
  target: z.string().nullable(),

  modality: z.enum([
    "required",
    "prohibited",
    "permitted",
    "possible",
    "unspecified",
  ]),

  applicability_conditions: z.array(z.string()),
  temporal_constraints: z.array(z.string()),
  quantitative_constraints: z.array(z.string()),
  scope_constraints: z.array(z.string()),

  resolution_status: z.enum([
    "resolved",
    "needs_resolution",
  ]),

  clarification_question: z.string().nullable(),
});
```

Root shape:

```ts
const SemanticPromptSchema = z.object({
  source_results: z.array(
    z.object({
      slot: z.string(),
      semantic_units: z.array(SemanticUnit),
    })
  ),
});
```

If the existing project naming convention requires camelCase internally, that is acceptable only if the generated provider-facing prompt still emits the intended snake_case provider contract.

Do not change the visible provider contract merely for code-style preference.

---

# 8. Required Zod Descriptions

The Zod schema must carry the semantic definitions currently present in the manual prompt.

---

## 8.1 semantic_kind

The schema description must preserve:

```text
workflow_step
  A concrete action or event performed by an actor, system, user,
  component, or process.

rule
  Governing business or behavioral logic describing what is required,
  permitted, prohibited, eligible, or applicable.

  A rule is primarily about governing behavior, not about expressing
  a measurable boundary.

constraint
  A restriction, bound, invariant, quantity limit, deadline, duration,
  range, scope boundary, or other definite limitation.

  A statement does not become a constraint merely because it contains
  temporal information. Classify according to its primary semantic role.
```

---

## 8.2 subject

Preserve:

```text
The entity, concept, requirement, or behavior the semantic unit is
primarily about.

Use null when there is no useful explicit subject.
```

---

## 8.3 actor

Preserve:

```text
The entity explicitly performing the action.

Use null when the source does not establish the actor.

Do not infer an actor merely because one would normally exist.
```

---

## 8.4 action

Preserve:

```text
The explicitly stated business action, normalized to a concise verb
or verb phrase.

Use null when the unit is not primarily an action.
```

---

## 8.5 object

Preserve:

```text
The business object directly acted upon or produced by the action.

Use null when none is explicitly established.
```

---

## 8.6 target

Preserve:

```text
The recipient or destination of the action.

Use null when none is explicitly established.
```

---

## 8.7 modality

The description must preserve the distinction:

```text
required
  The source definitely requires something.

prohibited
  The source definitely forbids something.

permitted
  The source explicitly allows something.

possible
  Something may or might apply, happen, or be necessary, but the source
  does not establish that it definitely applies.

  Possibility is uncertainty, not permission.

unspecified
  The source does not establish one of the modalities above.
```

The phrase:

```text
Possibility is uncertainty, not permission.
```

is semantically important and must not be lost.

---

## 8.8 applicability_conditions

Preserve:

```text
Conditions determining WHETHER or UNDER WHAT CIRCUMSTANCES the
semantic unit applies.

Preserve logical relationships such as AND, OR, ONLY IF, or nested
conditions when they materially affect meaning.

Do not invent missing applicability conditions.
```

---

## 8.9 temporal_constraints

Preserve:

```text
Explicit timing or ordering relationships such as:
after another event;
before another event;
within a duration;
while a state holds.

Timing/order is not automatically an applicability condition.
```

The final sentence is critical.

---

## 8.10 quantitative_constraints

Preserve:

```text
Explicit numeric limits, minimums, maximums, ranges, counts,
percentages, amounts, or other quantitative boundaries.

Preserve exact values and units.
```

---

## 8.11 scope_constraints

Preserve:

```text
Explicit scope boundaries such as:
per order;
per customer;
for verified accounts;
within a particular object or context.

Preserve the stated scope rather than broadening it.
```

---

## 8.12 resolution_status

The schema description must preserve both states.

### resolved

```text
The source contains enough information to faithfully represent the
requirement that it actually states.

A source does NOT need resolution merely because it omits incidental
implementation details.

Missing information such as method, storage location, implementation
mechanism, exact timing, downstream behavior, or an unstated actor is
not automatically a reason for clarification.
```

### needs_resolution

```text
Material ambiguity or missing information prevents safe representation
of the stated requirement.

Use this when, for example:
- multiple plausible referents materially change who or what the
  requirement concerns;
- the source states that something may apply but omits what determines
  whether it applies;
- materially different interpretations remain possible.

Do not guess merely to avoid needs_resolution.
```

---

## 8.13 clarification_question

Preserve:

```text
When resolution_status is "needs_resolution", ask exactly one concise
question requesting only the missing material information.

Do not assume the answer.

When resolution_status is "resolved", use null.
```

---

# 9. Cross-Field Zod-Owned Semantics

Some behavior does not belong to a single field.

Attach an object-level `.describe(...)` to the semantic unit to preserve cross-field behavior such as:

```text
If material ambiguity or missing information prevents safe
representation, use resolution_status = "needs_resolution".

When resolution_status = "needs_resolution",
clarification_question must contain exactly one concise question asking
only for the missing material information.

When resolution_status = "resolved",
clarification_question must be null.

Do not create clarification questions for merely incidental omissions.
```

The prompt builder must render this object-level description in a visible place such as:

```text
SEMANTIC UNIT RULES
```

Do not hide object-level semantic descriptions.

---

# 10. JSON Schema Conversion Boundary

Use:

```ts
const jsonSchema = z.toJSONSchema(SemanticPromptSchema);
```

The prompt builder must consume the JSON Schema result.

Do not traverse undocumented Zod internals such as:

```text
_def
private schema AST
private node classes
```

The stable conceptual boundary is:

```text
Zod
    -> JSON Schema
    -> prompt builder
```

---

# 11. Required Prompt Builder Interface

A conceptual interface is:

```ts
export function buildSemanticSystemPrompt(
  jsonSchema: JsonSchema
): string
```

Or:

```ts
export function buildSemanticSystemPrompt(
  schema: typeof SemanticPromptSchema
): string
```

only if the first internal step is still:

```ts
z.toJSONSchema(schema)
```

The builder must not require provider/model information.

It must remain product/provider independent.

---

# 12. Required Generated Prompt Structure

The generated prompt should follow this section order:

```text
SYSTEM ROLE

TASK INSTRUCTION

OUTPUT SHAPE

FIELD DEFINITIONS

SEMANTIC UNIT RULES
(if object-level semantic descriptions exist)

REFERENCE HANDLING

MULTIPLE-UNIT HANDLING

CONFLICT HANDLING

GENERAL RULES

SOURCE ACCOUNTING

OUTPUT RULES
```

The exact whitespace may differ from the manual checkpoint.

The semantic content must not.

---

# 13. OUTPUT SHAPE Rendering

`OUTPUT SHAPE` must be generated from the Zod/JSON Schema structure.

Do not hard-code the full example object independently.

For the frozen schema, generated output should be materially equivalent to:

```json
{
  "source_results": [
    {
      "slot": "input slot",
      "semantic_units": [
        {
          "semantic_kind": "workflow_step | rule | constraint",
          "subject": "string or null",
          "actor": "string or null",
          "action": "string or null",
          "object": "string or null",
          "target": "string or null",
          "modality": "required | prohibited | permitted | possible | unspecified",
          "applicability_conditions": ["zero or more strings"],
          "temporal_constraints": ["zero or more strings"],
          "quantitative_constraints": ["zero or more strings"],
          "scope_constraints": ["zero or more strings"],
          "resolution_status": "resolved | needs_resolution",
          "clarification_question": "string or null"
        }
      ]
    }
  ]
}
```

The renderer may use a deterministic human-readable schema example rather than literal JSON Schema syntax.

Do not paste raw JSON Schema metadata such as:

```text
$schema URI
$defs internals
raw anyOf plumbing
internal reference names
```

into the generated system prompt unless required.

---

# 14. FIELD DEFINITIONS Rendering

Render field definitions from JSON Schema descriptions.

The builder should conceptually produce:

```text
FIELD DEFINITIONS

semantic_kind

<description derived from Zod>

subject

<description derived from Zod>

...
```

Enum values must be visible.

If enum descriptions are embedded into one field-level `.describe(...)`, preserve that text verbatim or semantically losslessly.

Do not maintain a second enum-description lookup table in the prompt builder.

---

# 15. Fixed Text Must Not Duplicate the Ontology

The fixed scaffold files must not independently define the provider semantic vocabulary.

Add a test or static assertion preventing semantic ontology drift.

The fixed text should not independently explain:

```text
workflow_step
rule
constraint
required
prohibited
permitted
possible
unspecified
resolved
needs_resolution
```

Those meanings belong to the Zod contract.

The fixed source may mention generic natural-language concepts such as:

```text
actions
rules
constraints
permissions
prohibitions
obligations
```

inside global extraction behavior.

It must not redefine their provider-contract meanings.

---

# 16. Prompt Provenance Map

Generate a review artifact that maps each important checkpoint instruction to its authority.

Suggested file:

```text
scripts/
  sem-anm-prompt001/
    prompt-provenance.md
```

At minimum map:

```text
"You are a semantic extraction component."
    -> FIXED / SYSTEM_ROLE

zero/one/multiple semantic units
    -> FIXED / TASK_INSTRUCTION

OUTPUT SHAPE
    -> ZOD_STRUCTURE

workflow_step meaning
    -> ZOD_DESCRIPTION / semantic_kind

rule meaning
    -> ZOD_DESCRIPTION / semantic_kind

constraint meaning
    -> ZOD_DESCRIPTION / semantic_kind

"Possibility is uncertainty, not permission."
    -> ZOD_DESCRIPTION / modality

"Timing/order is not automatically an applicability condition."
    -> ZOD_DESCRIPTION / temporal_constraints

resolution semantics
    -> ZOD_DESCRIPTION / resolution_status

clarification behavior
    -> ZOD_DESCRIPTION / clarification_question
       and/or SemanticUnit object-level description

reference ambiguity policy
    -> FIXED / REFERENCE_HANDLING
       + ZOD resolution representation

multiple-unit policy
    -> FIXED / MULTIPLE_UNIT_HANDLING

"Extraction is not conflict resolution."
    -> FIXED / CONFLICT_HANDLING

source-slot accounting
    -> FIXED / SOURCE_ACCOUNTING

"Return valid JSON only."
    -> FIXED / OUTPUT_RULES
```

This map is required CK evidence.

---

# 17. Checkpoint Coverage Audit

Implement a deterministic coverage audit for the frozen manual checkpoint.

The goal is not necessarily byte-for-byte equivalence.

The goal is:

> Every material instruction in `semantic-prompt-checkpoint-v1.txt` has exactly one intended authority in the generated architecture.

Use one of these approaches:

```text
explicit checklist
structured provenance manifest
test fixture mapping
review artifact
```

Do not use fuzzy LLM comparison.

This ticket must not depend on a model to decide whether the generated prompt preserved the checkpoint.

---

# 18. Determinism Requirement

The same schema and fixed scaffold must produce byte-identical generated prompt output.

Add:

```text
generated prompt snapshot
generated prompt SHA-256
```

Equivalent input must produce identical output.

Suggested generated artifact:

```text
.atlas-data/
  sem-anm-prompt001/
    generated-system-prompt.txt
    generated-system-prompt.sha256
    generated-provider-schema.json
```

No live/provider evidence is required.

---

# 19. Description Completeness Gate

Before generating the final prompt, fail closed if required semantic descriptions are missing.

At minimum verify descriptions exist for:

```text
semantic_kind
subject
actor
action
object
target
modality
applicability_conditions
temporal_constraints
quantitative_constraints
scope_constraints
resolution_status
clarification_question
SemanticUnit object-level behavior
```

A missing critical description must produce a local deterministic error.

Do not silently emit a weak prompt.

---

# 20. JSON Schema Traversal Requirements

The builder must handle the actual shape produced by the installed Zod version.

Support as required:

```text
properties
required
type
enum
const
anyOf
oneOf
items
description
$defs
$ref
```

If `$ref` exists:

```text
resolve locally
detect cycles
fail clearly on unsupported recursive/cyclic semantic schema
```

Do not silently omit referenced descriptions.

---

# 21. No Premature Optimization

Do not optimize the prompt for token count in this ticket.

Do not:

```text
shorten semantic descriptions
rename fields
remove examples from definitions
change snake_case fields
replace the universal object with discriminated union
remove resolution_status
remove clarification_question
remove global policies
compress headings
```

The purpose is semantic parity first.

Token optimization is a later ticket.

---

# 22. No Semantic Redesign

Do not use this ticket to decide whether:

```text
unresolved should become a separate kind
modality should disappear from workflow steps
constraint should become a nested limit object
clarification should be deterministic
null fields should become optional
```

Those may be future architecture decisions.

`SEM-ANM-PROMPT-001` freezes the current manual prompt contract and builds it dynamically.

---

# 23. Suggested File Layout

```text
scripts/
  sem-anm-prompt001/
    semantic-schema.mts
    json-schema.mts
    prompt-builder.mts
    prompt-fixed-sections.mts
    prompt-provenance.mts
    prompt-builder.test.mts
    run.mts
    README.md

    fixtures/
      semantic-prompt-checkpoint-v1.txt

    prompt-provenance.md
```

Generated ignored evidence:

```text
.atlas-data/
  sem-anm-prompt001/
    generated-provider-schema.json
    generated-system-prompt.txt
    generated-system-prompt.sha256
    checkpoint-coverage.json
```

---

# 24. Required Tests

At minimum prove:

```text
Zod schema generates JSON Schema
all required semantic descriptions exist
generated prompt contains SYSTEM_ROLE
generated prompt contains TASK_INSTRUCTION
generated OUTPUT SHAPE comes from schema
generated field definitions come from Zod descriptions
workflow_step meaning appears
rule meaning appears
constraint meaning appears
possible != permitted guidance appears
timing != applicability guidance appears
resolution semantics appear
clarification semantics appear
reference policy appears
multiple-unit policy appears
conflict policy appears
general rules appear
source accounting appears
valid-JSON output rule appears
same input -> byte-identical prompt
same input -> same SHA-256
missing required description fails closed
broken $ref fails closed
checkpoint coverage has no unmapped material instruction
fixed prompt source does not duplicate semantic enum definitions
```

Add a test proving that changing one Zod `.describe(...)` value changes the generated prompt without editing fixed prompt text.

This is important evidence that Zod is truly the semantic source.

---

# 25. Review Contract

Use clauses equivalent to:

| ID | Requirement | Evidence |
|---|---|---|
| `RC-PROMPT-001` | Manual prompt checkpoint V1 is frozen as an immutable fixture. | Fixture review/hash. |
| `RC-PROMPT-002` | Provider-facing semantic schema exists in Zod with complete descriptions. | Schema source + description completeness tests. |
| `RC-PROMPT-003` | Prompt builder consumes `z.toJSONSchema(...)`, not Zod private internals. | Code review + tests. |
| `RC-PROMPT-004` | OUTPUT SHAPE is generated from schema structure. | Generated prompt + implementation evidence. |
| `RC-PROMPT-005` | FIELD DEFINITIONS and enum meanings originate from Zod descriptions. | Provenance map + tests. |
| `RC-PROMPT-006` | Fixed text is limited to behavioral scaffold/policies and does not duplicate the semantic ontology. | Fixed-section code review + anti-duplication tests. |
| `RC-PROMPT-007` | Reference, multiple-unit, conflict, general, source-accounting, and output policies are preserved. | Generated prompt snapshot. |
| `RC-PROMPT-008` | Every material manual-checkpoint instruction is mapped to an explicit authority. | Checkpoint coverage/provenance artifact. |
| `RC-PROMPT-009` | Prompt generation is deterministic and hash-stable. | Snapshot + SHA-256 tests. |
| `RC-PROMPT-010` | Missing semantic descriptions or broken refs fail closed. | Negative tests. |
| `RC-PROMPT-011` | No provider call, credential use, semantic finalizer change, or Atlas contract change occurs. | Diff review. |
| `RC-PROMPT-012` | Repository hygiene passes. | affected tests + `git diff --check`. |

---

# 26. Terminal Classification

Use one:

```text
PASS
PASS_WITH_LIMITS
FAIL
```

No `ENVIRONMENT_BLOCKED` should normally be needed because this is an offline ticket.

### PASS

Use when:

```text
prompt builder implemented
+
generated prompt preserves the frozen checkpoint behavior
+
all semantic definitions originate from Zod
+
all global policies are preserved
+
checkpoint coverage is complete
+
generation is deterministic
+
tests pass
```

### PASS_WITH_LIMITS

Use only when the builder is functionally correct but a bounded implementation limitation remains that does not remove checkpoint semantics.

Do not use this to excuse missing definitions or unmapped checkpoint instructions.

### FAIL

Use when:

```text
checkpoint semantics are lost
schema descriptions are incomplete
fixed text duplicates semantic ontology
prompt generation is nondeterministic
output shape is still manually maintained independently
checkpoint coverage is incomplete
```

---

# 27. GO / CK / CFC / HMN Guidance

## GO

GO may:

```text
create the isolated prompt-builder implementation
create the Zod semantic schema
add spike-scoped Zod dependency if needed
create the frozen checkpoint fixture
build JSON Schema conversion
build prompt renderer
build provenance map
add tests
generate local prompt artifacts
commit the bounded checkpoint
hand off to CK
```

GO must not:

```text
call any external model
read ANOMAN_API_KEY
modify .env
implement Anoman client changes
run S1-S4 live
change Atlas semantic contracts
optimize the semantic schema
start SEM-ANM-SPIKE002 live qualification
```

## CK

CK should review only the frozen Review Contract and direct regressions.

CK should pay particular attention to:

```text
whether anything from the checkpoint disappeared
whether semantic definitions are truly Zod-owned
whether fixed text quietly duplicates ontology definitions
whether OUTPUT SHAPE is actually schema-generated
whether the generated prompt is deterministic
```

## CFC

CFC may remediate only bounded CK findings.

## HMN

HMN authorization is required for:

```text
schema redesign
prompt semantic changes
removing checkpoint behavior
provider/live testing
ticket scope expansion
```

---

# 28. Hard Stop

Stop when the ticket has produced:

```text
frozen manual checkpoint
+
provider-facing Zod schema
+
generated JSON Schema artifact
+
deterministic prompt builder
+
generated system prompt artifact
+
prompt hash
+
prompt provenance map
+
checkpoint coverage artifact
+
tests
+
terminal classification
+
review artifact
```

Do not continue into provider qualification.

The next ticket can consume the generated prompt and test it against Anoman.

---

# 29. Suggested Review Artifact

```text
project's goal/feedback/
SEM-ANM-PROMPT-001-zod-semantic-prompt-builder.md
```

Include:

```text
terminal result
commit/checkpoint
frozen prompt checkpoint path/hash
Zod schema path
generated JSON Schema path/hash
generated system prompt path/hash
fixed-vs-Zod ownership summary
checkpoint coverage result
description completeness result
determinism result
test result
Review Contract closure
one next recommendation
```

---

# 30. Final Intended Result

The completed ticket should establish this offline architecture:

```text
FROZEN BEHAVIORAL SCAFFOLD
        |
        +-- role
        +-- extraction task
        +-- reference policy
        +-- multiple-unit policy
        +-- conflict policy
        +-- general faithfulness rules
        +-- source accounting
        +-- JSON-only rule
        |
        |
        +-----------------------------+
                                      |
ZOD SEMANTIC CONTRACT                 |
        |                             |
        +-- structure                 |
        +-- field meanings            |
        +-- enum meanings             |
        +-- resolution semantics      |
        +-- cross-field invariants    |
        |                             |
        v                             |
z.toJSONSchema(...)                   |
        |                             |
        +-----------------------------+
                      |
                      v
        DETERMINISTIC PROMPT BUILDER
                      |
                      v
        GENERATED SYSTEM PROMPT
```

The core acceptance question is:

> Can Atlas reproduce the desired manual semantic prompt from one Zod-defined semantic contract plus a small fixed behavioral scaffold, without maintaining a second independent semantic ontology?

If yes, `SEM-ANM-PROMPT-001` is complete.

Live provider testing belongs to the next ticket.
