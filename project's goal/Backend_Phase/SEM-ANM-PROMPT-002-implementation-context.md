# SEM-ANM-PROMPT-002 — Atlas Semantic V1 Zod/Describe Prompt Qualification

## 1. Purpose

`SEM-ANM-PROMPT-002` replaces the intentionally small semantic language used by `SEM-ANM-PROMPT-001` with a Zod-driven provider semantic language derived from the **actual current Atlas semantic-v1 contract**.

This ticket is **offline prompt/schema work only**.

It answers:

> Can the existing Atlas `atlas.semantic.extract/v1` vocabulary and result semantics be represented in Zod with explicit human-authored `.describe(...)` semantics, then deterministically compiled into a provider-facing extraction prompt without inventing a parallel Atlas ontology?

No Anoman/Gemini/live-provider call is authorized by this ticket.

---

## 2. Authoritative Source Inspected

```text
repository: adityaa11/ces-platform
branch: codex/new-atlas-backend
path: packages/atlas-contracts/src/semantic.ts
Git blob SHA: a80c72922f25aac83bf2a6c4714865b7c247c9f6
```

The inspected V1 source defines:

```text
candidate kinds:
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

source classifications:
candidate
non_fact

reconciliation relationship types:
new
supports
duplicates
refines
extends
contradicts
supersedes
partially_supersedes
ambiguous
requires_resolution
```

The current extraction result remains:

```text
version
candidate_assertions[]
source_statement_inventory[]
questions[]
```

Each candidate remains:

```text
local_candidate_id
semantic_key
kind
payload
normalized_meaning
source_wording?
needs_resolution
evidence_refs[]
```

The current V1 `payload` intentionally remains bounded JSON rather than a fixed business-domain schema.

---

## 3. Frozen Human-Authored Zod Reference

Use the supplied file exactly:

```text
SEM-ANM-PROMPT-002-atlas-semantic-v1-zod-reference.ts
SHA-256: 67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083
```

Codex is **not authorized** to independently write or rewrite the semantic `.describe(...)` text.

Codex may only:

```text
copy the supplied reference into the repository
adapt mechanical imports/file placement
build parity tests
build the prompt compiler
build deterministic finalization tests
```

Any semantic wording change requires explicit HMN authorization.

---

## 4. Two Layers Must Stay Separate

The supplied Zod reference contains:

### A. Atlas V1 mirror/reference

```text
atlasSemanticKindV1Schema
atlasSemanticPayloadV1Schema
atlasEvidenceRefV1Schema
atlasSemanticCandidateV1Schema
atlasSourceClassificationV1Schema
atlasSourceStatementInventoryItemV1Schema
atlasSemanticQuestionV1Schema
atlasSemanticExtractionResultV1Schema

atlasReconciliationRelationshipTypeV1Schema
atlasReconciliationRelationshipV1Schema
atlasSemanticReconciliationResultV1Schema
```

This exists for **contract parity and alignment proof**.

### B. Provider-facing extraction profile

```text
atlasProviderExtractionProposalV1Schema
```

The model-facing candidate contains only semantic judgments:

```text
semantic_key
kind
payload
normalized_meaning
needs_resolution
```

The provider-facing layer must not ask the model to create:

```text
local_candidate_id
page_number
locator_type
locator_id
evidence_refs
source_unit_id
source_statement_inventory identity
canonical semantic IDs
workspace/project authority
accepted truth
reconciliation decisions
publication state
Master state
```

Atlas owns those deterministically.

---

## 5. Critical Semantic Rule: `kind` Is Primary Role

The current V1 contract stores exactly one `kind` per candidate while keeping an extensible structured `payload`.

Therefore:

> `kind` identifies the candidate's **primary semantic role**. It does not mean the proposition has no other semantic facets.

Do not recreate:

```text
rule XOR constraint
```

A proposition can simultaneously contain:

```text
normative rule meaning
+
quantitative restriction
+
scope
+
condition
+
timing
```

The primary kind supports Atlas classification/indexing; the payload preserves orthogonal source-grounded meaning.

Example:

```text
Customers may buy at most 2 products per order.
```

A valid representation may use:

```text
kind = rule
```

with payload preserving:

```text
modality = permitted
maximum = 2
object/unit = products
scope = per order
```

A `constraint` kind is also meaningful when the boundary/invariant itself is the primary informational contribution.

The model must never discard one facet merely to satisfy the primary kind.

---

## 6. Frozen V1 Kind Meanings

The exact `.describe(...)` wording is authoritative in the supplied TypeScript file. Codex must not regenerate these descriptions.

Summary only:

| V1 kind | Primary meaning |
|---|---|
| `actor` | independently meaningful agent/role/system/entity |
| `business_object` | domain object/record/document/concept |
| `business_property` | property/status/value/formula/derived characteristic |
| `responsibility` | stable duty/authority/capability assigned to an actor |
| `rule` | governing normative business behavior/policy |
| `constraint` | boundary/invariant/restriction/cardinality/threshold/limit |
| `condition` | applicability predicate/prerequisite/guard/trigger |
| `decision` | material choice/determination/approval decision point |
| `workflow_step` | concrete process action/event |
| `state_transition` | change from one state/status/value to another |
| `relationship` | business-domain association/dependency/cardinality |
| `input` | information/document/value/artifact supplied to behavior |
| `output` | report/artifact/message/result/display/export produced |
| `acceptance_expectation` | acceptance criterion/verification/completion expectation |
| `exception` | exceptional/failure/override/alternate path |
| `unresolved` | material ambiguity prevents safe specific representation |

---

## 7. `unresolved` vs `needs_resolution`

They are different dimensions.

Valid:

```text
kind = rule
needs_resolution = true
```

when the statement is clearly a rule but one material condition/scope/value remains unresolved.

Use:

```text
kind = unresolved
```

when material ambiguity prevents safe representation under a more specific kind.

Do not force every unresolved detail into `kind = unresolved`.

---

## 8. Payload Philosophy

Do not invent a new closed Atlas payload contract.

Current V1 intentionally accepts bounded JSON payload.

For the provider-facing profile, payload is constrained to a JSON object with descriptive keys so the model can produce structured meaning that fits directly inside existing V1 payload.

Possible source-grounded dimensions include:

```text
actor
subject
action
object
target
modality
conditions
temporal ordering
quantities
units
scope
states
state transitions
relationships
cardinality
derivations/formulas
inputs
outputs
acceptance details
exception details
```

These are **not mandatory fields**.

Do not produce a giant null-filled universal payload.

Only emit materially useful, source-supported keys.

---

## 9. Source Accounting Must Use Current V1 Vocabulary

Provider-facing source classification must be only:

```text
candidate
non_fact
```

Do not reintroduce the old spike-only:

```text
uncertain
```

Uncertainty belongs in:

```text
candidate.kind
candidate.needs_resolution
questions[]
```

Cross-field rules:

```text
candidate:
  candidates.length >= 1
  non_fact_reason = null

non_fact:
  candidates.length = 0
  non_fact_reason != null
  questions.length = 0
```

Missing output is never equivalent to `non_fact`.

---

## 10. Deterministic Finalization Proof

Implement an offline finalizer proving:

```text
atlasProviderExtractionProposalV1Schema
        ->
Atlas-owned deterministic assembly
        ->
existing parseSemanticExtractionResult(...)
```

Atlas may deterministically add:

```text
local candidate IDs
exact source wording
page/locator identity
evidence excerpts
source inventory identity
question evidence refs
V1 result envelope fields
```

Atlas may **not**:

```text
change candidate kind
invent payload meaning
repair numbers
repair modality
invent conditions
invent scope
silently resolve ambiguity
```

---

## 11. Source-Parity Gate

Before prompt generation, compare the supplied Zod reference against current:

```text
packages/atlas-contracts/src/semantic.ts
```

Freeze/check at minimum:

```text
semantic version = v1
16 candidate kind literals
2 source classification literals
10 reconciliation relationship literals
candidate field names
result field names
candidate/result bounds
evidence locator vocabulary
payload bounds
source-accounting invariants
reconciliation target invariant
```

If current `semantic.ts` no longer matches the inspected Git blob:

```text
a80c72922f25aac83bf2a6c4714865b7c247c9f6
```

stop as:

```text
SOURCE_DRIFT
```

Do not silently rewrite the human-authored descriptions.

---

## 12. Prompt Compiler

Use:

```text
Zod reference
    -> z.toJSONSchema(...)
    -> deterministic prompt compiler
    -> generated extraction system prompt
```

Do not inspect private Zod `_def` internals.

Do not maintain a second hand-written kind glossary inside the compiler.

The extraction prompt should render only:

```text
atlasProviderExtractionProposalV1Schema
```

The full result mirror exists for parity/finalization proof, not for dumping Atlas-owned IDs and evidence fields into the provider prompt.

---

## 13. Static Global Extraction Policy

Keep these rules static rather than duplicating them in individual `.describe(...)` fields:

```text
extract only supplied source meaning
one source may yield zero/one/multiple independently meaningful candidates
do not invent
preserve uncertainty
preserve exact numbers/units
preserve modality and negation
preserve scope
preserve conditions separately from temporal ordering
resolve references only when safe
do not silently reconcile conflicts
do not infer accepted/canonical truth
do not perform reconciliation
preserve every supplied slot exactly once
return JSON only
```

Add explicitly:

```text
Candidate kind is the PRIMARY semantic role.
Kinds are not mutually exclusive semantic facets.
Payload preserves additional source-grounded facets.
```

---

## 14. Safara Is Coverage, Not Ontology Authority

Use `Safara_Buyer_Business_PRD` as one coverage corpus because it exercises generic PRD semantics such as:

```text
workflow actions
role responsibilities
business objects
properties/derived values
rules
constraints
conditions
state transitions
relationships/cardinality
inputs/documents
outputs/reports
acceptance expectations
exceptions/rejections
unresolved ambiguity
```

Do not encode Safara-specific terms/statuses into the schema.

The schema remains product-independent.

---

## 15. Offline Coverage

The generated prompt/schema coverage must include all 16 current V1 kinds and:

```text
candidate
non_fact
needs_resolution = true/false
multiple candidates from one source when independently meaningful
```

Coverage fixtures may combine generic examples with selected Safara statements.

Do not create a test that forces every real sentence into exactly one mutually exclusive conceptual bucket. The candidate kind is the primary classification, while payload preserves the rest.

---

## 16. Reconciliation Boundary

The supplied Zod reference includes the actual V1 reconciliation relationship vocabulary and human-authored descriptions because reconciliation belongs to the same `semantic.ts` source.

However `SEM-ANM-PROMPT-002` is extraction-only.

Therefore:

```text
DO parity-check reconciliation vocabulary
DO preserve its Zod reference
DO NOT render reconciliation relationship definitions into extraction prompt
DO NOT send prior candidates
DO NOT perform reconciliation
```

A later reconciliation prompt ticket may consume those already-authored descriptions.

---

## 17. Suggested Repository Layout

```text
scripts/
  sem-anm-prompt002/
    atlas-semantic-v1-zod-reference.ts
    atlas-semantic-v1-source-parity.mts
    prompt-fixed-sections.mts
    prompt-compiler.mts
    prompt-compiler.test.mts
    provider-proposal-finalizer.mts
    provider-proposal-finalizer.test.mts
    semantic-v1-coverage-fixtures.mts
    generated/
      system-prompt.txt
      provider-schema.json
      source-parity.json
      prompt-provenance.json
```

Record SHA-256 for:

```text
Zod reference source
provider JSON Schema
generated system prompt
coverage fixture set
```

---

## 18. Mandatory Negative Tests

Reject at minimum:

```text
unknown candidate kind
unknown source classification
missing source slot
duplicate source slot
invented source slot
candidate classification with zero candidates
candidate classification with non_fact_reason
non_fact with candidates
non_fact without reason
non_fact with semantic questions
payload beyond current V1 depth/array/object/string bounds
provider-created local_candidate_id
provider-created Atlas evidence fields
reconciliation vocabulary leaking into extraction result
```

Parity must fail if:

```text
V1 kind added/removed
source classification added/removed
reconciliation relation added/removed
current semantic.ts source hash changes unexpectedly
candidate/result field shape drifts
```

---

## 19. Review Contract

| ID | Requirement |
|---|---|
| `RC-PROMPT2-001` | Current `semantic.ts` matches frozen source authority or ticket stops as `SOURCE_DRIFT`. |
| `RC-PROMPT2-002` | All 16 V1 extraction kinds are represented exactly in the Zod semantic vocabulary. |
| `RC-PROMPT2-003` | All 10 V1 reconciliation relationship types are preserved in the reference but excluded from extraction prompt. |
| `RC-PROMPT2-004` | Human-authored `.describe(...)` text is used verbatim; Codex does not regenerate it. |
| `RC-PROMPT2-005` | Provider profile excludes Atlas-owned identity/evidence/authority fields. |
| `RC-PROMPT2-006` | Provider proposal deterministically finalizes into unchanged `parseSemanticExtractionResult(...)`. |
| `RC-PROMPT2-007` | `kind` is documented as primary role, avoiding false rule-vs-constraint exclusivity. |
| `RC-PROMPT2-008` | Source accounting uses current `candidate/non_fact` vocabulary; no spike-only `uncertain`. |
| `RC-PROMPT2-009` | Prompt definitions derive from Zod/JSON Schema, not a duplicate semantic glossary. |
| `RC-PROMPT2-010` | Offline generated prompt covers every V1 kind. |
| `RC-PROMPT2-011` | Safara is test coverage only, never product-specific ontology authority. |
| `RC-PROMPT2-012` | No live provider call occurs. |
| `RC-PROMPT2-013` | Deterministic hashes and repository hygiene pass. |

---

## 20. Terminal Classification

Use exactly one:

```text
PASS
CHANGES_REQUIRED
SOURCE_DRIFT
```

`PASS` requires:

```text
source parity PASS
Zod reference PASS
provider JSON Schema generated
prompt generated from Zod descriptions
all 16 extraction kinds present
reconciliation vocabulary excluded from extraction prompt
o Codex-authored semantic descriptions
o live provider call
o semantic invention in finalizer
real existing semantic-v1 parser PASS
```

---

## 21. Hard Stop

Stop after:

```text
source parity
Zod/reference tests
generated provider schema
generated prompt
prompt/schema hashes
offline finalizer
real V1 parser proof
coverage fixtures
CK review artifact
```

Do not automatically continue into:

```text
Anoman
Gemini
live qualification
full Safara extraction
semantic reconciliation
BSS-V2-004-03 production activation
```

The next live semantic qualification must consume the exact generated PROMPT-002 artifacts and hashes.
