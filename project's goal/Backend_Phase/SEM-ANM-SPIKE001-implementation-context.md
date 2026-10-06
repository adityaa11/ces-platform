# SEM-ANM-SPIKE001 — Anoman Schema-Driven Semantic Route Qualification

## 1. Purpose

`SEM-ANM-SPIKE001` is a bounded feasibility and route-qualification experiment for using **Anoman AI** as the external semantic-extraction gateway for the Atlas backend after the accepted `BSS-V2-004-02` perception boundary.

The spike answers two sequential questions:

1. **Transport/schema gate**  
   Can Anoman, using the selected Gemini route, reliably accept and return a strict provider-facing JSON-schema contract suitable for Atlas semantic extraction?

2. **Semantic gate**  
   If the transport/schema gate passes, can the same route produce Atlas-correct semantic proposals from bounded `NormalizedDocument v1` source slots, validate through the same Zod source schema, deterministically finalize into the unchanged `atlas.semantic.extract/v1` contract, and satisfy the frozen semantic oracle?

This spike is intended to produce direct implementation evidence for the future `BSS-V2-004-03` semantic extraction live qualification.

This is **not** a production semantic-route ticket.

This is **not** authority to redesign `atlas.semantic.extract/v1`.

This is **not** a reconciliation experiment.

This is **not** authority to rewrite `NormalizedDocument v1`, Docling behavior, IDSER persistence, reconciliation, review, or publication semantics.

A failure is a valid completed result.

---

## 2. Current Atlas Position

The accepted production-shaped path currently ends at:

```text
PDF
    -> BSS-009-authorized exact source bytes
    -> Agents Bridge
    -> persistent Compose-private Docling Serve
    -> DoclingDocument
    -> deterministic Atlas mapper
    -> NormalizedDocument v1
    -> authenticated Atlas result handoff
    -> accepted logical D1 perception result
    -> STOP before semantic work
```

The next intended semantic boundary remains:

```text
accepted NormalizedDocument v1
    -> deterministic bounded source-slot preparation
    -> product-independent semantic extraction instruction
    -> small provider-facing semantic proposal schema
    -> deterministic validation
    -> deterministic Atlas finalization
    -> complete atlas.semantic.extract/v1 validation
    -> frozen semantic oracle
```

`SEM-ANM-SPIKE001` tests the Anoman route specifically at:

```text
small provider-facing semantic proposal schema
+
live provider execution
```

It must remain connected to the real `NormalizedDocument v1` compatibility boundary produced by `BSS-V2-004-02`.

---

## 3. Frozen Authorities

### 3.1 Perception authority

Do not change:

```text
NormalizedDocument v1
parseNormalizedDocument(...)
Docling mapping behavior
BSS-009 source authority
BSS-V2-004-01
BSS-V2-004-02
```

The fixture used by the semantic gate must pass through the existing normalized-document parser.

Do not replace the actual compatibility boundary with arbitrary raw strings only.

### 3.2 Atlas semantic authority

The authoritative Atlas semantic contract remains:

```text
atlas.semantic.extract/v1
```

Do not rewrite or weaken:

```text
packages/atlas-contracts/src/semantic.ts
parseSemanticExtractionResult(...)
candidate kind vocabulary
source statement inventory semantics
evidence reference semantics
semantic result envelope semantics
```

The provider-facing proposal may differ from the Atlas domain representation.

The deterministic finalizer must adapt the provider proposal **into** the existing Atlas contract.

The existing Atlas contract must not be modified merely to make Anoman or Gemini pass.

### 3.3 Provider authority

The external model is an untrusted proposal generator.

It does not own:

```text
Atlas IDs
source identity
evidence locator identity
source inventory bookkeeping
accepted truth
canonical truth
workspace state
Master state
publication
reconciliation
winner selection
supersession
conflict resolution
```

All such authority remains deterministic Atlas authority.

---

## 4. Provider Configuration

Use the Anoman OpenAI-compatible chat-completions route.

Frozen initial qualification configuration:

```text
provider/gateway: Anoman AI
endpoint: https://api.anoman.io/v1/chat/completions
model: gemini-2.5-flash
streaming: false
temperature: 0
work class: background semantic qualification
fallback: none
retry to another provider/model: prohibited
```

Do not silently switch to:

```text
gemini-2-5-flash
gemini-2-5-flash-lite
OpenRouter variants
another Gemini model
another Anoman route
another provider
```

merely to obtain a PASS.

A later comparison spike may test another route separately.

---

## 5. Credential and `.env` Requirement

The spike must use:

```text
ANOMAN_API_KEY
```

from the repository `.env`.

Expected local configuration:

```dotenv
ANOMAN_API_KEY=anm-sk-REDACTED
```

Requirements:

- load `ANOMAN_API_KEY` from `.env`;
- do not hard-code the key in source;
- do not place the key in fixtures;
- do not print the key;
- do not print the `Authorization` header;
- do not persist the key in evidence;
- do not commit the real `.env`;
- verify the repository ignores `.env` before running live qualification;
- fail closed with a clear credential/configuration result when `ANOMAN_API_KEY` is absent.

The request must authenticate conceptually as:

```text
Authorization: Bearer ${ANOMAN_API_KEY}
```

Do not require the human to export a second shell-only credential when the `.env` value is available.

---

## 6. Important Manual Baseline Already Observed

Manual qualification has already shown that the Anoman route can:

```text
authenticate successfully
list entitled models
invoke gemini-2.5-flash
return OpenAI-compatible chat.completion responses
expose token/usage telemetry
expose _anoman routing and guardrail metadata
preserve the difficult S4 semantic meaning
split multiple semantic units from one bounded source bundle
```

Manual testing also observed that:

```text
response_format = json_object
```

may still return JSON wrapped in Markdown fences.

Therefore:

> `json_object` success alone is not sufficient evidence for the strict schema-driven boundary intended by this spike.

The spike must test strict schema compatibility directly rather than treating Markdown-fence stripping as proof of strict structured output.

---

# PART A — TRANSPORT / STRICT-SCHEMA GATE

## 7. Gate A Purpose

Gate A answers:

> Can Anoman accept a strict JSON-schema style response contract for `gemini-2.5-flash` and return a raw response that validates directly against the originating Zod schema without semantic repair?

This gate intentionally uses a tiny non-Atlas payload.

Do not begin the semantic oracle if this gate fails.

---

## 8. Gate A Zod Schema

Create a tiny spike-local Zod schema equivalent to:

```ts
const TransportQualificationSchema = z.object({
  status: z.literal("ANOMAN_OK").describe(
    "Fixed qualification marker proving the provider returned the requested schema."
  ),
  count: z.literal(1).describe(
    "Fixed integer used only to verify typed structured output."
  ),
});
```

Generate the provider-facing JSON Schema from this same Zod source.

Do not hand-maintain separate schemas that can drift.

Conceptually:

```text
Zod source schema
    -> JSON Schema
    -> provider request
    -> provider response
    -> same Zod source schema parses response
```

---

## 9. Gate A Request Strategy

The runner must attempt the strictest Anoman/OpenAI-compatible structured-output form supported by the route under test.

Conceptually, the target capability is:

```json
{
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "transport_qualification",
      "strict": true,
      "schema": {}
    }
  }
}
```

The exact wire shape may be adapted only to the documented/observed Anoman-compatible contract.

Do not silently fall back to:

```text
json_object
prompt-only JSON
Markdown-fence cleanup
regex extraction
JSON repair
corrective retry
second model
second provider
```

and still call Gate A a PASS.

If `json_schema` / strict schema is rejected or unsupported, preserve the provider response/error and classify Gate A accordingly.

---

## 10. Gate A PASS Criteria

Gate A passes only when all are true:

```text
authenticated request succeeds
strict schema mode is accepted
response is terminal
response is machine-parseable without semantic repair
same Zod schema validates the response
status == "ANOMAN_OK"
count == 1
no unknown fields when the schema forbids them
no fallback provider/model was used
no corrective retry was used
```

A single deterministic outer transport wrapper supplied by the API client is acceptable.

Model-produced Markdown fences are not acceptable evidence of strict raw structured output for this gate.

---

## 11. Gate A Failure Classification

Record a bounded sub-result such as:

```text
STRICT_SCHEMA_PASS
STRICT_SCHEMA_UNSUPPORTED
STRICT_SCHEMA_REJECTED
STRICT_SCHEMA_MALFORMED_RESPONSE
AUTHENTICATION_BLOCKED
RATE_LIMITED
ENVIRONMENT_BLOCKED
```

The overall spike terminal result still uses the terminal vocabulary defined later.

If strict schema is unsupported/rejected, stop before Gate B.

Do not weaken the Atlas semantic route requirement automatically.

---

# PART B — SCHEMA-DRIVEN SEMANTIC GATE

## 12. Gate B Start Condition

Gate B may run only after:

```text
Gate A = STRICT_SCHEMA_PASS
```

Gate B must use the same:

```text
Anoman gateway
gemini-2.5-flash model route
credential source
strict structured-output mechanism
```

that passed Gate A.

---

## 13. Fixture Boundary

Use a spike-local `NormalizedDocument v1` fixture that contains the frozen S1-S4 sources.

The fixture must pass through:

```text
parseNormalizedDocument(...)
```

before source slots are prepared.

Prepare exactly four bounded source slots:

### S1

```text
The customer submits an order.
```

Required semantic meaning:

```text
workflow step
actor = customer
action = submit
object = order
no material unresolved information
```

### S2

```text
Seorang pelanggan hanya boleh membeli maksimal 2 produk dalam satu pesanan.
```

Required semantic meaning:

```text
constraint
subject = customer/pelanggan
maximum = 2
unit/object = product
scope = per order
exact value 2 preserved
```

A generic rule that loses the numeric/per-order boundary is not sufficient.

### S3

```text
3.2 Purchase Rules
```

Required semantic meaning:

```text
non-fact / document structure
no business proposition invented
```

### S4

```text
Approval may be required before processing.
```

Required semantic meaning:

```text
approval meaning preserved
possibility preserved
before-processing temporal ordering preserved
applicability condition remains missing
no hidden condition invented
material resolution is required
```

The model must not turn S4 into:

```text
approval is definitely required
before processing = applicability condition
fully resolved rule
invented trigger
```

---

## 14. Provider-Facing Schema Philosophy

The provider-facing schema is **not** the authoritative Atlas semantic schema.

It exists to help the model express semantic meaning reliably.

Use:

```text
meaningful property names
explicit types
rich Zod .describe(...) text
small semantic variants
discriminated unions where useful
```

Do not expose the entire existing Atlas result envelope merely because it already exists.

Do not make the model produce:

```text
Atlas IDs
source IDs
evidence IDs
workspace IDs
provenance bookkeeping
candidate persistence metadata
reconciliation state
publication state
```

Atlas already owns those.

---

## 15. Provider-Facing Semantic Shape

Use a compact discriminated proposal shape rather than one universal object containing every possible nullable field.

The exact implementation may vary, but it should follow this intent.

### 15.1 Workflow step proposal

Conceptually:

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
    "The business object directly affected or produced by the action, or null when none is explicitly established."
  ),

  target: z.string().nullable().describe(
    "The explicit recipient or destination of the action, or null when absent."
  ),

  temporalConstraint: z.string().nullable().describe(
    "An explicitly stated timing or ordering relationship, or null when none is stated."
  )
}).describe(
  "A workflow step represents a concrete business-process action or event. Do not use it for document headings, static numeric limits, or unresolved possibilities."
);
```

### 15.2 Constraint proposal

Conceptually:

```ts
const ConstraintProposal = z.object({
  kind: z.literal("constraint"),

  subject: z.string().describe(
    "The actor, object, or behavior whose permitted behavior is explicitly bounded."
  ),

  restriction: z.string().describe(
    "The explicit boundary or limitation stated by the source."
  ),

  quantity: z.number().nullable().describe(
    "The exact numeric boundary when explicitly stated, otherwise null."
  ),

  unit: z.string().nullable().describe(
    "The unit associated with the numeric boundary when explicitly stated, otherwise null."
  ),

  scope: z.string().nullable().describe(
    "The explicit scope in which the limitation applies, for example per order, otherwise null."
  )
}).describe(
  "A constraint expresses an explicit maximum, minimum, threshold, quantity limit, deadline, bounded range, or other definite restriction."
);
```

### 15.3 Rule proposal

S4 exposed an important modeling lesson:

```text
semantic kind
and
resolution state
```

are conceptually separate dimensions.

A statement may be a rule and still require resolution.

Use a provider-facing rule proposal equivalent to:

```ts
const RuleProposal = z.object({
  kind: z.literal("rule"),

  subject: z.string().nullable().describe(
    "The actor, object, process, or requirement governed by the rule when explicitly stated."
  ),

  modality: z.enum([
    "required",
    "prohibited",
    "permitted",
    "possible",
    "unspecified"
  ]).describe(
    "How strongly the source asserts the rule. 'possible' means something may or might apply but the source does not establish that it definitely applies. Possibility is not permission."
  ),

  temporalConstraint: z.string().nullable().describe(
    "Explicit timing or ordering such as before, after, within, or while. Timing is not automatically an applicability condition."
  ),

  applicabilityCondition: z.string().nullable().describe(
    "The explicit condition determining whether or under what circumstances the rule applies. Use null when the source does not establish it."
  ),

  missingInformation: z.array(z.string()).describe(
    "Material semantic information that is required to safely resolve the stated rule but is absent from the source. Use an empty array when the statement is sufficiently specified."
  )
}).describe(
  "A governing business or behavioral rule. Preserve uncertainty. Do not invent missing applicability conditions, and do not convert possibility into certainty."
);
```

The deterministic finalizer may translate:

```text
kind = rule
+
modality = possible
+
missingInformation contains applicability condition
```

into the existing Atlas representation required by `atlas.semantic.extract/v1`.

Do not rewrite Atlas candidate kinds merely because the model-facing ontology is cleaner.

### 15.4 Non-fact proposal

Conceptually:

```ts
const NonFactProposal = z.object({
  kind: z.literal("non_fact"),

  reason: z.string().describe(
    "Why the source is structural/document context rather than an asserted business meaning."
  )
}).describe(
  "Use for headings, titles, numbering, labels, navigation, formatting, or other document structure that does not itself assert business meaning."
);
```

---

## 16. Root Semantic Proposal

Use a discriminated union equivalent to:

```ts
const SourceSemanticProposal = z.discriminatedUnion("kind", [
  WorkflowStepProposal,
  ConstraintProposal,
  RuleProposal,
  NonFactProposal,
]);
```

For the frozen S1-S4 spike, exactly one semantic proposal per source slot is sufficient.

A reasonable root:

```ts
const SemanticQualificationSchema = z.object({
  sourceResults: z.array(
    z.object({
      sourceSlot: z.enum(["S1", "S2", "S3", "S4"]),
      extraction: SourceSemanticProposal,
    })
  ).length(4),
});
```

Also enforce deterministically:

```text
S1 exactly once
S2 exactly once
S3 exactly once
S4 exactly once
no duplicate slot
no unknown slot
no omitted slot
```

Do not trust array length alone.

---

## 17. Prompt Boundary

The system instruction should be product-independent and small.

Do not use:

```text
"You are Atlas"
"Atlas wants..."
"According to Atlas..."
```

The semantic meaning should be carried primarily by the schema descriptions, not by project-name prompting.

The instruction may be conceptually as small as:

```text
Extract the business semantics of each authorized source slot.
Use only information supported by the source.
Preserve uncertainty and explicit limits.
Do not invent missing conditions.
Return output matching the supplied schema.
```

Do not place the frozen S1-S4 oracle or expected answers in the prompt.

Do not use examples that are near-copies of S1-S4.

---

## 18. Deterministic Finalizer Responsibilities

After provider output passes the same Zod schema:

```text
provider proposal
    -> deterministic Atlas finalizer
    -> atlas.semantic.extract/v1
    -> parseSemanticExtractionResult(...)
```

The finalizer owns:

```text
Atlas-generated IDs
semantic keys where deterministic policy defines them
source-slot -> real source identity mapping
evidence references
source statement inventory
question/evidence bookkeeping
provider provenance
result-envelope fields
exact Atlas contract assembly
```

The finalizer may normalize harmless surface form such as:

```text
"the customer" -> "customer"
"a confirmation email" -> "confirmation email"
```

only where such normalization is deterministic and semantics-preserving.

The finalizer must not:

```text
repair a wrong semantic kind
invent missing semantic content
turn possibility into certainty
infer a missing applicability condition
repair a malformed provider payload
silently replace one model judgment with another
```

Semantic decisions remain provider-proposal decisions for the purpose of this spike.

---

## 19. S4 Frozen Oracle

S4 is the primary diagnostic case.

Source:

```text
Approval may be required before processing.
```

The provider proposal must preserve all of:

```text
semantic kind compatible with a governing rule
modality = possible
temporal relation = before processing
applicability condition = null / absent according to schema
material missing information = condition under which approval is required
```

The final Atlas result must represent the source as unresolved according to the existing `atlas.semantic.extract/v1` semantics.

A provider result equivalent to the following meaning is acceptable:

```text
approval may be required
+
when applicable, approval occurs before processing
+
the source does not establish what determines whether approval applies
```

The model must not produce:

```text
approval always required
approval definitely required
"before processing" as the applicability trigger
invented approval threshold
invented approver
resolved rule with no missing applicability
```

---

## 20. S1 Anti-Overclarification Oracle

S1 is also important because earlier free-form experiments tended to invent irrelevant "missing information".

Source:

```text
The customer submits an order.
```

The provider/final result must not require clarification merely because the source does not specify:

```text
submission method
submission time
order contents
transport
storage
downstream behavior
```

The criterion is:

> Missing information requires resolution only when it materially prevents safe representation of the requirement actually stated.

Do not turn every omitted implementation detail into a semantic gap.

---

## 21. Execution Protocol

### Gate A

Perform:

```text
1 strict-schema authenticated qualification call
```

If Gate A fails, stop.

### Gate B

If Gate A passes, perform:

```text
2 equivalent authenticated semantic qualification calls
```

Both semantic calls must use identical:

```text
model
endpoint
schema
instruction
fixture
source slots
temperature
strict structured-output mode
```

No adaptive prompt changes are allowed between run 1 and run 2.

No corrective retry is allowed.

No fallback provider/model is allowed.

---

## 22. Required Telemetry

For each live call record secret-safe telemetry including:

```text
provider = Anoman
served model
HTTP status
finish reason
latency ms
prompt/input tokens
completion/output tokens
reasoning tokens when exposed
visible/text tokens when exposed
total tokens
_anoman.weighted_tokens when exposed
_anoman.cost_usd when exposed
_anoman.routing.mode when exposed
_anoman.routing.region when exposed
_anoman.routing.provider_type when exposed
_anoman.routing.provider_region when exposed
guardrail summary
cache hit/miss when exposed
```

Do not treat `_anoman.billing = null` as proof that a request had zero cost.

Preserve the actual cost and weighted-token fields when present.

---

## 23. Regional / Privacy Evidence

Manual calls have shown Anoman may report separately:

```text
gateway region
provider region
```

The spike must preserve those values in secret-safe evidence.

Do not infer that an Indonesia/Jakarta gateway necessarily means the upstream model processed data in Indonesia.

Record the observed routing truth exactly as returned.

Do not silently downgrade privacy requirements to obtain a successful call.

---

## 24. Guardrail Evidence

Capture the Anoman guardrail result summary when exposed, including at minimum the available statuses for:

```text
credential DLP
injection
jailbreak
content moderation
PII
policy
response credential DLP
response content
output DLP
```

The spike is not a full guardrail-red-team exercise.

However, unexpected blocking or mutation of the frozen non-confidential fixture must be recorded as qualification evidence.

---

## 25. Local Validation Rules

Allowed deterministic validation:

```text
response exists
response is terminal
strict schema mode was accepted
provider output parses
provider output passes the originating Zod schema
exact source-slot accounting
real NormalizedDocument parser passes fixture
real Atlas semantic parser passes finalized output
telemetry fields are recorded when available
```

Prohibited semantic repair:

```text
regex-based semantic rewriting
LLM output repair
changing semantic kind locally
inventing missing conditions
fixing S4 modality
adding an unstated quantity
adding an unstated scope
corrective model retry
fallback model
fallback provider
```

If the provider output is semantically wrong, record the run as semantically wrong.

---

## 26. Suggested Spike Layout

Prefer an isolated layout such as:

```text
scripts/
  sem-anm-spike001/
    fixture.mts
    schema.mts
    anoman-client.mts
    prepare-source-slots.mts
    finalize.mts
    semantic-oracle.mts
    test.mts
    run.mts
    README.md
```

Suggested ignored evidence:

```text
.atlas-data/
  sem-anm-spike001/
    gate-a-transport.json
    semantic-run-1.json
    semantic-run-2.json
    summary.json
```

Do not persist:

```text
API keys
Authorization headers
raw secrets
unbounded customer PRDs
confidential source content
```

Use only the approved non-confidential qualification fixture.

---

## 27. Required Tests

At minimum add deterministic tests for:

```text
.env credential loading without secret logging
missing ANOMAN_API_KEY fails closed
Zod -> JSON Schema generation
strict schema request construction
provider response -> same Zod validation
unknown fields rejected where intended
duplicate source slot rejected
missing source slot rejected
unknown source slot rejected
finalizer preserves source-slot identity
finalizer cannot invent provider-owned semantics
parseSemanticExtractionResult(...) accepts valid finalized result
malformed provider output fails closed
semantic oracle detects S1/S2/S3/S4 regressions
```

Add a negative proving that:

```text
S4:
modality = required
```

does not pass the semantic oracle.

Add a negative proving that:

```text
S4:
applicabilityCondition = "before processing"
```

does not pass the semantic oracle.

Add a negative proving that:

```text
S1:
material resolution required solely because submission method is absent
```

does not pass the semantic oracle.

---

## 28. Review Contract

The spike should be reviewable through bounded clauses equivalent to:

| ID | Requirement | Evidence |
|---|---|---|
| `RC-ANM-001` | The spike starts from a real `NormalizedDocument v1` fixture/parser boundary. | Fixture parses through `parseNormalizedDocument(...)`; bounded slots are deterministic. |
| `RC-ANM-002` | `ANOMAN_API_KEY` is loaded from `.env` and remains secret-safe. | Missing-key negative; no key/header in logs/evidence/diff. |
| `RC-ANM-003` | Gate A proves or disproves real strict-schema compatibility without fallback. | Raw request mode/result; same Zod schema validates or bounded failure is recorded. |
| `RC-ANM-004` | The provider-facing schema is Zod-authored, semantically described, compact, and separate from the Atlas authoritative contract. | Zod source + generated schema inspection. |
| `RC-ANM-005` | Both semantic live runs satisfy the frozen S1-S4 oracle. | Run matrix with S1 workflow, S2 exact constraint, S3 non-fact, S4 possible/unresolved applicability. |
| `RC-ANM-006` | Provider output validates without semantic repair. | Same Zod parser accepts live responses; malformed negatives fail closed. |
| `RC-ANM-007` | Deterministic finalization preserves Atlas authority and unchanged `atlas.semantic.extract/v1`. | Final results pass `parseSemanticExtractionResult(...)`; no production semantic-contract rewrite. |
| `RC-ANM-008` | Usage, latency, routing, guardrail, and region evidence are preserved safely. | Secret-safe telemetry for all live calls. |
| `RC-ANM-009` | No provider/model fallback, adaptive retry, or prompt mutation is used to obtain PASS. | Runner configuration and evidence hashes/config snapshot. |
| `RC-ANM-010` | Security and repository hygiene remain clean. | `.env` ignored; no secrets; affected tests + `git diff --check` pass. |

Do not broaden remediation beyond these frozen clauses without explicit human authorization.

---

## 29. Terminal Classification

Use exactly one final terminal classification:

```text
PASS
PASS_WITH_LIMITS
FAIL
ENVIRONMENT_BLOCKED
```

### PASS

Use only when:

```text
Gate A strict-schema compatibility passes
+
both semantic runs validate through the same Zod schema
+
both runs satisfy S1-S4
+
both deterministic finalizations pass parseSemanticExtractionResult(...)
+
required telemetry/evidence is preserved
```

Interpretation:

```text
Anoman / gemini-2.5-flash is a viable candidate route
for the BSS-V2-004-03 schema-driven semantic boundary.
```

This does not activate the route in production.

### PASS_WITH_LIMITS

Use only when all semantic and strict-schema requirements pass, but a material non-oracle limitation remains, for example:

```text
latency variance
high weighted-token consumption
cross-region processing observation
non-blocking guardrail concern
```

Do not use `PASS_WITH_LIMITS` to excuse:

```text
strict-schema incompatibility
malformed structured output
S4 semantic failure
S2 numeric/scope loss
S3 fact hallucination
Atlas final parser failure
```

### FAIL

Use when the route executes but fails a required qualification gate, including:

```text
strict schema unsupported/rejected
provider returns invalid structured output
Zod validation fails
semantic oracle fails
Atlas final parser fails
provider output requires semantic repair
```

### ENVIRONMENT_BLOCKED

Use only when the spike cannot reach a meaningful provider qualification result due to an external execution blocker such as:

```text
invalid/missing credential despite correct local setup
account-level provider outage
unusable entitlement
hard rate-limit/account block before meaningful inference
network/environment failure outside the spike implementation
```

Do not classify provider capability incompatibility as `ENVIRONMENT_BLOCKED`.

---

## 30. GO / CK / CFC / HMN Guidance

This spike should remain friendly to the existing workflow.

### GO

GO may:

```text
create the isolated spike
implement deterministic tests
run Gate A
run Gate B only if Gate A passes
record secret-safe evidence
commit the bounded checkpoint
hand off to CK
```

GO must not:

```text
activate Anoman as production semantic route
rewrite BSS-V2-004-03
rewrite atlas.semantic.extract/v1
start reconciliation work
expand into HB-01..HB-09 automatically
switch model/provider to chase PASS
```

### CK

CK should review only the frozen Review Contract and direct regressions caused by the spike.

Do not manufacture unrelated production requirements.

### CFC

CFC may remediate only bounded review findings explicitly authorized by the ticket/review contract or a valid HMN authorization.

### HMN

HMN remains the authority for scope expansion, additional live-call budgets, provider/model changes, or changes to frozen semantic/transport requirements.

---

## 31. Hard Stop

The spike stops when it has produced:

```text
Gate A terminal result
+
if Gate A passes:
    two equivalent semantic live runs
    Zod validation evidence
    deterministic finalization evidence
    real Atlas parser evidence
    semantic oracle evidence
+
telemetry/economics evidence
+
security/redaction evidence
+
terminal classification
+
review artifact
```

Do not continue directly into production `BSS-V2-004-03` implementation.

Do not automatically add HB-01 through HB-09 to this ticket.

Those harder bundles are a separate follow-on corpus qualification after the S1-S4 route is proven.

---

## 32. Suggested Final Report

Suggested report:

```text
project's goal/feedback/
SEM-ANM-SPIKE001-anoman-schema-driven-semantic-route-qualification.md
```

Include:

```text
terminal result
commit/checkpoint
provider/model
credential source = ANOMAN_API_KEY from .env
Gate A strict-schema result
generated-schema evidence
NormalizedDocument fixture/parser evidence
S1-S4 run matrix
Zod validation result
Atlas final parser result
latency
raw token usage
reasoning/text token split when available
weighted-token usage
cost observations
routing/provider-region observations
guardrail summary
cross-run consistency
security/redaction inspection
Review Contract closure
one next recommendation
```

Never include the actual API key.

---

## 33. Final Architectural Intent

`SEM-ANM-SPIKE001` should test this exact shape:

```text
BSS-V2-004-02
Atlas-accepted NormalizedDocument v1
        |
        v
deterministic bounded source slots
        |
        v
small Zod provider-facing semantic contract
        |
        +-- explicit semantic descriptions
        +-- discriminated semantic variants
        +-- no Atlas IDs/provenance authority
        |
        v
z.toJSONSchema(...)
        |
        v
Anoman
gemini-2.5-flash
strict structured output
        |
        v
same Zod validation
        |
        v
deterministic Atlas finalizer
        |
        +-- Atlas IDs
        +-- source/evidence accounting
        +-- provider provenance
        +-- existing result-envelope fields
        |
        v
existing atlas.semantic.extract/v1
        |
        v
parseSemanticExtractionResult(...)
        |
        v
frozen S1-S4 semantic oracle
```

The central question is:

> Can Anoman provide the strict, schema-driven semantic proposal boundary Atlas needs after `BSS-V2-004-02`, while the existing Atlas semantic contract remains authoritative and unchanged?

If yes, the route becomes a qualified candidate for the future `BSS-V2-004-03` implementation.

If no, preserve the failure honestly and do not weaken Atlas merely to make the provider pass.
