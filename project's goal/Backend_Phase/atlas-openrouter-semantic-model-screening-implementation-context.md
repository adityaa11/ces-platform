# Atlas ORSEMSPIKE-001 - OpenRouter Bounded Semantic Model Screening

Status: Authorized implementation context for a bounded model-screening feasibility spike
Spike ID: ORSEMSPIKE-001
Repository: adityaa11/ces-platform
Target branch: codex/new-atlas-backend
Authoring date: 2026-10-03
Encoding: UTF-8, ASCII-safe Markdown

---

## 1. Purpose

`ORSEMSPIKE-001` is a tiny, isolated model-screening experiment.

It exists to answer one question:

> Which exact OpenRouter model routes, if any, can reliably perform the small amount of bounded semantic reasoning Atlas needs after Docling perception, without weakening Atlas contracts and without consuming a large number of daily inference requests?

This spike is intentionally designed as a low-RPD model bake-off.

It does not select a production provider permanently.
It does not activate a production OpenRouter route.
It does not replace Docling.
It does not implement reconciliation.
It does not process the full Safara PRD.
It does not qualify production economics.

The intended proof path is:

```text
already-proven Docling perception
            |
            v
Atlas NormalizedDocument v1
            |
            v
tiny controlled semantic fixture
            |
            v
OpenRouter
            |
            +-- exact model A
            +-- exact model B
            +-- exact model C
            +-- ...
            |
            v
same small provider-facing semantic contract
            |
            v
Atlas-owned deterministic finalizer
            |
            v
existing parseSemanticExtractionResult(...)
            |
            v
per-model screening result
```

The spike must compare models under the same fixture, prompt, schema, and Atlas finalization rules.

---

## 2. Decision Baseline

The following architecture decisions are already established and are not reopened by this spike.

### 2.1 Docling remains the perception path

Docling has already been selected for Atlas document perception.

The semantic experiment begins after:

```text
immutable PRD
    |
    v
Docling
    |
    v
NormalizedDocument v1
```

Do not ask OpenRouter models to parse PDFs.
Do not rerun a full Docling feasibility experiment.
Do not replace Docling with a multimodal model.
Do not introduce another perception contract.

### 2.2 Atlas semantic contracts remain authoritative

The current final extraction contract remains:

```text
atlas.semantic.extract/v1
```

The final validator remains the existing:

```ts
parseSemanticExtractionResult(...)
```

Do not weaken or fork semantic-v1 to make a model pass.

### 2.3 Previous Groq evidence remains historical

The completed Groq GPT-OSS-120B spike is historical evidence for that exact experiment.

Do not rewrite, delete, relabel, or silently reinterpret its artifacts.

`ORSEMSPIKE-001` is a new experiment because the purpose is now different:

```text
previous experiment:
one specific Groq/model route

this experiment:
low-RPD screening of several exact OpenRouter model routes
```

---

## 3. Correct Authority Split

This spike must preserve the following split.

### 3.1 Provider/model responsibility

The model is responsible only for semantic judgments that Atlas cannot safely derive from syntax alone.

The model must determine, for each authorized source:

```text
is this a candidate fact, non-fact structural text, or unresolved uncertainty?

if candidate:
what current Atlas semantic kind does it represent?

what normalized meaning does the text express?

does the meaning require resolution?

if uncertain:
what semantic uncertainty is present?
```

The model must preserve:

```text
numbers
scope
modality
negation
actors
objects
conditions
uncertainty
```

### 3.2 Atlas responsibility

Atlas owns:

```text
source authorization
source-slot mapping
NormalizedDocument identity
page and locator identity
evidence construction
exact source wording
candidate IDs
source inventory
semantic-v1 envelope
final question wording for this controlled spike
question evidence identity
validation
acceptance authority
persistence authority
review authority
publication authority
Master authority
```

### 3.3 Important correction from the earlier Groq context

Do not require the provider to manufacture Atlas-owned question fields merely to pass semantic screening.

For the controlled S4 fixture, the provider must prove that it understands:

```text
the statement is unresolved uncertainty
and
the missing information concerns the condition under which approval is required
```

Atlas may deterministically construct the spike-only final clarification question needed to cross the current semantic-v1 parser.

That deterministic spike question does not qualify production question-generation behavior.

The provider is still responsible for the semantic uncertainty judgment itself.

---

## 4. Core Hypothesis

The hypothesis is:

> At least one exact OpenRouter model route can take a tiny Atlas-authorized source scope, return a small semantic proposal with correct Atlas ontology decisions, and allow Atlas-owned deterministic code to construct a valid unchanged semantic-v1 result.

The experiment must distinguish:

```text
model semantic failure
from
OpenRouter route/capability failure
from
Atlas harness/finalizer failure
```

Do not collapse all three into one generic error.

---

## 5. Why OpenRouter Is Used Here

OpenRouter is used as a model-access gateway for this spike because Atlas wants to compare several models without implementing a separate adapter and account path for every candidate.

The screening experiment should exploit the common gateway while still pinning exact model identities.

Conceptually:

```text
Atlas semantic fixture
        |
        v
OpenRouter gateway
        |
        +-- exact model slug A
        +-- exact model slug B
        +-- exact model slug C
        |
        v
same Atlas screening harness
```

This spike does not use an automatic model router.

The experiment is about knowing exactly which model produced each result.

---

## 6. Current OpenRouter Facts at Authoring Time

At the authoring date, OpenRouter documents:

```text
API base:
https://openrouter.ai/api/v1

free-account free-model limit:
50 requests/day

free-model RPM:
20 requests/minute

after at least USD 10 in credits:
free-model ceiling may rise to 1000 requests/day

failed free-model inference requests also count against daily request allowance
```

OpenRouter also documents that structured-output support is endpoint-specific and that:

```json
{
  "provider": {
    "require_parameters": true
  }
}
```

can be used to prevent routing to endpoints that do not support requested parameters.

These are external service facts and may change.

Before executing the spike, verify the current official OpenRouter model catalog and rate-limit documentation.

Do not silently expand the request budget merely because the external limits changed upward.

Reference pages:

```text
https://openrouter.ai/pricing
https://openrouter.ai/models
https://openrouter.ai/developers
```

---

## 7. Hard RPD Budget

The spike must be designed to fit comfortably inside the current 50-request/day free-account ceiling.

### 7.1 Maximum model shortlist

Maximum candidate models:

```text
10
```

Do not test more than 10 models in one authorized ORSEMSPIKE-001 run.

### 7.2 Phase 1 - one-call screen

Every configured candidate receives at most:

```text
1 inference request
```

Models that fail the semantic or contract screen are eliminated immediately.

### 7.3 Phase 2 - confirmation

Only Phase 1 survivors receive:

```text
2 additional equivalent requests
```

Therefore each surviving model has:

```text
3 total semantic runs
```

### 7.4 Worst-case request count

If all 10 models pass Phase 1:

```text
Phase 1:
10 models x 1 request = 10

Phase 2:
10 survivors x 2 requests = 20

maximum inference requests = 30
```

The hard default experiment ceiling is therefore:

```text
30 inference requests/day
```

This leaves headroom under a 50-RPD account for accidental route failures or unrelated manual activity.

### 7.5 Budget may not expand automatically

The runner must refuse to issue request 31 for this spike.

Increasing the budget requires explicit human authorization and a separately recorded reason.

Do not automatically continue because:

```text
the account has more credits
the external quota is larger
one model "almost passed"
a provider returned a transient error
Codex wants more evidence
```

---

## 8. No Automatic Retries

Automatic inference retry is prohibited in ORSEMSPIKE-001.

Reason:

```text
failed requests can consume daily request allowance
```

For each planned inference slot:

```text
one outbound attempt only
```

If OpenRouter returns:

```text
429
5xx
route unavailable
unsupported parameter
timeout
network failure after request dispatch
```

record the attempt and classify it appropriately.

Do not retry that inference automatically.

A human may authorize a later rerun as a separate bounded attempt if needed.

Local file reads, validation, parsing, and deterministic tests may be rerun freely because they do not consume OpenRouter RPD.

---

## 9. Request Pace

Use:

```text
concurrency = 1
```

Do not parallelize model screening.

Default local pacing should stay below the documented free-model RPM ceiling.

Preferred safety limit:

```text
<= 10 inference requests/minute
```

The purpose is not throughput benchmarking.

Latency is observed, but request speed must not risk wasting RPD through avoidable rate limiting.

---

## 10. Exact Model Identity

Every candidate must be an exact OpenRouter model slug.

Examples of the required identity style:

```text
vendor/model-name
vendor/model-name:free
```

The actual candidate list must come from a checked-in spike config or an ignored local config with an evidence copy.

Do not use moving aliases such as:

```text
latest
auto
free router
automatic model selection
```

unless a future explicitly authorized experiment is specifically testing an alias.

For ORSEMSPIKE-001:

```text
one configured slug = one screening identity
```

---

## 11. No Auto Router

Do not use:

```text
openrouter/auto
openrouter/free
or another automatic multi-model selector
```

for the semantic comparison.

A result is useful only when Atlas can attribute it to an exact model slug.

Provider endpoint routing behind the exact model slug may remain OpenRouter-managed, subject to the required parameter support.

If OpenRouter reports underlying endpoint/provider provenance, record it.

Do not claim that the spike qualifies every underlying provider serving that model.

The qualification identity is:

```text
OpenRouter + exact model slug + required structured-output capability
```

---

## 12. Candidate Model Configuration

Create a bounded model config, for example:

```text
scripts/openrouter-semantic-screen/models.json
```

Conceptual shape:

```json
{
  "max_models": 10,
  "models": [
    {
      "slug": "vendor/model:free",
      "enabled": true,
      "allow_paid": false
    }
  ]
}
```

Requirements:

```text
maximum 10 enabled models
no duplicate slug
no auto-router slug
no empty slug
default allow_paid = false
```

A paid route must not be used merely because the free endpoint is unavailable.

If a future human explicitly authorizes a paid candidate, record that as a separate config decision.

---

## 13. Preflight Must Save RPD

Before issuing any inference request, perform non-inference preflight.

Use current OpenRouter model/capability metadata where available to reject candidates that cannot satisfy the required request shape.

Preflight should verify, as far as the API/catalog exposes:

```text
exact model exists
text input/output is supported
structured output / JSON Schema support is available
requested model variant is reachable
free route exists when allow_paid = false
```

A candidate that clearly lacks required capability must be classified:

```text
PREFLIGHT_INELIGIBLE
```

and consume:

```text
0 inference requests
```

Do not "try anyway" when metadata already proves the route is incompatible.

---

## 14. OpenRouter Request Shape

Use the OpenRouter OpenAI-compatible API.

Prefer direct HTTP or an already-installed compatible client.

Do not add a large dependency solely for this spike if the existing runtime can issue the bounded request.

Credential:

```text
OPENROUTER_API_KEY
```

The key must come from environment configuration only.

Never:

```text
hard-code it
commit it
print it
store it in artifacts
include Authorization headers in evidence
```

The inference request must be:

```text
non-streaming
no tools
no web
no MCP
no agent loop
```

Use:

```json
{
  "provider": {
    "require_parameters": true
  }
}
```

so a structured-output request is not silently routed to an endpoint that ignores required parameters.

---

## 15. Structured Output Policy

Use:

```text
response_format = json_schema
strict = true
```

with a deliberately small provider-facing schema.

Do not pass the full Atlas semantic-v1 schema to candidate models.

Do not fall back automatically to:

```text
plain text
JSON mode without schema
tool calling
prompt-only pseudo JSON
```

If an exact model route cannot support the frozen structured request, classify the route as unsupported for this experiment.

That is not authority to weaken the screening contract.

---

## 16. Reasoning Controls

Do not require one provider-specific reasoning parameter across all candidate models.

Different models expose different reasoning controls.

For fair low-complexity screening:

```text
use the model's ordinary/default reasoning behavior
do not request hidden chain-of-thought
do not require reasoning_effort unless the exact screening config explicitly freezes it for every compared model
```

The semantic fixture is intentionally small enough that a model should not need an expensive agentic reasoning loop.

Record any model-specific reasoning configuration if one is explicitly authorized.

---

## 17. Controlled Fixture

Reuse one tiny four-source fixture for every model.

The fixture must first pass the real existing:

```ts
parseNormalizedDocument(...)
```

Use exactly four non-empty page-one text blocks.

### S1

```text
The customer submits an order.
```

Structural kind:

```text
paragraph
```

Required provider semantic judgment:

```text
disposition = candidate
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

Required provider semantic judgment:

```text
disposition = candidate
kind = constraint
needs_resolution = false
```

Required preserved meaning:

```text
actor = customer
maximum = 2
object = product
scope = per order
modality = maximum limit / constraint
```

The model may normalize wording into English or another clear representation.

It must not change:

```text
2
per-order scope
customer actor
product object
constraint modality
```

### S3

```text
3.2 Purchase Rules
```

Structural kind:

```text
heading
```

Required provider semantic judgment:

```text
disposition = non_fact
```

The heading is structural context only.

It must not become a business fact merely because it contains the word "Rules".

### S4

```text
Approval may be required before processing.
```

Structural kind:

```text
paragraph
```

Required provider semantic judgment:

```text
disposition = uncertain
kind = unresolved
needs_resolution = true
```

Required preserved uncertainty:

```text
approval is not stated as universally required
the condition triggering approval is missing
the model must not invent that condition
```

The provider does not need to generate Atlas's final clarification question text.

---

## 18. Stable Source Identity

Use deterministic source IDs, for example:

```text
page 1
spike-text-001
spike-text-002
spike-text-003
spike-text-004
```

The provider receives only temporary slots:

```text
S1
S2
S3
S4
```

Atlas owns:

```text
S1 -> spike-text-001
S2 -> spike-text-002
S3 -> spike-text-003
S4 -> spike-text-004
```

The provider must never manufacture Atlas locator IDs.

---

## 19. Provider Input

Send only the bounded semantic source representation.

Conceptually:

```json
{
  "sources": [
    {
      "slot": "S1",
      "structural_kind": "paragraph",
      "text": "The customer submits an order."
    },
    {
      "slot": "S2",
      "structural_kind": "paragraph",
      "text": "Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan."
    },
    {
      "slot": "S3",
      "structural_kind": "heading",
      "text": "3.2 Purchase Rules"
    },
    {
      "slot": "S4",
      "structural_kind": "paragraph",
      "text": "Approval may be required before processing."
    }
  ]
}
```

Do not send:

```text
full Safara PRD
real user data
workspace secrets
database state
Master state
review decisions
credentials
full semantic-v1 output schema
reconciliation context
Knowledge Index
```

---

## 20. Small Provider-Facing Semantic Contract

The transport contract is spike-only.

It must not become a new Atlas domain contract.

Use a compact shape equivalent to:

```json
{
  "source_results": [
    {
      "slot": "S1",
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
      "uncertainty_reason": ""
    }
  ]
}
```

Required source-result fields:

```text
slot
disposition
candidates
non_fact_reason
uncertainty_reason
```

Required candidate fields:

```text
kind
semantic_key
normalized_meaning
needs_resolution
```

Use:

```text
additionalProperties = false
```

for objects where supported by the frozen JSON Schema profile.

---

## 21. Allowed Semantic Vocabulary

Candidate kinds must come directly from current Atlas semantic-v1:

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

Do not create a model-specific parallel ontology.

The screen intentionally requires exact ontology classification where the fixture has an unambiguous Atlas expectation.

Therefore:

```text
S2 = rule
```

is a semantic FAIL for this fixture because the expected Atlas kind is:

```text
constraint
```

Likewise:

```text
S4 = condition
```

is a semantic FAIL when the model has converted unresolved modal uncertainty into a definite condition.

---

## 22. Transport Dispositions

Allowed spike dispositions:

```text
candidate
non_fact
uncertain
```

### candidate

Requirements:

```text
candidates.length >= 1
non_fact_reason == ""
```

### non_fact

Requirements:

```text
candidates.length == 0
non_fact_reason != ""
uncertainty_reason == ""
```

### uncertain

Requirements:

```text
candidates.length >= 1
uncertainty_reason != ""
all relevant candidates have needs_resolution == true
```

For S4:

```text
candidate kind = unresolved
```

Do not require provider-generated `question` or `question_reason` fields.

---

## 23. Mandatory Source Accounting

For every run:

```text
S1 exactly once
S2 exactly once
S3 exactly once
S4 exactly once
```

Therefore:

```text
missing slot        -> CONTRACT_FAIL
duplicate slot      -> CONTRACT_FAIL
unknown slot        -> CONTRACT_FAIL
invalid disposition -> CONTRACT_FAIL
```

Never translate:

```text
missing model output
```

into:

```text
non_fact
```

No-model-output is not a semantic classification.

---

## 24. Atlas-Owned Finalization

The model must not create:

```text
Atlas candidate IDs
page numbers
locator types
locator IDs
evidence refs
source inventory identity
semantic-v1 envelope
workspace identity
persistence identity
review identity
```

Atlas spike code owns those.

Candidate IDs must be deterministic for the fixture, for example:

```text
spike.s1.c1
spike.s2.c1
spike.s4.c1
```

Random IDs are prohibited.

---

## 25. Evidence Construction

Evidence must come from the trusted source-slot mapping, never from provider paraphrase.

For S2, Atlas should construct evidence equivalent to:

```json
{
  "page_number": 1,
  "locator_type": "text_block",
  "locator_id": "spike-text-002",
  "excerpt": "Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan."
}
```

The provider normalized meaning is not evidence.

---

## 26. Source Wording

When final semantic-v1 includes source wording, use the exact authorized source text.

For S2:

```text
Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.
```

Do not replace trusted source wording with the model's translation.

---

## 27. S4 Question Finalization

The semantic screen tests whether the model detects unresolved uncertainty.

It does not test free-form question-writing quality.

When S4 correctly returns:

```text
disposition = uncertain
kind = unresolved
needs_resolution = true
uncertainty_reason = condition for approval is unspecified
```

Atlas may deterministically construct the controlled spike question:

```text
Under what condition is approval required before processing?
```

with a deterministic reason equivalent to:

```text
The source states that approval may be required but does not identify the triggering condition.
```

Atlas must attach trusted S4 evidence.

This is allowed only because the controlled fixture already defines the expected missing semantic dimension.

The report must explicitly state:

> ORSEMSPIKE-001 does not qualify general production question generation.

Do not generalize this spike helper into production question synthesis without a separate design decision.

---

## 28. Candidate Payload

Use:

```json
{}
```

for final candidate payloads unless the unchanged semantic-v1 parser requires an already-established bounded representation.

The report must state:

> Candidate payload semantics were not qualified by ORSEMSPIKE-001.

Do not invent a new payload strategy during model screening.

---

## 29. Final Semantic-v1 Validation

For every semantically acceptable provider proposal, Atlas must build the final result and call the real current:

```ts
parseSemanticExtractionResult(...)
```

from the existing Atlas contracts package.

No copied parser.
No Python clone.
No weakened schema.
No alternative "equivalent" validator.

The existing parser is the final contract boundary.

A model cannot be a Phase 1 survivor unless its proposal can cross this boundary without Atlas inventing the model's missing semantic judgment.

---

## 30. Frozen Prompt

All candidate models must receive materially the same semantic instructions.

Do not tune the prompt per model during ORSEMSPIKE-001.

The prompt must include the equivalent of:

```text
You receive only authorized source slots.

Interpret only supplied text.

Use only the allowed dispositions and Atlas semantic kinds.

Preserve numbers, modality, negation, actors, objects, scope, and uncertainty.

Do not treat headings as business facts merely because they contain semantic-looking words.

Do not resolve ambiguity the source does not resolve.

Every source slot must appear exactly once.

Do not omit a source.

Do not manufacture Atlas IDs.

Do not infer accepted truth.

Do not perform reconciliation.

Do not decide supersession.

Return only the requested structured result.
```

Model-specific prompt rescue is out of scope.

If a model fails this common bounded prompt, record the failure and eliminate it.

A later model-specific optimization experiment may be separately authorized if there is a compelling reason.

---

## 31. Phase 1 Screening Algorithm

For each preflight-eligible configured model:

1. verify remaining request budget;
2. issue exactly one request;
3. record route/model/metrics;
4. validate structured response;
5. validate exact source accounting;
6. evaluate S1-S4 semantic expectations;
7. if semantic expectations pass, run Atlas finalization;
8. run real semantic-v1 parser;
9. classify the model.

Phase 1 statuses:

```text
PHASE1_PASS
SEMANTIC_FAIL
CONTRACT_FAIL
ROUTE_UNAVAILABLE
PREFLIGHT_INELIGIBLE
HARNESS_ERROR
NOT_TESTED_BUDGET
```

Only:

```text
PHASE1_PASS
```

may enter Phase 2.

Do not retry a failed Phase 1 request.

---

## 32. Phase 2 Confirmation Algorithm

Each Phase 1 survivor receives two more requests using:

```text
same fixture
same prompt
same JSON Schema
same exact model slug
same routing requirements
same max output configuration
```

The three total runs must be compared semantically.

Natural-language phrasing does not need to be byte-identical.

The model qualifies only if:

```text
Run 1 = PASS
Run 2 = PASS
Run 3 = PASS
```

A material semantic failure in any confirmation run means:

```text
NOT_QUALIFIED_FOR_RECONSPIKE
```

Do not majority-vote a 2/3 result into qualification.

The point of Phase 2 is to reject unstable semantic behavior before spending requests on reconciliation.

---

## 33. Semantic PASS Conditions Per Run

A run passes only when all of the following are true.

### S1

```text
candidate
workflow_step
customer submits order meaning preserved
needs_resolution = false
```

### S2

```text
candidate
constraint
customer preserved
maximum 2 preserved
product preserved
per-order scope preserved
needs_resolution = false
```

### S3

```text
non_fact
heading-only / structural-context meaning preserved
no business candidate created
```

### S4

```text
uncertain
unresolved
needs_resolution = true
missing approval condition recognized
no condition invented
```

### Integrity

```text
all four slots exactly once
no unknown slot
no duplicate slot
strict intermediate schema valid
Atlas finalizer succeeds
real parseSemanticExtractionResult(...) succeeds
evidence remains Atlas/source-owned
no Atlas semantic contract changed
```

---

## 34. Model Qualification Result

A model is:

```text
QUALIFIED_FOR_RECONSPIKE
```

only if all three equivalent runs pass.

A model is:

```text
NOT_QUALIFIED_FOR_RECONSPIKE
```

if any completed semantic run has a material semantic or contract failure.

A route may instead be:

```text
ROUTE_UNAVAILABLE
```

when meaningful model evaluation could not occur due to gateway/provider conditions.

Do not label route unavailability as semantic model failure.

---

## 35. Do Not Automatically Start RECONSPIKE

ORSEMSPIKE-001 ends after semantic screening and reporting.

Even if one or more models qualify:

```text
do not start reconciliation automatically
```

Produce the qualified shortlist and stop.

The human selects the model route for:

```text
RECONSPIKE-001
```

This preserves RPD and keeps reconciliation as a separately authorized experiment.

---

## 36. Survivor Comparison

Correctness is a hard gate.

Only models with:

```text
QUALIFIED_FOR_RECONSPIKE
```

may be compared on secondary metrics.

Record:

```text
input tokens
output tokens
total tokens when available
latency
reported cost when available
underlying endpoint/provider provenance when available
structured-output success
```

Do not trade semantic correctness for lower cost.

If several models qualify, the report may sort or summarize survivors by deterministic operational measures such as:

```text
lower observed cost
lower output-token use
lower median latency
```

but must preserve the raw measurements.

The spike should not automatically choose a production model.

---

## 37. Output Token Bound

Keep provider output deliberately small.

Use a bounded max output appropriate for the four-source structured result.

Preferred starting ceiling:

```text
1200 output tokens
```

If the OpenRouter/model API expresses the limit differently, use the closest supported equivalent and record it.

Do not request long explanations or chain-of-thought.

The response should contain only the structured semantic proposal.

---

## 38. Request Ledger

Maintain an ignored local request ledger, for example:

```text
.atlas-data/openrouter-semantic-screen/request-ledger.json
```

Each dispatched inference attempt must append or atomically record:

```text
timestamp
spike ID
model slug
phase
run number
request ordinal
HTTP status
terminal local classification
```

Never record:

```text
API key
Authorization header
secret environment values
```

Before dispatch, the runner must count the spike's current inference attempts and refuse to exceed:

```text
30
```

Do not rely on memory or console history for RPD accounting.

---

## 39. Local Artifacts

Generated artifacts must stay in an ignored directory such as:

```text
.atlas-data/openrouter-semantic-screen/
```

Suggested layout:

```text
fixture.normalized.json
models.resolved.json
request-ledger.json

<safe-model-id>/
|-- phase1-run1.provider.json
|-- phase1-run1.semantic-v1.json
|-- phase1-run1.metrics.json
|-- phase2-run2.provider.json
|-- phase2-run2.semantic-v1.json
|-- phase2-run2.metrics.json
|-- phase2-run3.provider.json
|-- phase2-run3.semantic-v1.json
`-- phase2-run3.metrics.json

summary.json
```

Sanitize model slugs for filesystem paths.

Do not commit provider raw outputs unless the ticket explicitly authorizes a redacted evidence artifact.

---

## 40. Suggested Spike Code

Prefer isolated code under:

```text
scripts/openrouter-semantic-screen/
```

Suggested files:

```text
fixture.ts
models.ts
model-capabilities.ts
intermediate-schema.ts
openrouter-client.ts
prompt.ts
budget.ts
finalize.ts
evaluate.ts
run.ts
README.md
```

This is a feasibility harness.

Do not import spike code into production runtime.

---

## 41. Production Isolation

ORSEMSPIKE-001 must not modify production provider routing.

Do not:

```text
add OpenRouter as active production provider
change semantic-worker provider route
change queue behavior
change BSS-V2 qualification state
change IDSER ticket state
change persistence
activate a fallback
replace Gemini route
replace Mistral route
```

Production adoption requires separate work after semantic and reconciliation feasibility are proven.

---

## 42. Explicit Non-Goals

Out of scope:

```text
full Safara extraction
full PRD token/cost measurement
reconciliation
Knowledge Index
embeddings
vector database
retrieval
Main Workflow
Project Facts
Project Context
CES Result
chatbot
production question generation
database persistence
candidate repository changes
queue integration
pg-boss changes
replay/fencing changes
publication
Master
human review UI
provider fallback
subscription economics
customer pricing
production OpenRouter adapter activation
production Gemini migration
production model auto-routing
prompt tuning per model
fine-tuning
```

---

## 43. Privacy Scope

The spike uses only the synthetic controlled fixture.

Do not send real customer data or confidential PRDs.

Therefore this experiment does not qualify production privacy behavior.

If OpenRouter exposes provider data-policy filtering, it may be recorded as future production-routing capability, but changing provider/privacy routing must not consume semantic-screen requests unnecessarily.

Production privacy qualification belongs to separate architecture work.

---

## 44. Failure Classification

Keep failures precise.

### SEMANTIC_FAIL

Use when the provider returned a valid proposal but meaning is materially wrong.

Examples:

```text
S2 -> rule instead of constraint
2 changed to another number
per-order scope lost
S3 heading promoted to fact
S4 treated as definite condition
S4 uncertainty resolved by invention
```

### CONTRACT_FAIL

Use when the provider response violates the small transport contract.

Examples:

```text
missing slot
duplicate slot
unknown slot
invalid disposition
invalid candidate kind
malformed structured result
```

### ROUTE_UNAVAILABLE

Use when meaningful model evaluation did not occur because of external serving conditions.

Examples:

```text
429
provider outage
model unavailable
no compatible endpoint
gateway failure
hard quota
```

### PREFLIGHT_INELIGIBLE

Use when metadata proves before inference that the exact route cannot satisfy the frozen request.

This should consume zero RPD.

### HARNESS_ERROR

Use when Atlas local spike code is wrong or cannot evaluate a response due to a local implementation defect.

A harness defect must not be blamed on the model.

---

## 45. Overall Spike Terminal Classification

The ORSEMSPIKE-001 report must end with one of:

```text
PASS
PASS_WITH_LIMITS
FAIL
ENVIRONMENT_BLOCKED
```

### PASS

Use when:

```text
at least one exact model route is QUALIFIED_FOR_RECONSPIKE
the screening harness is valid
the 30-request budget was respected
Atlas contracts remained unchanged
```

### PASS_WITH_LIMITS

Use when at least one model qualifies, but a non-blocking operational limitation materially affects interpretation, for example:

```text
one intended candidate was route-unavailable
provider provenance was not returned
a candidate was preflight-ineligible
```

The qualifying model must still have passed all three semantic runs.

### FAIL

Use when meaningful screening occurred but no tested model qualifies.

This is a valid spike outcome.

Do not weaken the fixture or semantic contract to force a PASS.

### ENVIRONMENT_BLOCKED

Use only when no meaningful semantic screening can occur because of external conditions such as:

```text
invalid OpenRouter credential
account-wide hard quota
network failure
OpenRouter outage
all configured routes inaccessible before semantic evaluation
```

---

## 46. Review Contract

| Row | Required proof | PASS condition |
| --- | --- | --- |
| `RC-ORSEMSPIKE-001-01` | Existing controlled input crosses the real `parseNormalizedDocument(...)` boundary. | No alternate perception contract is introduced. |
| `RC-ORSEMSPIKE-001-02` | Model shortlist is explicit, exact, bounded to at most 10 slugs, and preflight filters ineligible routes without inference. | No auto router, duplicate slug, or uncontrolled discovery call consumes semantic RPD. |
| `RC-ORSEMSPIKE-001-03` | Request budget and retry controls are enforced. | Maximum 30 inference attempts, concurrency 1, no automatic retries, durable local ledger. |
| `RC-ORSEMSPIKE-001-04` | Every tested model receives the same bounded fixture, prompt, and small structured contract. | No model-specific prompt rescue or weakened schema. |
| `RC-ORSEMSPIKE-001-05` | Each run preserves mandatory S1-S4 semantic decisions and exact source accounting. | No material semantic deviation, missing slot, duplicate slot, or unknown slot. |
| `RC-ORSEMSPIKE-001-06` | Atlas owns identity, evidence, source wording, final question construction for the controlled fixture, and semantic-v1 assembly. | Provider output cannot become Atlas truth directly. |
| `RC-ORSEMSPIKE-001-07` | Every Phase 1 survivor receives exactly two additional equivalent confirmation calls. | Qualified model has three semantic PASS runs. |
| `RC-ORSEMSPIKE-001-08` | Every acceptable proposal crosses the real unchanged `parseSemanticExtractionResult(...)` boundary. | No copy, clone, or weakened semantic parser. |
| `RC-ORSEMSPIKE-001-09` | Results are reported per exact model identity with tokens, latency, route outcome, and cost when available. | Failures are not hidden by Atlas repair. |
| `RC-ORSEMSPIKE-001-10` | Production code and downstream Atlas behavior remain unchanged. | No production OpenRouter activation, reconciliation, Knowledge Index, persistence, or full-Safara work. |

---

## 47. Required Evaluation Matrix

The report must contain one row per model.

Example:

| Model | Preflight | Run 1 | Run 2 | Run 3 | Requests used | Qualification |
| --- | --- | --- | --- | --- | ---: | --- |
| exact/model-a | eligible | PASS | PASS | PASS | 3 | QUALIFIED_FOR_RECONSPIKE |
| exact/model-b | eligible | S4 FAIL | - | - | 1 | NOT_QUALIFIED |
| exact/model-c | ineligible | - | - | - | 0 | PREFLIGHT_INELIGIBLE |

For each executed run include a source matrix:

| Source | Expected | Observed | Status |
| --- | --- | --- | --- |
| S1 | `workflow_step` | actual | PASS/FAIL |
| S2 | `constraint`, max 2 products per order | actual | PASS/FAIL |
| S3 | `non_fact`, structural heading | actual | PASS/FAIL |
| S4 | `uncertain` + `unresolved`, approval condition missing | actual | PASS/FAIL |

Also include:

| Integrity requirement | Status |
| --- | --- |
| All four source slots accounted | PASS/FAIL |
| No unknown slot | PASS/FAIL |
| No duplicate slot | PASS/FAIL |
| Numeric value `2` preserved | PASS/FAIL |
| `per order` scope preserved | PASS/FAIL |
| Uncertainty preserved | PASS/FAIL |
| Atlas evidence copied from trusted source | PASS/FAIL |
| Real semantic-v1 parser accepts finalization | PASS/FAIL |
| Existing semantic contracts unchanged | PASS/FAIL |

---

## 48. Metrics

Record per inference attempt:

```text
exact model slug
phase
run number
HTTP status
latency
input tokens if returned
output tokens if returned
reasoning tokens if separately returned
total tokens if returned
reported cost if returned
underlying provider/endpoint if returned
structured-output mode
semantic result
local classification
```

Record aggregate per qualifying model:

```text
3-run total input tokens
3-run total output tokens
3-run total reported cost
median latency
semantic consistency
```

Do not estimate missing token or cost values as if they were provider-reported facts.

---

## 49. GO / CK / CFC / HMN Workflow Guidance

This spike must remain friendly to the established Atlas workflow.

### GO

GO owns:

```text
bounded harness implementation
preflight
request-budget enforcement
one-call screening
survivor confirmation
deterministic finalization
local evidence
report preparation
```

GO must not keep making model calls merely to obtain a preferred outcome.

Once the frozen budgeted experiment reaches a terminal classification, GO should prepare CK evidence.

### CK

CK reviews:

```text
the frozen fixture
the frozen prompt
the candidate config
budget enforcement
request ledger
per-model raw/redacted evidence
semantic evaluation
Atlas finalization
real parser evidence
terminal classification
```

A model FAIL is not automatically a ticket defect.

CK must distinguish:

```text
valid experimental FAIL
from
bad harness / bad evidence
```

### CFC

CFC may remediate:

```text
local harness defects
missing deterministic tests
incorrect budget accounting
broken finalizer logic
missing report evidence
```

CFC must not:

```text
change the fixture expectation
weaken ontology requirements
add retries
increase RPD budget
tune prompts for a failed model
switch model identity
```

unless HMN explicitly authorizes a scope change.

### HMN

HMN is required for:

```text
increasing the 30-request budget
adding more than 10 models
adding or switching a model after execution has begun
changing the common prompt materially
changing the intermediate semantic contract materially
allowing a paid route
rerunning a model after route failure
changing semantic expectations
authorizing a follow-up model-specific experiment
```

HMN should not be used merely to convert a legitimate model FAIL into more attempts.

---

## 50. Security and Authority Boundaries

### BOUNDARY-ORSEMSPIKE-001-SOURCE

Only the synthetic four-source fixture may be sent to OpenRouter.

### BOUNDARY-ORSEMSPIKE-001-AUTHORITY

OpenRouter and candidate models provide semantic proposals only.

They cannot create:

```text
accepted Atlas truth
review decisions
resolved knowledge
publication state
Master state
```

### BOUNDARY-ORSEMSPIKE-001-IDENTITY

Provider output never owns Atlas evidence or persistence identity.

### BOUNDARY-ORSEMSPIKE-001-SECRETS

Only:

```text
OPENROUTER_API_KEY
```

is required for live inference.

It must remain environment-only and redacted.

### BOUNDARY-ORSEMSPIKE-001-BUDGET

The experiment may not exceed:

```text
30 dispatched inference requests
```

without explicit human authorization.

### COUPLING-ORSEMSPIKE-001-PRODUCTION

Spike code must not be imported by production runtime code.

---

## 51. Required Local Tests Before First Inference

Before spending any RPD, prove locally:

```text
controlled fixture passes real parseNormalizedDocument(...)
intermediate schema accepts a known-good proposal
intermediate schema rejects missing slot
intermediate schema rejects duplicate slot
intermediate schema rejects unknown slot
intermediate schema rejects unknown kind
S2 wrong kind is detected
S4 condition-vs-unresolved failure is detected
Atlas finalizer creates trusted evidence
Atlas finalizer constructs controlled S4 question
known-good final result passes real parseSemanticExtractionResult(...)
request budget blocks attempt 31
model config rejects >10 enabled models
model config rejects duplicate slugs
model config rejects auto-router slugs
automatic retry is disabled
secret redaction test passes
```

Do not spend inference requests while basic local harness defects remain.

---

## 52. Required Execution Order

Execute in this order:

```text
1. inspect current Atlas contracts
2. build controlled NormalizedDocument fixture
3. prove fixture locally
4. build and test small intermediate schema
5. build and test deterministic finalizer
6. build model config validation
7. build request ledger and 30-request hard cap
8. build OpenRouter preflight
9. resolve candidate eligibility
10. freeze eligible candidate list
11. Phase 1: one call per eligible model
12. eliminate failures immediately
13. Phase 2: exactly two more calls per survivor
14. finalize all acceptable proposals through real semantic-v1 parser
15. produce comparison report
16. stop
```

Do not start RECONSPIKE-001 in the same GO cycle.

---

## 53. Recommended Candidate Strategy

The implementation context does not freeze specific model names because OpenRouter's model catalog changes.

The human or ticket author should choose up to 10 exact current slugs before execution.

Prefer a diverse but relevant shortlist:

```text
models advertised for strong structured output
models capable of multilingual text understanding
small/cheap models
one or two stronger reference models if available
free variants where practical
```

Do not fill all 10 slots merely because 10 are allowed.

A smaller high-signal shortlist is preferable.

Candidate discovery itself should not consume inference requests.

---

## 54. No Hidden Model Rescue

The following behavior is prohibited:

```text
Model A fails S4.
Change prompt specifically for Model A.
Run again.
Model A now passes.
Call that the same ORSEMSPIKE result.
```

That is a new experiment.

ORSEMSPIKE-001 compares models against one frozen contract.

If later evidence suggests a promising model only needs a different prompt strategy, authorize a separate:

```text
model-specific prompt-qualification spike
```

Do not contaminate the screening result.

---

## 55. Stop Conditions

Stop rather than expanding scope if completion would require:

```text
changing NormalizedDocument v1
changing semantic-v1
changing production semantic-worker behavior
adding production OpenRouter routing
building reconciliation
building Knowledge Index
adding embeddings
processing full Safara
adding persistence
adding queue behavior
changing review authority
adding more than 10 models
exceeding 30 inference attempts
model-specific prompt tuning
automatic retry
```

Record the required expansion as:

```text
SCOPE_CHANGE_REQUIRED
```

and stop the spike.

---

## 56. Required Report

Produce:

```text
project's goal/feedback/ORSEMSPIKE-001-openrouter-semantic-model-screening.md
```

The report header must include:

```text
ORSEMSPIKE-001 RESULT: <PASS | PASS_WITH_LIMITS | FAIL | ENVIRONMENT_BLOCKED>

Gateway: OpenRouter
Configured model count: <n>
Preflight-eligible model count: <n>
Inference request budget: 30
Inference requests consumed: <n>
Automatic retries: disabled

Docling perception changed: no
NormalizedDocument v1 changed: no
Semantic v1 changed: no
Production semantic worker changed: no
Production provider route changed: no
Knowledge Index implemented: no
Reconciliation tested: no
Full Safara processed: no
```

Then include:

```text
fixture summary
candidate list
preflight result
request ledger summary
per-model phase result
per-run source matrices
semantic-v1 finalization result
parser result
token usage
latency
reported cost
route limitations
qualified shortlist
terminal classification
next recommendation
```

---

## 57. Next Stage After PASS

If at least one model is:

```text
QUALIFIED_FOR_RECONSPIKE
```

the next architecture step is not production adoption.

It is:

```text
RECONSPIKE-001
```

using one human-selected qualified model route.

Conceptually:

```text
Docling
   |
   v
NormalizedDocument
   |
   v
ORSEMSPIKE-001
   |
   v
qualified semantic model shortlist
   |
   v
human selects one route
   |
   v
RECONSPIKE-001
   |
   +-- FAIL -> stop / reconsider
   |
   `-- PASS
         |
         v
full Safara development run
         |
         v
measure real tokens + latency + cost
         |
         v
production-provider/economics decision
```

Do not pay for large-scale Atlas workloads before semantic and reconciliation feasibility are proven.

---

## 58. Relationship to Gemini

Gemini may be one or more candidates if an exact current Gemini model slug is available through OpenRouter and satisfies preflight.

However ORSEMSPIKE-001 must not assume Gemini wins.

Likewise it must not assume Groq, OpenAI, Anthropic, Qwen, DeepSeek, Mistral, or another family wins.

The screening principle is:

> The model must prove that it can satisfy Atlas's bounded semantic reasoning need. Atlas should not be redesigned merely to accommodate the first provider tested.

If a Gemini model qualifies and later direct-Google economics are attractive, Atlas may separately compare:

```text
same model family through OpenRouter
vs
direct Gemini route
```

That is not part of ORSEMSPIKE-001.

---

## 59. Completion Definition

ORSEMSPIKE-001 is complete when all of the following are true:

```text
Docling remains untouched as perception choice
the four-source fixture passes real perception validation
candidate list is explicit and <= 10 models
preflight avoids known-incompatible routes
request ledger exists
30-request hard cap is enforced
automatic retries are disabled
Phase 1 uses one request per eligible model
only Phase 1 survivors receive two confirmation requests
all executed proposals are evaluated honestly
Atlas owns final identity/evidence/question construction
acceptable proposals cross the unchanged semantic-v1 parser
qualified models have 3/3 semantic PASS runs
production runtime remains unchanged
RECONSPIKE is not started automatically
the final report is CK-ready
```

A terminal FAIL with correct evidence is a completed spike.

The purpose is to cheaply discover whether any candidate model is good enough before Atlas spends more requests, engineering effort, or money.

---
