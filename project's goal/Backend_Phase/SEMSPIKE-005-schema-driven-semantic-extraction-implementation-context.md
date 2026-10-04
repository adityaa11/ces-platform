# SEMSPIKE-005 - Schema-Driven Atlas Semantic Extraction Implementation Context

## 1. Purpose

`SEMSPIKE-005` is a bounded feasibility experiment that continues from the approved `BSS-V2-004-02` perception checkpoint and informs the design of the future `BSS-V2-004-03` semantic extraction live qualification.

The experiment answers one narrow question:

> Can an explicit reasoning model reliably produce Atlas-correct semantic proposals when the Atlas semantic vocabulary is encoded in a provider-facing Zod schema with semantic descriptions, rather than being taught primarily through a large prose prompt?

This is not a production semantic-route ticket.

This is not a redesign of `atlas.semantic.extract/v1`.

This is not a reconciliation experiment.

This is not a new provider-selection experiment.

The experiment exists to test whether schema-driven semantic extraction is a viable provider-facing contract shape for `BSS-V2-004-03`.

---

## 2. Current BSS-V2 Position

The current production-shaped path is already established through `BSS-V2-004-02`:

```text
PDF
    -> BSS-009-authorized exact source bytes
    -> Agents Bridge
    -> persistent Compose-private Docling Serve
    -> DoclingDocument
    -> deterministic Atlas mapper
    -> NormalizedDocument v1
    -> authenticated Atlas result handoff
    -> one accepted logical D1 perception result
    -> STOP before semantic work
```

`BSS-V2-004-01` qualified the persistent local Docling perception executor.

`BSS-V2-004-02` qualified the IDSER D1 lifecycle through the persistent Docling route and ended at an Atlas-accepted `NormalizedDocument v1`.

The next planned BSS-V2 semantic boundary is:

```text
accepted NormalizedDocument v1
    -> deterministic bounded source-slot preparation
    -> product-independent semantic extraction instruction
    -> small provider-facing semantic proposal schema
    -> deterministic finalization
    -> complete atlas.semantic.extract/v1 validation
    -> frozen semantic oracle
```

`SEMSPIKE-005` tests the previously unresolved implementation choice inside:

```text
small provider-facing semantic proposal schema
```

The intended experiment is therefore directly connected to the future `BSS-V2-004-03` architecture.


### 2.1 Explicit predecessor-ticket bypass authority

`SEMSPIKE-005` is an intentionally isolated feasibility experiment and is **not predecessor-state-gated by `SEMSPIKE-004` or any other semantic spike ticket**.

For this ticket only, GO / CK / CFC / HMN are explicitly authorized to proceed without requiring:

```text
SEMSPIKE-004 existence
SEMSPIKE-004 completion
SEMSPIKE-004 approval
SEMSPIKE-004 CK PASS
SEMSPIKE-004 review artifacts
SEMSPIKE-004 dependency closure
```

Previous semantic spikes may be used only as comparison evidence where available.

They are not execution prerequisites.

Do not block, stop, or return `NOT_READY`, `PREDECESSOR_MISSING`, `DEPENDENCY_BLOCKED`, or equivalent merely because a predecessor semantic-spike ticket is absent, incomplete, unapproved, or not inspected.

The authoritative start gate for `SEMSPIKE-005` is instead:

```text
BSS-V2-004-02 is already the accepted perception checkpoint
+
the existing NormalizedDocument v1 parser is available
+
the existing atlas.semantic.extract/v1 parser is available
+
the Groq live route can be invoked for the experiment
```

This bypass is deliberately narrow.

It does **not** waive:

```text
the frozen S1-S4 semantic oracle
real parser validation
schema-driven experimental isolation
security/redaction requirements
two equivalent live runs
Zod validation
deterministic finalization
Review Contract closure
```

It also does not authorize `SEMSPIKE-005` to mutate, supersede, or retroactively close any predecessor ticket.

---

## 3. Why This Experiment Exists

Previous semantic spikes established that the model can often understand the source proposition itself but remains unstable when mapping that proposition into Atlas semantic kinds.

Observed examples include:

```text
constraint     <-> rule
workflow_step  <-> actor / relationship
unresolved     <-> condition / rule
```

The existing spike-facing contract largely exposes generic fields such as:

```text
kind
semantic_key
normalized_meaning
needs_resolution
```

and asks the model to select among abstract Atlas kinds.

The previous experiments primarily strengthened the prose instruction while leaving the provider-facing ontology structurally generic.

`SEMSPIKE-005` tests a different hypothesis:

> Atlas should not require the model to learn the meaning of its ontology primarily from a prompt. The provider-facing schema itself should define the semantic concepts the model is allowed to produce.

This follows a schema-driven extraction pattern:

```text
schema first
    -> semantic descriptions define intended meaning
    -> model returns only schema-conforming data
    -> the same schema validates the response
    -> deterministic application code maps the proposal into the authoritative domain contract
```

---

## 4. Frozen Architectural Boundaries

The following existing Atlas authorities remain unchanged.

### 4.1 Perception authority

`NormalizedDocument v1` remains the perception/semantics compatibility boundary.

Do not change:

```text
NormalizedDocument v1
parseNormalizedDocument(...)
Docling mapping behavior
BSS-009 source authority
BSS-V2-004-01
BSS-V2-004-02
```

### 4.2 Semantic authority

The authoritative Atlas semantic contract remains:

```text
atlas.semantic.extract/v1
```

implemented through the existing semantic contract and parser.

Do not rewrite or weaken:

```text
packages/atlas-contracts/src/semantic.ts
parseSemanticExtractionResult(...)
candidate kind vocabulary
source statement inventory semantics
evidence reference semantics
semantic result envelope semantics
```

The experiment must adapt provider output to the existing Atlas contract.

The existing Atlas contract must not be adapted merely to make the provider pass.

### 4.3 Provider authority

The external model is an untrusted proposal generator.

It does not own:

```text
accepted truth
canonical truth
publication state
workspace state
Master state
Atlas IDs
source identity
evidence locator identity
source inventory bookkeeping
reconciliation
winner selection
supersession
conflict resolution
```

---

## 5. Primary Experimental Variable

The primary changed variable is the provider-facing semantic schema.

Previous spikes used a generic structured proposal schema plus increasingly detailed semantic prompts.

`SEMSPIKE-005` instead uses:

```text
Zod semantic proposal schema
    -> .describe(...) / semantic metadata
    -> z.toJSONSchema(...)
    -> strict provider structured output
    -> same Zod schema parses provider output
```

The system instruction should become intentionally small.

The experiment must not silently reintroduce the previous large semantic prompt and then attribute success to the schema.

---

## 6. Provider and Execution Profile

Keep the provider/model configuration frozen unless execution is impossible for environmental reasons.

Use:

```text
Provider: Groq
Model: openai/gpt-oss-120b
reasoning_effort: medium
streaming: false
structured output: strict JSON Schema
live authenticated inference: required
runs: 2 equivalent live runs
```

This preserves comparability with `SEMSPIKE-001`, `SEMSPIKE-002`, and `SEMSPIKE-003`.

Do not switch models inside this experiment merely to obtain a PASS.

A later model comparison may be planned separately if this exact route fails.

---

## 7. Zod Dependency Boundary

Atlas does not currently use Zod as the authoritative semantic-contract implementation.

For this experiment:

- add Zod only where required for the isolated spike;
- prefer an isolated/root development dependency or spike-scoped dependency approach;
- do not add Zod to `@atlas/contracts` production semantics merely for this experiment;
- do not rewrite AJV-based Atlas semantic validation;
- do not add Zod as a hidden production dependency of Agents Bridge.

The experiment must prove the approach before production adoption is considered.

---

## 8. Proposed Experiment Layout

A suggested isolated structure is:

```text
scripts/
  groq-semantic-spike-005/
    fixture.mts
    schema.mts
    groq-client.mts
    finalize.mts
    semantic-oracle.mts
    test.mts
    run.mts
    README.md
```

Ignored live evidence may use:

```text
.atlas-data/groq-semantic-spike-005/
```

Suggested evidence:

```text
fixture.normalized.json
provider-schema.json
run-1.json
run-2.json
summary.json
```

Do not persist:

```text
API keys
Authorization headers
raw secrets
unbounded source data
```

---

## 9. Frozen Source Fixture

Reuse the same S1-S4 semantic oracle used by the previous semantic spikes.

### S1

Source:

```text
The customer submits an order.
```

Required semantic result:

```text
workflow_step
```

Required preserved meaning:

```text
actor: customer
action: submit
object: order
```

No resolution is required.

### S2

Source:

```text
Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.
```

Required semantic result:

```text
constraint
```

Required preserved meaning includes:

```text
subject: customer
limit: maximum 2
object/unit: product
scope: per order
```

The exact numeric value `2` must be preserved.

The per-order scope must be preserved.

A generic `rule` classification is not sufficient.

### S3

Source:

```text
3.2 Purchase Rules
```

Required semantic result:

```text
non_fact
```

It is structural/document context and must not become a business-semantic candidate merely because the heading contains business terminology.

### S4

Source:

```text
Approval may be required before processing.
```

Required semantic result:

```text
unresolved
```

The output must preserve:

```text
known meaning:
approval may be required before processing

missing information:
the condition under which approval is required

clarification question:
non-empty and limited to the missing information
```

The model must not convert the statement into a resolved `rule` or a fully known `condition`.

---

## 10. Fixture Input Boundary

The fixture must still pass through the real existing perception parser.

The test should establish:

```text
fixture
    -> parseNormalizedDocument(...)
    -> four authorized normalized source units
```

Do not bypass `NormalizedDocument v1` with arbitrary raw strings only.

The experiment must remain connected to the exact compatibility boundary produced by `BSS-V2-004-02`.

A small deterministic source-slot preparation layer may map the four normalized source units into provider-facing slots such as:

```text
S1
S2
S3
S4
```

Atlas retains ownership of slot/source correspondence.

---

## 11. Provider-Facing Schema Philosophy

Do not expose the existing generic Atlas result structure directly merely because it already exists.

The provider-facing schema may be specialized for model comprehension.

The internal Atlas representation and the model-facing extraction representation are allowed to differ.

The provider-facing schema should express semantic intent explicitly.

Prefer:

```text
meaningful property name
+
explicit type
+
semantic .describe(...)
```

Do not rely on field names alone.

Do not deliberately use meaningless property names when meaningful names improve model guidance and maintainability.

---

## 12. Minimum Semantic Kinds

Do not begin by encoding all Atlas semantic kinds unless required.

The minimum experiment needs only enough nearby alternatives to make the S1-S4 distinctions meaningful.

Recommended minimum set:

```text
workflow_step
constraint
rule
condition
unresolved
non_fact
```

This avoids turning a tiny feasibility spike into a complete ontology-production ticket.

If the implementation requires another kind only to faithfully represent one of the frozen fixture statements, document the reason before adding it.

---

## 13. Recommended Zod Shape

The exact implementation may vary, but the schema should follow the intent below.

### 13.1 Workflow step

Conceptual shape:

```ts
const WorkflowStepProposal = z.object({
  kind: z.literal("workflow_step"),

  actor: z.string().nullable().describe(
    "The actor explicitly performing the business action, or null when the source does not identify one."
  ),

  action: z.string().describe(
    "The business action explicitly stated by the source."
  ),

  object: z.string().nullable().describe(
    "The business object directly affected by the action, or null when none is explicitly stated."
  ),

  condition: z.string().nullable().describe(
    "An explicitly stated condition controlling when the action occurs, otherwise null."
  )
}).describe(
  "A workflow step represents something that happens as part of a business process. Do not use it for static rules, limits, headings, or unresolved possibilities."
);
```

### 13.2 Constraint

Conceptual shape:

```ts
const ConstraintProposal = z.object({
  kind: z.literal("constraint"),

  subject: z.string().describe(
    "The actor, object, or behavior whose permitted behavior is explicitly limited."
  ),

  restriction: z.string().describe(
    "The explicit boundary or limitation stated by the source."
  ),

  quantity: z.number().nullable().describe(
    "The exact numeric boundary when explicitly stated, otherwise null."
  ),

  unit: z.string().nullable().describe(
    "The unit associated with the quantity when explicitly stated, otherwise null."
  ),

  scope: z.string().nullable().describe(
    "The scope in which the limitation applies, for example per order, otherwise null."
  )
}).describe(
  "A constraint expresses an explicit maximum, minimum, threshold, quantity limit, prohibition, or bounded range. Prefer constraint over generic rule when the source states such a boundary."
);
```

### 13.3 Rule

Conceptual shape:

```ts
const RuleProposal = z.object({
  kind: z.literal("rule"),

  subject: z.string().nullable().describe(
    "The actor, object, or process governed by the rule when explicitly stated."
  ),

  rule: z.string().describe(
    "The normative business behavior explicitly required, allowed, or prohibited by the source."
  )
}).describe(
  "A rule is a normative business statement. Do not use generic rule when a more precise semantic kind such as constraint is explicitly supported."
);
```

### 13.4 Condition

Conceptual shape:

```ts
const ConditionProposal = z.object({
  kind: z.literal("condition"),

  condition: z.string().describe(
    "The explicitly stated circumstance under which another business statement applies."
  )
}).describe(
  "Use only when the source explicitly states the relevant condition. Do not invent a missing condition and do not use condition for unresolved uncertainty."
);
```

### 13.5 Unresolved

Conceptual shape:

```ts
const UnresolvedProposal = z.object({
  kind: z.literal("unresolved"),

  knownMeaning: z.string().describe(
    "The business meaning that the source explicitly establishes."
  ),

  missingInformation: z.string().describe(
    "The essential semantic information that the source does not establish."
  ),

  clarificationQuestion: z.string().describe(
    "A clarification question asking only for the missing information."
  )
}).describe(
  "Use when the source establishes business-relevant meaning but leaves an essential condition, trigger, actor, threshold, decision, or outcome undetermined. Never invent the missing information or convert possibility into a resolved rule."
);
```

### 13.6 Non-fact

Conceptual shape:

```ts
const NonFactProposal = z.object({
  kind: z.literal("non_fact"),

  reason: z.string().describe(
    "Why this source unit is document structure or non-semantic context rather than an asserted business meaning."
  )
}).describe(
  "Use for headings, titles, numbering, labels, navigation, formatting, or other document structure that does not itself assert business meaning."
);
```

---

## 14. Root Provider Proposal

A reasonable experiment-level root may be:

```ts
const SourceSemanticProposal = z.discriminatedUnion("kind", [
  WorkflowStepProposal,
  ConstraintProposal,
  RuleProposal,
  ConditionProposal,
  UnresolvedProposal,
  NonFactProposal,
]);

const AtlasSemanticSpikeSchema = z.object({
  sourceResults: z.array(
    z.object({
      sourceSlot: z.enum(["S1", "S2", "S3", "S4"]),
      extraction: SourceSemanticProposal,
    })
  ).length(4)
}).describe(
  "Schema-driven semantic extraction results for exactly the four authorized Atlas source slots."
);
```

The implementation must additionally enforce deterministic exactly-once accounting:

```text
S1 exactly once
S2 exactly once
S3 exactly once
S4 exactly once
no unknown slot
no duplicate slot
no omitted slot
```

Do not trust array length alone.

---

## 15. Strict-Structured-Output Compatibility

The provider schema must be compatible with the selected provider's strict structured-output subset.

Prefer required nullable fields over optional fields where strict schema support requires all properties to be present.

For example:

```ts
actor: z.string().nullable()
```

is preferred over:

```ts
actor: z.string().optional()
```

when provider strict-mode compatibility requires the property to always exist.

Null means:

```text
the source does not explicitly provide a supported value
```

It must not mean:

```text
Atlas failed to parse the field
```

---

## 16. Zod to Provider Schema

Use the original Zod schema as the source contract.

Convert it using the supported Zod JSON Schema conversion:

```ts
const providerSchema = z.toJSONSchema(AtlasSemanticSpikeSchema);
```

The resulting schema must preserve semantic descriptions.

Persist a redacted/generated `provider-schema.json` in ignored experiment evidence so CK can inspect whether the semantic descriptions actually reached the provider-facing JSON Schema.

The experiment must not merely define `.describe(...)` in TypeScript while accidentally sending a description-free schema.

---

## 17. Minimum System Instruction

The system prompt should be deliberately small.

Recommended intent:

```text
Perform bounded semantic extraction for Atlas.

Interpret only the supplied authorized source text.

Use the supplied output schema and its descriptions as the authoritative definitions of Atlas semantic concepts.

Do not infer information not explicitly supported by the source.

Return only the required structured output.
```

Minor provider-formatting wording may be added if required.

Do not reintroduce the full SEMSPIKE-002 or SEMSPIKE-003 ontology prompt.

If the prompt again contains the full ontology definitions, the experiment no longer cleanly tests schema-driven semantics.

---

## 18. Provider Call Shape

Conceptual call:

```ts
const response = await fetch(
  "https://api.groq.com/openai/v1/chat/completions",
  {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      stream: false,
      reasoning_effort: "medium",

      messages: [
        {
          role: "system",
          content: instructions,
        },
        {
          role: "user",
          content: JSON.stringify(providerInput()),
        },
      ],

      response_format: {
        type: "json_schema",
        json_schema: {
          name: "atlas_schema_driven_semantics",
          strict: true,
          schema: providerSchema,
        },
      },
    }),
  }
);
```

After JSON decoding:

```ts
const proposal = AtlasSemanticSpikeSchema.parse(parsedProviderResponse);
```

The exact same Zod schema that generated the provider contract must validate the response.

---

## 19. Deterministic Finalization

The model should not generate Atlas-owned bookkeeping when Atlas can derive it deterministically.

Atlas must continue to own:

```text
local_candidate_id
semantic_key
source_wording
source statement inventory
page number
locator type
locator ID
evidence references
question evidence references
source accounting
```

The experiment may derive `normalized_meaning` deterministically from the validated semantic proposal, or may use a narrowly described model field if the implementation requires one.

However, the model must not create arbitrary system identity.

The deterministic finalizer must map the validated schema-driven proposal into the existing authoritative shape expected by:

```ts
parseSemanticExtractionResult(...)
```

The final Atlas output must remain:

```text
version: v1
candidate_assertions
source_statement_inventory
questions
```

and must pass the existing parser unchanged.

---

## 20. Semantic Key Rule

Do not make provider success depend on inventing Atlas-internal `semantic_key` syntax.

For this experiment, `semantic_key` should be generated deterministically by Atlas from the trusted slot identity and/or validated proposal structure.

The purpose of the experiment is semantic extraction, not LLM identifier naming.

Example experiment-only deterministic key:

```text
spike.s1.workflow_step
spike.s2.constraint
spike.s4.unresolved
```

The exact production key policy remains outside this experiment unless already frozen elsewhere.

---

## 21. No Semantic Repair

The experiment must not include deterministic logic that repairs incorrect model semantics.

Forbidden examples:

```text
if source contains "maximum" then force kind = constraint

if source contains "may" then force kind = unresolved

if model returns rule for S4 then rewrite to unresolved

if heading matches a regex then overwrite model output with non_fact
```

Deterministic code may:

```text
validate
account for slots
attach trusted evidence
construct system IDs
map validated fields into Atlas v1
reject invalid output
```

It may not transform a semantically incorrect model choice into the expected oracle result.

Otherwise the experiment would test hybrid heuristic correction instead of schema-driven LLM semantics.

---

## 22. Live Run Requirements

Perform two equivalent authenticated live runs.

For each run record, without secrets:

```text
provider
model
reasoning effort
HTTP status
structured-output mode
input token count
output token count
latency
Zod parse result
source accounting result
Atlas final parser result
semantic oracle result
```

Retain the actual validated proposal and finalized Atlas result in ignored local evidence.

Material differences between equivalent runs must not be hidden.

---

## 23. Frozen Semantic Oracle

Both runs must satisfy all rows.

| Slot | Required classification | Required preserved meaning |
| --- | --- | --- |
| S1 | `workflow_step` | customer performs submit action on order |
| S2 | `constraint` | customer, maximum `2`, product, per-order scope |
| S3 | `non_fact` | structural heading only |
| S4 | `unresolved` | possible approval preserved; missing approval condition identified; non-empty clarification question |

A result such as:

```text
S2 -> rule
```

fails.

A result such as:

```text
S4 -> rule
```

fails.

A result such as:

```text
S4 -> condition with invented condition
```

fails.

A schema-valid response is not sufficient.

---

## 24. Pass Criteria

`SEMSPIKE-005` may return `PASS` only if both equivalent live runs satisfy all of the following:

```text
real NormalizedDocument fixture parser: PASS
provider structured response: PASS
Zod parse: PASS
exactly-once source accounting: PASS
S1 semantic oracle: PASS
S2 semantic oracle: PASS
S3 semantic oracle: PASS
S4 semantic oracle: PASS
deterministic finalization: PASS
parseSemanticExtractionResult(...): PASS
cross-run semantic consistency: PASS
credential/redaction inspection: PASS
directly affected tests: PASS
git diff --check: PASS
```

No semantic repair may be used.

---

## 25. Terminal Classification

Allowed terminal classifications:

```text
PASS
FAIL
ENVIRONMENT_BLOCKED
```

`PASS_WITH_LIMITS` should be avoided for the core semantic oracle.

If one of S1-S4 fails semantically, the experiment is `FAIL`.

Environmental problems such as unavailable credentials or provider outage may produce `ENVIRONMENT_BLOCKED` only when no valid semantic conclusion can be made.

HTTP 200 plus semantic-oracle failure is `FAIL`, not `ENVIRONMENT_BLOCKED`.

---

## 26. Required Local Tests

Before live calls, add tests covering at minimum:

### Schema conversion

Prove generated JSON Schema contains important descriptions from the Zod schema.

For example, inspect that generated provider schema contains semantic guidance for:

```text
workflow_step
constraint
unresolved
non_fact
```

### Valid proposal parsing

A known-correct S1-S4 proposal must pass the Zod schema.

### Invalid slot accounting

Reject:

```text
missing S1-S4 slot
duplicate slot
unknown slot
more than one result for the same source
```

### Invalid structural shape

Reject malformed or non-schema-conforming provider output.

### Finalizer

A known-correct Zod proposal must deterministically produce an Atlas result accepted by:

```ts
parseSemanticExtractionResult(...)
```

### No contract weakening

Existing Atlas semantic-contract tests must remain unchanged and passing.

---

## 27. Security Readiness

`SecurityReadiness: applicable`.

Inherited boundaries:

### Source boundary

Only the authorized non-confidential S1-S4 fixture may be sent to Groq.

The spike must not introduce direct DocumentStore discovery or database access.

### Credential boundary

`GROQ_API_KEY` remains environment-only.

Never persist or print:

```text
API key
Authorization header
secret-bearing environment dump
```

### Truth boundary

Provider output remains an untrusted proposal.

A schema-valid result is not accepted truth.

### Identity boundary

Atlas retains authority over:

```text
source identity
evidence identity
candidate identity
inventory identity
final semantic result construction
```

### Production isolation

No spike code becomes a production route.

Do not modify route activation, worker scheduling, queue behavior, persistence, or publication behavior.

---

## 28. Scope

In scope:

```text
isolated Zod provider-facing semantic schema
schema descriptions
z.toJSONSchema(...)
strict provider structured output
same-schema Zod validation
frozen S1-S4 fixture
two Groq live calls
deterministic Atlas finalization
real Atlas semantic parser validation
oracle comparison with SEMSPIKE-001/002/003
```

---

## 29. Explicit Non-Scope

Do not implement:

```text
full Safara semantic extraction
all Atlas semantic kinds unless needed by S1-S4
semantic reconciliation
BSS-V2-004-04
retrieval/index lookup
existing knowledge matching
conflict detection
canonical truth
Main Workflow projection
Project Facts projection
CES Result projection
chatbot behavior
production queue integration
production Agents Bridge route activation
semantic persistence
new provider fallback
quota-domain work
cost ledger work
privacy production qualification
model comparison
prompt optimization beyond the minimal instruction
semantic repair heuristics
```

---

## 30. Relationship to Previous Spikes

Treat previous spikes as frozen evidence.

```text
SEMSPIKE-001
generic schema + original instruction
-> FAIL

SEMSPIKE-002
generic schema + strengthened semantic instruction
-> FAIL

SEMSPIKE-003
generic schema + faithfulness-heavy instruction
-> FAIL

SEMSPIKE-005
schema-driven semantic contract + minimal instruction
-> ?
```

Do not modify prior ticket artifacts or reports.

The final SEMSPIKE-005 report should explicitly compare:

```text
what changed
what remained frozen
whether schema descriptions materially changed semantic reliability
```

---

## 31. Interpretation of PASS

If `SEMSPIKE-005` passes:

1. treat schema-driven extraction as qualified feasibility evidence for the provider-facing contract shape;
2. stop creating increasingly elaborate semantic prompt spikes;
3. use the result to plan `BSS-V2-004-03`;
4. preserve the two-layer contract model:

```text
LLM-facing Zod semantic proposal contract
    -> deterministic Atlas finalization
    -> existing atlas.semantic.extract/v1
```

A likely future split is:

```text
BSS-V2-004-03-01
Schema-driven provider proposal contract and deterministic finalizer

BSS-V2-004-03-02
Production-shaped live semantic extraction qualification from accepted NormalizedDocument v1
```

The actual BSS child-ticket split remains planning authority and should be generated separately after spike review.

---

## 32. Interpretation of FAIL

If `SEMSPIKE-005` fails:

Do not weaken the oracle.

Do not add semantic repair simply to obtain PASS.

Do not reopen the existing Atlas semantic contract.

Record exactly which distinction remains unreliable.

A failure after explicit schema-driven ontology guidance is stronger evidence that this exact provider/model route is not sufficiently reliable for Atlas semantic extraction.

The next experiment should then be separately authorized and should preferably change the model/provider rather than continue uncontrolled prompt inflation.

---

## 33. GO / CK / CFC / HMN Friendliness

This spike should remain small enough that GO can reach a complete reviewable checkpoint without short-stopping.

### GO should complete

Before execution, GO must apply the explicit predecessor-ticket bypass in Section 2.1. It must not spend the run inspecting, validating, or waiting on `SEMSPIKE-004` as a dependency gate.

```text
isolated Zod dependency/setup
schema implementation
JSON Schema generation
local schema tests
fixture reuse
provider client
two live calls
Zod validation
deterministic finalization
real parser validation
oracle evaluation
evidence generation
terminal report
git diff --check
```

before declaring `READY_FOR_CK`.

Do not stop merely after:

```text
schema compiles
one provider call works
first run passes
JSON is returned
Zod parse passes
```

### CK should review

The review should focus on bounded questions:

```text
Was schema-driven semantics genuinely the changed variable?
Did descriptions reach the provider schema?
Was the prompt kept minimal?
Were both live runs real and equivalent?
Did both runs satisfy S1-S4?
Was semantic repair absent?
Did deterministic finalization preserve Atlas authority?
Did the unchanged real Atlas parser accept the results?
Were credentials and artifacts safe?
```

### CFC

If CK identifies an implementation/evidence defect, CFC may repair only the authorized gap.

CFC must not change the semantic oracle or introduce semantic repair unless separately authorized.

### HMN

Use HMN when remediation would alter the experiment's frozen variable, semantic oracle, provider/model identity, or acceptance boundary.

---

## 34. Suggested Review Contract

| Row | Required behavior | PASS condition |
| --- | --- | --- |
| `RC-SEMSPIKE-005-00` | The experiment applies the explicit predecessor-ticket bypass and does not treat `SEMSPIKE-004` state as an execution prerequisite. | No GO/CK/CFC/HMN blocker is raised solely from missing/incomplete/unapproved predecessor semantic-spike state. |
| `RC-SEMSPIKE-005-01` | The spike begins from the same real `NormalizedDocument v1` fixture boundary and accounts for exactly S1-S4 once each. | Real parser passes; no missing, duplicate, or unknown slot. |
| `RC-SEMSPIKE-005-02` | Zod is the source of the provider-facing schema and semantic descriptions survive into generated JSON Schema. | Generated schema inspection proves the required descriptions are present. |
| `RC-SEMSPIKE-005-03` | Two authenticated calls use the frozen Groq GPT-OSS-120B route with strict structured output and the minimal schema-authority instruction. | Both requests use the exact frozen provider/model/configuration and return terminal structured responses. |
| `RC-SEMSPIKE-005-04` | The original Zod schema validates provider output without semantic repair. | Both responses parse through Zod; invalid-shape negatives fail closed. |
| `RC-SEMSPIKE-005-05` | Both runs satisfy the frozen Atlas semantic oracle. | S1 workflow_step; S2 constraint with exact 2/per-order scope; S3 non_fact; S4 unresolved with missing condition and clarification question. |
| `RC-SEMSPIKE-005-06` | Atlas deterministic finalization retains IDs/evidence/accounting authority and the unchanged real semantic parser accepts the result. | Both finalized results pass `parseSemanticExtractionResult(...)`. |
| `RC-SEMSPIKE-005-07` | Equivalent-run consistency and security evidence are honestly preserved. | Material differences are recorded; no secret leakage; affected tests and `git diff --check` pass. |

---

## 35. GO Hard Stop

GO stops when the experiment has produced:

```text
two equivalent live runs
+
Zod schema evidence
+
Zod parse evidence
+
Atlas final parser evidence
+
semantic oracle evidence
+
terminal classification
+
review artifact
```

It must not continue into production BSS-V2-004-03 implementation.

It must not activate semantic work in the normal IDSER lifecycle.

---

## 36. Expected Final Report

Suggested report path:

```text
project's goal/feedback/
SEMSPIKE-005-schema-driven-semantic-extraction-feasibility.md
```

The report should contain:

```text
terminal result
provider/model/configuration
changed variable
frozen baselines
generated-schema evidence
S1-S4 run matrix
Zod validation result
Atlas final parser result
token and latency observations
cross-run consistency
security/redaction inspection
Review Contract closure
comparison against SEMSPIKE-001/002/003
one next recommendation
```

---

## 37. Final Architectural Intent

The experiment should test this exact architectural pattern:

```text
BSS-V2-004-02
Atlas-accepted NormalizedDocument v1
        |
        v
deterministic bounded source slots
        |
        v
LLM-facing Zod semantic contract
        |
        +-- explicit shape
        +-- explicit semantic descriptions
        +-- distinctions between nearby concepts
        |
        v
z.toJSONSchema(...)
        |
        v
strict external reasoning call
        |
        v
Zod validation
        |
        v
deterministic Atlas finalizer
        |
        +-- Atlas IDs
        +-- semantic_key
        +-- evidence refs
        +-- source inventory
        +-- questions/evidence
        |
        v
existing atlas.semantic.extract/v1
        |
        v
parseSemanticExtractionResult(...)
        |
        v
frozen semantic oracle
```

The experiment succeeds only if the model can reliably speak the small schema-driven Atlas semantic language without Atlas repairing its semantic decisions.

That result, if positive, becomes direct implementation evidence for the provider-facing contract shape of `BSS-V2-004-03`.
