# Atlas SEMSPIKE-001 - Groq GPT-OSS-120B Bounded Semantic Extraction Feasibility

## 1. Purpose

`SEMSPIKE-001` is a tiny, isolated feasibility experiment.

It answers only this question:

> Can `openai/gpt-oss-120b` on Groq take a tiny Atlas-authorized `NormalizedDocument` scope, produce a deliberately small semantic proposal, and allow Atlas-owned deterministic code to construct a valid, unchanged `atlas.semantic.extract/v1` result?

The intended proof path is:

```text
Already-proven NormalizedDocument boundary
            |
            v
small authorized source scope
            |
            v
Groq / openai/gpt-oss-120b
small intermediate semantic proposal
            |
            v
Atlas-owned deterministic finalizer
            |
            v
existing parseSemanticExtractionResult(...)
            |
            v
UNCHANGED semantic-v1 result
```

This is not production integration, not a Groq migration, not reconciliation, and not Knowledge Index work.

---

## 2. Existing Atlas Authority

Run against:

```text
codex/new-atlas-backend
```

Relevant existing code includes:

```text
packages/atlas-contracts/src/perception.ts
packages/atlas-contracts/src/semantic.ts
packages/atlas-skills/src/index.ts
apps/agents-bridge/src/provider-capabilities.ts
apps/agents-bridge/src/semantic-worker.ts
```

The authoritative extraction contract remains:

```text
atlas.semantic.extract/v1
```

The authoritative final validator remains:

```ts
parseSemanticExtractionResult(...)
```

Do not change semantic-v1. Do not change `NormalizedDocument v1`. Do not modify the production semantic worker to use the spike intermediate schema.

---

## 3. Hypothesis

The provider should understand bounded source meaning, while Atlas owns identity, evidence, source accounting, IDs, final semantic-v1 assembly, validation, authority, and persistence.

```text
Provider responsibility:
understand bounded source meaning

Atlas responsibility:
source identity
source accounting
evidence identity
locators
candidate IDs
semantic-v1 assembly
bounds
validation
authority
persistence
```

The spike tests:

```text
small semantic reasoning contract
               +
Atlas deterministic finalization
               =
valid semantic-v1
```

Do not weaken Atlas contracts to make the provider pass.

---

## 4. Frozen Provider Target

Provider:

```text
Groq
```

Model:

```text
openai/gpt-oss-120b
```

Credential:

```text
GROQ_API_KEY
```

Target reasoning configuration:

```text
reasoning_effort = medium
```

Target output mode:

```text
JSON Schema structured output
strict = true
```

The live spike must verify that the authenticated account and exact model route actually accept this capability. Documentation or model labels are not acceptance evidence.

Do not silently switch model, provider, reasoning mode, or structured-output mode if the requested route fails.

The spike must use:

```text
non-streaming
no tools
no web search
no code execution
no MCP
no agent loop
```

The API key must come from environment configuration only. Never hard-code, commit, print, or include it in evidence.

---

## 5. Isolation Boundary

Do not add a production Groq adapter yet.

Prefer isolated spike code under:

```text
scripts/groq-semantic-spike/
```

Suggested files:

```text
scripts/groq-semantic-spike/
|-- fixture.ts
|-- intermediate-schema.ts
|-- groq-client.ts
|-- finalize.ts
|-- run.ts
`-- README.md
```

Write generated evidence only under an ignored directory such as:

```text
.atlas-data/groq-semantic-spike/
```

Do not add a production Groq SDK dependency solely for this experiment if the existing runtime can perform the bounded HTTP call directly.

---

## 6. Explicit Non-Goals

Out of scope:

```text
production Groq provider adapter
production route activation
BSS-V2 route qualification
BSS-V2 ticket state changes
semantic-worker redesign
full Safara extraction
atlas.semantic.reconcile/v1
reconciliation
Knowledge Index
targeted retrieval
embeddings
vector database
Main Workflow
Project Facts
Project Context
CES Result
database persistence
candidate repository changes
queue integration
pg-boss integration
replay/fencing changes
human review
provider fallback
pricing implementation
multilingual coverage qualification
```

One multilingual source statement is included only as a sanity check. It does not qualify all languages.

---

## 7. Perception Boundary

Do not rerun the full Docling feasibility experiment.

DOCSPIKE already proved that Docling can reach Atlas-valid `NormalizedDocument v1` for the tested digital PDFs.

SEMSPIKE begins at:

```text
NormalizedDocument
```

Construct one tiny controlled `NormalizedDocument` fixture and pass it through the real:

```ts
parseNormalizedDocument(...)
```

before semantic execution.

Do not create a second perception contract.

---

## 8. Controlled Four-Source Fixture

Use exactly four non-empty text blocks.

### S1

```text
The customer submits an order.
```

Structural kind:

```text
paragraph
```

Expected semantic outcome:

```text
candidate
kind = workflow_step
needs_resolution = false
```

### S2

```text
Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.
```

Structural kind:

```text
paragraph
```

Expected semantic outcome:

```text
candidate
kind = constraint
needs_resolution = false
```

The meaning must preserve:

```text
customer
maximum = 2
product
per order
```

The model may normalize wording into another language, but must not alter the number, scope, modality, actor, or object.

### S3

```text
3.2 Purchase Rules
```

Structural kind:

```text
heading
```

Expected semantic outcome:

```text
non_fact
```

This is structural context only. It must not become a business fact merely because the heading contains semantic-looking words.

### S4

```text
Approval may be required before processing.
```

Structural kind:

```text
paragraph
```

Expected semantic outcome:

```text
uncertain
```

The provider must preserve the uncertainty.

Expected final candidate:

```text
kind = unresolved
needs_resolution = true
```

The final semantic-v1 result must contain a clarification question equivalent in meaning to:

```text
Under what condition is approval required before processing?
```

Exact wording does not need to match. Meaning does.

---

## 9. Stable Source Identity

Use deterministic source IDs, for example:

```text
page 1
spike-text-001
spike-text-002
spike-text-003
spike-text-004
```

The request sent to Groq should use bounded temporary slots:

```text
S1
S2
S3
S4
```

Atlas owns the mapping:

```text
S1 -> spike-text-001
S2 -> spike-text-002
S3 -> spike-text-003
S4 -> spike-text-004
```

Groq must never manufacture Atlas locator IDs.

---

## 10. Provider Input

Send only the bounded source representation required for semantic interpretation.

Conceptually:

```json
{
  "sources": [
    {
      "slot": 1,
      "structural_kind": "paragraph",
      "text": "The customer submits an order."
    },
    {
      "slot": 2,
      "structural_kind": "paragraph",
      "text": "Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan."
    },
    {
      "slot": 3,
      "structural_kind": "heading",
      "text": "3.2 Purchase Rules"
    },
    {
      "slot": 4,
      "structural_kind": "paragraph",
      "text": "Approval may be required before processing."
    }
  ]
}
```

Do not send real workspace secrets, database state, Master state, review decisions, user credentials, the full PDF, the full semantic-v1 output schema, or reconciliation context.

---

## 11. Tiny Intermediate Semantic Contract

The intermediate response is spike-only. It is not a new Atlas contract.

Use a small shape equivalent to:

```json
{
  "source_results": [
    {
      "slot": 1,
      "disposition": "candidate",
      "candidates": [
        {
          "kind": "workflow_step",
          "semantic_key": "customer order submission",
          "normalized_meaning": "The customer submits an order.",
          "needs_resolution": false
        }
      ],
      "non_fact_reason": "",
      "question": "",
      "question_reason": ""
    }
  ]
}
```

Every source result must contain:

```text
slot
disposition
candidates
non_fact_reason
question
question_reason
```

Every candidate must contain:

```text
kind
semantic_key
normalized_meaning
needs_resolution
```

Allowed `kind` values must come directly from current semantic-v1:

```text
actor
business_object
business_property
responsibility
rule
constraint
condition
decision
workflow_step
state_transition
relationship
input
output
acceptance_expectation
exception
unresolved
```

Do not create a parallel semantic vocabulary.

Keep this JSON Schema deliberately small. Use `additionalProperties = false` for objects. Do not pass the full current `semanticExtractionResultSchema` to Groq.

---

## 12. Intermediate Dispositions

Allowed spike dispositions:

```text
candidate
non_fact
uncertain
```

These do not change semantic-v1.

### candidate

```text
candidates.length >= 1
non_fact_reason == ""
```

### non_fact

```text
candidates.length == 0
non_fact_reason != ""
question == ""
question_reason == ""
```

### uncertain

```text
candidates.length >= 1
question != ""
question_reason != ""
all relevant candidates have needs_resolution == true
```

For S4, the expected candidate kind is:

```text
unresolved
```

---

## 13. Mandatory Source Accounting Rule

This rule is non-negotiable:

```text
NO MODEL OUTPUT
!=
NON_FACT
```

And:

```text
MISSING SOURCE SLOT
!=
NON_FACT
```

For S1 through S4 there must be exactly one source result each.

Therefore:

```text
missing slot        -> FAIL
duplicate slot      -> FAIL
unknown slot        -> FAIL
invalid disposition -> FAIL
```

Never silently convert provider omission into `non_fact`.

---

## 14. Atlas-Owned Finalization

Groq must not create:

```text
local_candidate_id
page_number
locator_type
locator_id
evidence_refs
source_unit_id
source_statement_inventory
semantic-v1 envelope
provider persistence identity
workspace identity
```

Atlas spike code owns those fields.

Candidate IDs must be deterministic, for example:

```text
spike.s1.c1
spike.s2.c1
spike.s4.c1
```

Random UUIDs are prohibited.

---

## 15. Evidence Construction

For a candidate derived from S2, Atlas must construct evidence from the trusted slot mapping:

```json
{
  "page_number": 1,
  "locator_type": "text_block",
  "locator_id": "spike-text-002",
  "excerpt": "Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan."
}
```

The excerpt must be copied from the original authorized `NormalizedDocument`.

Never use the model's paraphrase as evidence.

---

## 16. Source Wording

When final semantic-v1 includes `source_wording`, copy the exact authorized source text.

For S2, keep:

```text
Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.
```

A normalized English paraphrase may be used as `normalized_meaning`, but it is not source evidence.

---

## 17. Candidate Payload

SEMSPIKE-001 does not establish the final production payload strategy.

Use:

```json
{}
```

for candidate `payload`.

The report must explicitly state:

> Candidate payload semantics were not qualified by SEMSPIKE-001.

Do not invent a new payload contract.

---

## 18. Source Inventory Finalization

Atlas must construct exactly four source inventory entries.

For candidate sources:

```text
classification = candidate
destination_local_candidate_ids = corresponding candidate IDs
```

For S3:

```text
classification = non_fact
destination_local_candidate_ids = []
non_fact_reason = validated structural-context reason
```

For S4:

```text
classification = candidate
destination_local_candidate_ids = unresolved candidate ID
```

Current semantic-v1 still owns the inventory vocabulary:

```text
candidate
non_fact
```

`uncertain` is only a spike transport disposition and must not become a third semantic-v1 inventory classification.

---

## 19. Questions Finalization

S4 uncertainty must become a semantic-v1 question with trusted evidence.

Conceptually:

```json
{
  "question": "Under what condition is approval required before processing?",
  "reason": "The source states that approval may be required but does not identify the triggering condition.",
  "evidence_refs": [
    {
      "page_number": 1,
      "locator_type": "text_block",
      "locator_id": "spike-text-004",
      "excerpt": "Approval may be required before processing."
    }
  ]
}
```

The model may propose question/reason meaning. Atlas owns the evidence identity.

---

## 20. Final Semantic-v1 Validation

The finalized result must be passed through the real current:

```ts
parseSemanticExtractionResult(...)
```

from:

```text
packages/atlas-contracts/src/semantic.ts
```

No copy. No Python clone. No weakened validator. No alternate equivalent schema.

The existing parser is the acceptance authority.

---

## 21. Expected Final Semantic Shape

The exact normalized wording may vary, but the result must semantically represent:

```text
candidate_assertions
|-- workflow_step
|   `-- customer submits order
|
|-- constraint
|   `-- customer max 2 products per order
|
`-- unresolved
    |-- approval may be required before processing
    `-- needs_resolution = true

source_statement_inventory
|-- S1 -> candidate
|-- S2 -> candidate
|-- S3 -> non_fact
`-- S4 -> candidate

questions
`-- clarify approval condition
```

---

## 22. Provider Prompt Requirements

The prompt must explicitly instruct the model:

```text
You receive only authorized source slots.

Interpret only supplied text.

Do not invent omitted business meaning.

Do not treat headings as business facts merely because their words sound semantic.

Preserve numbers, modality, negation, conditions, actors, objects, and scope.

Preserve uncertainty.

Every supplied source slot must receive exactly one disposition.

Do not omit a source.

Do not manufacture Atlas IDs.

Do not infer accepted truth.

Do not perform reconciliation.

Do not decide supersession.

Do not resolve ambiguity that the source does not resolve.
```

The provider receives no action authority.

---

## 23. Repeatability

Run the exact controlled request at least twice.

Do not require byte-identical natural-language wording.

Compare semantic decisions:

```text
source disposition
candidate kind
number preservation
scope preservation
needs_resolution
non_fact decision
uncertainty decision
source accounting completeness
```

Material semantic disagreement between equivalent runs is evidence and must not be hidden by deterministic post-processing.

---

## 24. Required Observations

Record for each run:

```text
provider
model
HTTP status
latency
input tokens if returned
output tokens if returned
reasoning configuration
structured-output mode
source count
candidate count
non_fact count
uncertain count
parser result
```

Also record:

```text
unknown slots
missing slots
duplicate slots
schema errors
semantic expectation deviations
```

Never record the API key or Authorization header.

---

## 25. Review Contract

| Row | Required proof | PASS condition |
| --- | --- | --- |
| `RC-SEMSPIKE-001-01` | Real authenticated Groq execution against exactly `openai/gpt-oss-120b` using the frozen bounded configuration. | Provider produces a terminal structured result. Documentation alone is insufficient. |
| `RC-SEMSPIKE-001-02` | Controlled four-source input validates through the real existing `parseNormalizedDocument(...)`. | No alternate perception contract or parser is introduced. |
| `RC-SEMSPIKE-001-03` | Provider accounts for all four authorized slots exactly once. | No missing, duplicate, unknown, or silently synthesized source disposition. |
| `RC-SEMSPIKE-001-04` | Expected semantics are preserved: workflow step, numerical purchase constraint, heading-only non-fact, unresolved approval statement. | No material source meaning is invented, dropped, or changed. |
| `RC-SEMSPIKE-001-05` | Atlas finalizer constructs evidence, IDs, inventory, questions, and exact source wording independently of provider identity generation. | Final output passes unchanged `parseSemanticExtractionResult(...)`. |
| `RC-SEMSPIKE-001-06` | Two equivalent executions are compared and terminal classification is honest. | No semantic instability or limitation is hidden by deterministic post-processing. |

---

## 26. Terminal Classifications

The report must end with exactly one of:

```text
PASS
PASS_WITH_LIMITS
FAIL
ENVIRONMENT_BLOCKED
```

### PASS

Use only if:

```text
real Groq call succeeds
requested structured-output mode works
all 4 sources are accounted exactly once
S1 = workflow_step
S2 = constraint, max 2 products per order preserved
S3 = non_fact heading/context
S4 = unresolved/needs_resolution
semantic-v1 finalization succeeds
real parseSemanticExtractionResult(...) succeeds
exact evidence remains source-grounded
no Atlas semantic contract changed
no production route changed
two runs are materially semantically consistent
```

### PASS_WITH_LIMITS

Use only when the core hypothesis succeeds and the limitation is non-blocking and explicitly recorded.

Example:

```text
normalized wording differs between runs,
while kind/disposition/meaning/source accounting remain materially equivalent
```

### FAIL

Use for a material semantic failure, including:

```text
wrong source disposition
heading promoted to a fact
number 2 altered
per-order scope lost
uncertainty falsely resolved
source omitted
unknown source invented
semantic-v1 finalizer cannot produce a valid result
existing semantic contract would need weakening
```

### ENVIRONMENT_BLOCKED

Use only when meaningful semantic execution cannot occur because of an external condition such as:

```text
invalid or disabled Groq credential
exact model inaccessible
requested structured-output capability inaccessible
provider outage
hard account quota
network failure
```

Do not classify model-quality failure as environment blocked.

---

## 27. Explicit Stop Conditions

Stop as `SCOPE_CHANGE` rather than expanding the spike if completion would require:

```text
changing semantic-v1
changing NormalizedDocument v1
changing production semantic-worker behavior
building reconciliation
building Knowledge Index
adding embeddings
building a permanent Groq provider
activating a route
changing BSS-V2 qualification state
adding DB persistence
adding queue behavior
changing authority/review semantics
processing the full Safara PRD
inventing a new semantic vocabulary
```

Do not continue into these areas automatically.

---

## 28. Security and Authority Boundaries

### BOUNDARY-SEMSPIKE-001-SOURCE

Only the controlled non-confidential four-source fixture may be sent to Groq.

### BOUNDARY-SEMSPIKE-001-AUTHORITY

Groq provides semantic proposals only. It cannot create accepted Atlas truth, review decisions, Master knowledge, publication state, or canonical workspace resolution.

### BOUNDARY-SEMSPIKE-001-IDENTITY

Groq must not own Atlas evidence or persistence identity.

### BOUNDARY-SEMSPIKE-001-SECRETS

Only `GROQ_API_KEY` is required. It must remain environment-only and redacted from logs and reports.

### COUPLING-SEMSPIKE-001-PRODUCTION

Spike code must not be imported by production runtime code.

---

## 29. Suggested Local Artifacts

Ignored local artifacts may include:

```text
.atlas-data/groq-semantic-spike/
|-- fixture.normalized.json
|-- run-1.provider.json
|-- run-1.semantic-v1.json
|-- run-1.metrics.json
|-- run-2.provider.json
|-- run-2.semantic-v1.json
|-- run-2.metrics.json
`-- summary.json
```

Provider artifacts must contain no API key or Authorization data.

---

## 30. Required Report

Produce:

```text
project's goal/feedback/SEMSPIKE-001-groq-gpt-oss-120b-semantic-extraction-feasibility.md
```

The report must state:

```text
SEMSPIKE-001 RESULT: <classification>

Provider: Groq
Model: openai/gpt-oss-120b
Reasoning effort: medium
Requested structured output: strict JSON Schema
Authenticated live inference: yes/no

NormalizedDocument v1 changed: no
Semantic v1 changed: no
Production semantic worker changed: no
Production route activated: no
Knowledge Index implemented: no
Reconciliation tested: no
```

Then record:

```text
fixture
provider response summary
source-by-source expected vs observed matrix
final semantic-v1 result summary
parser result
repeatability comparison
token usage
latency
limitations
terminal classification
next recommendation
```

---

## 31. Required Evaluation Matrix

| Source | Expected | Observed | Status |
| --- | --- | --- | --- |
| S1 | `workflow_step`, customer submits order | actual | PASS/FAIL |
| S2 | `constraint`, customer max 2 products per order | actual | PASS/FAIL |
| S3 | `non_fact`, structural heading only | actual | PASS/FAIL |
| S4 | `unresolved`, approval uncertainty preserved | actual | PASS/FAIL |

Also include:

| Integrity requirement | Status |
| --- | --- |
| All four source slots accounted | PASS/FAIL |
| No unknown slot | PASS/FAIL |
| No duplicate slot | PASS/FAIL |
| Evidence copied from trusted source | PASS/FAIL |
| Exact numeric value `2` preserved | PASS/FAIL |
| `per order` scope preserved | PASS/FAIL |
| Uncertainty preserved | PASS/FAIL |
| Real semantic-v1 parser accepts result | PASS/FAIL |
| Existing semantic contracts unchanged | PASS/FAIL |

---

## 32. Validation

At minimum run:

```text
controlled fixture validation
Groq live run 1
Groq live run 2
intermediate schema validation
Atlas finalization
parseSemanticExtractionResult(...)
directly affected atlas-contract tests
git diff --check
```

Do not stop after merely proving that the API responded or that structured JSON was returned.

The spike is complete only when the resulting semantic proposal successfully crosses the real Atlas semantic-v1 boundary.

---

## 33. Success Does Not Authorize Production

A successful SEMSPIKE-001 means only:

> `openai/gpt-oss-120b` on Groq demonstrated that a small bounded semantic proposal can be converted by Atlas-owned deterministic finalization into a valid current semantic-v1 extraction result for the controlled fixture.

It does not mean:

```text
Groq is production-qualified
GPT-OSS-120B is globally good enough for Atlas
all languages are supported
Safara extraction works
reconciliation works
Knowledge Index works
```

Those require separate evidence.

---

## 34. Next Step After PASS

Do not automatically implement the next stage.

Preferred sequence:

```text
SEMSPIKE-001
small extraction
      |
      | PASS
      v
RECONSPIKE-001
small manually supplied reconciliation
      |
      | PASS
      v
real bounded PRD extraction qualification
      |
      v
Knowledge Index / targeted retrieval proof
      |
      v
integrated semantic pipeline
```

If SEMSPIKE-001 fails:

```text
stop
record why
do not weaken Atlas contracts to compensate
```

---

## 35. Core Rule

Preserve this separation:

```text
Groq / GPT-OSS
      |
      | understands bounded meaning
      v
semantic proposal
      |
      v
Atlas
      |
      +-- owns source identity
      +-- owns evidence
      +-- owns IDs
      +-- owns accounting
      +-- owns validation
      +-- owns authority
      `-- owns persistence
```

The provider proposes meaning.

Atlas remains the authority.
