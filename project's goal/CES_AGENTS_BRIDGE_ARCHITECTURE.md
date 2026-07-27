# CES Agents Bridge Architecture and First Vertical Slice

## Status and authority

This document is the source of truth for the centralized CES Agents Bridge.
It supersedes the earlier interpretation of this file as a specification for a
dedicated Atlas-to-Gemini service.

The authoritative direction is:

> The CES Agents Bridge is a centralized, contract-driven, agent-agnostic and
> provider-agnostic execution gateway. It hosts registered CES agents, routes
> their execution through approved providers or runtimes, enforces
> agent-specific contracts and policies, and returns validated
> workflow-specific results.

Atlas requirement extraction is the first registered agent. Gemini structured
generation is the first provider adapter. Neither defines the permanent
identity or boundary of the bridge.

The existing repository schemas remain authoritative when this document and
implementation differ:

```text
packages/agent-provider-sdk/src/index.ts
packages/greenfield-contracts/src/index.ts
packages/requirement-schema/src/index.ts
packages/business-rule-schema/src/index.ts
```

Do not redesign the Atlas CLI or incompatibly change its existing provider
contract. A small backward-compatible SDK improvement is permitted only when a
proven bridge integration need requires it.

## Goals

- Provide one centrally deployable service for approved CES agent workflows.
- Separate workflow behavior from provider transport behavior.
- Keep callers independent from physical providers and provider credentials.
- Validate every agent input, intermediate result, and output.
- Enforce per-agent providers, models, tools, budgets, and review policies.
- Preserve the existing Atlas HTTPS provider integration.
- Fail closed without becoming an arbitrary prompt, model, tool, or HTTP proxy.
- Support multiple stateless instances behind trusted HTTPS ingress.

## Non-goals

- A general chat API.
- Caller-provided prompts, schemas, tools, credentials, or provider URLs.
- Automatic agent registration from untrusted packages.
- Dynamic provider or tool downloading.
- Automatic approval of agent-produced CES artifacts.
- Durable asynchronous jobs in the first release.
- Implementing speculative execution modes before a real CES workflow needs
  them.

## Repository and service identity

Implement the service as:

```text
apps/agents-bridge/
```

Package and service identity:

```text
@company/ces-agents-bridge
ces-agents-bridge
```

Suggested structure:

```text
apps/agents-bridge/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── server.ts
    ├── config/
    │   ├── environment.ts
    │   ├── agents.ts
    │   ├── providers.ts
    │   └── models.ts
    ├── core/
    │   ├── agent.ts
    │   ├── agent-registry.ts
    │   ├── provider.ts
    │   ├── provider-registry.ts
    │   ├── model-registry.ts
    │   ├── execution-context.ts
    │   ├── executor.ts
    │   ├── authentication.ts
    │   ├── authorization.ts
    │   ├── limits.ts
    │   ├── errors.ts
    │   └── logging.ts
    ├── agents/
    │   └── atlas-requirement-extractor/
    │       ├── agent.ts
    │       ├── contracts.ts
    │       ├── prompt.ts
    │       ├── transform.ts
    │       └── agent.test.ts
    ├── providers/
    │   └── gemini/
    │       ├── provider.ts
    │       ├── client.ts
    │       ├── response.ts
    │       └── provider.test.ts
    ├── tools/
    │   └── index.ts
    └── routes/
        ├── execute-agent.ts
        ├── atlas-compatibility.ts
        ├── health.ts
        └── readiness.ts
```

The exact file split may evolve, but these boundaries are mandatory:

```text
core/       shared bridge execution and security
agents/     workflow contracts, prompts, policies, and transformations
providers/  provider transport and protocol translation
tools/      registered, schema-validated, allowlisted capabilities
routes/     transport compatibility and generic execution entry points
```

## Architectural concepts

### Calling workflow

A calling workflow is a CES process such as Atlas, the policy compiler,
verification, or documentation generation. It selects a registered agent it is
authorized to invoke. It does not select a physical provider or supply provider
credentials.

### Agent

An agent defines the task:

- stable identifier and version;
- input, intermediate, and output schemas;
- execution instructions;
- result transformation;
- allowed providers, model aliases, and tools;
- input, output, timeout, and attempt budgets;
- human-review requirements.

Initial registered agent:

```text
atlas.requirement-extractor@1.0.0
```

### Provider

A provider defines how a provider-neutral execution request is translated and
executed:

- authentication;
- physical API request translation;
- response parsing and completion validation;
- retry classification and timeout behavior;
- provider error normalization;
- physical model and bounded usage reporting.

Initial provider:

```text
gemini
```

Provider adapters must not import Atlas contracts or implement Atlas prompts,
source provenance, candidate IDs, or review rules.

### Model alias

Agents refer to controlled aliases, not arbitrary physical model names:

```text
atlas-default
  → provider: gemini
  → model: gemini-2.5-flash
  → capabilities: structured-output
```

Alias resolution is server-controlled. Changing an alias requires a managed
configuration change, compatibility validation, and rollback path.

### Tool

A tool is a registered, schema-validated capability explicitly allowed by an
agent policy. The first Atlas agent uses no tools. Tool-assisted execution is a
reserved extension point, not a first-release requirement.

## Core contracts

The implementation may refine TypeScript details, but must preserve these
semantics.

```ts
type AgentExecutionMode =
  | "structured-generation"
  | "tool-assisted"
  | "remote-agent"
  | "deterministic";

type AgentExecutionPolicy = {
  allowedProviders: readonly string[];
  allowedModelAliases: readonly string[];
  allowedTools: readonly string[];
  timeoutMs: number;
  maxAttempts: number;
  maxInputBytes: number;
  maxOutputBytes: number;
  maxOutputTokens: number;
  requiresStructuredOutput: boolean;
  requiresHumanReview: boolean;
};

interface StructuredGenerationAgentDefinition<
  TInput,
  TIntermediate,
  TOutput,
> {
  readonly id: string;
  readonly version: string;
  readonly description: string;
  readonly mode: "structured-generation";
  readonly inputSchema: Schema<TInput>;
  readonly intermediateSchema: Schema<TIntermediate>;
  readonly outputSchema: Schema<TOutput>;
  readonly executionPolicy: AgentExecutionPolicy;

  buildExecutionRequest(
    input: TInput,
    context: AgentExecutionContext,
  ): StructuredGenerationRequest;

  transformResult(
    result: TIntermediate,
    input: TInput,
    context: AgentExecutionContext,
  ): Promise<TOutput>;
}

interface AgentProvider {
  readonly providerId: string;

  executeStructured<TOutput>(
    request: StructuredGenerationRequest,
    outputSchema: Schema<TOutput>,
    context: ProviderExecutionContext,
  ): Promise<StructuredGenerationResponse<TOutput>>;
}
```

Only the mode-specific `StructuredGenerationAgentDefinition` contract is
defined and executable in the first release. `tool-assisted`, `remote-agent`,
and `deterministic` are reserved mode identifiers, not incomplete interfaces.
Each future mode receives its own definition and lifecycle only when a proven
workflow requires it. Introducing one must not change the meaning of the
structured-generation contract. Registrations using unsupported modes fail
during startup.

When a second mode is proven, the registry-facing `AgentDefinition` becomes a
discriminated union of complete mode-specific definitions. It must never gain a
universal method whose request or lifecycle applies to only one mode.

A provider-neutral structured request contains trusted system instructions,
messages, response JSON Schema, a controlled model alias, and bounded generation
settings. It does not contain a physical provider URL or credential.

## Registries and startup validation

Agents, providers, models, and future tools must be explicitly registered.
Startup must fail for:

- duplicate identifiers or duplicate identifier/version pairs;
- invalid definitions;
- unsupported execution modes;
- missing providers or model aliases;
- aliases whose provider is unavailable;
- aliases lacking capabilities required by the agent;
- agents referring to disallowed or unavailable tools;
- invalid, zero, negative, or globally excessive budgets;
- an Atlas registration that does not require human review.

A new agent must be registerable without modifying the shared executor. A new
provider must be registerable without changing existing agent contracts.

## Trusted execution flow

```text
authenticated client
  → authorized route and registered agent
  → validated agent version and input
  → registered agent definition
  → allowed model alias
  → registered provider and physical model
  → allowed tools and execution budgets
  → provider execution
  → intermediate schema validation
  → agent transformation
  → output schema validation
  → workflow-specific response
```

The caller must never be able to provide:

- system prompts or unrestricted messages;
- provider URLs, API versions, or credentials;
- physical model names on the generic route;
- response schemas;
- tools or tool arguments outside a registered agent flow;
- execution budgets exceeding agent or global policy.

Source documents are untrusted content. Instructions embedded in a PRD cannot
change the registered prompt, provider, model alias, schema, tools, metadata,
authorization, or human-review policy.

## HTTP API

Initial endpoints:

```text
GET  /healthz
GET  /readyz
POST /v1/agents/:agentId/execute
POST /v1/atlas/analyze
```

`POST /v1/agents/:agentId/execute` is the canonical execution route for
registered agents. `POST /v1/atlas/analyze` is a backward-compatible adapter
for the existing Atlas SDK. Future agents do not automatically receive custom
routes; add one only to preserve a proven existing client contract.

### Health

`GET /healthz` returns:

```json
{
  "status": "ok",
  "service": "ces-agents-bridge"
}
```

It must not expose keys, environment values, registry contents, models, quota,
or provider availability.

Readiness may verify that configuration and required registrations loaded
successfully, but its public response must remain non-sensitive.

### Generic registered-agent execution

Example:

```http
POST /v1/agents/atlas.requirement-extractor/execute
```

```json
{
  "agent_version": "1.0.0",
  "input": {},
  "correlation": {
    "request_id": "bounded-optional-value"
  }
}
```

Only agent version, agent-specific input, and bounded correlation metadata are
accepted. Input is validated by the registered agent schema.

### Atlas compatibility route

`POST /v1/atlas/analyze` preserves the existing `HttpAtlasProvider` protocol
and delegates internally through `atlas.requirement-extractor`.

The Atlas CLI sends:

```json
{
  "contract": "1.0.0",
  "model": "gemini-2.5-flash",
  "request": {
    "schema_version": "1.0.0",
    "prompt_contract_version": "1.0.0",
    "source_documents": [],
    "project_intent": {}
  }
}
```

Define a strict local envelope schema and reuse
`AtlasProviderRequestSchema`. The legacy physical model field is allowlisted
and mapped by trusted route code to `atlas-default`. It does not establish a
general caller-controlled model-selection mechanism.

The successful compatibility response is the direct validated
`AtlasProviderResult`; never wrap it in `data`, `result`, or `response`.

## Authentication and authorization

Caller authentication and provider authentication are separate.

First-release environment naming:

```text
AGENTS_BRIDGE_API_KEY=<temporary caller credential>
GEMINI_API_KEY=<provider credential>
```

The Atlas CLI continues sending the caller credential from
`CES_ATLAS_API_KEY` as:

```http
Authorization: Bearer <credential>
```

Missing or unsupported authorization returns `401`; an invalid credential
returns `403`. Compare secrets using a timing-safe method where practical.

The target production design uses per-client identities with:

- separately revocable and rotatable credentials;
- allowed routes and agent versions;
- individual quotas and concurrency limits;
- stable audit identity.

No caller credential is sent to a provider. No provider credential is returned
to a caller or accepted in request JSON or query parameters.

## Shared runtime requirements

- Default to the built-in Node.js HTTP server and native `fetch`.
- Parse configuration separately from server construction.
- Inject transport, clock, delay, randomness, and logger dependencies for
  deterministic tests.
- Fail startup when required configuration or registrations are invalid.
- Limit request bytes while streaming, before full buffering or JSON parsing.
- Bound provider response bytes before parsing.
- Use request IDs with length and character limits.
- Apply agent-specific timeouts, attempts, input bytes, output bytes, and output
  tokens within stricter global ceilings.
- Use `AbortController` for provider deadlines.
- Keep the service stateless; external coordination may enforce distributed
  quotas when multiple instances require global limits.
- Support graceful shutdown.

## Error contract

Return sanitized JSON:

```json
{
  "error": {
    "code": "INVALID_AGENT_INPUT",
    "message": "The registered agent input is invalid.",
    "request_id": "optional-bounded-id"
  }
}
```

Initial error families include:

```text
400 INVALID_REQUEST
400 INVALID_ATLAS_REQUEST
401 AUTHENTICATION_REQUIRED
403 AUTHENTICATION_FAILED
403 AGENT_NOT_AUTHORIZED
404 AGENT_NOT_FOUND
405 METHOD_NOT_ALLOWED
409 AGENT_VERSION_UNSUPPORTED
413 REQUEST_TOO_LARGE
422 INVALID_AGENT_RESULT
429 BRIDGE_RATE_LIMITED
429 PROVIDER_RATE_LIMITED
502 PROVIDER_REQUEST_FAILED
502 PROVIDER_RESPONSE_INVALID
504 PROVIDER_TIMEOUT
500 INTERNAL_ERROR
503 BRIDGE_NOT_READY
```

Do not return provider bodies, HTML, stack traces, secrets, authorization
headers, full source documents, prompts, or responses.

Calling SDKs may eventually parse known error codes from bounded JSON error
responses. They must never expose arbitrary provider response bodies. The
existing Atlas SDK may continue reporting HTTP status until a separate
backward-compatible diagnostic improvement is justified.

## Logging and audit

Log bounded operational fields:

- request and client audit IDs;
- route, agent ID/version, execution mode, and model alias;
- resolved provider and physical model;
- source count and aggregate character count;
- durations, attempts, provider status, finish state, and final bridge status;
- bounded token usage when supplied by the provider.

Never log:

- caller or provider credentials;
- authorization headers;
- complete source documents;
- complete prompts or provider responses;
- unrestricted correlation metadata.

Audit records must distinguish authenticated client, calling route, agent,
provider, model alias, physical model, and result status.

## Gemini structured-generation provider

The first adapter calls:

```text
POST https://generativelanguage.googleapis.com/v1beta/models/{trusted-model}:generateContent
```

with:

```http
Content-Type: application/json
x-goog-api-key: <GEMINI_API_KEY>
```

The trusted model is resolved from the registry. The adapter translates the
provider-neutral request to Gemini `systemInstruction`, `contents`, and
`generationConfig`.

For structured output:

```json
{
  "responseMimeType": "application/json",
  "responseJsonSchema": {},
  "candidateCount": 1,
  "maxOutputTokens": 32768
}
```

Generate JSON Schema from Zod 4 where practical. Gemini supports only a subset,
so remove unsupported constructs without weakening application-side parsing.
Agent schemas remain authoritative after provider output.

A successful Gemini response requires:

- exactly one requested candidate;
- no prompt-level block;
- non-empty joined text from that candidate;
- a normal successful completion reason;
- no safety block or truncation;
- JSON within the response-byte limit;
- successful intermediate-schema parsing.

Do not search multiple candidates for one that happens to validate.

Retry only transient failures such as `429`, supported `5xx` responses, and
temporary network failures. Do not retry provider `400`, authentication errors,
safety blocks, malformed JSON, or schema violations. Use bounded exponential
backoff with jitter and honor only reasonable `Retry-After` values.

## Atlas requirement extraction agent

The Atlas agent owns:

- `AtlasProviderRequestSchema` and `AtlasProviderResultSchema`;
- its extraction prompt and Gemini-independent intermediate schema;
- source prompt representation and provenance reconstruction;
- candidate normalization, review restrictions, ordering, and identifiers;
- final result validation and mandatory human review.

Gemini owns none of these responsibilities.

### Prompt construction

The system instruction must require extraction of candidate requirements,
business rules, uncertainties, conflicts, and clarification questions while
forbidding invention and approval.

The user content clearly separates:

```text
PROJECT INTENT
SOURCE DOCUMENT INDEX
SOURCE DOCUMENT CONTENT
```

Markdown source content is represented with stable line numbers such as
`[L0001]` without modifying the stored source hash.

Source documents are data, not instructions. Prompt-injection text cannot
override registered execution policy.

### Intermediate contract

The internal extraction schema contains semantic candidate fields and source
references with known `document_id` plus optional section and line locations.
It excludes:

- source paths and hashes;
- provider, model, and prompt-contract identity;
- Atlas schema versions;
- final canonical IDs;
- approval authority.

Confidence is model-proposed but constrained to `0..1`; the bridge does not
claim a fixed confidence it did not calculate.

### Trusted transformation

For every source reference:

- match `document_id` against the original request;
- copy `path` and `content_hash` from the matched document;
- reject unknown documents;
- validate optional line ranges against numbered content;
- do not invent page locations.

The bridge stamps schema version, agent provider/model metadata, prompt contract
version, and review state from trusted execution context. Origin is restricted
to `explicit` or `inferred`; review state is restricted to `candidate` or
`needs_confirmation`.

The bridge must reject or prevent `confirmed`, `derived`, `observed`,
`approved`, `rejected`, and `superseded` provider claims.

### Deterministic normalization

Do not trust model ordering or final IDs. Given the same normalized
intermediate result, excluding array order and temporary model identifiers, the
bridge must produce byte-equivalent ordering, identifiers, and references.

Normalize strings according to the agent contract, then sort requirement and
business-rule candidates by:

1. source-document position in the original request;
2. `line_start`, with an absent value sorted last;
3. `line_end`, with an absent value sorted last;
4. normalized candidate type;
5. normalized title for requirements or statement for business rules;
6. SHA-256 of canonical semantic candidate content as the final tie-breaker.

After candidate IDs are assigned and temporary references are remapped, sort
the remaining collections with lexicographic text comparison and these exact
keys:

- uncertainties: joined sorted affected requirement IDs; severity rank
  `blocking`, `high`, `medium`, `low`; normalized field; normalized reason;
  canonical semantic SHA-256;
- conflicts: joined sorted source requirement IDs; the same severity rank;
  normalized statement; canonical semantic SHA-256;
- clarification questions: joined sorted affected requirement IDs; blocking
  questions first; normalized question; canonical semantic SHA-256.

Assign each collection's sequential IDs only after its sort. Canonical semantic
hash input excludes temporary and final IDs, array order for set-like
references, and trusted execution metadata. AGB-001 golden fixtures must lock
the string normalization and canonical JSON rules already used by the
repository.

Assign:

```text
REQ-CAND-001
BR-CAND-001
UNC-001
CONFLICT-001
QUESTION-001
```

after deterministic semantic ordering, then remap all references. Reject
duplicates or dangling references after normalization.

Candidate identifiers are deterministic for the same normalized intermediate
result. They are run-local and are not guaranteed to remain stable when
candidate content, source positions, or candidate membership changes.

Finally:

```ts
const validated = AtlasProviderResultSchema.parse(transformedResult);
```

The compatibility route returns only `validated`.

## Environment

Initial variables:

```text
PORT=8787
HOST=0.0.0.0
AGENTS_BRIDGE_API_KEY=<temporary caller secret>
GEMINI_API_KEY=<provider secret>
ATLAS_MODEL_ALIAS=atlas-default
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT_MS=90000
GEMINI_MAX_RETRIES=2
MAX_REQUEST_BYTES=10485760
MAX_SOURCE_DOCUMENTS=20
MAX_TOTAL_SOURCE_CHARACTERS=5000000
MAX_SINGLE_SOURCE_CHARACTERS=1000000
MAX_PROVIDER_RESPONSE_BYTES=4194304
MAX_OUTPUT_TOKENS=32768
MAX_PROVIDER_ATTEMPTS=3
```

Production per-client credentials may replace the temporary single bridge key.
Do not overload provider credentials for caller authentication.
Service ceilings apply to every execution. Agent policies may impose stricter
limits but can never exceed a service ceiling.

## Testing

Normal unit and CI tests must not call a real provider.

Shared runtime coverage:

- health and readiness;
- configuration and registry startup failures;
- authentication and per-agent authorization;
- generic registered-agent routing;
- request and response byte limits;
- timeouts, concurrency limits, and sanitized errors;
- log and audit redaction;
- no real network access.

Gemini adapter coverage:

- trusted URL, credential header, and model resolution;
- structured request translation;
- exact candidate and completion validation;
- safety, truncation, empty, oversized, and malformed responses;
- retry and no-retry classification;
- `Retry-After` bounds and timeouts;
- no Atlas imports or behavior.

Atlas agent coverage:

- valid generic and compatibility execution;
- envelope, contract, request, and legacy model validation;
- trusted source path and hash reconstruction;
- unknown and out-of-bounds source references;
- deterministic ordering, IDs, and reference remapping;
- forbidden review states and metadata override attempts;
- prompt injection;
- final `AtlasProviderResultSchema` validation;
- existing CLI result and expected exit code `7`.

Extensibility coverage:

- a second deterministic fixture agent registers and executes without modifying
  the shared executor;
- a second fixture provider registers without changing agent contracts;
- duplicate and unresolved registrations fail startup.

An optional real-provider test runs only when:

```text
GEMINI_LIVE_TEST=true
```

Never commit credentials or confidential live PRD fixtures.

## Deployment and operations

- Expose the bridge only through HTTPS for remote callers.
- Keep provider credentials in a secret manager or equivalent injection
  boundary.
- Issue and rotate per-client identities in production.
- Apply per-client, per-agent, and provider-level rate and concurrency limits.
- Document data retention and confidential-PRD handling.
- Support multiple stateless bridge instances.
- Define model alias replacement, compatibility validation, rollback, and
  provider credential rotation.
- Store only redacted live validation evidence.

## Documentation

`apps/agents-bridge/README.md` must document:

- architecture and the agent/provider/workflow distinction;
- registry and model-alias behavior;
- caller versus provider credentials;
- environment variables and local startup;
- HTTPS deployment;
- generic and Atlas compatibility routes;
- Gemini key creation;
- Atlas CLI invocation and expected exit code `7`;
- generated Atlas artifacts;
- errors, privacy, and confidential-document warnings;
- opt-in live validation.

## Acceptance criteria

- The application is named and structured as a centralized Agents Bridge.
- Atlas is a registered agent, not the bridge identity.
- Gemini is a provider adapter, not the agent implementation.
- Stable agent, provider, policy, context, and model-alias contracts exist.
- Registries reject invalid, duplicate, and unresolved definitions.
- Callers cannot submit arbitrary prompts, schemas, providers, URLs,
  credentials, physical models, budgets, or tools.
- The generic route executes only registered, authorized agents.
- The Atlas compatibility endpoint works without an incompatible CLI change.
- Every agent validates its input, intermediate result, and output.
- Every provider normalizes provider-specific transport and completion behavior.
- Agent policy controls providers, models, tools, limits, and human review.
- Trusted Atlas source and execution metadata are reconstructed by agent code.
- No agent or provider can approve Atlas candidates.
- Timeouts, retries, byte limits, concurrency controls, and sanitized errors are
  enforced.
- Secrets and confidential source content do not appear in logs or errors.
- Normal CI is external-network-free.
- A second fixture agent can be registered without modifying shared execution
  logic.
- A second fixture provider can be registered without changing agent contracts.
- A documented opt-in live Gemini test and redacted Atlas run succeed.
- Existing repository checks continue to pass.

## Delivery tickets

Implementation is evidence-gated by:

```text
project's goal/tickets/greenfield/agents-bridge/
├── CES-GF-AGB-001-service-boundary-and-contracts.md
├── CES-GF-AGB-002-secure-shared-runtime.md
├── CES-GF-AGB-003-gemini-provider-adapter.md
├── CES-GF-AGB-004-atlas-gemini-vertical-slice.md
└── CES-GF-AGB-005-production-operations.md
```
