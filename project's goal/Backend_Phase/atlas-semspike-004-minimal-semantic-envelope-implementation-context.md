# Atlas SEMSPIKE-004 Implementation Context

## 1. Purpose

`SEMSPIKE-004` is the next bounded semantic experiment after the corrected free-form `SEMTRACE-001` execution.

The corrected SEMTRACE result established, for the frozen S1-S4 fixture, that Groq `openai/gpt-oss-120b` can preserve the intended raw meaning in ordinary natural language, including the S4 distinction:

```text
Approval may be required before processing.
!=
Approval is required before processing.
```

`SEMSPIKE-004` asks the next, narrower question:

> **Can the same model preserve that free-form semantic quality while packaging the result into the smallest practical machine-readable envelope, without forcing it into Atlas concepts or provider-enforced semantic categories?**

This experiment does **not** test the final Atlas extraction contract.

This experiment does **not** test deterministic Atlas compilation.

This experiment does **not** test reconciliation, batching, large PRDs, embeddings, retrieval, RPD economics, or production integration.

A failure is a valid completed result.

---

## 2. Experimental hypothesis

The working hypothesis is:

```text
Natural-language comprehension                    PASS
        |
        v
Minimal semantic packaging                        ?
        |
        v
Atlas-oriented semantic/application contract      NOT TESTED HERE
```

`SEMSPIKE-004` tests only the middle layer.

The experiment intentionally preserves semantic content as ordinary natural-language text and adds only a small container:

```text
slot
structural_only
meaning
qualifications[]
unspecified[]
```

No semantic enums are allowed.

No Atlas-facing classifications are allowed.

---

## 3. Important correction from earlier experiments

Do **not** repeat the SEMTRACE-001 design mistake.

Provider-enforced strict structured output is **not** used in this experiment.

The Groq request MUST NOT include:

```text
response_format
json_schema
strict JSON Schema
tools
function calls
provider-enforced semantic enums
```

The model is asked by instruction to return JSON, but generation is ordinary unconstrained text generation.

This distinction is deliberate.

The question is:

```text
Can GPT-OSS package its understanding into a tiny JSON envelope?
```

not:

```text
Can constrained decoding force GPT-OSS through another semantic schema?
```

If the model cannot return valid JSON reliably under this minimal instruction, that is experimental evidence rather than something to repair with provider-enforced schema.

---

## 4. Frozen provider configuration

Use:

```text
provider: Groq
model: openai/gpt-oss-120b
stream: false
reasoning_effort: medium
tools: none
response_format: omitted
live runs: exactly 2
```

Use only the existing environment credential:

```text
GROQ_API_KEY
```

Do not print, persist, log, commit, or include the API key or Authorization header in reports or evidence.

No adaptive retry is allowed.

No prompt mutation between run 1 and run 2 is allowed.

---

## 5. Frozen source fixture

Use the same exact S1-S4 source text already used by SEMSPIKE-002, SEMSPIKE-003, and SEMTRACE-001:

```text
S1
The customer submits an order.

S2
Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.

S3
3.2 Purchase Rules

S4
Approval may be required before processing.
```

Where practical, continue to validate the frozen fixture through the real existing:

```text
parseNormalizedDocument(...)
```

Do not modify Docling output, source wording, source identifiers, or normalized-document semantics.

---

## 6. FROZEN GPT-OSS SYSTEM INSTRUCTION

The following instruction is supplied by planning authority.

Codex MUST use it verbatim.

Codex MUST NOT:

- rewrite it;
- strengthen it;
- shorten it;
- expand it;
- add examples;
- add expected S1-S4 answers;
- append hidden semantic rules;
- add Atlas terminology;
- add provider-specific schema coaching;
- change it between runs.

### Exact instruction

```text
You are performing a bounded semantic-packaging experiment.

Your task is to preserve the meaning of each supplied source while expressing that meaning inside a minimal JSON envelope.

First understand the source in ordinary language. Then place that meaning into the requested fields without converting it into application-specific categories.

Use only the supplied text. Do not use outside knowledge or probable business practice. Do not invent actors, requirements, conditions, causes, thresholds, intent, or outcomes that are not expressed.

For each source:
- `slot` copies the supplied slot identifier.
- `structural_only` is true only when the source is purely structural text such as a heading, title, label, numbering, or navigation and does not itself state a business proposition.
- `meaning` is a faithful ordinary-language statement of what the source says. Preserve uncertainty, possibility, negation, quantities, scope, temporal ordering, exceptions, and other qualifiers. Use an empty string only when `structural_only` is true.
- `qualifications` contains ordinary-language qualifications that materially limit or modify the meaning already present in the source. Do not invent qualifications.
- `unspecified` contains ordinary-language descriptions of relevant information that the source itself leaves open or unspecified. Do not answer that missing information.

Do not classify the result into Atlas concepts, predefined semantic categories, ontology types, workflow kinds, constraints, candidates, dispositions, resolution states, canonical states, or any other application schema.

Do not strengthen or weaken the source. In particular, do not convert may to must, possibility to obligation, permission to prediction, examples to requirements, or descriptive statements to normative rules.

Do not treat temporal ordering as an applicability condition merely because it contains words such as before or after.

Return only one JSON object with exactly this shape:

{
  "observations": [
    {
      "slot": "S1",
      "structural_only": false,
      "meaning": "...",
      "qualifications": ["..."],
      "unspecified": ["..."]
    }
  ]
}

Return exactly one observation for every supplied source slot, in source order. Do not omit, duplicate, or invent slots.

The JSON itself is only a container. Keep semantic content in ordinary natural language inside the text fields.
```

### Integrity fingerprint

UTF-8 SHA-256:

```text
c80d619bf5272fd104029e1b466b1b597deeaf16d8e67b47658ff7cb78c90edd
```

The harness must verify this hash before either live call.

A hash mismatch invalidates the experiment and must stop execution without a semantic verdict.

---

## 7. User-message boundary

The user message sent to GPT-OSS must contain source data only.

Use a shape equivalent to:

```json
{
  "sources": [
    {
      "slot": "S1",
      "text": "The customer submits an order."
    },
    {
      "slot": "S2",
      "text": "Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan."
    },
    {
      "slot": "S3",
      "text": "3.2 Purchase Rules"
    },
    {
      "slot": "S4",
      "text": "Approval may be required before processing."
    }
  ]
}
```

Do not include:

- the semantic oracle;
- expected S4 wording;
- Atlas rules;
- candidate kinds;
- examples of desired answers;
- clarification questions;
- semantic labels.

---

## 8. Minimal semantic envelope

The only allowed output shape is:

```ts
interface MinimalSemanticObservation {
  slot: "S1" | "S2" | "S3" | "S4";
  structural_only: boolean;
  meaning: string;
  qualifications: string[];
  unspecified: string[];
}

interface MinimalSemanticEnvelope {
  observations: MinimalSemanticObservation[];
}
```

This TypeScript representation is a local parser contract only.

It is **not** sent as provider-enforced JSON Schema.

### Field meaning

`slot`

```text
Source identity only.
No semantic meaning.
```

`structural_only`

```text
Whether the source is purely structural text and expresses no business proposition.
```

`meaning`

```text
The model's ordinary-language description of what the source says.
```

`qualifications`

```text
Ordinary-language qualifiers already expressed by the source that materially limit or modify the meaning.
```

`unspecified`

```text
Ordinary-language descriptions of relevant information that the source leaves open.
```

The text fields remain free semantic language.

They are deliberately **not** enums.

---

## 9. Explicitly prohibited fields and concepts

Do not add:

```text
epistemic_status
polarity
conditionality
condition_type
semantic_role enum
actor enum
action enum
relationship enum
ontology type
workflow_step
constraint
rule
state
transition
candidate
kind
disposition
unresolved
needs_resolution
question
question_reason
evidence
Atlas ID
canonical state
accepted fact
conflict
winner
supersession
reconciliation
publication state
Main Workflow
Project Facts
CES Result
```

If Codex believes one of these is required, stop as `SCOPE_CHANGE`.

Do not silently expand the envelope.

---

## 10. Local parsing and validation boundary

Local code may parse the model's text as JSON and validate only the minimal transport/container contract.

Allowed deterministic validation:

- response exists;
- response parses as JSON;
- top-level object contains `observations`;
- exactly four observations;
- exactly one each for S1, S2, S3, S4;
- source order preserved;
- `slot` is authorized;
- `structural_only` is boolean;
- `meaning` is string;
- `qualifications` is string array;
- `unspecified` is string array;
- no additional fields;
- S3 structural shape may require:
  - `structural_only = true`;
  - `meaning = ""`;
- non-structural observations may require:
  - `structural_only = false`;
  - non-empty `meaning`;
- credential/header safety.

Local code MUST NOT:

- rewrite provider text;
- move text between fields;
- infer missing qualifications;
- convert prose into enums;
- classify certainty;
- classify polarity;
- classify conditions;
- create Atlas candidates;
- repair malformed JSON;
- issue a corrective retry;
- call another model.

If the JSON is malformed or the envelope shape is invalid, preserve the raw response and record the run as a packaging failure.

Do not repair it.

---

## 11. Frozen semantic oracle

Evaluation is semantic, not exact-string matching.

### S1

Source:

```text
The customer submits an order.
```

Required meaning:

- customer is preserved;
- submission action is preserved;
- order is preserved;
- no invented uncertainty;
- no invented condition.

Expected container behavior:

```text
structural_only = false
meaning faithfully states the proposition
qualifications may be empty
unspecified should be empty
```

### S2

Source:

```text
Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.
```

Required meaning:

- customer/pelanggan preserved;
- purchasing preserved;
- maximum quantity exactly `2`;
- product object preserved;
- single-order / per-order scope preserved;
- no weakening into a vague purchase statement.

Indonesian or English semantic wording is acceptable.

Expected container behavior:

```text
structural_only = false
meaning preserves the restriction
qualifications may state the exact maximum and per-order scope
unspecified should not invent missing information
```

### S3

Source:

```text
3.2 Purchase Rules
```

Required meaning:

- structural heading only;
- no business proposition invented.

Required container behavior:

```text
structural_only = true
meaning = ""
qualifications = []
unspecified = []
```

### S4 — primary diagnostic target

**Human-authorized clarification:** `HMN-SEMSPIKE-004-001 — CLARIFY_S4_ENVELOPE_SEMANTICS` clarifies only the semantic evaluation boundary for S4. Evaluate the combined content of `meaning`, `qualifications`, and `unspecified` across the complete observation. Do not require semantic information to occupy a particular text field.

Source:

```text
Approval may be required before processing.
```

**PASS** when the combined semantic content of `meaning`, `qualifications`, and `unspecified` preserves all of the following:

1. Approval is possibly/maybe required rather than definitely, unconditionally, or always required.
2. `Before processing` is temporal ordering: if approval is required, it precedes processing.
3. The response does not convert the sentence into an unconditional approval requirement.
4. The response does not reinterpret `before processing` as the applicability condition governing whether approval is required.
5. The response does not invent a hidden condition, trigger, circumstance, actor, or answer absent from the source.

The response may explicitly say the source leaves applicability open, such as whether or under what circumstances approval is required. `unspecified` need not be non-empty when the same uncertainty is faithfully preserved in `meaning` or `qualifications`. Judge semantic preservation across the entire observation; do not enforce semantic field placement.

These examples are oracle/evaluation guidance only and MUST NOT be sent to GPT-OSS:

```json
{
  "slot": "S4",
  "structural_only": false,
  "meaning": "Approval might be required before processing.",
  "qualifications": ["The text does not say approval is always required."],
  "unspecified": []
}
```

```json
{
  "slot": "S4",
  "structural_only": false,
  "meaning": "Approval might be required before processing.",
  "qualifications": ["Approval, when required, occurs before processing."],
  "unspecified": ["Whether or under what circumstances approval is required."]
}
```

The central oracle is possible requirement plus temporal ordering and no invented applicability; that semantic content may appear across any of the three text fields.

---

## 12. Two-run execution protocol

Perform exactly two authenticated live calls.

Both calls must use identical:

- model;
- provider;
- reasoning effort;
- instruction;
- input;
- absence of provider-enforced schema;
- absence of tools/functions.

Record redacted metrics:

```text
provider
model
HTTP status
latency
input tokens
output tokens
reasoning_effort
instruction SHA-256
source count
structured-output mode = none
```

Preserve raw model text before parsing.

No adaptive retry.

No "please fix your JSON" second pass.

No fallback provider.

No second model.

---

## 13. Terminal classification

Use exactly one:

```text
PASS
PASS_WITH_LIMITS
FAIL
ENVIRONMENT_BLOCKED
```

### PASS

Both live runs must:

1. return valid parseable JSON;
2. satisfy the minimal envelope contract;
3. preserve S1-S4 semantics;
4. preserve S4's possibility, temporal relation, and lack of an invented applicability condition across the combined `meaning`, `qualifications`, and `unspecified` content; `unspecified` may be empty when the uncertainty is preserved elsewhere;
5. introduce no Atlas-facing classification.

Interpretation:

```text
GPT-OSS can preserve the bounded free-form semantic understanding
inside the minimal machine-readable envelope without provider-enforced schema.
```

This permits planning the next experiment.

It does **not** prove Atlas extraction readiness.

### PASS_WITH_LIMITS

Both runs must still satisfy the complete S1-S4 semantic oracle.

Use only for a material non-oracle limitation.

Do not use this verdict to excuse malformed JSON or an S4 miss.

### FAIL

Use when any authenticated provider response fails the packaging or semantic oracle, including:

- malformed JSON;
- missing/duplicate/invented slot;
- added forbidden semantic field;
- S3 turned into a business fact;
- S2 loses exact `2` or per-order scope;
- S4 becomes definite;
- S4 loses `before processing`;
- S4 treats temporal ordering as the applicability condition;
- S4 invents a hidden condition;
- model cannot maintain the minimal envelope.

A valid `FAIL` is a completed experiment.

Do not remediate the prompt.

Do not enable strict schema.

Do not add fields.

### ENVIRONMENT_BLOCKED

Use only for genuine provider/environment inability to obtain the scheduled calls, such as:

- credential unavailable;
- provider unreachable;
- request rejected before model output;
- network failure.

Do **not** classify malformed or semantically incorrect model output as `ENVIRONMENT_BLOCKED`.

That is `FAIL`.

---

## 14. Comparison required in the report

The report must compare three stages honestly:

```text
SEMSPIKE-003
Atlas-oriented structured contract
S4 failed

SEMTRACE-001 corrected free-form
ordinary-language interpretation
S1-S4 passed twice

SEMSPIKE-004
minimal JSON envelope without provider-enforced schema
current experiment
```

The report must answer:

> Did adding only a minimal JSON container preserve the semantic quality observed in free-form SEMTRACE-001?

Do not claim more.

---

## 15. Allowed implementation scope

Prefer isolated code:

```text
scripts/groq-semantic-spike-004/
  fixture.mts
  prompt.mts
  parser.mts
  groq-client.mts
  test.mts
  run.mts
```

Suggested ignored evidence path:

```text
.atlas-data/groq-semantic-spike-004/
```

Suggested report:

```text
project's goal/feedback/SEMSPIKE-004-minimal-semantic-envelope.md
```

Suggested ticket:

```text
project's goal/Backend_Phase/tickets/Groq_Spike_Phase/SEMSPIKE-004-minimal-semantic-envelope.md
```

No production application may import the spike.

---

## 16. Explicit non-goals

Do not:

- modify SEMSPIKE-001/002/003;
- rewrite SEMTRACE-001 history;
- modify production extraction;
- modify `NormalizedDocument v1`;
- modify Atlas semantic parser/contracts;
- implement Atlas compiler logic;
- implement reconciliation;
- add embeddings;
- add vector storage;
- add retrieval;
- add batching;
- add large-PDF handling;
- add a local model;
- add a second vendor call;
- switch providers/models;
- optimize RPD yet;
- design final semantic ontology;
- introduce factuality enums;
- introduce application-domain semantic enums.

Stop as `SCOPE_CHANGE` if any of these becomes necessary.

---

## 17. Codex authority boundary

Codex is authorized to implement experiment mechanics only.

Codex is not authorized to redesign:

- the prompt;
- the envelope;
- the semantic oracle;
- the provider configuration;
- the number of runs;
- the fixture;
- the interpretation of PASS/FAIL.

The instruction and semantic envelope are supplied by planning authority.

If Codex finds an internal contradiction, report it and stop.

Do not silently "improve" the experiment.

---

## 18. GO / CK / CFC behavior

This is a bounded diagnostic spike.

A semantic or packaging `FAIL` is a legitimate completed GO outcome and should become CK-reviewable evidence.

CK should review:

- instruction hash;
- fixture integrity;
- provider request shape;
- absence of provider-enforced schema;
- raw response preservation;
- parser non-repair behavior;
- both run metrics;
- semantic oracle evaluation;
- truthful terminal classification;
- credential safety;
- isolation.

CFC/HMN must not be used to tune the model into passing.

Mechanical implementation defects may be repaired.

Model output failures must remain evidence.

---

## 19. Decision after SEMSPIKE-004

If `PASS`:

```text
raw comprehension                        proven for fixture
minimal machine-readable packaging       proven for fixture
```

Only then plan the next experiment:

```text
MinimalSemanticObservation[]
        |
        v
What is the smallest additional semantic structure
needed for deterministic Atlas compilation?
```

Do not jump directly to the old Atlas semantic schema.

If `FAIL`:

```text
free-form understanding works
minimal JSON packaging does not
```

Preserve that result.

Do not automatically enable strict schema or add more fields.

Investigate the representation boundary before changing architecture.

---

## 20. Success definition

The success condition is intentionally narrow:

> **The model expresses the same bounded meaning it already demonstrated in SEMTRACE-001, but now inside a tiny JSON container that ordinary code can parse, without provider-enforced constrained decoding and without Atlas semantic categories.**

Especially for S4:

```text
"Approval may be required before processing."
```

must survive packaging as:

```text
possible requirement
+
approval before processing as temporal ordering
+
no invented applicability condition; uncertainty preserved across the observation
```

without becoming:

```text
definite approval requirement
```

or:

```text
"before processing" = applicability condition
```

That is all SEMSPIKE-004 is allowed to prove.
