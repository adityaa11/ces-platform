# Atlas SEMTRACE-001 Implementation Context

## 1. Purpose

`SEMTRACE-001` is a deliberately tiny diagnostic experiment that follows the frozen `SEMSPIKE-003` result.

Its purpose is to answer exactly one question:

> **Does Groq `openai/gpt-oss-120b` correctly understand the raw semantics of the frozen S1-S4 sources when the Atlas extraction/application contract is removed?**

This is **not** another attempt to make the existing Atlas semantic extraction contract pass.

This is **not** a production implementation.

This is **not** a prompt-tuning tournament.

This experiment exists only to separate two hypotheses:

- **H1 — model semantic-capability failure:** GPT-OSS does not reliably understand the semantic distinction required by S4.
- **H2 — representation/contract loss:** GPT-OSS understands S4, but that meaning is lost when SEMSPIKE-003 requires the model to translate it into Atlas-oriented disposition/kind/resolution fields.

The result must be allowed to fail honestly. A `FAIL` is useful evidence and must not trigger automatic remediation.

---

## 2. Why this experiment exists

`SEMSPIKE-003` already uses a strong faithfulness instruction. It explicitly requires preservation of modality, uncertainty, underspecification, conditions, negation, scope, quantity, temporal ordering, and related qualifiers. It also explicitly prohibits converting possibility into obligation.

Despite that, the frozen semantic oracle still fails at S4:

```text
Approval may be required before processing.
```

The Atlas-facing SEMSPIKE oracle expects this to remain unresolved rather than becoming an ordinary asserted rule.

However, SEMSPIKE-003 asks the model to move directly from source language into an intermediate contract that still contains Atlas-oriented decisions such as:

```text
disposition = uncertain
candidate kind = unresolved
needs_resolution = true
question
question_reason
```

Therefore SEMTRACE-001 removes those concepts completely.

The experiment asks GPT-OSS only:

```text
What meaning is explicitly present in this source?
```

It does **not** ask:

```text
What should Atlas do with that meaning?
```

---

## 3. Frozen baseline

Do not modify or reopen:

- `SEMSPIKE-001`
- `SEMSPIKE-002`
- `SEMSPIKE-003`
- their reports
- their evidence
- their scripts

`SEMSPIKE-003` remains the comparison baseline.

Freeze the provider/runtime settings from SEMSPIKE-003:

```text
provider: Groq
model: openai/gpt-oss-120b
stream: false
reasoning_effort: medium
structured output: strict JSON Schema
live runs: 2
```

Use the existing environment credential:

```text
GROQ_API_KEY
```

Do not log, persist, print, or include the API key or Authorization header in evidence.

---

## 4. Frozen source fixture

Use the same exact four semantic sources used by SEMSPIKE-002/003.

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

The fixture text is immutable for this experiment.

Where practical, reuse the existing frozen fixture through the real existing `parseNormalizedDocument(...)` path so that SEMTRACE receives the same authorized source wording as the previous spikes.

Do not alter perception, Docling output, normalized-document semantics, source wording, or source identifiers to make the model pass.

---

## 5. FROZEN GPT-OSS SYSTEM INSTRUCTION

The following system instruction is **authoritative and immutable for SEMTRACE-001**.

Codex MUST use it **verbatim**.

Codex MUST NOT:

- rewrite it;
- strengthen it;
- shorten it;
- expand it;
- add examples;
- add chain-of-thought requests;
- add Atlas terminology;
- add S1-S4 expected answers;
- add retry-specific corrective text;
- append hidden instructions;
- dynamically modify it between runs.

### Exact system instruction

```text
You are performing a bounded semantic-meaning trace experiment.

Your only task is to describe the meaning explicitly expressed by each supplied source slot. This experiment measures language understanding before any Atlas classification, policy, reconciliation, or application-schema mapping.

Interpret only the supplied text. Do not use outside knowledge or probable business practice. Do not invent actors, requirements, conditions, causes, thresholds, intent, or outcomes that are not expressed.

For each source slot:
1. Decide whether it contains a business proposition or is structural/non-semantic text.
2. If it contains a business proposition, restate that proposition faithfully without strengthening or weakening it.
3. Identify its epistemic status using only: certain, probable, possible, underspecified, or not_applicable.
4. Identify its polarity using only: positive, negative, underspecified, or not_applicable.
5. Record any condition explicitly stated by the source. If none is stated, return an empty list.
6. Record information that the source itself leaves unresolved and that would be necessary to know whether or how the proposition applies. Do not answer or repair the missing information.
7. Preserve quantities, units, scope, modality, negation, temporal ordering, exceptions, and other qualifiers exactly.
8. Return exactly one semantic observation for every supplied slot. Do not omit, duplicate, or invent slots.

Important distinctions:
- Modal words are not classified by keyword alone. For example, "may" can express permission or possibility; determine its meaning from the sentence.
- Do not convert may to must, can to will, possibility to obligation, examples to requirements, or descriptive statements to normative rules.
- Do not treat headings, numbering, labels, navigation, or other structural text as business propositions.
- Do not generate clarification questions. Only describe information that remains unresolved in the source.
- Do not use Atlas concepts or labels such as candidate, workflow_step, constraint, unresolved kind, needs_resolution, disposition, evidence, canonical, accepted fact, reconciliation, Main Workflow, Project Facts, or CES Result.
- Do not decide what Atlas should believe, accept, publish, reconcile, or do.

Return only JSON conforming to the supplied strict JSON Schema.
```

### Integrity fingerprint

UTF-8 SHA-256 of the exact system-instruction text above:

```text
9d00f115bfe5d6c3e08edfb6aa577917386fe6ffb0b9210ad9d53fccc326550c
```

The implementation should keep this instruction in one obvious constant and record its SHA-256 in the experiment report.

If the runtime instruction hash does not equal the frozen hash above, the experiment is invalid and must stop without a semantic verdict.

---

## 6. User message boundary

The user message sent to GPT-OSS must contain **data only**.

It must not contain additional semantic instructions, expected results, Atlas policies, or oracle hints.

Use an input shape equivalent to:

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

The exact JSON serialization may differ mechanically, but semantic content must not.

---

## 7. Frozen neutral output representation

SEMTRACE-001 must **not** reuse the SEMSPIKE-002/003 intermediate schema.

Create a new isolated strict JSON Schema for semantic observation only.

The semantic output is intentionally neutral and must contain exactly one observation per source slot.

Use this conceptual TypeScript shape:

```ts
type EpistemicStatus =
  | "certain"
  | "probable"
  | "possible"
  | "underspecified"
  | "not_applicable";

type Polarity =
  | "positive"
  | "negative"
  | "underspecified"
  | "not_applicable";

type SemanticRole =
  | "business_proposition"
  | "structural_text";

interface SemanticObservation {
  slot: "S1" | "S2" | "S3" | "S4";
  semantic_role: SemanticRole;

  // Empty only when semantic_role === "structural_text".
  proposition: string;

  epistemic_status: EpistemicStatus;
  polarity: Polarity;

  // Conditions explicitly stated by the source only.
  stated_conditions: string[];

  // Information the source itself leaves unresolved.
  // This is descriptive only; it is NOT an Atlas clarification question.
  unresolved_information: string[];
}

interface SemanticTraceResponse {
  observations: SemanticObservation[];
}
```

The implementation may express the schema directly as JSON Schema, but it must preserve this meaning.

Do not add fields for:

```text
candidate
kind
workflow_step
constraint
unresolved
needs_resolution
disposition
question
question_reason
evidence
Atlas ID
canonical status
conflict
winner
reconciliation
publication
projection
```

Those concepts are deliberately outside this experiment.

---

## 8. Important experimental distinction

Do **not** encode Atlas's S4 conclusion into the schema.

In particular, SEMTRACE-001 must **not** require GPT-OSS to claim that a specific hidden condition definitely exists.

The raw sentence:

```text
Approval may be required before processing.
```

directly supports that:

- approval is semantically related to processing;
- approval, if required, precedes processing;
- the requirement is not asserted with ordinary certainty;
- the source does not tell us definitively whether/when the approval requirement applies.

It does **not** explicitly name a hidden condition.

Therefore an acceptable semantic observation may describe the unresolved information in language equivalent to:

```text
whether approval is actually required
```

or:

```text
under what circumstances approval is required
```

without claiming that the source explicitly states that such a condition exists.

This distinction is important because the experiment is measuring **source meaning**, not Atlas's downstream resolution policy.

---

## 9. Frozen semantic oracle

The oracle evaluates meaning, not exact wording.

### S1

Source:

```text
The customer submits an order.
```

Required semantic meaning:

```text
semantic_role = business_proposition
actor = customer, preserved in proposition
action = submits, preserved in proposition
object = order, preserved in proposition
epistemic_status = certain
polarity = positive
stated_conditions = []
no invented unresolved information
```

No Atlas `workflow_step` classification is required or allowed.

### S2

Source:

```text
Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.
```

Required semantic meaning:

```text
semantic_role = business_proposition
customer/pelanggan meaning preserved
purchase/buy meaning preserved
maximum quantity = exactly 2
object = products
scope = one order / per-order
epistemic meaning must not be weakened into a vague purchase statement
polarity = positive
```

The proposition may remain Indonesian, be normalized to English, or use another faithful wording. Evaluation is semantic.

No Atlas `constraint` classification is required or allowed.

### S3

Source:

```text
3.2 Purchase Rules
```

Required semantic meaning:

```text
semantic_role = structural_text
proposition = ""
epistemic_status = not_applicable
polarity = not_applicable
stated_conditions = []
unresolved_information = []
```

It must not invent a business rule from the heading.

### S4 — primary diagnostic target

Source:

```text
Approval may be required before processing.
```

Required semantic meaning:

```text
semantic_role = business_proposition

proposition preserves:
- approval
- requirement relation
- temporal relation: before processing

epistemic_status = possible
polarity = positive

the output must NOT strengthen the source into:
- approval is definitely required
- approval is always required
- processing always requires approval

stated_conditions:
- empty unless the model can point to a condition literally stated by the source
- "before processing" is temporal ordering, not the applicability condition

unresolved_information:
- must preserve that the source does not establish whether/when approval is actually required
- wording may vary semantically
- must not invent the missing answer
```

The important S4 distinction is:

```text
possible requirement
!=
certain unconditional requirement
```

SEMTRACE-001 does not ask GPT-OSS to decide `needs_resolution`.

---

## 10. Validation rules

Deterministic code may validate only **transport and structural invariants**, including:

- strict JSON validity;
- schema validity;
- exactly four observations;
- exactly one observation for S1, S2, S3, S4;
- no missing slot;
- no duplicate slot;
- no invented slot;
- enum validity;
- structural-text field invariants;
- no credential leakage;
- no malformed provider response.

Deterministic code MUST NOT:

- repair semantics;
- change `certain` to `possible`;
- manufacture unresolved information;
- rewrite propositions;
- infer missing qualifiers;
- reclassify structural/business meaning;
- retry with a corrective prompt because the first answer failed.

Provider output remains untrusted evidence.

A semantic failure is recorded as a failure, not repaired.

---

## 11. Live-run protocol

Perform exactly **two authenticated live runs** using the same:

```text
provider
model
reasoning effort
system instruction
input fixture
strict schema
```

No adaptive prompt change is allowed between run 1 and run 2.

Record redacted metrics:

```text
provider
model
HTTP status
latency
input tokens
output tokens
reasoning_effort
structured-output mode
system-instruction SHA-256
source count
```

Do not record credentials or authorization material.

If a transient provider/network error prevents a valid semantic response, classify the environment honestly. Do not turn a failed semantic result into a provider retry loop.

---

## 12. Terminal verdict

Use one terminal result:

```text
PASS
PASS_WITH_LIMITS
FAIL
ENVIRONMENT_BLOCKED
```

### PASS

Only if **both live runs** satisfy all S1-S4 semantic oracles, including S4 preserving `possible` rather than strengthening it to certainty.

Interpretation:

```text
GPT-OSS demonstrates the required bounded raw semantic understanding.
The SEMSPIKE-003 failure is therefore evidence consistent with
representation/contract loss rather than basic S4 comprehension failure.
```

This does not yet prove the replacement architecture.

It authorizes proposing `SEMSPIKE-004`, whose job would be to test:

```text
source
-> neutral semantic observation
-> deterministic Atlas compilation
-> existing Atlas semantic contract
```

with no additional vendor inference call.

### PASS_WITH_LIMITS

Use only when both runs satisfy the frozen semantic oracle but there is a material non-oracle limitation that should be recorded.

Do not use this verdict to excuse an S4 semantic miss.

### FAIL

If either valid live run violates a frozen semantic oracle.

Examples:

```text
S4 epistemic_status = certain
S4 proposition strengthens "may" into unconditional requirement
S4 invents an applicability condition
S2 loses the exact quantity or per-order scope
S3 becomes a fabricated business fact
```

Interpretation:

```text
The representation-loss hypothesis is not sufficiently supported by this model.
Do not redesign Atlas around SEMTRACE-001.
Investigate model capability next.
```

Do not automatically create SEMSPIKE-004 after `FAIL`.

### ENVIRONMENT_BLOCKED

Use only when authenticated execution cannot produce the required valid experimental runs due to environment/provider failure.

Do not confuse semantic failure with environment failure.

---

## 13. Evidence/report

Create one concise report, suggested path:

```text
project's goal/feedback/SEMTRACE-001-raw-semantic-understanding.md
```

The report must contain:

1. terminal verdict;
2. branch/commit/worktree state;
3. provider/model/config;
4. frozen system-instruction SHA-256;
5. source-integrity confirmation;
6. run-1 metrics;
7. run-2 metrics;
8. S1-S4 semantic outcome matrix for each run;
9. exact or safely quoted structured provider outputs;
10. semantic differences between runs;
11. direct comparison with the frozen SEMSPIKE-003 S4 failure;
12. conclusion limited to H1 vs H2;
13. next action allowed by the verdict;
14. credential/header safety check.

Do not claim:

```text
Atlas semantics are solved
production extraction is ready
large-PRD extraction is solved
RPD economics are solved
reconciliation is solved
```

SEMTRACE-001 answers only the bounded raw-understanding question.

---

## 14. Isolation and allowed files

Prefer isolated experiment code such as:

```text
scripts/groq-semantic-trace-001/
  fixture.mts
  schema.mts
  groq-client.mts
  run.mts
```

Reuse frozen SEMSPIKE fixture/perception helpers only when doing so does not import Atlas semantic mapping behavior into the trace.

Allowed changes should remain limited to:

```text
SEMTRACE-001 experiment code
SEMTRACE-001 ignored evidence
SEMTRACE-001 report
optional single SEMTRACE-001 ticket
```

No production application should import the experiment.

No production runtime route should be changed.

No database migration.

No queue/worker change.

No DocumentStore change.

No Docling change.

No `NormalizedDocument v1` change.

No Atlas semantic parser/schema change.

No reconciliation change.

No projection change.

No embedding/vector-store work.

No batching/large-PDF work.

---

## 15. Workflow behavior

This is a diagnostic spike, not a production feature.

Keep GO/CK scope correspondingly small.

A semantic `FAIL` is a legitimate completed outcome.

Do not use CFC/HMN remediation to make the model pass by modifying:

```text
the frozen instruction
the frozen fixture
the frozen oracle
the frozen schema semantics
provider/model/reasoning effort
```

If implementation mechanics are broken, they may be fixed without changing the experiment.

If the model's valid response fails the semantic oracle, **stop** and preserve the failure.

Do not perform a prompt-tuning loop.

Do not create SEMTRACE-002 automatically.

---

## 16. Explicit Codex authority boundary

Codex is authorized to implement the mechanics of this experiment.

Codex is **not authorized** to design the semantic instruction.

The system instruction in Section 5 was supplied by human planning authority and is frozen.

Codex is also not authorized to:

- reinterpret the goal into an Atlas extraction test;
- reuse SEMSPIKE disposition semantics;
- add "helpful" Atlas fields;
- weaken the oracle;
- alter S4 wording;
- add examples to coach GPT-OSS toward the expected result;
- add semantic post-processing;
- add extra model calls;
- choose another model;
- introduce embeddings/RAG/local models;
- broaden the scope into architecture implementation.

If Codex believes the frozen instruction/schema/oracle is internally inconsistent, it must report the inconsistency and stop rather than silently modifying the experiment.

---

## 17. Decision after SEMTRACE-001

The experiment exists to create one clean fork:

```text
SEMSPIKE-003
S1 PASS
S2 PASS
S3 PASS
S4 FAIL
      |
      v
SEMTRACE-001
raw semantic understanding only
      |
   +--+--+
   |     |
 PASS   FAIL
   |     |
   v     v
representation/        model capability
contract hypothesis    remains the likely blocker
becomes credible
   |
   v
SEMSPIKE-004
neutral semantic observation
      |
deterministic Atlas compiler
      |
existing Atlas semantic result
```

Do not skip this fork.

---

## 18. Success definition

The most important success condition is not:

```text
GPT-OSS returns valid JSON.
```

It is:

```text
Without Atlas terminology or policy hints,
GPT-OSS independently preserves the semantic distinction:

"Approval may be required before processing."

!=

"Approval is required before processing."
```

If it does, we have evidence that the model can understand the distinction and that the next investigation should move to the representation/compilation boundary.

If it does not, we have evidence not to spend time refactoring Atlas around that hypothesis.

Either outcome is valuable.
