# SEM-ANM-PROMPT-003 Implementation Context
## Frozen cross-field semantic composition remediation after PROMPT-002 / SPIKE-003

Status: planning context for Codex ticket generation and bounded implementation

Repository: `adityaa11/ces-platform`

Branch: `codex/new-atlas-backend`

Predecessor: `SEM-ANM-PROMPT-002`

Predecessor integrated implementation checkpoint:
`e2ccb5b9529d641eca0136d73fd55f2e6e308739`

Predecessor approval record:
`b49984c7b4fc2b9ea85b8de043cbc8338d4ac789`

Predecessor CK result: `PASS`

---

## 1. Purpose

`SEM-ANM-PROMPT-003` is a narrow offline prompt-remediation ticket set.

It exists because `SEM-ANM-PROMPT-002` correctly established the full Atlas Semantic V1 provider-facing vocabulary and prompt compiler, but the live S1-S4 qualification exposed one reproducible cross-field composition gap.

The bounded question is:

> Can Atlas add the exact manually proven generic cross-field composition policy to the PROMPT-002 generated extraction prompt, while keeping the Atlas Semantic V1 Zod authority, provider schema, candidate vocabulary, individual field/kind descriptions, and all other PROMPT-002 behavior unchanged?

This ticket does NOT redesign Atlas semantics.

This ticket does NOT create Semantic V2.

This ticket does NOT perform live inference.

This ticket does NOT broaden into Safara extraction, reconciliation, finalization, or production integration.

The intended progression is:

```text
SEM-ANM-PROMPT-002
  -> CK PASS
  -> live qualification exposed reproducible S4 composition failure
  -> exact generic manual remediation tested twice
  -> both manual runs produced full S1-S4 PASS
  -> SEM-ANM-PROMPT-003
       freeze that exact cross-field policy
       compile it deterministically
       prove everything else stayed unchanged
       CK
       STOP
  -> later SEM-ANM-SPIKE-004
```

---

## 2. Why PROMPT-003 Exists

The historical PROMPT-002 prompt already contained the necessary primitive meanings:

```text
kind = PRIMARY semantic role
payload preserves orthogonal facets

rule and constraint can overlap

condition means an actual predicate / prerequisite / trigger / guard /
circumstance that determines whether another proposition applies

mere temporal ordering is not automatically an applicability condition

needs_resolution is independent of primary kind

preserve uncertainty
preserve modality and negation
preserve conditions and temporal relationships separately
```

However, the live S4 source:

```text
Approval may be required before processing.
```

failed twice under the exact PROMPT-002 prompt in the same material way:

```text
kind = condition
needs_resolution = false
questions = []
```

while still preserving:

```text
modality = "may be"
timing = "before processing"
```

This means the model recognized the local semantic facets but did not reliably compose them into the intended Atlas resolution behavior.

The failure is therefore classified as:

```text
CROSS_FIELD_SEMANTIC_COMPOSITION_GAP
```

It is NOT evidence that:

```text
Atlas Semantic V1 is structurally insufficient
the 16-kind vocabulary is wrong
the provider schema shape is wrong
Gemini cannot understand modality
rule / constraint overlap is still unresolved
```

---

## 3. Manual Remediation Evidence

A manual prompt experiment inserted one new generic section into the otherwise unchanged PROMPT-002 prompt:

```text
CROSS-FIELD SEMANTIC COMPOSITION
```

The exact S4 source sentence and expected S4 answer were NOT included in that remediation section.

The manual experiment then used the same S1-S4 source corpus.

Observed result:

```text
Original PROMPT-002
-------------------
Run 1:
  S1 PASS
  S2 PASS
  S3 PASS
  S4 FAIL

Run 2:
  S1 PASS
  S2 PASS
  S3 PASS
  S4 FAIL


Manual generic cross-field remediation
--------------------------------------
Run 1:
  S1 PASS
  S2 PASS
  S3 PASS
  S4 PASS

Run 2:
  S1 PASS
  S2 PASS
  S3 PASS
  S4 PASS
```

The two successful remediated S4 responses independently preserved:

```text
kind = rule
needs_resolution = true
possible / "may be required" modality
"before processing" as timing
no invented applicability condition
one clarification question asking what determines applicability
```

The two successful runs varied only in harmless flexible-payload wording such as:

```text
action = approval
vs
subject = approval
```

and question phrasing such as:

```text
"What conditions determine when..."
vs
"Under what conditions..."
```

This manual evidence authorizes freezing the generic composition policy for offline PROMPT-003 construction.

It does NOT authorize changing the historical PROMPT-002 or SPIKE-003 results.

---

## 4. Immutable Predecessor Authority

PROMPT-003 must consume PROMPT-002 as an immutable predecessor.

Do not edit:

```text
scripts/sem-anm-prompt002/**
```

Do not rewrite PROMPT-002 artifacts or historical feedback.

The PROMPT-002 approved hashes are:

```text
Atlas Semantic V1 Zod reference SHA-256:
67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083

provider schema SHA-256:
c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b

system prompt SHA-256:
80935e3f64f77a0569ff91e30ce7c7d7d08d1c78747dbbee304c28de88a538c5

provenance SHA-256:
27bb968c000d82897857f8076f7dfab1e04abaffcab2bed798c4fb8dc451f8c4
```

PROMPT-003 must prove:

```text
Zod reference bytes unchanged
provider-facing JSON Schema bytes unchanged
all 16 candidate kinds unchanged
all existing .describe(...) semantic definitions unchanged
all existing fixed PROMPT-002 policy unchanged

ONLY the new cross-field composition policy is added to the generated prompt
and corresponding provenance.
```

---

## 5. Atlas Semantic V1 Remains Unchanged

Do not modify:

```text
packages/atlas-contracts/src/semantic.ts
semanticContractVersion
candidate kind vocabulary
evidence refs
source statement inventory
questions contract
reconciliation contract
parseSemanticExtractionResult(...)
```

The provider proposal remains:

```text
version
source_results[]
  slot
  classification
  candidates[]
  non_fact_reason
  questions[]
```

Candidate remains:

```text
semantic_key
kind
payload
normalized_meaning
needs_resolution
```

No new provider field is authorized.

No field is removed.

No field type is widened.

No provider-schema relaxation is authorized.

---

## 6. Zod Reference Must Remain Byte-Identical

The PROMPT-002 Zod semantic reference is already CK-approved.

PROMPT-003 must not edit its `.describe(...)` text.

In particular, do not modify the definitions of:

```text
rule
constraint
condition
unresolved
needs_resolution
questions
payload
normalized_meaning
semantic_key
source classification
```

Reason:

The manually successful intervention changed only cross-field prompt policy.

Changing the Zod descriptions at the same time would add a second experimental variable and destroy the clean causal progression.

Therefore:

```text
PROMPT-003 Zod semantic authority
=
exact PROMPT-002 Zod semantic authority
```

The frozen reference hash must remain:

```text
67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083
```

---

## 7. Provider Schema Must Remain Byte-Identical

Because the Zod provider profile is unchanged, the generated provider JSON Schema must also remain byte-identical to PROMPT-002.

Expected SHA-256:

```text
c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b
```

Any provider-schema hash change is a hard failure unless explicitly authorized by HMN.

PROMPT-003 is a prompt-policy remediation, not a schema redesign.

---

## 8. Exact Frozen Cross-Field Policy

This is the exact generic text proven manually.

Codex must not rewrite, paraphrase, shorten, expand, or "improve" it.

```text
CROSS-FIELD SEMANTIC COMPOSITION

- Treat candidate kind, modality, applicability conditions, temporal relationships, payload facets, needs_resolution, and clarification questions as separate but related semantic dimensions.
- A possible or uncertain modality is NOT itself an applicability condition.
- Wording such as "may be required", "might be required", or "could be required" means the source establishes a possible requirement, not that the missing condition has been supplied.
- If the source clearly establishes a specific primary semantic kind but leaves materially unstated what determines whether that proposition applies:
  - keep the specific primary kind when it is otherwise clear;
  - preserve the possible or uncertain modality;
  - do not invent the missing applicability condition;
  - set needs_resolution = true;
  - emit one concise clarification question asking only for the missing material applicability condition.
- Temporal wording such as "before processing", "after approval", "within 30 days", or "while a state holds" describes timing/order. It does not by itself supply an applicability condition unless the source explicitly makes it a predicate or guard.
- Do not classify a proposition as kind = "condition" merely because it contains uncertain modality or temporal wording. Use kind = "condition" only when the source actually states a predicate, prerequisite, trigger, guard, eligibility criterion, or circumstance that determines whether another proposition applies.
```

This exact body is frozen.

Do NOT add the concrete S4 sentence:

```text
Approval may be required before processing.
```

to the generated system prompt.

Do NOT add expected S1-S4 answers.

Do NOT add Safara-specific examples.

---

## 9. Semantic Ownership Decision

PROMPT-002 established that:

```text
individual field meanings
individual kind meanings
provider shape
candidate/non_fact meanings
unresolved vs needs_resolution definitions
```

are Zod-owned.

That remains true.

PROMPT-003 introduces one new category:

```text
cross-field composition policy
```

The new section is intentionally classified as:

```text
STATIC_POLICY
```

because it does not redefine the meaning of any individual field or kind.

Instead it tells the model how already-defined semantic dimensions interact:

```text
kind
modality
applicability
timing
payload
needs_resolution
questions
```

This is the exact intervention that was manually tested.

Do not relocate or reinterpret the remediation into individual `.describe(...)` fields in this ticket.

Doing so would change the tested variable.

---

## 10. Exact Prompt Placement

The manually successful prompt placed:

```text
CROSS-FIELD SEMANTIC COMPOSITION
```

immediately after:

```text
CLARIFICATION QUESTIONS
```

and immediately before:

```text
SOURCE CLASSIFICATION
```

PROMPT-003 must preserve that location.

Relevant section sequence must be:

```text
CANDIDATE KIND MEANINGS

CLARIFICATION QUESTIONS

CROSS-FIELD SEMANTIC COMPOSITION

SOURCE CLASSIFICATION

REFERENCE HANDLING
```

Placement is part of the frozen remediation.

Do not append this section arbitrarily at the end of the prompt.

Do not merge it into GENERAL RULES.

Do not merge it into CONDITION or RULE descriptions.

---

## 11. Recommended Implementation Shape

Prefer a new isolated directory:

```text
scripts/sem-anm-prompt003/
```

Historical PROMPT-002 files remain untouched.

A clean implementation may reuse the approved PROMPT-002 compiler output as structured input rather than copying semantic definitions.

Suggested shape:

```text
scripts/
  sem-anm-prompt003/
    cross-field-policy.mts
    prompt-compiler.mts
    prompt-compiler.test.mts
    qualification.test.mts
    generate.mts
    generated/
      system-prompt.txt
      provider-schema.json
      prompt-provenance.json
      hashes.json
      qualification-report.json
```

Recommended compiler strategy:

```text
PROMPT-002 compileExtractionPrompt()
        ->
structured provenance.sections
        ->
insert exactly one STATIC_POLICY section
after section id = questions
before source-result-classification
        ->
regenerate prompt from structured sections
        ->
PROMPT-003 prompt + provenance
```

This avoids:

```text
editing PROMPT-002
copying the whole semantic glossary
rewriting Zod descriptions
patching raw prompt text with regex
```

If Codex chooses another implementation shape, it must prove the same invariants.

---

## 12. Differential Oracle Against PROMPT-002

PROMPT-003 should be tested primarily as a deterministic delta over PROMPT-002.

The strongest offline invariant is:

```text
PROMPT-003
=
PROMPT-002
+
exact CROSS-FIELD SEMANTIC COMPOSITION section
at the frozen location
```

Tests must prove:

```text
all PROMPT-002 sections remain byte-identical
all PROMPT-002 section ordering remains identical
except for one inserted cross-field section

provider schema remains byte-identical
Zod reference remains byte-identical

new system prompt is deterministic
new provenance is deterministic
```

A useful implementation-level check is:

```text
take PROMPT-003 structured section sequence
remove exactly the cross-field section
compare remaining section IDs, titles, ownership, source properties,
source descriptions, generated text, and order to PROMPT-002 provenance

result must be exact equality
```

Do not use fuzzy comparison.

---

## 13. Prompt Leakage Negative Checks

The generated PROMPT-003 system prompt must NOT contain the exact test source:

```text
Approval may be required before processing.
```

It must NOT contain:

```text
S1
S2
S3
S4
```

as fixture labels from the live qualification.

It must NOT contain expected oracle answers.

It must NOT contain the manually observed provider response.

The generic phrases inside the frozen policy are allowed:

```text
may be required
might be required
could be required
before processing
after approval
within 30 days
while a state holds
```

These are generic semantic examples, not the S4 fixture sentence.

---

## 14. Important Non-Generalization Rule

Do not accidentally convert the remediation into:

```text
every use of "may" => needs_resolution = true
```

That would be wrong.

For example, a permission statement can be semantically complete:

```text
The customer may cancel the order.
```

The frozen remediation is specifically about cases where:

```text
the source establishes a possible/uncertain proposition
AND
what determines whether it applies is materially unstated
```

The ticket must preserve that distinction.

Do not add a deterministic keyword heuristic.

Do not add runtime code that scans for:

```text
may
might
could
before
after
```

and changes model output.

This is prompt guidance only.

---

## 15. No Semantic Repair

PROMPT-003 does not authorize deterministic post-processing that changes:

```text
condition -> rule
needs_resolution false -> true
questions [] -> generated question
payload condition -> timing
```

The provider must produce the correct semantics itself.

Atlas code must not repair a bad model answer to make a later oracle pass.

This remains a core qualification principle.

---

## 16. Required Generated Artifacts

PROMPT-003 must produce:

```text
generated/system-prompt.txt
generated/provider-schema.json
generated/prompt-provenance.json
generated/hashes.json
generated/qualification-report.json
```

Hashes must include at least:

```text
PROMPT-002 predecessor system prompt SHA-256
PROMPT-002 predecessor provider schema SHA-256
PROMPT-002 frozen Zod reference SHA-256

PROMPT-003 generated system prompt SHA-256
PROMPT-003 generated provider schema SHA-256
PROMPT-003 generated provenance SHA-256
exact cross-field policy body SHA-256
```

Expected unchanged hash:

```text
PROMPT-003 provider schema SHA-256
=
c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b
```

The new PROMPT-003 system-prompt hash is generated by the implementation and must not be guessed in planning.

---

## 17. Required Offline Tests

Tests must deterministically prove all of the following:

```text
PROMPT-002 CK PASS / predecessor identity is referenced

frozen Zod reference hash unchanged

provider schema bytes unchanged
provider schema hash unchanged

all 16 Atlas V1 extraction kinds still present

candidate/non_fact classification still present

semantic_key still present
payload still present
normalized_meaning still present
needs_resolution still present
questions still present
slot/source-result accounting still present

all existing PROMPT-002 Zod-derived descriptions remain unchanged

all existing PROMPT-002 static policy remains unchanged

exact CROSS-FIELD SEMANTIC COMPOSITION title present exactly once

exact frozen cross-field body present byte-for-byte

cross-field section ownership = STATIC_POLICY

cross-field section location:
questions < cross-field < source classification

removing the new section restores exact PROMPT-002 section sequence/content

exact S4 fixture sentence absent
S1-S4 fixture labels/answers absent

reconciliation definitions do not leak

two identical builds produce identical bytes and hashes
```

---

## 18. Required Negative Tests

Tests must fail if:

```text
the Zod reference changes

the provider schema changes

one of the 16 extraction kinds changes or disappears

Codex rewrites the frozen cross-field wording

the cross-field section is missing

the cross-field section appears more than once

the cross-field section is placed somewhere else

the section is merged into GENERAL RULES

the concrete S4 fixture sentence leaks into the prompt

expected S4 output leaks into the prompt

a deterministic "may => unresolved" heuristic is implemented

post-provider semantic repair is introduced

PROMPT-002 files are modified

live provider code is added to this ticket

reconciliation semantics leak into extraction

the build is nondeterministic
```

---

## 19. Provenance Requirements

The new provenance artifact must identify the cross-field section as:

```text
generatedSection:
CROSS-FIELD SEMANTIC COMPOSITION

ownership:
STATIC_POLICY

sourceSchemaProperty:
(fixed policy)
```

Its recorded source description/body must exactly match the frozen policy.

All predecessor provenance sections must remain materially and structurally identical.

The provenance should make CK able to answer:

> Is the only semantic prompt delta the exact manually proven cross-field composition policy?

The answer must be deterministically inspectable without an LLM.

---

## 20. Scope

### In scope

```text
consume immutable PROMPT-002 predecessor
freeze exact manually proven cross-field policy
add it as STATIC_POLICY
place it after CLARIFICATION QUESTIONS and before SOURCE CLASSIFICATION
generate PROMPT-003 prompt
generate unchanged provider schema
generate provenance
generate hashes
deterministic differential tests
offline qualification report
CK review
```

### Out of scope

```text
Anoman call
Gemini call
any provider call
S1-S4 live execution
Safara live extraction
Atlas finalizer
parseSemanticExtractionResult(...) integration
evidence/source inventory finalization
reconciliation
persistence
BSS-V2 integration
production routing
Semantic V2
provider schema redesign
candidate vocabulary redesign
Zod .describe(...) rewriting
```

---

## 21. Recommended Ticket Split

Keep the ticket set bite-sized.

### SEM-ANM-PROMPT-003-01
### Frozen cross-field policy and deterministic compiler insertion

Goal:

```text
consume immutable PROMPT-002 structured prompt/provenance
add exact frozen policy
place it at exact frozen location
leave Zod/provider schema untouched
```

Review focus:

```text
exact wording
exact placement
static ownership
predecessor immutability
no fixture leakage
```

Hard stop:

```text
compiler insertion and focused tests pass
checkpoint
CK
```

### SEM-ANM-PROMPT-003-02
### Differential generated artifacts and provenance

Goal:

```text
generate PROMPT-003 system prompt
generate provider schema
generate provenance
generate hashes

prove:
provider schema identical to PROMPT-002
all predecessor sections identical
only one new cross-field section exists
build deterministic
```

Review focus:

```text
artifact identities
differential oracle
provenance
hashes
reconciliation exclusion
```

Hard stop:

```text
artifacts generated
differential tests pass
checkpoint
CK
```

### SEM-ANM-PROMPT-003-03
### Integrated offline qualification checkpoint

Goal:

```text
run the complete offline PROMPT-003 qualification
produce qualification-report.json
crosswalk all parent requirements
record one CK-ready checkpoint
```

Review focus:

```text
all predecessor invariants
exact remediation
no scope expansion
all required negative tests
deterministic two-build equality
```

Hard stop:

```text
integrated evidence complete
ticket awaiting_review
CK
```

No live call is authorized by any PROMPT-003 ticket.

---

## 22. Review Contract

| ID | Requirement |
|---|---|
| `RC-PROMPT3-001` | PROMPT-002 is consumed as an immutable CK-approved predecessor. |
| `RC-PROMPT3-002` | Atlas Semantic V1 and its 16-kind vocabulary remain unchanged. |
| `RC-PROMPT3-003` | The PROMPT-002 Zod reference remains byte-identical with the approved SHA-256. |
| `RC-PROMPT3-004` | The provider-facing JSON Schema remains byte-identical with the approved PROMPT-002 SHA-256. |
| `RC-PROMPT3-005` | The exact frozen CROSS-FIELD SEMANTIC COMPOSITION body is present once and is not rewritten. |
| `RC-PROMPT3-006` | The new section is STATIC_POLICY and does not replace individual Zod-owned field/kind definitions. |
| `RC-PROMPT3-007` | The new section is located immediately after CLARIFICATION QUESTIONS and before SOURCE CLASSIFICATION. |
| `RC-PROMPT3-008` | Removing the new section restores the PROMPT-002 structured prompt/provenance sequence exactly. |
| `RC-PROMPT3-009` | The concrete S4 source, S1-S4 expected outputs, and manual provider responses do not leak into the generated prompt. |
| `RC-PROMPT3-010` | No deterministic semantic repair or keyword heuristic is introduced. |
| `RC-PROMPT3-011` | Reconciliation definitions remain excluded from the extraction prompt. |
| `RC-PROMPT3-012` | Prompt, provenance, schema, and hashes are deterministic across identical builds. |
| `RC-PROMPT3-013` | PROMPT-002 source/artifacts/history remain untouched. |
| `RC-PROMPT3-014` | No live provider call, finalizer, parser integration, persistence, or production work occurs. |
| `RC-PROMPT3-015` | Repository hygiene and bounded regression checks pass. |

---

## 23. SecurityReadiness

Status: `applicable`

This ticket is offline, so security scope is narrow.

Integrity boundary:

```text
PROMPT-002 accepted artifacts are immutable inputs.
PROMPT-003 may derive a new prompt/provenance artifact only.
```

Identity evidence must record:

```text
predecessor checkpoint
predecessor hashes
cross-field policy hash
new prompt hash
new provenance hash
unchanged provider-schema hash
```

No credentials are needed.

Tests and scripts must not read:

```text
ANOMAN_API_KEY
.env
Authorization
```

No network/provider execution is authorized.

CK must be able to prove from local artifacts that:

```text
only the frozen cross-field policy changed the prompt semantics
```

---

## 24. GO / CK / CFC / HMN Guidance

GO may:

```text
create scripts/sem-anm-prompt003/
import/reuse immutable PROMPT-002 compiler outputs or structured provenance
freeze the exact cross-field policy
implement deterministic section insertion
generate prompt/provenance/schema/hash artifacts
write differential tests
write qualification tests
commit bounded checkpoints
handoff to CK
```

GO must not:

```text
edit PROMPT-002
edit Zod descriptions
change candidate vocabulary
change provider schema
add S4 expected answer to prompt
perform a live call
add semantic repair
add reconciliation
continue into production
```

GO should not short-stop once implementation begins. Within each ticket, continue through implementation, focused tests, required negative tests, artifact generation, diff/hygiene checks, checkpoint record, and CK-ready handoff unless a genuine frozen-scope blocker requires HMN.

CK reviews the frozen ticket scope only and returns `PASS` or `CHANGES_REQUIRED`.

CFC may remediate implementation defects such as wrong section ordering, wrong provenance ownership, hash bugs, nondeterministic formatting, missing negative tests, or differential-comparison defects. CFC may not rewrite the frozen policy wording, change Zod descriptions/schema/ontology, add provider examples, or perform live calls.

Explicit HMN authorization is required for:

```text
any modification to the frozen cross-field wording
any .describe(...) change
any candidate-kind vocabulary change
any provider-schema change
any Atlas Semantic V1 change
any deterministic semantic repair rule
any live provider call
any S1-S4 corpus change
any Safara expansion
any reconciliation work
any BSS/production integration
```

---

## 25. Terminal Classification

PROMPT-003 uses only:

```text
PASS
CHANGES_REQUIRED
```

PASS requires:

```text
PROMPT-002 predecessor identity proven
Zod reference unchanged
provider schema unchanged
exact frozen cross-field policy inserted once
placement matches manual prompt
all other prompt/provenance sections unchanged
fixture leakage negatives pass
reconciliation exclusion passes
build determinism passes
CK approves
```

Use `CHANGES_REQUIRED` whenever any frozen requirement is not proven.

---

## 26. Hard Stop

Stop after:

```text
PROMPT-003 generated prompt
+
unchanged provider schema
+
provenance
+
hashes
+
qualification report
+
CK PASS
```

Do not automatically continue into:

```text
Anoman
Gemini
SEM-ANM-SPIKE-004
Safara
Atlas finalization
semantic reconciliation
BSS-V2
production
```

The next live step must be separately authorized.

The intended next step after PROMPT-003 CK PASS is `SEM-ANM-SPIKE-004`, using the exact approved PROMPT-003 system-prompt hash and the same bounded S1-S4 corpus to verify:

```text
S1 remains PASS
S2 remains PASS
S3 remains PASS
S4 remains PASS
```

without semantic repair.
