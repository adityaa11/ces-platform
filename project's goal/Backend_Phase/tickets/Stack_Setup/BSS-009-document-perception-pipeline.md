# BSS-009: Document Perception pipeline

- **State:** `in_progress`
- **Review batch:** BSS-BATCH-09
- **Depends on:** BSS-006, BSS-007, BSS-008
- **Baseline:** [Production Baseline](../../atlas-backend-production-baseline.md) §§7–8, 12–13, 15–16, 19, 21–22
- **Architecture guardrails:** [Atlas Core Architecture — Updated Checkpoint](../../atlas-core-architecture-checkpoint-v2.md), especially Sections 2–3, Cross-Cutting: Evidence & Provenance, Agents Bridge provider boundary, Context-Window Implication, and Canonical Document Processing Pipeline
- **Provider dependency:** [BSS-008](BSS-008-mistral-provider-adapter.md) supplies the provider-neutral Mistral OCR capability; this ticket does not reimplement the Mistral adapter.

## Outcome

Establish Atlas's production-shaped **Document Perception** pipeline for immutable PDF source documents.

The pipeline must take an Atlas-authorized immutable source document, execute provider-backed perception through Agents Bridge in the background, normalize the result into a provider-neutral `NormalizedDocument`, and return/store that result as Atlas-owned **derived operational state** without granting Agents Bridge document-discovery authority or trusted-state mutation authority.

The canonical boundary is:

```text
DocumentStore
      |
      v
immutable source.pdf
      |
      v
Atlas authorization
and bounded source handoff
      |
      v
document-perception job
      |
      v
Agents Bridge worker
      |
      v
BSS-008 provider capability
      |
      v
provider perception result
      |
      v
NormalizedDocument
      |
      v
Atlas-owned derived-perception cache
```

This ticket does **not** perform Semantic Extraction.

The architectural separation remains:

```text
Document Perception
        !=
Semantic Extraction
```

and:

```text
NormalizedDocument
        !=
SemanticCandidates
```

## Governance / compatibility boundary

BSS-009 is an additive checkpoint.

It must not reopen the accepted foundations established by BSS-001 through BSS-006, and it must not change the BSS-007 `DocumentStore` contract merely to expose local filesystem paths to Agents Bridge.

In particular:

```text
BSS-005
    existing provider-neutral ReasoningRuntime remains valid

BSS-006
    existing pg-boss queue, retry, timeout, idempotency,
    restricted Bridge role, and worker lifecycle remain valid

BSS-007
    immutable source bytes remain behind DocumentStore
    and storage paths remain private to the adapter

BSS-008
    provider API mapping / Mistral OCR behavior remains
    provider-adapter responsibility
```

BSS-009 composes those foundations into the new Document Perception capability.

Implementation must not begin until its required dependency checkpoints have received the review state required by the Stack Setup ticket-set controls.

## Scope

### 1. Provider-neutral perception contract

Add a provider-neutral Document Perception contract under the existing shared-contract ownership, without replacing the BSS-005 reasoning envelope.

Conceptually:

```ts
type DocumentPerceptionRequest = {
  version: "v1";
  executionId: string;

  artifact: {
    artifactId: string;
    sourceSha256: string;
    mimeType: string;
    byteSize: number;
  };

  source: {
    grant: string;
  };

  perception: {
    capability: "atlas.document.perceive";
    contractVersion: string;
  };
};
```

The exact TypeScript shape may differ during implementation, but the contract must remain:

```text
provider-neutral
versioned
bounded
source-linked
execution-linked
free of filesystem paths
free of provider model IDs
```

Initial acceptance is PDF-first:

```text
application/pdf
```

The contract may be designed for future document types, but BSS-009 does not need to qualify additional formats.

### 2. `NormalizedDocument` contract

Define the first provider-neutral `NormalizedDocument` contract.

Conceptually:

```text
NormalizedDocument
|
+-- version
+-- execution identity
+-- artifact identity
+-- source SHA-256
+-- perception capability/version
+-- provider execution provenance
|
+-- pages[]
    |
    +-- page number
    +-- page dimensions
    |
    +-- text blocks[]
    |   +-- stable perception-local ID
    |   +-- text / markdown
    |   +-- block kind when available
    |   +-- bounding box when available
    |   +-- confidence when available
    |
    +-- tables[]
    |   +-- stable perception-local ID
    |   +-- normalized table representation
    |   +-- source region / bounding box
    |
    +-- visual regions[]
        +-- stable perception-local ID
        +-- source region / bounding box
        +-- provider-derived labels/metadata when available
        +-- optional derived-asset reference
```

The contract must preserve enough source localization for later deterministic evidence validation.

It must **not** contain semantic assertions such as:

```text
"this arrow means approval"
"this rule supersedes another rule"
"this workflow step causes registration"
```

Those belong to later Semantic Extraction / reasoning.

### 3. Provider provenance

A normalized perception result must record enough execution provenance to determine how it was produced.

Conceptually:

```text
provider
provider capability
qualified model / processor identity
perception contract version
provider response/version identity when available
execution ID
processed-at timestamp
source SHA-256
```

Provider-specific payloads must not become the canonical normalized contract.

Raw provider payloads may be retained only for bounded diagnostics when explicitly enabled and privacy-safe; they are not required for Atlas correctness.

### 4. Atlas-authorized source handoff

Agents Bridge must not directly open Atlas local paths or independently query Atlas repositories to discover source documents.

BSS-009 must implement an explicit, bounded source-handoff mechanism.

Use an **Atlas-issued, execution-scoped source grant** for the initial production-shaped path:

```text
Atlas
  |
  +-- authenticate/authorize initiating operation
  +-- resolve document metadata
  +-- read/verify metadata through Atlas repository boundaries
  +-- issue short-lived perception source grant
  |
  v
enqueue document-perception job
  |
  v
Agents Bridge worker
  |
  +-- redeem source grant against Atlas internal source endpoint
  |
  v
Atlas internal source endpoint
  |
  +-- validate grant
  +-- validate execution/document scope
  +-- read bytes through DocumentStore
  +-- stream bounded bytes
  |
  v
Agents Bridge worker
```

The grant must be:

```text
opaque to callers
short-lived
execution-scoped
document-scoped
bound to expected source SHA-256
bound to expected MIME type / byte size
safe for bounded queue retries
```

A grant is authorization to read **one expected source for one perception execution**.

It is not general DocumentStore access.

### 5. No document bytes in pg-boss / PostgreSQL

Raw PDF bytes must not be persisted in the pg-boss job payload or Atlas/Bridge PostgreSQL tables merely to transport them to the worker.

The queued job may contain:

```text
execution ID
artifact/document identity
source hash
MIME type
byte size
source grant
perception contract version
capability alias
```

but not:

```text
base64 PDF bytes
absolute filesystem paths
local DocumentStore roots
provider secrets
Mistral model IDs selected by the caller
```

This preserves the BSS-007 rule that document bytes live behind DocumentStore rather than becoming database payloads.

### 6. Source integrity verification

Before the provider call, the perception worker must verify that the bytes obtained through the source grant match the expected source identity.

At minimum:

```text
actual byte count
actual SHA-256
expected MIME type / declared type
configured maximum byte size
```

A hash or size mismatch fails before provider submission.

Retries must continue to target the same immutable source identity.

### 7. Background job orchestration

Add a real `document-perception` job on top of the BSS-006 pg-boss runtime.

Conceptually:

```text
source operation committed
        |
        v
document-perception job
        |
        v
BSS-006 worker lifecycle
        |
        v
source grant redemption
        |
        v
source-integrity verification
        |
        v
atlas.document.perceive
        |
        v
BSS-008 provider adapter
        |
        v
provider perception result
        |
        v
normalization
        |
        v
NormalizedDocument
```

The job must reuse BSS-006 behavior for:

```text
bounded concurrency
retry/backoff
timeout
cancellation
failed-job visibility
idempotency
graceful shutdown
```

Do not create another queue implementation or worker service.

### 8. Perception normalization

Add a provider-neutral normalization layer between the BSS-008 provider result and `NormalizedDocument`.

```text
BSS-008 provider result
        |
        v
perception normalizer
        |
        +-- page identity
        +-- text blocks
        +-- tables
        +-- visual regions
        +-- bounding boxes
        +-- dimensions
        +-- confidence where available
        +-- derived asset references
        |
        v
NormalizedDocument
```

The normalizer may use Mistral-specific mapping internally through the BSS-008 adapter contract, but `NormalizedDocument` must not expose Mistral SDK objects or require a Mistral model name to be interpreted.

### 9. Derived visual assets

If the qualified provider returns extracted images or visual-region image content, do not embed unbounded binary image data directly into PostgreSQL or the normalized JSON contract.

Introduce an Atlas-owned derived-asset/cache abstraction as needed.

Conceptually:

```text
NormalizedDocument
    |
    +-- visual region
            |
            +-- assetRef
                    |
                    v
           Atlas derived cache
```

The initial local implementation may store rebuildable derived assets under a Git-ignored Atlas data area separate from immutable source storage.

Derived assets are:

```text
rebuildable
non-authoritative
linked to source SHA-256
linked to perception version
safe to invalidate
```

They are **not** BSS-007 immutable source documents.

Do not modify `DocumentStore` semantics to disguise derived perception artifacts as source documents.

### 10. Atlas-owned derived-perception cache

Atlas may cache successful `NormalizedDocument` output so later Semantic Extraction does not need to repeat OCR/perception for every execution.

The initial cache must be explicitly non-authoritative.

A cache identity should include enough information to prevent unsafe reuse, conceptually:

```text
source SHA-256
+
NormalizedDocument contract version
+
perception capability/config identity
```

The cache may be invalidated when:

```text
source identity changes
normalization contract changes
perception capability/config changes
integrity verification requests rebuild
explicit reprocessing is requested
```

Deleting the cache must not destroy project truth because it is rebuildable from the immutable source.

### 11. Result handoff back to Atlas authority

Agents Bridge cannot write Atlas trusted-state or Atlas-owned cache tables directly.

Implement an explicit completion boundary.

The initial production-shaped direction is:

```text
Agents Bridge worker
        |
        v
NormalizedDocument
        |
        v
authenticated internal result handoff
        |
        v
Atlas
        |
        +-- validate execution identity
        +-- validate source SHA-256
        +-- validate NormalizedDocument schema
        +-- reject stale/mismatched completion
        +-- persist/update derived cache
        +-- mark Atlas perception operation complete
```

The result handoff must be idempotent.

If the worker successfully calls the provider and then retries because acknowledgement was lost, replaying the same successful result must not create duplicate cache state or multiple logical completions.

### 12. Internal service authentication

The source-grant and result-handoff paths are internal service boundaries, not public document APIs.

They must:

```text
authenticate Atlas <-> Agents Bridge service traffic
scope authorization to the expected execution
avoid exposing provider or storage secrets
avoid logging raw document bodies
apply request/response size limits
return stable error responses
```

Use an environment/deployment-managed internal service secret or equivalent bounded mechanism.

Do not reuse an end-user Better Auth session as the Bridge service credential.

Better Auth continues to establish user identity; Atlas authorization decides whether the originating user may initiate the operation.

### 13. Perception state machine

Keep the operational state explicit enough for retry and UI/backend observability.

Conceptually:

```text
queued
  |
  v
fetching_source
  |
  v
perceiving
  |
  v
normalizing
  |
  v
delivering_result
  |
  +--> completed
  |
  +--> failed
  |
  +--> cancelled
```

This is operational state, not a project revision lifecycle.

The exact database schema is not locked by this ticket beyond what is required for safe execution and idempotency.

### 14. Failure behavior

Stable failure classes should distinguish at least:

```text
source grant invalid / expired
source unavailable
source hash mismatch
source too large
unsupported MIME type
provider capability unavailable
provider failure
timeout
cancellation
normalization failure
result schema invalid
result handoff rejected
stale execution/result
derived-cache write failure
```

A failed perception run must not:

```text
create SemanticCandidates
advance HEAD
modify Master
approve a workspace
publish project truth
alter immutable source bytes
```

### 15. No semantic interpretation in BSS-009

Document Perception preserves document structure.

It may normalize:

```text
page
text block
table
image region
bounding box
confidence
source labels
```

It must not decide:

```text
actor meaning
business rule meaning
workflow arrow semantics
supersession
contradiction
project truth
CES concern
```

For example, given a flowchart containing:

```text
Approved?
Yes
Continue
No
Manual Review
```

BSS-009 may preserve the labels, their page regions, and visual assets.

It must not assert:

```text
Approved? --No--> Manual Review
```

unless that semantic relationship is later derived by the Semantic Extraction reasoning capability.

## Explicitly out of scope

The following do **not** belong to BSS-009:

- changing BSS-001 through BSS-007 accepted behavior;
- changing BSS-008 provider API/model qualification rules;
- reimplementing Mistral OCR calls outside the BSS-008 provider adapter;
- renaming or redesigning the final semantic-extraction skill;
- creating `SemanticCandidates`;
- interpreting diagram arrows or workflow semantics;
- changing text/visual evidence into accepted semantic evidence records;
- semantic reconciliation;
- CES assessment;
- Main Workflow or Project Facts projection;
- chatbot/query/explore/correct behavior;
- Addendum authoring;
- acceptance/approval/publication;
- workspace or Master HEAD movement;
- final production S3/R2 source-storage selection;
- final production distributed-cache/object-store selection for derived perception;
- vector retrieval or embedding qualification;
- Atlas golden-fixture/SFE behavior validation.

Those belong to later SFE/domain/deployment tickets.

## Acceptance criteria

- A versioned provider-neutral `DocumentPerceptionRequest` and `NormalizedDocument` contract exist without changing the approved BSS-005 reasoning envelope.
- The initial accepted input is an immutable PDF source identified by Atlas artifact/document identity, expected SHA-256, MIME type, and byte size.
- Atlas issues an execution-scoped, short-lived source grant; the Agents Bridge worker can redeem only the authorized source for that execution.
- Source bytes are read by Atlas through the BSS-007 `DocumentStore`; Agents Bridge receives bytes through the bounded handoff and never receives an absolute/local DocumentStore path.
- Raw PDF bytes do not appear in the pg-boss job payload or PostgreSQL persistence used only to transport the job.
- The worker recomputes and validates SHA-256 and byte bounds before invoking the provider.
- A real `document-perception` job uses the existing BSS-006 pg-boss worker lifecycle, retry/backoff, timeout/cancellation, concurrency, and idempotency mechanisms; no second queue/worker framework is introduced.
- The job calls the BSS-008 `atlas.document.perceive` provider capability rather than calling Mistral directly.
- Provider perception output is normalized into a schema-valid provider-neutral `NormalizedDocument`.
- `NormalizedDocument` can preserve page dimensions, text blocks, tables, visual regions, bounding boxes, confidence information, and derived-asset references when present.
- Extracted/derived visual binary content is referenced through Atlas-owned derived cache/storage rather than embedded unboundedly in PostgreSQL.
- Successful results are delivered back through an authenticated Atlas boundary; Agents Bridge does not write Atlas trusted-state or Atlas-owned cache tables directly.
- Result delivery is idempotent across retry/replay.
- Atlas can cache the successful normalized result as rebuildable derived state linked to source SHA-256 and perception/config version.
- Deleting/invalidation of the derived cache does not affect the immutable source document.
- Expired/invalid grants, source mismatch, unsupported MIME, size overflow, provider failure, normalization failure, result-schema failure, timeout, cancellation, and stale completion fail without mutating trusted Atlas state.
- Internal source/result endpoints do not log raw document bodies, source grants, service secrets, provider keys, or machine-specific storage paths.
- BSS-009 introduces no semantic assertions, reconciliation decisions, CES findings, approval behavior, publication behavior, or HEAD mutation.
- Ordinary CI uses a BSS-owned synthetic PDF and mocked BSS-008 provider capability; no live Mistral call or Atlas golden-fixture suite is required.
- `docker compose up` remains the canonical boot path; no new standalone perception service or manual worker process is introduced.

## Validation

### Contract validation

Test accepted and rejected payloads for:

```text
DocumentPerceptionRequest
NormalizedDocument
page/block/table/visual-region bounds
source SHA-256 shape
MIME type
byte-size limits
execution identity
perception contract version
derived-asset references
```

Reject malformed or provider-specific payload leakage at the boundary.

### Source handoff validation

Using the BSS-007 local `DocumentStore` adapter:

1. write a synthetic PDF through `DocumentStore`;
2. retain only its opaque storage metadata inside Atlas;
3. create a document-perception execution and source grant;
4. enqueue the job without raw PDF bytes or local filesystem paths;
5. redeem the grant from the Bridge worker;
6. verify Atlas reads/streams the bytes through `DocumentStore`;
7. verify the worker receives byte-identical content;
8. verify SHA-256 and byte-size checks pass.

Negative cases must cover:

```text
expired grant
wrong execution
wrong document
modified/tampered grant
source SHA-256 mismatch
size mismatch
oversized source
unsupported MIME
```

### Queue / idempotency validation

Use the existing BSS-006 queue runtime to verify:

```text
enqueue
successful perception
provider transient retry
source-fetch retry
normalization failure
result-handoff retry
duplicate job replay
timeout
cancellation
worker shutdown
```

Replays must not produce multiple logical perception completions or duplicate derived-cache entries for the same execution/result identity.

### Perception normalization validation

Use mocked BSS-008 provider results for a small BSS-owned synthetic PDF containing representative material such as:

```text
normal paragraphs
a table
an embedded image / visual region
multiple pages
```

Verify normalization preserves:

```text
page order
page dimensions
text
block types when supplied
table location/content
visual-region location
bounding boxes
confidence when supplied
provider provenance
source SHA-256
```

This is a perception contract test, not an SFE semantic-extraction/golden-fixture test.

### Derived-cache validation

Verify:

```text
successful normalized result can be cached
same safe cache identity can be reused
different source hash cannot reuse the cache
different perception contract/config invalidates reuse
cache deletion causes reprocessing rather than truth loss
derived visual assets remain separate from BSS-007 immutable sources
```

Local derived cache bytes must be Git-ignored and excluded from source-control/build artifacts.

### Authority / security validation

Verify that:

```text
Agents Bridge database role still cannot update Atlas trusted-state tables
Bridge cannot derive a DocumentStore path from the job
internal source/result routes reject unauthenticated callers
grants cannot be used outside their execution/document scope
provider credentials are never sent to Atlas
DocumentStore roots never leave the adapter
raw PDF bodies are not written to ordinary logs
```

### Compose validation

- `docker compose up` starts the existing Atlas/Bridge/worker/PostgreSQL stack required by this ticket.
- No new standalone document-perception service is required.
- The synthetic perception integration path runs through the Compose-managed Agents Bridge worker.
- `docker compose down` preserves the existing named persistent data behavior.
- Derived perception cache remains explicitly disposable/rebuildable.

### Optional live provider smoke check

After BSS-008 has passed live qualification, a manually gated BSS-009 end-to-end smoke check may use explicit Mistral development credentials and a synthetic/non-confidential PDF.

The live check verifies only:

```text
DocumentStore source
-> source grant
-> Bridge worker
-> BSS-008 OCR capability
-> NormalizedDocument
-> Atlas result handoff/cache
```

It is not part of ordinary CI and does not replace mocked contract/integration tests.

The Stack Setup fixture-suite exclusion remains in force.

## Review checkpoint

- **Review question:** Can Atlas process an authorized immutable PDF through a background, provider-neutral Document Perception pipeline and produce a rebuildable `NormalizedDocument` without exposing DocumentStore paths, persisting raw PDF bytes in the queue/database, performing semantic interpretation, or allowing Agents Bridge to mutate trusted Atlas state?
- **Combined acceptance:** The source-grant handoff, source-integrity checks, BSS-006 queue execution, BSS-008 perception capability, provider-neutral normalization, derived-cache/result handoff, retry/idempotency behavior, and Atlas/Bridge authority boundaries all pass their BSS-owned validation while BSS-001 through BSS-008 boundaries remain intact.
- **Downstream boundary:** Semantic Extraction may consume `NormalizedDocument` only in a later SFE/domain ticket after BSS-BATCH-09 receives a `PASS` review.
- **Commit to review:** Pending implementation commit.
