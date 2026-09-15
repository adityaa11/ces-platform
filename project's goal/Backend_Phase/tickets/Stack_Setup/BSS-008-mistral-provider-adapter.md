# BSS-008: Mistral provider adapter

- **State:** `approved`
- **Review batch:** BSS-BATCH-08
- **Depends on:** BSS-005
- **Supersedes planned scope:** `BSS-008-groq-provider-adapter.md`
- **Baseline:** [Production Baseline](../../atlas-backend-production-baseline.md) §§7, 10–12, 15–16, 18, 21
- **Architecture guardrails:** [Atlas Core Architecture — Updated Checkpoint](../../atlas-core-architecture-checkpoint-v2.md), especially Provider Qualification Direction, Document Perception vs Semantic Extraction, Agents Bridge provider boundary, and the Canonical Document Processing Pipeline
- **Provider references:** [Mistral Chat API](https://docs.mistral.ai/api); [Custom Structured Outputs](https://docs.mistral.ai/studio/conversations/structured-output/custom); [Chat Completions](https://docs.mistral.ai/studio/conversations/chat-completion); [OCR Processor](https://docs.mistral.ai/studio/document-processing/basic_ocr); [OCR 4.1](https://docs.mistral.ai/models/ocr-4-1); [Mistral Small 4](https://docs.mistral.ai/models/mistral-small-4-0-26-03); [Mistral Large 3](https://docs.mistral.ai/models/mistral-large-3-25-12); [Mistral Medium 3.5](https://docs.mistral.ai/models/mistral-medium-3-5-26-04); [Mistral ZDR](https://help.mistral.ai/en/articles/347612-can-i-activate-zero-data-retention-zdr)

## Outcome

Implement Mistral as the first provider behind the provider-neutral Agents Bridge boundary established by BSS-005.

The Bridge can use Mistral for:

- validated structured reasoning;
- streamed chat and provider tool-call events; and
- a provider-level document-perception primitive backed by the stateless OCR API.

The Bridge retains control of capability/model selection, execution limits, retries, cancellation, usage, privacy policy, and provider credentials.

This ticket does **not** implement the Atlas document-perception workflow. It only establishes the Mistral provider capabilities that BSS-009 can orchestrate.

The architectural separation remains:

```text
BSS-008
    Mistral provider capability boundary

BSS-009
    Atlas Document Perception pipeline
```

and:

```text
Document Perception
        !=
Semantic Extraction
```

## Scope

### Provider adapter boundary

- Implement the Mistral adapter under the existing Compose-managed `apps/agents-bridge` service.
- Keep the implementation behind Bridge-owned provider-neutral contracts. Mistral SDK/API types must not leak into Atlas Core, skill contracts, client responses, or trusted Atlas state.
- Preserve the BSS-005 provider-neutral `ReasoningRuntime`; this ticket may add provider capability interfaces needed by Mistral, but must not rewrite the approved BSS-005 execution foundation.
- Do not create a separate Mistral service/container or require a manual provider boot command after `docker compose up`.

### Server-controlled capability aliases

Resolve Atlas/Bridge capability aliases inside Agents Bridge to explicit, configured Mistral model or endpoint IDs.

Initial qualification direction:

```text
atlas.reasoning.structured
    -> Mistral Large 3 or Mistral Medium 3.5
       selected by explicit qualification/configuration

atlas.chat.default
    -> Mistral Small 4

atlas.document.perceive
    -> Mistral OCR 4.1
```

- The provider mapping is Bridge-owned.
- Clients and skills cannot select arbitrary provider names, model IDs, aliases, endpoints, or provider-specific parameters.
- Production mappings should use explicit qualified model IDs rather than silently following mutable `*-latest` aliases.
- Record the effective provider/model/endpoint identity in execution provenance/usage metadata.
- `atlas.retrieval.embed` may be reserved for later `mistral-embed` qualification, but embedding endpoint implementation is **not required for BSS-BATCH-08 acceptance**.

### Structured reasoning

- Support Mistral custom Structured Outputs through the stateless `/v1/chat/completions` path.
- Treat structured reasoning as a complete-response operation for this ticket. Ordinary chat remains the streaming path.
- Send the skill's required JSON Schema through the provider capability when supported.
- Validate the completed structured result again with the complete Bridge/skill AJV schema regardless of provider-side constrained-generation guarantees.
- Reject unsupported model/schema/capability combinations before sending the request.
- Never silently drop, weaken, or replace schema constraints in order to make a provider request succeed.
- Normalize finish state, refusal/blocked state when surfaced, provider usage, malformed output, and provider failures into Bridge-owned contracts.

### Streamed chat and tool-call events

- Support ordinary chat through stateless `/v1/chat/completions` streaming.
- Normalize provider text deltas into Bridge-owned stream events.
- Normalize provider tool/function-call events without granting the provider authority to execute Atlas operations directly.
- Atlas remains responsible for authorization and deterministic execution of any future model-requested tool operation.
- Propagate cancellation promptly.
- Once any response delta or tool-call event has been emitted to the caller, do not transparently replay the request as a retry.
- Normalize completion and error termination so callers do not depend on Mistral-specific SSE payload shapes.

### Provider-level document perception

Implement a Mistral OCR provider capability sufficient for BSS-009 to consume later.

The provider primitive should:

- call the stateless `/v1/ocr` endpoint;
- accept bounded document content supplied explicitly to the adapter together with its MIME type and provider-neutral options;
- support PDF input without requiring Mistral `/v1/files`;
- request OCR/document structure needed by the Atlas direction, including page content and, when configured, blocks, tables, images/image references, page dimensions, bounding boxes, confidence information, and provider usage;
- preserve provider-returned source localization information needed for later normalization;
- normalize the raw provider response into a Bridge-owned provider result rather than exposing Mistral SDK objects to callers;
- report provider/model identity and usage without calculating price in the adapter.

The BSS-008 OCR capability is **not** the Atlas `NormalizedDocument` contract.

Conceptually:

```text
explicit bounded document input
        |
        v
Mistral adapter
        |
        v
/v1/ocr
        |
        v
Bridge-owned provider perception result
```

BSS-009 later owns:

```text
DocumentStore source resolution
        |
        v
document-perception job
        |
        v
Agents Bridge provider capability
        |
        v
NormalizedDocument
        |
        v
Atlas-owned derived-perception cache
```

### Document and authority boundary

BSS-008 must preserve the approved BSS-003, BSS-005, and BSS-007 boundaries.

The Mistral adapter must **not**:

- resolve Atlas projects or workspaces;
- query Atlas trusted-state tables to discover documents;
- open `DocumentStore` filesystem paths;
- enumerate local files;
- decide which source document a user may access;
- persist `NormalizedDocument`;
- create semantic candidates;
- move workspace/Master HEAD;
- approve or publish project knowledge.

The provider adapter receives only explicit bounded input supplied through the Bridge capability boundary.

### Credentials and provider configuration

- Read `MISTRAL_API_KEY` only at the Agents Bridge configuration/deployment-secret boundary.
- Keep credentials out of shared contracts, Atlas database business records, responses, ordinary logs, fixtures, and test snapshots.
- Validate required provider configuration at Bridge startup or capability preflight with secret-safe errors.
- Make development provider configuration optional enough that ordinary CI and stack boot do not require a live Mistral account.

### Privacy and retention boundary

Use stateless Mistral API paths for Atlas provider execution covered by this ticket:

```text
/v1/chat/completions
/v1/ocr
```

Do not introduce provider-managed Atlas state through:

```text
/v1/files
Agents
Conversations
Libraries
provider-hosted project memory
```

- The adapter must not claim that Zero Data Retention is active merely because a stateless endpoint is used.
- If a Bridge execution policy requires provider-side zero retention, fail before the provider call unless deployment configuration explicitly declares that Mistral ZDR has been approved/enabled for the organization.
- Free/development mode must not be described as ZDR.
- Provider training opt-out and ZDR are deployment/account controls, not skill behavior.
- Live development qualification should use synthetic or non-confidential documents unless the account's privacy controls have been deliberately reviewed.

### Limits, retry, and cancellation

- Respect Bridge-supplied timeout, cancellation, attempt, request-size, and response-size limits.
- Enforce a bounded document byte limit before OCR network submission; BSS-009 may add Atlas-specific page/document limits later.
- Retry only eligible transient failures before observable completion, using bounded backoff.
- Authentication, invalid-request, unsupported-capability, rate-limit, timeout, provider-unavailable, malformed-response, privacy-policy, and response-bound failures must map to stable Bridge error codes.
- Never leak provider response bodies when they may contain document content, prompts, secrets, or provider-internal diagnostics.
- Keep provider capacity/rate-limit policy in the Bridge runtime rather than hard-coding user-facing limits into the adapter.

### Usage boundary

Normalize provider-reported usage when available.

For reasoning/chat, retain fields such as:

```text
provider
model
input tokens
output tokens
cached tokens when reported
latency
attempt
```

For OCR, retain provider-reported fields sufficient to account for:

```text
provider
model
processed pages when reported
usage metadata
latency
attempt
```

- Missing provider usage remains unavailable rather than guessed.
- Do not calculate provider price or reserve budgets inside the adapter.
- Cost calculation, usage persistence, budget reservation, and project/user budget policy remain Bridge runtime/usage-manager responsibilities.

## Explicitly out of scope

The following do **not** belong to BSS-008:

- changing approved BSS-001 through BSS-007 acceptance criteria;
- reading source documents from `DocumentStore`;
- defining the final Atlas `NormalizedDocument` schema;
- persisting or caching derived document perception;
- creating the `document-perception` pg-boss job;
- changing BSS-006 queue mechanics;
- semantic-extraction skill redesign;
- replacing the current `atlas.document-extraction` skill contract;
- text-vs-visual evidence schema redesign;
- semantic reconciliation;
- CES assessment implementation;
- Atlas chatbot tools or tool authorization;
- accepted-truth mutation, revisions, approval, publication, or HEAD movement;
- production object-storage selection;
- mandatory embedding support;
- pricing-plan/product-entitlement implementation.

Those responsibilities belong to BSS-009 or later Atlas/SFE feature tickets.

## Acceptance criteria

- The Mistral adapter is implemented inside the existing Agents Bridge service and does not introduce a standalone provider process/container.
- The adapter remains behind provider-neutral Bridge contracts; Mistral-specific SDK/API objects do not leak into Atlas Core or skill contracts.
- The existing BSS-005 reasoning runtime remains compatible and its approved provider-neutral boundary is not rewritten.
- Server-controlled capability aliases resolve only to explicitly configured and qualified Mistral model/endpoint IDs. Unknown aliases and unsupported capabilities fail before any provider request.
- Structured reasoning uses a qualified Mistral chat model with custom JSON Schema output and is revalidated against the complete skill schema with AJV before the result is accepted by the Bridge.
- Ordinary chat streaming yields normalized text events and normalized tool-call events, propagates cancellation, and terminates with a normalized completion or stable error.
- No transparent retry occurs after any chat delta/tool-call event has been emitted.
- The OCR provider capability calls `/v1/ocr` with explicit bounded document input and can preserve page text/markdown, structural blocks, tables, images/image references, page dimensions, bounding boxes, confidence information, model identity, and provider usage when returned by the qualified OCR configuration.
- The OCR provider capability does not read `DocumentStore`, persist a `NormalizedDocument`, create semantic candidates, or access trusted Atlas state.
- The adapter uses stateless provider paths for chat/structured reasoning and OCR and does not introduce Mistral Files, Agents, Conversations, Libraries, or provider-hosted Atlas memory.
- A zero-retention-required execution fails closed when the deployment has not explicitly declared approved/enabled Mistral ZDR.
- Authentication, invalid request, unsupported capability, rate limit, timeout, provider unavailable, malformed response, response bound, and privacy-policy failures map to stable secret-safe Bridge error codes.
- Provider-reported reasoning/chat/OCR usage is normalized when available. Pricing, budget reservation, and trusted Atlas state remain outside the adapter.
- `MISTRAL_API_KEY` remains Bridge-only and does not appear in contracts, responses, ordinary logs, or snapshots.
- With explicit development credentials, the provider path is reachable through the Compose-managed Agents Bridge service without a separate boot command.
- Ordinary CI makes no live Mistral calls.
- Mocked conformance tests cover structured request mapping, full-schema validation, model/capability checks, streaming text, tool-call normalization, retries, cancellation, request/response bounds, OCR request/response normalization, usage normalization, privacy-policy preflight, and secret-safe errors.
- BSS-009 can consume the provider OCR capability later without changing the provider contract or reopening BSS-005/BSS-007.

## Validation

### Automated

Run:

```text
Agents Bridge type-check
Agents Bridge build
provider-contract tests
Mistral adapter unit tests
structured-output conformance tests
chat streaming/tool-call tests
OCR mapping/normalization tests
retry/cancellation tests
privacy-policy preflight tests
secret-redaction tests
Compose service smoke test
```

The BSS ticket-set fixture-suite exclusion remains in force:

```text
@atlas/fixtures golden bundle
PRD fixture catalog
SFE extraction behavior
fixture-driven UI scenarios
```

are not BSS-008 blockers.

### Mocked provider validation

Use mocked Mistral HTTP/SSE responses to prove:

- explicit model/endpoint selection;
- custom JSON Schema request mapping;
- Bridge AJV revalidation;
- normalized chat deltas;
- normalized tool-call events;
- cancellation;
- retry cutoff after emitted output;
- OCR PDF request mapping;
- OCR blocks/bounding-box/table/image/dimension/confidence normalization;
- usage normalization;
- request/response limits;
- provider error mapping;
- privacy-policy fail-closed behavior;
- secret-safe logging/errors.

### Manually gated live qualification

Only run live qualification when an explicit `MISTRAL_API_KEY` and the selected model/endpoint configuration are available.

Record the exact model IDs/endpoints qualified.

At minimum, separately verify:

```text
Structured reasoning
    qualified Large 3 or Medium 3.5 model
    custom structured-output request
    complete schema-valid response
    provider usage fields

Chat
    qualified Small 4 model
    streamed text
    cancellation
    tool/function-call event when supported by the selected scenario

Document perception
    OCR 4.1
    PDF processing
    page content
    blocks / bounding boxes
    tables/images where present in the qualification fixture
    dimensions / confidence where configured
    provider usage fields
```

Use a synthetic or explicitly non-confidential PDF for ordinary development qualification.

A live provider call is not part of normal CI or ordinary `docker compose up`.

### Compose validation

- `docker compose up` remains the canonical supported local stack boot path.
- Agents Bridge starts without requiring a live Mistral request during boot.
- Missing optional live-provider credentials do not make ordinary provider-mocked CI unusable.
- When credentials are deliberately configured, the live qualification command/test reaches Mistral through the existing Agents Bridge process rather than a separate provider process.

## Review checkpoint

- **Review question:** Can Mistral provide the Bridge's structured reasoning, streamed chat/tool events, and document-perception provider primitive through provider-neutral contracts without taking ownership of Atlas truth, document authorization, or the BSS-009 perception workflow?
- **Combined acceptance:** Structured reasoning, chat streaming/tool events, and OCR provider capability pass their conformance tests; selected model/endpoint combinations are explicitly qualified; provider behavior, privacy requirements, limits, usage, errors, and secrets remain bounded by the Bridge; and the approved BSS-001 through BSS-007 boundaries remain unchanged.
- **Next dependent checkpoint:** BSS-009 may begin only after BSS-BATCH-08 receives a `PASS` review.
- **Commit to review:** `HEAD` (`feat(bridge): add Mistral provider adapter`).
