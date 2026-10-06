# Atlas Semantic V1 Zod + Provider-Agnostic Anoman Productionization Implementation Context

Status: Authorized implementation context for the next post-BSS-V2-004-02 semantic extraction scope
Repository: adityaa11/ces-platform
Branch inspected: codex/new-atlas-backend
Inspected branch HEAD: c7541e315cdcc377d3854ae91a1db4f55b767fbc
Encoding: UTF-8
Markdown policy: ASCII-safe punctuation and symbols to prevent mojibake
Primary scope: BSS-V2-004-03 child ticket generation and implementation
Out of scope for freezing now: BSS-V2-005 and later planned operational tickets

---

## 1. Purpose

This context defines the next bounded implementation sequence after the approved BSS-V2-004-02 checkpoint.

The approved production-shaped path currently stops here:

```text
IDSER D1
    -> BSS-009 source authority
    -> Agents Bridge
    -> qualified persistent Docling route
    -> deterministic perception mapping
    -> unchanged NormalizedDocument v1
    -> Atlas acceptance
    -> STOP BEFORE SEMANTICS
```

The next goal is to productionize semantic extraction without repeating the historical provider coupling that previously formed around Mistral and Gemini.

The intended continuation is:

```text
accepted NormalizedDocument v1
    -> canonical Atlas Semantic V1 Zod authority
    -> provider-facing proposal schema derived from that authority
    -> production PROMPT-003-equivalent prompt compiler
    -> deterministic source-unit / user-prompt builder
    -> provider-neutral StructuredReasoningProvider
    -> first concrete route: Anoman
    -> untrusted provider proposal
    -> canonical Zod validation
    -> deterministic Atlas finalizer
    -> unchanged atlas.semantic.extract/v1 acceptance
    -> existing replay / staging / handoff
```

The implementation must remain provider-agnostic above the concrete Bridge adapter layer.

Anoman is the first concrete semantic reasoning route to productionize. It is not allowed to become Atlas semantic architecture authority.

---

## 2. Completed BSS V2 authority that must remain intact

Only completed BSS-V2 work is treated as frozen predecessor authority for this context.

### 2.1 BSS-V2-001 - Provider capability decoupling

Approved authority:

```text
StructuredReasoningProvider
DocumentPerceptionProvider
StreamingChatProvider
```

Generic workers and runtime paths consume Bridge-owned neutral capability interfaces.

Mandatory invariant:

```text
semantic-worker.ts
    MUST NOT import AnomanProvider
    MUST NOT import GeminiProvider
    MUST NOT import MistralProvider
```

A concrete provider may be named only in adapter/config/composition code.

### 2.2 BSS-V2-002 - Qualified route registry

Approved authority:

```text
Atlas capability
    -> server-controlled qualified route
    -> provider/model/processor identity
    -> adapter identity
    -> qualification identity
```

Caller, prompt, skill, project, user, or queue payload must not select arbitrary provider/model/endpoint identity.

The new Anoman route must fit this existing route-authority model additively.

Do not redesign BSS-V2-002 merely to make Anoman easier to wire.

### 2.3 BSS-V2-003 - Direct Gemini adapter contracts

BSS-V2-003 remains approved historical capability.

The Gemini adapter must not be deleted, rewritten as Anoman, or have its base URL changed to point at Anoman.

The new direction is:

```text
StructuredReasoningProvider
    -> GeminiProvider     retained direct adapter
    -> MistralProvider    retained inactive/blockable adapter
    -> AnomanProvider     new gateway-backed adapter
```

Gemini remains one implementation of the neutral Bridge capability.

It is not the semantic architecture authority and is not the required active extraction route.

### 2.4 BSS-V2-004-01 - Persistent local Docling executor

Approved and unchanged.

Docling remains structural perception only.

It must not:

```text
emit semantic candidates
classify Atlas semantic kinds
build semantic prompts
call Anoman
call Gemini
choose project truth
```

### 2.5 BSS-V2-004-02 - D1 Docling lifecycle checkpoint

Approved and unchanged until the final continuation ticket.

The deliberate terminal behavior remains active while semantic productionization is incomplete:

```text
D1
    -> Docling
    -> accepted NormalizedDocument v1
    -> STOP
```

Do not remove or bypass this stop during the Zod, prompt-builder, source-unit, Anoman-adapter, or semantic-worker construction tickets.

The stop is released only after the production semantic extraction path has passed its own bounded qualification.

---

## 3. Provider-agnostic architecture invariant

This is the primary design guardrail for the entire scope.

### 3.1 Provider-neutral layers

The following layers must contain no provider-specific semantic branching:

```text
packages/atlas-contracts
packages/atlas-skills
Atlas Semantic V1 Zod schemas
toAtlasJsonSchema(...)
provider proposal schema
PROMPT-003 production compiler
source-unit builder
user-prompt builder
deterministic finalizer
apps/agents-bridge/src/semantic-worker.ts
Atlas semantic replay/staging
Atlas semantic client/handoff
Atlas DB semantic acceptance
```

Prohibited examples:

```ts
if (provider === "anoman") {
    // semantic behavior
}

if (provider === "gemini") {
    // different semantic prompt
}
```

```ts
import { AnomanProvider } from "./providers/anoman";
```

inside generic semantic worker or Atlas packages.

```ts
const prompt =
    route.providerId === "anoman"
        ? anomanPrompt
        : geminiPrompt;
```

The semantic profile is Atlas-owned and provider-independent.

### 3.2 Provider-specific layer

Provider naming is permitted only where concrete adapters are expected:

```text
apps/agents-bridge/src/providers/anoman.ts
apps/agents-bridge/src/providers/gemini.ts
apps/agents-bridge/src/providers/mistral.ts
Bridge config
Bridge adapter registry/composition root
qualified-route validation specific to adapter identity
provider transport tests
```

The provider adapter receives an already prepared reasoning request.

It does not define Atlas semantics.

### 3.3 Required dependency direction

Correct:

```text
Atlas semantic authority
    -> prompt compiler
    -> provider-neutral messages / schema hint
    -> StructuredReasoningProvider
    -> concrete adapter
```

Incorrect:

```text
Anoman adapter
    -> imports Atlas semantic schemas
    -> builds PROMPT-003
    -> decides semantic shape
```

Incorrect:

```text
Gemini adapter
    -> defines schema constraints
    -> Atlas changes semantic contract to satisfy Gemini
```

Provider limitations may influence a provider-specific transport projection.

They may not redefine Atlas Semantic V1.

---

## 4. Single-source Semantic V1 authority

The Zod migration must eliminate semantic-shape duplication.

It must not create this architecture:

```text
hand-maintained Zod Semantic V1
+
hand-maintained JSON Schema Semantic V1
```

The required architecture is:

```text
                   CANONICAL ATLAS SEMANTIC V1
                         Zod + .describe()
                               |
                 +-------------+-------------+
                 |             |             |
                 v             v             v
           runtime parse    TS types    JSON Schema projection
                                             |
                                             v
                                    provider compatibility view
```

### 4.1 Canonical Zod authority

Production-owned Zod schemas become the semantic meaning authority for at least:

```text
semantic kind
semantic payload
semantic meaning fields
candidate assertion
evidence reference
source classification
source inventory item
semantic clarification question
reconciliation relationship vocabulary
reconciliation result vocabulary
extraction result
```

The current spike reference:

```text
scripts/sem-anm-prompt002/atlas-semantic-v1-zod-reference.ts
```

is qualification/reference evidence, not the permanent production import location.

Production code must move the relevant definitions into a production package such as:

```text
packages/atlas-contracts/src/semantic-v1.ts
```

or another deliberately reviewed production path under `@atlas/contracts`.

Production runtime must not import the spike file.

### 4.2 `.describe()` is semantic instruction authority

The `.describe()` text is not decorative documentation.

It defines the model-facing interpretation of semantic fields and vocabulary used by the production prompt compiler.

For example:

```text
kind = rule
kind = constraint
kind = condition
kind = workflow_step
kind = unresolved
```

must have their semantic interpretation authored once in canonical Zod descriptions.

The prompt compiler consumes those descriptions.

Do not create a second manual list of semantic-kind meanings in the prompt builder.

### 4.3 TypeScript types are derived

Where practical:

```ts
export type SemanticCandidateV1 =
    z.infer<typeof atlasSemanticCandidateV1Schema>;
```

Do not maintain an independent TypeScript interface with the same semantic fields unless a transport boundary genuinely requires a distinct type.

### 4.4 Plain JSON Schema is generated, never manually maintained

Existing Bridge/provider seams still consume a plain JSON Schema object.

That object remains available, but it is a derived artifact:

```text
canonical Zod
    -> toAtlasJsonSchema(...)
    -> plain Readonly<Record<string, unknown>>
```

Example target:

```ts
export const semanticExtractionResultSchema =
    toAtlasJsonSchema(atlasSemanticExtractionResultV1Schema);
```

Nobody manually edits both the Zod shape and a JSON shape.

If a new semantic field is added later:

```text
edit canonical Zod once
    -> runtime validation changes
    -> TypeScript type changes
    -> descriptions change
    -> prompt compilation changes where relevant
    -> generated JSON Schema changes
```

### 4.5 `toAtlasJsonSchema(...)` owns compatibility policy, not semantics

`toAtlasJsonSchema(...)` may normalize Zod output for Atlas/provider compatibility.

It must not contain business-semantic field definitions such as:

```text
rule
constraint
workflow_step
effective_scope
approval_policy
```

Those belong in canonical Zod.

The projection may contain generic transport rules such as:

```text
JSON Schema dialect/profile
reference inlining policy
recursive JSON payload projection
unsupported custom-refinement handling
provider-compatible keyword normalization
description preservation
```

Initial compatibility target should preserve current Atlas AJV/provider behavior.

Any dialect/profile choice must be proven by tests before replacing the current hand-written JSON Schema exports.

---

## 5. Semantic field ownership

The production design must distinguish semantic meaning from Atlas-owned bookkeeping.

### 5.1 Shared semantic meaning fields

These fields are provider/model reasoning material and should be defined through reusable canonical Zod components:

```text
semantic_key
kind
payload
normalized_meaning
needs_resolution
```

If a later Semantic V1-compatible field is model-owned semantic meaning, it should be added to the shared canonical semantic component so provider proposal and final candidate inherit the same definition.

### 5.2 Provider proposal shape

The provider proposal is intentionally smaller than the final Atlas result.

It may contain only judgments the model is authorized to make.

Conceptual example:

```text
source_results[]
    slot
    classification
    candidates[]
        semantic_key
        kind
        payload
        normalized_meaning
        needs_resolution
    non_fact_reason
    questions[]
```

The provider proposal schema must reuse canonical Semantic V1 semantic components.

It must not independently redefine them.

Preferred pattern:

```text
canonical semantic meaning Zod
    -> provider proposal projection
    -> final Atlas candidate projection
```

### 5.3 Atlas-owned fields

The provider must not invent authoritative Atlas bookkeeping such as:

```text
local_candidate_id
source_unit_id
page_number
locator_type
locator_id
trusted source_wording
evidence_refs
destination_local_candidate_ids
canonical semantic IDs
persistence IDs
review state
accepted truth
publication state
Master state
```

Those are materialized from deterministic Atlas-owned context/finalization.

---

## 6. Production prompt architecture

The prompt pipeline is Atlas-owned and provider-independent.

### 6.1 System prompt

The production system prompt is built from:

```text
canonical Semantic V1 Zod descriptions
+
provider proposal Zod descriptions
+
frozen Atlas semantic policy
+
PROMPT-003 cross-field semantic composition policy
+
authority exclusions
```

The current reference behavior is:

```text
SEM-ANM-PROMPT-003
```

Production may relocate/refactor the compiler but must preserve the qualified PROMPT-003 design: deterministic section composition, static-policy placement/ownership, authority exclusions, provider-agnostic compilation, and no fixture, reconciliation, provider-transport, or runtime leakage. After BSS-V2-004-03-01 CK approval, its canonical Zod descriptions are the production authority for every schema-derived prompt/proposal field. PROMPT-003's historical schema-derived bytes and hashes remain immutable qualification evidence, not the production byte-level oracle; two production builds from the same 03-01 inputs must instead be byte-identical. The PROMPT-003 cross-field semantic composition policy remains frozen byte-for-byte unless separately authorized. A resulting production artifact hash change does not create Semantic V2: the final contract remains `atlas.semantic.extract/v1`.

### 6.2 User prompt

The user prompt is derived deterministically from accepted `NormalizedDocument v1`.

Conceptual flow:

```text
NormalizedDocument v1
    -> deterministic source-unit builder
    -> temporary source slots
    -> bounded source payload
    -> user prompt
```

The production source-unit builder must not inherit the spike-only assumption of exactly four S1-S4 slots.

It must handle the real Atlas source-accounting universe required by current acceptance:

```text
non-empty text blocks
non-empty tables
meaningful/labeled visual regions when applicable
```

### 6.3 Prompt packet

Before any provider call, Atlas should be able to deterministically produce a reasoning packet similar to:

```text
systemPrompt
userPrompt
providerProposalJsonSchema
sourceSlotMap
semanticProfileIdentity
```

The exact production type/name may differ.

The important property is:

```text
same authorized NormalizedDocument
+ same semantic profile/version
= same deterministic reasoning packet
```

Provider execution happens after this packet exists.

---

## 7. Anoman adapter role

Anoman is the first concrete production implementation used by this semantic extraction route.

It must remain a boring transport adapter.

### 7.1 Adapter input

The adapter receives provider-neutral structured-reasoning input such as:

```text
messages:
    system
    user

schema:
    Atlas-generated compatibility schema/hint

signal:
    AbortSignal

privacy requirement:
    existing neutral option if applicable
```

The adapter does not generate PROMPT-003.

The adapter does not inspect `NormalizedDocument`.

The adapter does not know Atlas semantic kinds.

### 7.2 Qualified transport reference

The reviewed spike used:

```text
endpoint:
    https://api.anoman.io/v1/chat/completions

authorization:
    Bearer ANOMAN_API_KEY

requested model:
    gemini-2.5-flash

stream:
    false

temperature:
    0

response_format:
    {"type":"json_object"}
```

This is qualification reference behavior.

Production implementation may use configuration around it, but must not silently change model identity or response mode without explicit review.

### 7.3 Schema behavior

Anoman qualification used JSON object mode rather than provider-enforced JSON Schema.

Therefore the neutral Bridge contract must not mean:

```text
provider guarantees complete Atlas schema
```

It means:

```text
provider returns bounded structured JSON
Atlas remains the validation authority
```

The generic `StructuredReasoningProvider` may continue receiving a plain schema hint for adapters that can use it.

Anoman may ignore the schema for transport while Atlas validates the returned value against canonical production Zod above the adapter.

Future direct Gemini/OpenAI/Mistral-style adapters may translate the same schema hint into their structured-output mechanism.

No semantic-worker provider branch is allowed.

### 7.4 Provenance

Anoman-specific response metadata may be normalized inside the adapter.

Core provider-neutral provenance should continue to expose stable generic identity such as:

```text
gateway/provider identity
requested model identity
served/routed model identity when available
endpoint identity
latency
attempt
normalized usage
```

Anoman-specific routing/cost fields may be preserved in a bounded generic extension/raw telemetry area if current contracts support it.

Do not leak raw provider response objects into Atlas domain packages.

---

## 8. Existing worker mismatch that this scope must eventually remove

Current production semantic execution still behaves conceptually as:

```text
semantic context
    -> short static skill prompt
    -> provider
    -> provider emits COMPLETE atlas.semantic.extract/v1
    -> parseSemanticExtractionResult(...)
```

The target extraction path is:

```text
semantic extraction context
    -> accepted NormalizedDocument v1
    -> source-unit builder
    -> system/user prompt compiler
    -> provider proposal schema
    -> StructuredReasoningProvider
    -> untrusted proposal
    -> canonical proposal Zod parse
    -> source accounting verification
    -> deterministic finalizer
    -> canonical final Semantic V1 Zod parse
    -> unchanged Atlas result envelope
    -> existing replay/staging/handoff
```

Only the extraction path is changed in this scope.

Reconciliation remains separate and must not be silently migrated using extraction prompt assumptions.

---

## 9. Required ticket decomposition

BSS-V2-004-03 is a planning parent only.

Do not execute it as one mega-ticket.

### BSS-V2-004-03-01 - Canonical Atlas Semantic V1 Zod authority

#### Outcome

Replace duplicated hand-authored semantic meaning/result authority with canonical production Zod + `.describe()` while preserving Semantic V1 behavior.

#### Owns

```text
production Zod dependency in @atlas/contracts
canonical semantic kind schema
canonical semantic payload schema
canonical evidence schema
canonical semantic meaning/candidate components
canonical source classification/inventory components
canonical semantic question schema
canonical extraction result schema
canonical reconciliation vocabulary/result schema as shared V1 authority
z.infer-derived types where appropriate
toAtlasJsonSchema(...)
generated plain JSON Schema compatibility exports
parser migration for semantic extraction/reconciliation result validation
differential parity tests against approved current Semantic V1 behavior
```

#### Does not own

```text
prompt builder
source-unit builder
Anoman adapter
semantic-worker execution redesign
Docling
NormalizedDocument v1 migration
semantic job/context/envelope transport migration
reconciliation execution redesign
```

#### Single-source acceptance rule

PASS only if no production hand-maintained duplicate Semantic V1 JSON shape remains for the migrated semantic/result authority.

Plain JSON Schema must be derived from canonical Zod.

#### Compatibility proof

At minimum prove:

```text
all 16 semantic kinds retain acceptance
all 10 reconciliation relationship types retain acceptance
current source-accounting invariants remain
current evidence requirements remain
current payload bounds remain
current byte/count boundaries remain
unknown fields remain rejected where currently strict
existing semantic parser public APIs remain compatible
generated JSON Schema compiles through current Atlas validation seam
BSS-V2-003 Gemini deterministic adapter regressions remain green
BSS-V2-001/002 generic provider/route regressions remain green
```

#### Hard stop

No prompt generation and no provider call.

---

### BSS-V2-004-03-02 - Provider proposal Zod and PROMPT-003 production compiler

#### Outcome

Create the production provider-facing extraction proposal as a projection of canonical Semantic V1 and productionize the qualified PROMPT-003 system prompt compiler.

#### Owns

```text
provider proposal Zod
reuse of canonical semantic meaning components
schema-derived prompt descriptions
production PROMPT-003-structured compiler regenerated from 03-01 canonical descriptions
cross-field semantic composition policy
prompt provenance/profile identity
generated provider compatibility schema
03-01 canonical-authority traceability, two-build determinism, frozen-static-policy equivalence, and PROMPT-003 structural differential evidence
```

#### Must not

```text
copy semantic kind descriptions into another manual enum table
import spike files at production runtime
call Anoman
call Gemini
read DocumentStore
finalize Atlas IDs/evidence
change final Semantic V1
```

#### Provider-agnostic rule

The compiler must have no provider argument.

Correct:

```ts
compileExtractionPrompt(profile, proposalSchema)
```

Incorrect:

```ts
compileAnomanExtractionPrompt(...)
compileGeminiExtractionPrompt(...)
```

Provider-specific transport formatting belongs in adapters.

#### Hard stop

Deterministic system prompt and provider proposal schema exist offline.

---

### BSS-V2-004-03-03 - NormalizedDocument source-unit and user-prompt pipeline

#### Outcome

Convert accepted `NormalizedDocument v1` into deterministic bounded provider source slots and the user prompt/payload consumed by the semantic extraction profile.

#### Owns

```text
deterministic source-unit enumeration
stable temporary slot IDs
slot -> page/locator/source mapping
text-block handling
table handling
meaningful/labeled visual-region handling where current acceptance requires it
bounded user prompt/payload generation
source-accounting completeness before provider call
reasoning-packet construction
determinism tests
```

#### Must not

```text
classify semantic kind
call a provider
create Atlas candidate IDs
invent evidence
alter NormalizedDocument v1
```

#### Hard stop

A fixture NormalizedDocument deterministically produces the complete provider-neutral reasoning packet without network access.

---

### BSS-V2-004-03-04 - Anoman reference StructuredReasoningProvider adapter

#### Outcome

Add Anoman as a distinct Bridge adapter implementing the existing provider-neutral reasoning boundary.

#### Owns

```text
ANOMAN_API_KEY configuration
HTTPS base URL
/v1/chat/completions transport
requested gemini-2.5-flash identity for current qualified route
temperature = 0
stream = false
response_format = json_object
request/response bounds
timeout/cancellation
auth/rate-limit/provider error normalization
JSON response extraction/parsing
normalized usage
normalized Anoman routing/cost/cache metadata where safely available
qualified-route adapter identity
worker composition injection
deterministic transport tests
```

#### Must not

```text
import @atlas/skills prompt compiler
import canonical semantic Zod to define meaning
inspect NormalizedDocument
build source slots
finalize extraction
change semantic-worker meaning based on provider
modify GeminiProvider to proxy Anoman
delete GeminiProvider
```

#### Adapter conformance rule

Future structured-reasoning adapters should be able to implement the same neutral capability without requiring Atlas semantic changes.

Anoman is the first reference implementation for the new active extraction route, not a superclass or domain dependency.

#### Hard stop

Anoman can execute already-prepared structured messages and return normalized JSON/provenance under deterministic transport tests.

No live semantic activation yet.

---

### BSS-V2-004-03-05 - Deterministic extraction finalizer and provider-neutral semantic-worker composition

#### Outcome

Compose the production extraction pipeline through the neutral provider seam.

#### Required path

```text
semantic extraction context
    -> production reasoning-packet builder
    -> StructuredReasoningProvider
    -> provider proposal
    -> canonical proposal Zod validation
    -> exact source accounting
    -> deterministic finalizer
    -> canonical final Semantic V1 Zod validation
    -> result envelope
    -> existing replay/staging/handoff
```

#### Finalizer owns

```text
local_candidate_id generation
trusted source_wording copying
evidence_refs from source-slot map
source_unit_id materialization
source inventory page/locator fields
destination_local_candidate_ids
final result envelope bookkeeping
```

#### Finalizer must not

```text
change semantic kind
rewrite normalized meaning
invent payload meaning
invent applicability conditions
invent clarification questions
silently repair invalid semantic output
drop incompatible provider meaning merely to pass validation
```

#### Worker provider-agnostic rule

`semantic-worker.ts` receives only `StructuredReasoningProvider`.

It must not inspect `route.providerId`.

Concrete adapter selection remains outside the worker.

#### Reconciliation rule

Do not modify reconciliation prompt/execution semantics in this child.

#### Hard stop

Production extraction path is deterministically testable with injected provider transport.

BSS-V2-004-02 D1 semantic stop remains active.

---

### BSS-V2-004-03-06 - Live Anoman production extraction qualification

#### Outcome

Qualify the real production extraction path through the Anoman route.

#### Required path

```text
accepted/synthetic NormalizedDocument v1
    -> production source-unit builder
    -> production PROMPT-003 compiler
    -> production reasoning packet
    -> production Anoman adapter
    -> real Anoman inference
    -> provider proposal Zod validation
    -> source accounting
    -> deterministic finalizer
    -> final Semantic V1 Zod validation
    -> existing staging/handoff
```

#### Evidence requirements

```text
opt-in
secret-safe
non-confidential fixture
pinned requested model identity
served/routed identity captured when exposed
latency
usage
cost/routing telemetry where exposed
no semantic repair
no correction call
no arbitrary fallback
written-semantic acceptance oracle
```

#### Historical spike rule

Preserve:

```text
SEM-ANM-SPIKE-004 runner terminal = FAIL
SEM-ANM-SPIKE-004 CK = PASS
```

Do not rewrite or rerun historical evidence merely to change the runner label.

#### Hard stop

Extraction route is qualified.

Normal D1 still stops at the BSS-V2-004-02 terminal checkpoint.

---

### BSS-V2-004-03-07 - D1 Docling-to-semantic continuation checkpoint

#### Outcome

Release the deliberate BSS-V2-004-02 semantic stop only after the production extraction route is qualified.

#### Required integrated path

```text
project/bundle D1
    -> pg-boss perception job
    -> BSS-009 authorized bytes
    -> qualified persistent Docling
    -> accepted NormalizedDocument v1
    -> existing semantic execution creation
    -> existing pg-boss semantic job
    -> production reasoning packet
    -> qualified StructuredReasoningProvider route
    -> current selected route: Anoman
    -> provider proposal validation
    -> deterministic finalization
    -> atlas.semantic.extract/v1 acceptance
    -> candidate/evidence materialization
    -> STOP BEFORE RECONCILIATION
```

#### Provider-agnostic integration rule

Atlas lifecycle code must schedule `atlas.semantic.extract`.

It must not schedule "Anoman extraction".

Route registry/composition chooses the concrete provider.

#### Hard stop

Successful extraction only.

Do not automatically continue into BSS-V2-004-04 reconciliation qualification in the same GO checkpoint.

---

## 10. Recommended production package ownership

Exact filenames may change if repository conventions require it, but dependency direction must remain clear.

### `@atlas/contracts`

Owns:

```text
canonical Semantic V1 Zod
semantic version/limits
shared semantic meaning components
final extraction/reconciliation result schemas
derived TypeScript types
toAtlasJsonSchema(...)
generated JSON Schema compatibility exports
final semantic parsers
```

Does not own:

```text
PROMPT-003 rendering
provider transport
Anoman config
source-slot construction
```

### `@atlas/skills`

Owns:

```text
provider proposal schema projection
semantic extraction prompt compiler
PROMPT-003 cross-field policy
prompt/profile provenance
authority exclusions
reasoning-packet semantic/profile composition
```

It may depend on `@atlas/contracts`.

It must not depend on concrete provider adapters.

### Agents Bridge generic semantic layer

Owns:

```text
semantic-worker orchestration
provider-neutral StructuredReasoningProvider call
source-slot/user-prompt preparation if Bridge is the selected current ownership boundary
proposal parse/finalizer composition if kept Bridge-side
replay/staging/delivery integration
```

No provider-specific imports in generic execution modules.

### Agents Bridge provider adapters

Own:

```text
Anoman transport
Gemini transport
Mistral transport
provider-specific request/response translation
provider-specific usage/provenance/error normalization
```

---

## 11. `toAtlasJsonSchema(...)` implementation constraints

The function exists to keep one semantic source of truth while serving existing plain-JSON consumers.

### Required

```text
input:
    canonical Zod schema

output:
    plain JSON Schema object

properties:
    deterministic
    description-preserving
    compatible with current Atlas validation/provider seams
    no semantic manual duplication
```

### Provider projection model

Use this architecture:

```text
canonical Zod
    -> toAtlasJsonSchema(...)
    -> Atlas portable schema
    -> optional provider-specific reduction
```

For example:

```text
Mistral:
    portable schema -> provider JSON-schema request

Gemini:
    portable schema -> existing Gemini-supported-keyword projection

Anoman:
    portable schema may remain a local validation/prompt artifact;
    qualified transport uses json_object mode
```

The generic semantic layer does not change semantics according to the selected provider.

### Custom refinements

Zod refinements that cannot be represented completely in provider JSON Schema remain authoritative local validation.

Provider schema is a constraint aid, never the final semantic authority.

### Recursive payload

The recursive/extensible semantic payload may use a portable provider-facing JSON projection if full recursive Zod constraints cannot be represented safely across current consumers.

Canonical Zod still owns full recursive runtime validation.

This is not a second semantic shape.

It is a transport projection of one canonical shape.

---

## 12. Regression requirements against completed BSS tickets

Every child in this scope must preserve the relevant completed predecessor guarantees.

### BSS-V2-001 regressions

Prove:

```text
generic semantic worker imports no concrete provider
provider SDK/API types remain adapter-internal
StructuredReasoningProvider remains the generic execution seam
```

### BSS-V2-002 regressions

Prove:

```text
provider/model route remains server-controlled
caller cannot select Anoman/Gemini/model/endpoint
unqualified route cannot execute
```

### BSS-V2-003 regressions

Prove:

```text
direct Gemini adapter still compiles
direct Gemini deterministic adapter tests remain valid
Gemini is not rewritten into Anoman
generated schema compatibility does not silently break Gemini adapter behavior
```

BSS-V2-003 does not need to become the active route.

### BSS-V2-004-01/02 regressions

Prove:

```text
Docling route remains unchanged
NormalizedDocument v1 remains unchanged
D1 continues to stop before semantics until 004-03-07
no semantic failure can leak into perception tickets before the stop is released
```

---

## 13. Security and trust boundaries

### 13.1 Semantic authority

```text
SEAM-BSSV2-00403-SEMANTIC-AUTHORITY

Canonical Zod and deterministic Atlas checks define accepted semantic shape.
Provider output is untrusted.
```

### 13.2 Provider coupling

```text
COUPLING-BSSV2-00403-CONCRETE-PROVIDER

No Atlas contract, skill, semantic worker, finalizer, replay, or DB acceptance
module may depend on Anoman/Gemini/Mistral concrete classes or provider IDs.
```

### 13.3 Prompt authority

```text
SEAM-BSSV2-00403-PROMPT-AUTHORITY

PROMPT-003 semantic instructions are Atlas-owned and compiled before provider
execution. Provider adapters do not author or mutate semantic meaning.
```

### 13.4 Source authority

```text
BOUNDARY-BSSV2-00403-SOURCE

Only accepted NormalizedDocument-derived bounded source units enter the semantic
reasoning packet.
```

### 13.5 Finalization

```text
COUPLING-BSSV2-00403-SEMANTIC-REPAIR

Deterministic finalization may add Atlas-owned identities/accounting only.
It may not repair provider semantic meaning.
```

### 13.6 Credential boundary

```text
BOUNDARY-BSSV2-0040304-ANOMAN-SECRET

ANOMAN_API_KEY remains Bridge deployment-only and must never appear in Atlas
contracts, prompt content, route payloads, logs, evidence artifacts, or trusted
domain records.
```

---

## 14. GO / CK / CFC execution rules

Each child must be independently GO/CK/CFC/HMN friendly.

Do not allow one child to accumulate unrelated unresolved review clauses from later children.

GO must not stop merely because a later child is not implemented.

For each child:

```text
implement only frozen scope
run directly affected deterministic tests
run inherited BSS regression set
produce bounded evidence
reach CK-ready state
STOP
```

CK must review the child's stated contract, not expand it into all remaining semantic production work.

CFC may remediate only findings within the frozen ticket contract unless HMN explicitly authorizes a bounded extension.

Historical tickets and spike evidence must not be rewritten to make the current architecture look as though it always existed.

---

## 15. What must not happen

The following are explicit anti-patterns.

### Anti-pattern 1 - Two semantic shapes

```text
semantic-zod.ts
semantic-json-schema.ts
```

both manually defining the same fields.

Prohibited.

### Anti-pattern 2 - Anoman owns prompt construction

```ts
AnomanProvider.buildAtlasSemanticPrompt(...)
```

Prohibited.

### Anti-pattern 3 - Generic worker switches on provider

```ts
if (route.providerId === "anoman") ...
```

inside semantic execution logic.

Prohibited.

### Anti-pattern 4 - Gemini is replaced rather than retained

Changing `GeminiProvider` endpoint/config so it becomes an Anoman proxy.

Prohibited.

### Anti-pattern 5 - Provider schema weakens Atlas truth

Changing Atlas Semantic V1 because a provider cannot express one constraint.

Prohibited.

Use provider projection plus canonical local validation instead.

### Anti-pattern 6 - Spike runtime becomes production runtime

Importing:

```text
scripts/sem-anm-prompt*
scripts/sem-anm-spike*
```

from production packages.

Prohibited.

Spike artifacts are qualification references.

### Anti-pattern 7 - Release D1 stop early

Removing `BSS-V2-004-02` terminal behavior before production extraction qualification passes.

Prohibited.

---

## 16. Definition of success for this scope

This scope is successful when Atlas reaches:

```text
                        ATLAS-OWNED
                Canonical Semantic V1 Zod
                         + .describe()
                              |
                +-------------+-------------+
                |                           |
                v                           v
        provider proposal              final result
                |                           ^
                v                           |
        PROMPT-003 compiler                 |
                |                           |
        source-unit builder                 |
                |                           |
                +------ reasoning packet ---+
                              |
                              v
                 StructuredReasoningProvider
                              |
                    +---------+---------+
                    |                   |
                    v                   v
                 Anoman              Gemini
              active qualified      retained adapter
                 route
                    |
                    v
             untrusted JSON
                    |
                    v
          canonical Zod validation
                    |
                    v
          deterministic finalizer
                    |
                    v
          atlas.semantic.extract/v1
```

And the real lifecycle can later execute:

```text
D1
    -> Docling
    -> NormalizedDocument v1
    -> atlas.semantic.extract
    -> route resolver
    -> qualified provider
    -> validated proposal
    -> deterministic final result
```

without Atlas semantic/domain code knowing whether the concrete executor was Anoman, direct Gemini, Mistral, OpenAI, OpenRouter, or another future qualified adapter.

That provider independence is a release criterion, not an optional cleanup.

---

## 17. Ticket-generation procedure

When generating the actual ticket files from this context:

1. Inspect the current branch HEAD before authoring.
2. Preserve approved BSS-V2-001, 002, 003, 004-01, and 004-02 ticket/review history unchanged.
3. Treat the historical BSS-V2-004 Gemini mega-ticket as superseded evidence only.
4. Inspect current `packages/atlas-contracts/src/semantic.ts`.
5. Inspect current `packages/atlas-skills/src/index.ts`.
6. Inspect current `apps/agents-bridge/src/provider-capabilities.ts`.
7. Inspect current `apps/agents-bridge/src/route-registry.ts`.
8. Inspect current `apps/agents-bridge/src/semantic-worker.ts`.
9. Inspect current `apps/agents-bridge/src/worker-main.ts` / composition root.
10. Inspect the approved Anoman prompt/spike source and CK evidence as qualification references.
11. Generate BSS-V2-004-03-01 through BSS-V2-004-03-07 as bounded child tickets.
12. Do not implement production code during ticket generation.
13. Do not regenerate 005+ as frozen follow-on contracts yet; they may be adjusted after the Zod + Anoman extraction path is real.
14. Preserve a hard stop after 004-03-06 before releasing the 004-02 lifecycle stop.
15. Preserve a hard stop after 004-03-07 before reconciliation.
16. Make provider-agnostic static/import-boundary checks explicit review evidence in every child that touches semantic execution composition.

---

## 18. Final principle

> Atlas owns semantic meaning. Zod is the single production Semantic V1 authority. Plain JSON Schema is generated from that authority, not maintained beside it. Atlas builds the semantic prompt before any provider call. The provider adapter only executes bounded prepared reasoning input and returns untrusted structured output. Anoman is the first active implementation of the neutral reasoning boundary, not a dependency of Atlas semantics. Direct Gemini remains a retained adapter. Docling remains perception-only. Only after the provider-neutral extraction path is qualified may the BSS-V2-004-02 stop be released.
