# Atlas Semantic IR v0 Qualification — Implementation Context v2

## 0. Document authority

This document supersedes the earlier draft implementation context for the post-`SEMSPIKE-005` semantic experiment.

This document defines the bounded work required to determine whether Atlas has a sufficiently general semantic intermediate representation before any further production semantic extraction work continues.

The work is intentionally divided into:

1. semantic requirements and qualification corpus;
2. Semantic IR design;
3. deterministic semantic oracle and negative validation;
4. real `NormalizedDocument v1` integration;
5. minimal live LLM qualification.

The semantic representation MUST be proven offline before any provider call is authorized.

---

# 1. Background

`SEMSPIKE-005` tested schema-driven semantic extraction using the mutually exclusive semantic categories:

```text
workflow_step
constraint
rule
condition
unresolved
non_fact
```

The provider-facing schema was generated from Zod and successfully preserved semantic descriptions.

Both authenticated provider responses:

- satisfied strict structured output;
- parsed through the generating Zod schema;
- satisfied source-slot accounting;
- deterministically finalized;
- passed the existing Atlas semantic parser.

However, both failed the frozen semantic oracle for the source:

```text
Approval may be required before processing.
```

The two generations interpreted the sentence differently:

```text
Run 1:
rule

Run 2:
unresolved,
but with the wrong unresolved meaning
```

This established an important architectural limitation:

> Structural schema correctness does not guarantee semantic correctness, and mutually exclusive categories can force semantic dimensions that should coexist to compete with one another.

In particular:

```text
business proposition type
```

and:

```text
epistemic completeness / unresolved knowledge
```

must not necessarily be represented as mutually exclusive alternatives.

This experiment therefore does NOT attempt to repair `SEMSPIKE-005`.

It tests a different semantic architecture.

---

# 2. Experiment objective

The central question is:

> Can Atlas represent specification knowledge as source-grounded propositions with independent semantic qualifiers and unresolved aspects, without requiring the extraction model to directly choose Atlas projections or canonical project truth?

The proposed direction is:

```text
source
  ↓
proposition
  ↓
semantic qualifiers
  ↓
unresolved aspects
  ↓
evidence
```

rather than:

```text
source
  ↓
choose exactly one Atlas semantic kind
```

The experiment MUST determine separately:

1. whether the proposed Semantic IR can represent a sufficiently diverse range of specification meanings;
2. whether deterministic Atlas validation can detect meaningful corruption;
3. whether an LLM can populate that IR correctly;
4. whether independent LLM generations remain semantically consistent.

---

# 3. Scope

This experiment is limited to semantic understanding of product, business, and system specification material.

The semantic domain includes source material commonly found in:

- PRDs;
- BRDs;
- functional specifications;
- system requirements;
- business process specifications;
- feature specifications;
- policy/specification documents;
- change requests;
- approved addenda;
- structured requirement tables.

Atlas is NOT being designed as a universal semantic interpreter for arbitrary PDFs.

The perception layer may accept broad document formats, but semantic qualification targets specification knowledge.

---

# 4. Explicit non-goals

This work MUST NOT implement or activate:

- canonical Master truth;
- entity canonicalization;
- relation canonicalization;
- reconciliation against existing project facts;
- conflict resolution;
- supersession;
- Main Workflow projection;
- Project Facts projection;
- CES Result generation;
- production extraction worker activation;
- persistence of production semantic assertions;
- vector retrieval;
- RAG;
- context retrieval from Master;
- workspace publishing;
- human reconciliation UI;
- automatic semantic repair;
- retry prompts;
- fallback models;
- multi-agent semantic decomposition.

This experiment also MUST NOT attempt to implement full:

- SBVR;
- AMR;
- FrameNet;
- PropBank;
- RDF;
- OWL;
- SHACL;
- BPMN;
- DMN.

Those are architectural references only.

---

# 5. Predecessor authority

`SEMSPIKE-005` has terminal result:

```text
FAIL
```

Its evidence is frozen.

`SEMSPIKE-005` PASS is NOT required for this work.

Explicit predecessor bypass is authorized because the new experiment changes the semantic representation being tested.

Approved existing boundaries may be reused where applicable:

- `NormalizedDocument v1`;
- immutable source fixture handling;
- source accounting;
- deterministic test infrastructure;
- BSS-V2-004-02 approved perception boundary.

The old semantic parser MUST NOT be treated as a required success boundary for the new Semantic IR.

The new experiment has its own parser and validator.

---

# 6. Architectural boundary

The experimental pipeline is:

```text
NormalizedDocument v1
        ↓
authorized source units
        ↓
Semantic IR proposal
        ↓
Zod structural validation
        ↓
deterministic evidence validation
        ↓
deterministic semantic oracle
        ↓
qualification result
```

It MUST NOT be:

```text
Semantic IR
   ↓
old parseSemanticExtractionResult(...)
```

unless a future separately authorized adapter is explicitly created.

The existing parser belongs to the earlier semantic contract.

This experiment deliberately tests a new contract.

---

# 7. Fundamental semantic principles

These principles are normative for the experiment.

They must be used both when designing known-good fixtures and when evaluating provider output.

## 7.1 Source grounding

Atlas may represent only meaning supported by the authorized source/context.

The extractor MUST NOT:

- add actors;
- add thresholds;
- add conditions;
- add outcomes;
- add causal relationships;
- resolve ambiguous references;
- convert examples into rules;
- infer canonical entity equivalence;

unless the authorized source/context explicitly supports that interpretation.

---

## 7.2 Preserve semantic force

Atlas MUST NOT strengthen or weaken the source.

Examples:

```text
may be required
```

must not become:

```text
is required
```

and:

```text
should
```

must not become:

```text
must
```

and:

```text
cannot
```

must not become:

```text
can
```

---

## 7.3 Proposition and completeness are separate dimensions

A proposition can contain legitimate business meaning while still being incomplete.

Therefore a proposition may simultaneously contain:

```text
business meaning
+
unresolved aspects
```

Example:

```text
Approval may be required before processing.
```

may express meaningful approval semantics while leaving applicability unresolved.

---

## 7.4 Modality is independent from proposition identity

The proposition describes the underlying business meaning.

Modality describes how the source qualifies that meaning.

The experiment must distinguish at least:

- assertion;
- obligation;
- permission;
- prohibition;
- possibility;
- recommendation.

---

## 7.5 Polarity is independent

Positive and negative propositions must remain distinguishable.

Example:

```text
Approval is required.
```

and:

```text
Approval is not required.
```

must never normalize to the same semantic meaning.

---

## 7.6 Conditions and triggers are separate

For this experiment:

### Condition

A condition is a state, criterion, predicate, or applicability requirement that must hold for another proposition to apply.

Example:

```text
Orders above Rp1,000,000 require approval.
```

Condition:

```text
order amount > Rp1,000,000
```

### Trigger

A trigger is an event or change whose occurrence initiates, causes, or activates another behavior or transition.

Example:

```text
When payment succeeds, the system sends a receipt.
```

Trigger:

```text
payment succeeds
```

The provider is not required to infer causal semantics beyond what the source establishes.

---

## 7.7 Unresolved meaning identifies a missing semantic component

An unresolved aspect exists when:

1. the source establishes useful business meaning;
2. an essential component required for complete interpretation is absent or indeterminate;
3. Atlas can state what is known without inventing the missing part.

An unresolved aspect must include:

```text
aspect
knownMeaning
missingInformation
clarificationQuestion
```

---

## 7.8 Non-semantic is not uncertainty

`non_semantic` is reserved for source units that do not assert specification meaning.

Examples:

```text
4.2 Approval Process
Table 7
Appendix
```

A confusing or incomplete business sentence MUST NOT be converted into `non_semantic`.

It should instead be represented as semantic with unresolved aspects or `needs_review`, depending on whether a safe proposition can be produced.

---

## 7.9 Examples are not universal rules

Example language must retain its discourse role.

Example:

```text
For example, an order worth Rp150,000 receives free shipping.
```

does not automatically establish:

```text
all Rp150,000 orders receive free shipping
```

---

## 7.10 Rationale is not requirement

Example:

```text
This feature is intended to reduce checkout abandonment.
```

may express project rationale or goal.

It must not automatically become an obligation on system behavior.

---

## 7.11 References are not substituted meaning

Example:

```text
See section 3.4 for fraud handling.
```

establishes a reference.

It does not itself define fraud-handling behavior.

---

# 8. Frozen Semantic Interpretation Contract

The following meanings are authoritative for qualification.

## 8.1 Assertion

The source presents a proposition directly as true or applicable without an explicit modal wrapper represented by this experiment.

Example:

```text
The order contains a status field.
```

---

## 8.2 Obligation

The source requires a behavior, state, or outcome.

Typical linguistic cues may include:

```text
must
shall
is required to
```

but classification MUST depend on meaning, not lexical lookup alone.

---

## 8.3 Permission

The source explicitly allows an actor/system to perform a behavior.

Example:

```text
Users may export reports.
```

---

## 8.4 Prohibition

The source explicitly disallows a behavior or state.

Example:

```text
Guests cannot delete orders.
```

---

## 8.5 Possibility

The source states that a proposition can, might, or may be true/applicable without asserting universal applicability.

Example:

```text
Reports may contain personal information.
```

---

## 8.6 Recommendation

The source expresses preferred, expected, or advisable behavior without making it mandatory.

Example:

```text
Users should verify their email address.
```

---

## 8.7 Nested modality

When necessary, one semantic force may qualify another.

Example:

```text
Approval may be required.
```

may be represented conceptually as:

```text
possibility(
    obligation(
        approval
    )
)
```

Nested modality MUST NOT be flattened if flattening changes the source meaning.

---

# 9. Source disposition

Every authorized source unit must receive exactly one disposition:

```ts
"semantic"
"non_semantic"
"needs_review"
```

## semantic

At least one safe proposition can be extracted.

It may still contain unresolved aspects.

## non_semantic

The source unit contains document structure or context but no asserted specification meaning.

## needs_review

The unit appears semantically meaningful, but the available authorized text does not permit a safe proposition.

`needs_review` is NOT a provider escape hatch.

The corpus must contain explicit cases defining when it is valid.

---

# 10. Discourse role

Where applicable, a source unit may also carry:

```ts
"assertion"
"example"
"rationale"
"reference"
```

This is separate from source disposition.

For example:

```text
For example, an order worth Rp150,000 receives free shipping.
```

is:

```text
sourceDisposition = semantic
discourseRole = example
```

---

# 11. Corpus-first development rule

The Semantic IR schema MUST NOT be frozen before the qualification corpus is defined.

The corpus is the requirements specification for the IR.

If the schema cannot represent a frozen corpus case cleanly, the schema must be revised.

The corpus MUST NOT be rewritten merely to fit the schema.

This is a critical experiment invariant.

---

# 12. Phase 1 — semantic requirements corpus

Ticket:

```text
SEMIR-001
```

Purpose:

> Define the semantic behaviors that Atlas Semantic IR v0 must be capable of representing.

No provider calls are allowed.

The minimum corpus must contain at least 30 cases.

A target of approximately 36–48 is preferred if the cases remain small and reviewable.

---

# 13. Required corpus families

The corpus must cover at minimum:

## Basic proposition structure

- simple action;
- action with actor;
- action without explicit actor;
- action with object;
- relation between entities;
- definition;
- attribute assertion.

## Modality

- assertion;
- obligation;
- permission;
- prohibition;
- possibility;
- recommendation;
- nested possibility + obligation.

## Polarity

- positive assertion;
- negative assertion;
- negative obligation/prohibition distinction.

## Conditions and triggers

- explicit condition;
- explicit trigger;
- condition + obligation;
- trigger + action;
- missing condition;
- missing trigger.

## Quantity and scope

- maximum;
- minimum;
- range;
- threshold;
- per-item/per-order scope;
- missing threshold.

## State semantics

- state assertion;
- state transition;
- trigger causing state transition;
- missing resulting state.

## Relations/cardinality

- one-to-one;
- one-to-many;
- bounded cardinality;
- ownership/association.

## Epistemic incompleteness

- missing actor;
- missing object;
- missing condition;
- missing trigger;
- missing threshold;
- missing scope;
- missing timing;
- missing outcome;
- ambiguous reference;
- ambiguous attachment.

## Discourse/source accounting

- example;
- rationale;
- reference;
- heading;
- numbering/label;
- genuinely non-semantic source.

---

# 14. Required contrast sets

The corpus MUST include contrast sets that differ minimally in wording but materially in semantics.

These are mandatory.

## Contrast Set A — modal force

```text
Users export reports.
Users may export reports.
Users must export reports.
Users must not export reports.
Users should export reports.
```

Expected distinction:

```text
assertion
permission
obligation
prohibition
recommendation
```

---

## Contrast Set B — different meanings of “may”

```text
Users may export reports.

Reports may contain personal information.

Approval may be required before processing.
```

Expected distinction:

```text
permission

possibility

possibility over obligation
+ unresolved applicability condition
```

A lexical rule:

```text
"may" => unresolved
```

must therefore fail the corpus.

---

## Contrast Set C — applicability

```text
Orders require approval.

International orders require approval.

Orders above Rp1,000,000 require approval.

Orders may require approval.
```

The IR must preserve the distinctions between:

```text
unconditional obligation

explicit category/scope condition

explicit numeric condition

non-universal applicability with missing determinant
```

---

## Contrast Set D — negation

```text
Users can cancel orders.

Users cannot cancel orders.

Users are not required to cancel orders.
```

These MUST NOT collapse into equivalent propositions.

---

## Contrast Set E — condition versus trigger

```text
Orders above Rp1,000,000 require approval.

When payment succeeds, the system sends a receipt.
```

The first tests applicability condition.

The second tests event trigger.

---

# 15. Multi-proposition cases

At least three corpus entries must contain multiple propositions.

Example:

```text
The system validates the order and sends a confirmation email.
```

The IR must be able to represent:

```text
validate(order)
send(confirmation email)
```

without requiring the source to be artificially rewritten into two fixture sentences.

Another example:

```text
The merchant owns the store and can update its profile.
```

contains:

```text
relationship
+
permission/capability
```

The corpus must prove the IR can express multiple meanings from one source unit.

---

# 16. Context-free versus context-dependent corpus cases

`SEMIR-001` should distinguish:

```text
context-free semantic cases
```

from:

```text
context-dependent semantic cases
```

However, the first live `SEMSPIKE-006` may use only context-free cases.

Context-dependent cases are retained for future `SEMSPIKE-007`.

Example future case:

```text
Source:
"The applicant submits it."
```

Without context:

```text
"it" may be unresolved.
```

With authorized preceding context:

```text
"The applicant completes the registration form."
```

the referent may become safely resolvable.

Do NOT solve context retrieval in this ticket set.

---

# 17. Human-authored semantic expectations

Each corpus case must define semantic expectations before any provider call.

Expectations must describe dimensions rather than exact JSON serialization.

Example:

```yaml
case: possible_obligation_missing_condition

source:
  "Approval may be required before processing."

expected:
  source_disposition: semantic

  proposition:
    meaning_contains:
      - approval
      - requirement

  modality:
    outer: possibility
    inner: obligation

  temporal:
    relation: before
    target: processing

  unresolved:
    aspect: condition
    required: true

  prohibited_interpretations:
    - unconditional_obligation
    - permission
    - explicit_condition_invented
```

The concrete file format may be JSON/TS fixture data.

The principle is mandatory.

---

# 18. Phase 2 — Semantic IR schema

Ticket:

```text
SEMIR-002
```

Purpose:

> Design the minimum Semantic IR capable of representing the frozen `SEMIR-001` corpus without case-specific hacks.

No provider calls are allowed.

---

# 19. Required top-level shape

The Semantic IR must conceptually contain:

```ts
type SourceSemanticResult = {
  sourceSlot: string;

  sourceDisposition:
    | "semantic"
    | "non_semantic"
    | "needs_review";

  discourseRole?:
    | "assertion"
    | "example"
    | "rationale"
    | "reference";

  propositions: SemanticProposition[];
};
```

Exact implementation names may differ only when justified in the ticket evidence.

The fundamental separation must remain.

---

# 20. Proposition shape

A proposition must minimally support:

```ts
type SemanticProposition = {
  predicate: SemanticPredicate;

  arguments: SemanticArgument[];

  qualifiers: SemanticQualifiers;

  unresolvedAspects: UnresolvedAspect[];

  evidence: EvidenceReference[];
};
```

---

# 21. Predicate policy

A predicate is a source-grounded semantic phrase representing the relation, action, state, property, or requirement being asserted.

The first IR MUST NOT attempt global predicate canonicalization.

Allowed examples:

```text
submit
send
contain
own
require approval
be confirmed
```

The predicate should be minimally normalized only where necessary for structure.

It MUST NOT convert source terminology into project-global canonical vocabulary.

Example:

```text
buyer submits order
```

must not automatically become:

```text
customer placeOrder
```

during extraction.

---

# 22. Argument-role policy

The experiment MUST NOT use fully unconstrained arbitrary argument-role strings.

A small generic role vocabulary must be defined.

Recommended initial roles:

```text
actor
object
subject
target
recipient
source
destination
value
entity
```

The schema may include:

```text
other
```

with an accompanying descriptive role name if required.

The role vocabulary must remain intentionally small.

It must not attempt to reproduce full PropBank/FrameNet role inventories.

---

# 23. Argument representation

Conceptually:

```ts
type SemanticArgument = {
  role:
    | "actor"
    | "object"
    | "subject"
    | "target"
    | "recipient"
    | "source"
    | "destination"
    | "value"
    | "entity"
    | "other";

  roleDescription?: string;

  value: string;

  evidence: EvidenceReference[];
};
```

When `role = other`, `roleDescription` must be required.

---

# 24. Modality representation

The IR must support:

```ts
type SemanticModality =
  | {
      type: "obligation";
      evidence: EvidenceReference[];
    }
  | {
      type: "permission";
      evidence: EvidenceReference[];
    }
  | {
      type: "prohibition";
      evidence: EvidenceReference[];
    }
  | {
      type: "possibility";
      appliesTo?: SemanticModality;
      evidence: EvidenceReference[];
    }
  | {
      type: "recommendation";
      evidence: EvidenceReference[];
    };
```

Simple assertion is represented by absence of explicit modality unless the final schema defines an explicit `assertion` wrapper consistently.

The schema MUST NOT represent:

```text
possibility(obligation(...))
```

as equivalent to:

```text
permission(...)
```

---

# 25. Condition representation

A condition should represent an applicability predicate/state.

Conceptually:

```ts
type SemanticCondition = {
  text: string;
  evidence: EvidenceReference[];
};
```

Future normalization is out of scope.

---

# 26. Trigger representation

A trigger should represent an event/change initiating another proposition.

Conceptually:

```ts
type SemanticTrigger = {
  text: string;
  evidence: EvidenceReference[];
};
```

Trigger and condition must remain separate fields.

---

# 27. Temporal representation

The initial experiment must support at least:

```text
before
after
during
until
```

Conceptually:

```ts
type TemporalRelation = {
  relation:
    | "before"
    | "after"
    | "during"
    | "until"
    | "other";

  target: string;

  evidence: EvidenceReference[];
};
```

---

# 28. Quantity representation

Quantity semantics must preserve:

```text
value
unit
comparison/boundary
scope if explicitly present
```

Conceptually:

```ts
type SemanticQuantity = {
  comparator?:
    | "equal"
    | "maximum"
    | "minimum"
    | "greater_than"
    | "greater_than_or_equal"
    | "less_than"
    | "less_than_or_equal"
    | "range";

  value?: number;
  lowerBound?: number;
  upperBound?: number;

  unit?: string;

  evidence: EvidenceReference[];
};
```

The schema should remain small enough for the corpus.

---

# 29. Scope representation

Scope defines where or to what population/context the proposition applies.

Examples:

```text
per order
international orders
administrators
draft records
```

Scope MUST NOT be invented when the source is silent.

---

# 30. State representation

The IR must support state assertions and transitions without requiring full workflow modeling.

At minimum it must be capable of representing:

```text
entity is in state X
entity becomes state Y
```

Trigger and temporal relations may qualify state transitions.

---

# 31. Unresolved-aspect representation

Required shape:

```ts
type UnresolvedAspect = {
  aspect:
    | "actor"
    | "object"
    | "condition"
    | "trigger"
    | "threshold"
    | "quantity"
    | "scope"
    | "timing"
    | "outcome"
    | "reference"
    | "relationship"
    | "other";

  knownMeaning: string;

  missingInformation: string;

  clarificationQuestion: string;

  evidence: EvidenceReference[];
};
```

`knownMeaning` MUST describe what the source actually establishes.

`missingInformation` MUST identify only the missing semantic component.

`clarificationQuestion` MUST ask for that missing information without implying an answer.

---

# 32. Evidence contract

Evidence MUST be deterministic and source-verifiable.

For this experiment, evidence MUST NOT be a provider-generated paraphrase.

Use:

```ts
type EvidenceReference = {
  sourceSlot: string;
  quote: string;
};
```

Rules:

1. `quote` must be an exact substring of the authorized source text after the same deterministic text normalization used by the fixture harness.
2. whitespace normalization may be allowed only if implemented deterministically and documented;
3. evidence must reference the current authorized source slot;
4. a provider may not cite text outside the authorized source;
5. evidence validation failure is a qualification failure.

If stable character offsets are already readily available from `NormalizedDocument v1`, the implementation may additionally record offsets.

Offsets are optional for this experiment unless already supported cleanly.

---

# 33. Semantic equivalence policy

The oracle MUST distinguish semantic differences from harmless surface differences.

The following should normally be treated as surface-equivalent when all other meaning is preserved:

```text
customer
the customer
```

and minor grammatical variation such as:

```text
require approval
approval is required
```

when they express the same frozen semantic proposition.

The following are NOT equivalent:

```text
permission vs possibility
possibility vs obligation
obligation vs recommendation
positive vs negative
condition vs trigger
example vs assertion
explicit threshold vs missing threshold
resolved vs unresolved applicability
```

The oracle MUST therefore inspect semantic dimensions rather than exact strings wherever feasible.

---

# 34. Phase 3 — deterministic oracle and mutation tests

Ticket:

```text
SEMIR-003
```

Purpose:

> Prove that valid Semantic IR fixtures pass and semantically corrupted variants fail for the intended reasons.

No provider calls are allowed.

---

# 35. Required oracle dimensions

The oracle must be able to evaluate at least:

```text
source disposition
discourse role
proposition presence/count
predicate meaning
argument meaning
argument role
modality
nested modality
polarity
condition
trigger
temporal relation
quantity/boundary
scope
state semantics
unresolved aspect type
known meaning
missing information
clarification intent
evidence validity
source accounting
```

Not every case needs every dimension.

---

# 36. Mutation requirements

Create known-bad mutations demonstrating that the oracle rejects meaningful corruption.

At minimum:

### Modality mutations

```text
permission → obligation
possibility → assertion
possibility(obligation) → permission
recommendation → obligation
```

### Polarity mutations

```text
negative → positive
```

### Applicability mutations

```text
missing condition → invented condition
explicit condition → removed condition
condition → trigger
```

### Unresolved mutations

```text
missing actor silently supplied
missing threshold silently supplied
wrong unresolved aspect
clarification question asks something already known
known meaning loses source uncertainty
```

### Discourse mutations

```text
example → universal assertion
rationale → obligation
reference → fabricated referenced behavior
```

### Evidence mutations

```text
quote not present in source
wrong source slot
evidence taken from another corpus case
```

### Accounting mutations

```text
missing source result
duplicate source result
unknown source result
```

---

# 37. Oracle output

Failures must be dimension-specific.

Example:

```text
CASE: POSSIBLE_OBLIGATION_01

sourceDisposition       PASS
predicate               PASS
arguments               PASS
modality.outer          PASS
modality.inner          FAIL
temporal.before         PASS
unresolved.condition    FAIL
evidence                PASS
```

Do not reduce all diagnostic evidence to:

```text
case failed
```

---

# 38. Phase 4 — real NormalizedDocument path

Ticket:

```text
SEMIR-004
```

Purpose:

> Prove that the qualification harness operates through the same real `NormalizedDocument v1` source boundary Atlas uses rather than bespoke raw strings only.

No provider calls are allowed.

The implementation must:

- create or reuse a deterministic fixture document;
- parse through the real `NormalizedDocument v1` path;
- derive authorized source slots from the parsed document;
- connect corpus cases to source units;
- prove exact source accounting;
- prove evidence validation against those real source units.

The corpus's human semantic expectations remain the oracle authority.

---

# 39. Phase 4 acceptance

Before any provider call:

```text
all corpus known-good fixtures parse
all known-good fixtures pass the oracle
all required semantic mutations fail
all evidence mutations fail
source accounting passes
real NormalizedDocument fixture path passes
provider JSON Schema generates successfully
required .describe() content survives schema generation
existing affected package tests pass
git diff --check passes
```

If any requirement above fails:

```text
SEMSPIKE-006 MUST NOT RUN
```

---

# 40. Phase 5 — SEMSPIKE-006

Ticket:

```text
SEMSPIKE-006
```

Batch:

```text
SEMSPIKE-BATCH-06
```

Question:

> Can the tested provider/model transform a diverse set of source-grounded specification statements into Atlas Semantic IR v0 while preserving semantic force and unresolved meaning without semantic repair?

---

# 41. Provider configuration

To isolate the semantic-representation variable, the initial experiment should retain the previous provider/model unless human authority explicitly changes it.

Frozen default:

```text
Provider: Groq
Model: openai/gpt-oss-120b
Streaming: false
Reasoning effort: medium
Structured output: strict JSON Schema
Retry: none
Fallback: none
Repair: none
```

Provider/model changes require explicit human authorization and must produce a separate qualification run rather than silently modifying the original experiment.

---

# 42. Live corpus subset

Use approximately 12 source cases selected from the frozen corpus.

Selection must cover semantic diversity rather than easy-pass cases.

Required live categories:

1. simple proposition;
2. obligation;
3. permission;
4. possibility;
5. nested possibility + obligation;
6. prohibition or negation;
7. explicit condition;
8. missing semantic component;
9. quantity/threshold;
10. state transition;
11. example or rationale;
12. non-semantic structure.

The three mandatory `may` contrast cases MUST be included:

```text
Users may export reports.

Reports may contain personal information.

Approval may be required before processing.
```

---

# 43. Live request structure

The live request should contain:

```text
generic Atlas semantic policy
+
provider-facing Semantic IR JSON Schema
+
authorized source units
```

It MUST NOT contain:

- fixture answers;
- case-specific hints;
- references to oracle expectations;
- instructions mentioning S4;
- lexical shortcuts;
- post-failure corrections.

---

# 44. Generic provider instruction

The provider instruction should remain compact and generic.

Conceptually:

```text
Extract only meaning supported by the authorized source units.

Represent each meaningful source as one or more propositions.

Represent modality, polarity, conditions, triggers, temporal relationships,
quantities, scope and state information independently when supported.

Do not strengthen or weaken the source.

Permission, possibility, obligation, prohibition and recommendation are
different semantic forces and must remain distinguishable.

When meaningful information is present but an essential semantic component
is missing, preserve the known meaning and identify the missing component as
an unresolved aspect. Do not invent the missing information.

Preserve examples, rationale, references and non-semantic document structure
as such.

Use only evidence from the authorized source text.

Do not canonicalize terminology, reconcile against project truth, resolve
conflicts, infer document authority or repair ambiguity.
```

The exact prompt must be frozen before the first authenticated call.

---

# 45. Number of provider calls

Run the identical frozen request exactly twice.

Planned authenticated requests:

```text
2
```

The second call is an independent generation.

No result from Run 1 may be supplied to Run 2.

No model output may be repaired between calls.

---

# 46. Live evaluation order

Each raw provider response must be evaluated in this order:

```text
HTTP/provider success
        ↓
strict structured-output parse
        ↓
same generating Zod parse
        ↓
source accounting
        ↓
evidence validation
        ↓
semantic oracle
        ↓
cross-run semantic comparison
```

No later stage may repair failure from an earlier stage.

---

# 47. Terminal result classification

## PASS

Only when both independent runs:

- complete successfully;
- pass Zod;
- pass source accounting;
- pass evidence validation;
- satisfy every critical semantic oracle requirement across the live corpus;
- contain no semantic repair.

---

## FAIL

When authenticated calls complete but one or both results violate any critical semantic requirement.

Examples:

```text
permission interpreted as possibility
possibility promoted to assertion
nested possibility-obligation flattened incorrectly
negative polarity lost
condition invented
trigger invented
missing actor invented
example promoted into rule
unresolved meaning misidentified
```

---

## ENVIRONMENT_BLOCKED

Only when the provider experiment cannot be meaningfully executed because of an environmental/provider condition outside the semantic result itself.

Examples may include:

- authentication failure;
- provider outage;
- request rejected before semantic execution;
- infrastructure unavailable.

A semantic error MUST NOT be classified as environment blocked.

---

# 48. Cross-run stability

The two responses do NOT need byte-identical JSON.

They do need semantic equivalence on all frozen critical dimensions.

Allowed differences may include:

```text
minor wording variation
equivalent predicate phrasing
equivalent grammatical phrasing
```

Disallowed differences include:

```text
permission in one run / possibility in another
resolved in one run / unresolved in another
condition in one run / trigger in another
positive in one run / negative in another
different thresholds
invented actor in one run
different discourse role
```

Cross-run instability on a critical semantic dimension causes terminal `FAIL`.

---

# 49. Evidence storage

Generated experiment evidence must remain outside version-controlled source where appropriate.

Recommended:

```text
.atlas-data/semantic-ir-v0/
.atlas-data/semantic-ir-spike-006/
```

May contain:

```text
provider-schema.json
raw-response-run-01.json
raw-response-run-02.json
evaluation-run-01.json
evaluation-run-02.json
summary.json
```

These directories must remain ignored.

No API key, Authorization header, credential or secret may be written.

---

# 50. Frozen report requirements

The final `SEMSPIKE-006` report must state separately:

```text
STRUCTURAL RESULT
EVIDENCE RESULT
SEMANTIC RESULT
CROSS-RUN STABILITY
TERMINAL RESULT
```

Example:

```text
Structural validity: PASS
Evidence grounding: PASS
Semantic oracle: FAIL
Cross-run stability: FAIL
Terminal result: FAIL
```

Do not report merely:

```text
LLM failed
```

---

# 51. Failure classification

A terminal failure must identify which category failed:

```text
IR_REPRESENTATION_FAILURE

SCHEMA_VALIDATION_FAILURE

EVIDENCE_GROUNDING_FAILURE

PROVIDER_STRUCTURAL_FAILURE

PROVIDER_SEMANTIC_FAILURE

PROVIDER_STABILITY_FAILURE
```

The classification must be evidence-backed.

If Phase 1–4 demonstrate that a valid known-good representation exists but the live provider fails to produce it, the result should normally be classified as provider semantic/stability failure rather than IR representation failure.

---

# 52. Stop conditions

Implementation MUST return control to human/planning authority when:

- a corpus case cannot be represented without a case-specific schema hack;
- the schema begins encoding fixture answers;
- lexical shortcuts are proposed to satisfy the oracle;
- semantic repair appears necessary;
- retry prompting appears necessary;
- canonicalization becomes necessary merely to pass extraction;
- reconciliation becomes necessary merely to pass extraction;
- production Atlas routes would need modification;
- existing Master facts must be loaded;
- provider calls would be required before Phase 1–4 pass.

Do not broaden scope automatically.

---

# 53. Ticket decomposition

The preferred ticket sequence is:

## `SEMIR-001`

**Semantic qualification corpus and frozen interpretation expectations**

Deliver:

- corpus;
- contrast sets;
- human-authored semantic expectations;
- context-free/context-dependent classification.

Provider calls:

```text
0
```

---

## `SEMIR-002`

**Atlas Semantic IR v0 Zod schema**

Deliver:

- exact Zod contract;
- provider JSON Schema;
- semantic descriptions;
- known-good fixture parsing.

Provider calls:

```text
0
```

---

## `SEMIR-003`

**Deterministic semantic oracle and mutation suite**

Deliver:

- dimension-based oracle;
- semantic equivalence policy;
- negative semantic mutations;
- evidence validation;
- source accounting validation.

Provider calls:

```text
0
```

---

## `SEMIR-004`

**Real NormalizedDocument qualification harness**

Deliver:

- real fixture path;
- source-unit mapping;
- exact evidence verification;
- full offline qualification command.

Provider calls:

```text
0
```

---

## `SEMSPIKE-006`

**Semantic IR live extraction qualification**

Deliver:

- exactly two planned authenticated calls;
- preserved raw output;
- run-level evaluations;
- cross-run comparison;
- terminal result.

Provider calls:

```text
2 planned
```

---

# 54. GO / CK / CFC / HMN expectations

Each ticket must remain independently bounded.

GO must not proceed into the next ticket merely because implementation is convenient.

CK reviews only the frozen ticket contract.

CFC may remediate only evidence/implementation defects authorized for the reviewed ticket.

CFC MUST NOT silently change:

- semantic definitions;
- corpus expectations;
- oracle meaning;
- provider prompt;
- provider configuration;

to make a failing experiment pass.

Any required semantic-contract change returns to human/planning authority.

HMN authorization is required for bounded deviations from frozen experiment authority.

---

# 55. Security and integrity requirements

Existing Atlas security-seam principles remain applicable.

At minimum:

- credentials never enter committed files;
- raw provider artifacts remain ignored;
- provider errors do not expose secrets;
- external text is treated as untrusted input;
- evidence references cannot escape authorized source units;
- source IDs are validated deterministically;
- experiment output cannot activate production behavior;
- semantic provider output does not gain canonical authority merely by parsing successfully.

---

# 56. What this experiment is actually proving

A successful result does NOT prove:

```text
Atlas semantics are solved.
```

It proves:

```text
A general Semantic IR can represent the frozen semantic corpus.

Deterministic Atlas validation can distinguish important semantic corruption.

The tested LLM can populate that representation correctly for the tested
qualification set.

Independent generations preserve the required semantic distinctions.
```

That is enough to authorize the next semantic problem.

---

# 57. Next authorized direction after PASS

A `SEMSPIKE-006 PASS` may authorize planning for:

```text
SEMCONTEXT-001 / SEMSPIKE-007
```

whose purpose is:

> Determine whether bounded document/project context improves interpretation of semantically context-dependent source units without requiring full-Master prompting.

That future experiment may test:

```text
local neighboring source context
project terminology
known definitions
known actors/entities
retrieved relevant facts
```

It must remain separate from canonicalization and reconciliation.

---

# 58. Next direction after FAIL

A `SEMSPIKE-006 FAIL` does not automatically authorize prompt expansion.

First classify whether the failure came from:

```text
IR design
oracle design
provider semantic capability
provider stochastic instability
```

If the IR and offline corpus remain sound but the provider is the failing layer, the next planning decision may test another provider/model with the same frozen:

```text
Semantic IR
corpus
oracle
prompt policy
```

This turns the corpus into an Atlas semantic model-qualification harness.

---

# 59. Final architectural invariant

The experiment must preserve this long-term Atlas boundary:

```text
DOCUMENT
    ↓
PERCEPTION
    ↓
SOURCE EVIDENCE
    ↓
SEMANTIC PROPOSITIONS
    ↓
SEMANTIC QUALIFIERS
    ↓
UNRESOLVED ASPECTS
    ↓
DETERMINISTIC VALIDATION
    ↓
later:
CANONICALIZATION
    ↓
ASSERTIONS
    ↓
RECONCILIATION
    ↓
HUMAN AUTHORITY
    ↓
MASTER
    ↓
PROJECTIONS
```

The LLM proposes source meaning.

It does not decide project truth.

---

# 60. Definition of ready for live qualification

`SEMSPIKE-006` is authorized to execute only when all of the following are true:

```text
SEMIR-001 corpus frozen and reviewed

SEMIR-002 schema represents every frozen corpus case

SEMIR-003 oracle passes all known-good fixtures

SEMIR-003 rejects all required semantic mutations

SEMIR-004 operates through real NormalizedDocument v1

evidence validation is deterministic

source accounting is deterministic

generated JSON Schema contains required semantic descriptions

affected local tests pass

affected package tests pass

git diff --check passes

provider prompt is frozen

live corpus subset is frozen

provider configuration is frozen
```

Only then may the two authenticated calls occur.

---

# 61. Terminal experiment question

The final question answered by this ticket chain is:

> **Can Atlas faithfully represent diverse specification meaning as source-grounded propositions with independent semantic qualifiers and explicit knowledge gaps, and can the tested LLM populate that representation consistently without inventing or repairing meaning?**

If yes, Atlas may proceed toward context-aware extraction.

If no, the evidence must identify whether the representation or the model is the failing boundary.