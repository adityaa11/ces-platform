# SEM-ANM-PROMPT-002 — Atlas Semantic V1 Prompt Builder Qualification

## 1. Purpose

`SEM-ANM-PROMPT-002` is a narrowly scoped offline prompt-builder qualification ticket.

Its only purpose is to answer:

> Can the prompt-builder deterministically turn the frozen Atlas Semantic V1 Zod + `.describe(...)` reference into the intended model-facing extraction system prompt?

This ticket does **not** test provider behavior.

This ticket does **not** test Atlas finalization.

This ticket does **not** run Anoman, Gemini, or any other model.

The output of this ticket is the generated prompt artifact that a later live semantic spike may consume.

---

## 2. Frozen Semantic Reference

Use exactly:

```text
SEM-ANM-PROMPT-002-atlas-semantic-v1-zod-reference.ts
```

Reference SHA-256:

```text
67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083
```

Codex is **not authorized** to rewrite, shorten, reinterpret, optimize, regenerate, or substitute any semantic `.describe(...)` text in that file.

Codex may only:

```text
copy/place the supplied reference into the repository
fix mechanical imports/paths if needed
consume it from the prompt builder
```

Any semantic wording change requires explicit HMN authorization.

---

## 3. Scope

### IN SCOPE

```text
consume the frozen Zod reference

use z.toJSONSchema(...)

reuse or extend the deterministic prompt-builder approach

derive the extraction output shape from the Zod schema

derive semantic field/kind definitions from Zod .describe(...)

combine those derived sections with fixed global extraction policy

generate the final extraction system prompt

write the generated prompt to an artifact

write the generated provider JSON Schema to an artifact

snapshot/hash the generated prompt

snapshot/hash the generated provider JSON Schema

verify all 16 Atlas Semantic V1 candidate kinds are represented

verify provider-facing candidate/non_fact classifications are represented

verify important global extraction rules remain present

verify reconciliation vocabulary does not leak into the extraction prompt

CK-review the final prompt output

STOP
```

### OUT OF SCOPE

```text
Anoman calls
Gemini calls
OpenRouter calls
Groq calls
any live model inference

S1-S4 live qualification
Safara full semantic extraction
HB-01..HB-09

parseSemanticExtractionResult(...)
Atlas semantic finalization
candidate ID construction
source inventory construction
evidence construction
question evidence construction

BSS-V2-004-03 production integration
Agents Bridge integration
queue/worker integration
database persistence

reconciliation execution
reconciliation prompt qualification

production contract changes
Semantic V2
```

---

## 4. Current Atlas Semantic V1 Vocabulary

The prompt must expose the actual current Atlas Semantic V1 extraction candidate vocabulary:

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

The prompt builder must not fall back to the smaller `SEM-ANM-PROMPT-001` vocabulary.

The provider-facing source accounting vocabulary remains:

```text
candidate
non_fact
```

Do not reintroduce spike-only:

```text
uncertain
```

as a source classification.

---

## 5. Important Semantic Rule

The generated prompt must preserve this principle from the frozen Zod reference:

> `kind` represents the candidate's **primary semantic role**, not every semantic facet present in the proposition.

Semantic facets may overlap.

Examples:

```text
rule
+
quantitative constraint
+
scope
```

```text
workflow_step
+
state change
```

```text
relationship
+
cardinality constraint
```

The prompt must not imply:

```text
rule XOR constraint
```

or similar false mutual exclusivity.

The provider-facing payload exists to preserve additional source-grounded semantic facets.

---

## 6. `unresolved` vs `needs_resolution`

The prompt must preserve the distinction defined in the frozen Zod reference.

These are orthogonal:

```text
kind
needs_resolution
```

For example:

```text
kind = rule
needs_resolution = true
```

is valid when the proposition is clearly a rule but one material condition/value/scope is unresolved.

Use:

```text
kind = unresolved
```

only when ambiguity prevents safe representation under a more specific kind.

The prompt builder must not collapse these concepts.

---

## 7. Prompt-Builder Architecture

Use:

```text
FROZEN ZOD REFERENCE
        |
        v
z.toJSONSchema(...)
        |
        +------------------------------+
        |                              |
        v                              v
OUTPUT SHAPE                    SEMANTIC DEFINITIONS
                                       |
                                       v
                         field/kind .describe(...) text
        |                              |
        +---------------+--------------+
                        |
                        v
              STATIC EXTRACTION POLICY
                        |
                        v
             GENERATED SYSTEM PROMPT
```

Do not inspect private Zod internals such as:

```text
_def
```

Use the public JSON Schema conversion path.

### 7.1 PROMPT-001 builder reuse boundary

Reuse the proven PROMPT-001 builder architecture, but do **not** assume the
current PROMPT-001 implementation can be copied unchanged.

The current builder is shaped around:

```text
source_results[]
  -> semantic_units[]
```

and its description-completeness traversal expects the old universal
`SemanticUnit` fields.

PROMPT-002 provider shape is instead:

```text
source_results[]
  -> classification
  -> candidates[]
      -> semantic_key
      -> kind
      -> payload
      -> normalized_meaning
      -> needs_resolution
  -> non_fact_reason
  -> questions[]
```

Therefore Codex may generalize the deterministic JSON-Schema traversal and
renderer as required for this new shape.

It must preserve the existing architecture:

```text
Zod
  -> z.toJSONSchema(...)
  -> deterministic traversal
  -> generated output shape / definitions
  -> fixed scaffold
```

It must not preserve old field assumptions merely for code reuse.


---

## 8. Frozen Fixed Prompt Sections

`SEM-ANM-PROMPT-002` must use the existing `SEM-ANM-PROMPT-001` fixed scaffold as its baseline, but it must **not** copy every string verbatim.

The actual current baseline is:

```text
scripts/sem-anm-prompt001/prompt-fixed-sections.mts
```

PROMPT-002 changes only the fixed wording that no longer matches the richer Atlas Semantic V1 provider profile.

The following strings are frozen for PROMPT-002.

### 8.1 SYSTEM ROLE — unchanged

```text
You are a semantic extraction component.
```

### 8.2 TASK INSTRUCTION — updated

Replace the old `semantic units` wording with:

```text
Extract the project meaning of each supplied source into semantic candidates.

A source may establish:
- no project meaning;
- exactly one independently meaningful semantic candidate; or
- multiple independently meaningful semantic candidates.

Do not merge independent propositions merely because they appear in the
same sentence or paragraph.

Do not split one proposition merely because it contains multiple
semantic facets.
```

Reason:

```text
PROMPT-002 output is candidate-oriented rather than semantic_units-oriented.
A source with no project meaning is represented through the Zod-owned
candidate/non_fact classification.
The final sentence prevents the S2-style mistake of splitting one
multi-faceted proposition merely because rule + constraint are both true.
```

### 8.3 REFERENCE HANDLING — unchanged

```text
REFERENCE HANDLING

- Resolve pronouns or references when the source establishes a clear
  referent.
- If multiple plausible referents materially change the semantics,
  do not choose one arbitrarily.
```

Do not add a fixed instruction saying exactly how ambiguity must be encoded.
That representation remains Zod-owned through:

```text
kind
needs_resolution
questions
```

### 8.4 MULTIPLE-CANDIDATE HANDLING — updated

Replace the PROMPT-001 multiple-unit section with:

```text
MULTIPLE-CANDIDATE HANDLING

- One grammatical sentence may express multiple independently meaningful
  propositions.
- One paragraph may express multiple independently meaningful propositions.
- Split candidates only when the propositions are independently meaningful
  project statements.
- Do not split one proposition solely because it contains several semantic
  facets, qualifiers, or restrictions.
- Preserve shared conditions or timing on every candidate to which they
  apply.
- Do not collapse several independent propositions into one vague candidate.
```

Reason:

```text
PROMPT-001 said to split materially independent actions/rules/constraints,
which was reasonable for the small schema but is too easy to misread once
Atlas V1 kinds overlap conceptually.

PROMPT-002 must split independent propositions, not semantic facets.
```

### 8.5 CONFLICT HANDLING — updated narrowly

Use:

```text
CONFLICT HANDLING

- Preserve every source proposition faithfully.
- Do not silently reconcile, weaken, merge, prioritize, supersede, or
  discard apparently conflicting propositions.
- Do not infer which conflicting proposition is accepted or canonical.
- Extraction is not reconciliation or conflict resolution.
```

Changes from PROMPT-001:

```text
add "supersede"
add explicit accepted/canonical-truth boundary
state extraction != reconciliation
```

This aligns the fixed extraction behavior with Atlas authority boundaries
without defining reconciliation relationship semantics.

### 8.6 GENERAL RULES — updated

Use:

```text
GENERAL RULES

- Use only information supported by the supplied source.
- Do not invent facts.
- Preserve uncertainty.
- Preserve modality and negation.
- Preserve exact numeric values and units.
- Preserve explicit scope.
- Preserve conditions and temporal relationships separately.
- Preserve material source-supported facets even when they are not the
  candidate's primary semantic role.
- Do not create clarification questions for merely incidental omissions.
```

Changes from PROMPT-001:

```text
"numeric limits" -> "numeric values and units"
add modality and negation
add preservation of non-primary semantic facets
```

Do not add fixed definitions for individual Atlas kinds here.
Those remain owned by the supplied Zod `.describe(...)` text.

### 8.7 SOURCE ACCOUNTING — updated narrowly

Use:

```text
SOURCE ACCOUNTING

- Return one source_result for every supplied slot.
- Preserve the supplied slot exactly.
- Do not create slots that were not supplied.
- Do not omit a supplied slot.
- Do not use non_fact as a fallback for missing or failed extraction.
```

The meaning of `candidate` and `non_fact` remains Zod-owned.
This fixed section only governs accounting behavior.

### 8.8 OUTPUT RULES — unchanged

```text
OUTPUT RULES

- Return valid JSON only.
```

No provider-specific JSON-fence behavior belongs in this prompt-builder ticket.

---

## 9. Zod-Owned Prompt Content

The following prompt content must come from the frozen Zod reference, not from a separately maintained handwritten glossary:

```text
provider-facing output shape

field definitions

candidate kind vocabulary

candidate kind meanings

payload meaning

semantic_key meaning

normalized_meaning meaning

needs_resolution meaning

candidate/non_fact classification meaning

question meaning

source_result meaning

primary-kind / overlapping-facets meaning

unresolved vs needs_resolution meaning

cross-field semantic rules represented by object descriptions
```

Codex must not create a second competing semantic glossary.

The fixed prompt text may say **how extraction should behave**, but the supplied
Zod `.describe(...)` text remains the authority for **what each semantic field
and kind means**.


## 10. Reconciliation Boundary

The supplied Zod reference also contains the current Atlas Semantic V1 reconciliation relationship vocabulary.

That vocabulary stays in the reference because it belongs to the same semantic-v1 source authority.

However, this ticket is **extraction-prompt only**.

Therefore the generated extraction prompt must not contain reconciliation relationship definitions such as:

```text
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

except where those words appear incidentally in ordinary prose.

No reconciliation schema should be rendered into the extraction prompt.

---

## 11. Safara Boundary

Safara may be used only as a sanity-check corpus when visually reviewing the generated prompt.

Do not add Safara-specific ontology concepts such as:

```text
jemaah
umrah
manifest
visa
passport
Safara-specific statuses
```

to the semantic vocabulary.

The prompt must remain product-independent.

No full Safara model extraction is authorized by this ticket.

---

## 12. Required Generated Artifacts

Suggested structure:

```text
scripts/
  sem-anm-prompt002/
    atlas-semantic-v1-zod-reference.ts
    prompt-fixed-sections.mts
    prompt-compiler.mts
    prompt-compiler.test.mts
    generated/
      system-prompt.txt
      provider-schema.json
      prompt-provenance.json
      hashes.json
```

Required outputs:

```text
generated system prompt

generated provider-facing JSON Schema

SHA-256 of frozen Zod reference

SHA-256 of generated provider JSON Schema

SHA-256 of generated system prompt
```

All generated artifacts must be deterministic.

Running the builder twice without source changes must produce identical bytes and identical hashes.

---

## 13. Required Prompt Coverage Checks

The test suite must prove the generated extraction prompt contains semantic coverage for every current Atlas V1 extraction kind:

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

It must also prove the prompt contains or materially represents:

```text
candidate
non_fact

semantic_key
payload
normalized_meaning
needs_resolution
questions
slot/source-result accounting
```

Do not use fuzzy LLM judgment for these checks.

Use deterministic string/structure/snapshot checks.

---

## 14. Required Negative Checks

The prompt-builder tests must fail if:

```text
one of the 16 extraction kinds disappears

an unknown extraction kind is introduced

candidate/non_fact classification disappears

the generated prompt contains reconciliation relationship definitions

the prompt compiler bypasses the supplied Zod descriptions

the generated prompt silently returns to the PROMPT-001 three-kind ontology

the generated prompt omits the primary-kind/non-exclusive-facets principle

the generated prompt omits the unresolved vs needs_resolution distinction

the generated prompt changes between identical builds

Codex-authored semantic description text appears outside the frozen reference
```

---

## 15. Prompt Provenance

Produce a deterministic provenance artifact showing, for each generated semantic section:

```text
generated section
source Zod schema/property
source .describe(...) text
static-vs-dynamic ownership
```

The purpose is to make CK able to answer:

> Did this wording actually come from the supplied Zod reference, or did the implementation invent another semantic definition?

No LLM is needed for this audit.

---

## 16. Review Contract

| ID | Requirement |
|---|---|
| `RC-PROMPT2-001` | The exact supplied Zod reference is consumed without semantic rewriting. |
| `RC-PROMPT2-002` | `z.toJSONSchema(...)` is the schema-to-prompt intermediate; private Zod internals are not used. |
| `RC-PROMPT2-003` | The generated extraction prompt represents all 16 current Atlas Semantic V1 candidate kinds. |
| `RC-PROMPT2-004` | The generated prompt preserves candidate/non_fact source classification. |
| `RC-PROMPT2-005` | The generated prompt preserves the primary-kind/non-exclusive-facets rule. |
| `RC-PROMPT2-006` | The generated prompt preserves the distinction between `unresolved` and `needs_resolution`. |
| `RC-PROMPT2-007` | Semantic definitions originate from the frozen Zod `.describe(...)` text rather than a duplicate Codex glossary. |
| `RC-PROMPT2-008` | Static global extraction policies remain present. |
| `RC-PROMPT2-009` | Reconciliation relationship definitions do not leak into the extraction prompt. |
| `RC-PROMPT2-010` | Generated prompt/schema artifacts are deterministic and hashed. |
| `RC-PROMPT2-011` | Prompt provenance clearly identifies static vs Zod-derived content. |
| `RC-PROMPT2-012` | No live provider/model call occurs. |
| `RC-PROMPT2-013` | No Atlas semantic finalizer, parser integration, persistence, or BSS production work is added. |
| `RC-PROMPT2-014` | Repository hygiene and snapshot tests pass. |

---

## 17. Terminal Classification

Use exactly one:

```text
PASS
CHANGES_REQUIRED
```

### PASS

Use only when:

```text
the exact frozen Zod reference is consumed
+
all 16 V1 kinds are represented in the generated prompt
+
the semantic descriptions are traceable to the supplied .describe(...) text
+
static extraction policy is preserved
+
reconciliation vocabulary does not leak
+
generated artifacts are deterministic
+
CK approves the final prompt output
```

### CHANGES_REQUIRED

Use when the prompt builder:

```text
drops semantic meaning
duplicates/invents semantic definitions
misrenders the schema
leaks reconciliation semantics
is nondeterministic
or otherwise fails the frozen Review Contract
```

---

## 18. GO / CK / CFC / HMN Guidance

### GO

GO may:

```text
place the supplied Zod reference into the repository

implement or adapt the prompt builder

generate the extraction prompt

generate provider JSON Schema

write deterministic snapshot/provenance/hash tests

commit the bounded checkpoint

hand off to CK
```

GO must not:

```text
rewrite .describe(...) text

perform live inference

implement Atlas semantic finalization

modify semantic-v1

perform reconciliation

continue into BSS integration
```

### CK

CK reviews:

```text
reference integrity
prompt output
schema output
semantic coverage
provenance
determinism
scope discipline
```

### CFC

CFC may remediate only prompt-builder implementation defects within this frozen scope.

CFC may not rewrite semantic descriptions to make the prompt "better" without HMN authorization.

### HMN

Explicit HMN authorization is required for:

```text
any .describe(...) change

candidate-kind vocabulary change

payload philosophy change

live model call

Atlas semantic-v1 change

reconciliation prompt work

production integration
```

---

## 19. Hard Stop

Stop after:

```text
frozen Zod reference consumed
+
provider JSON Schema generated
+
system prompt generated
+
coverage tests pass
+
provenance artifact generated
+
hashes recorded
+
CK prompt review complete
```

Do not automatically continue into:

```text
SEM-ANM live qualification
Anoman
Gemini
Safara extraction
Atlas finalization
semantic reconciliation
BSS-V2-004-03
```

The next live semantic spike must consume the exact CK-approved generated prompt and its recorded hash.
