# BSS-008: Groq model provider adapter

- **State:** `planned`
- **Review batch:** BSS-BATCH-08
- **Depends on:** BSS-005
- **Baseline:** [Production Baseline](../../atlas-backend-production-baseline.md) §§7–11, 15–16, 19, 21
- **Provider reference:** [Groq Structured Outputs](https://console.groq.com/docs/structured-outputs); [Groq Text Generation and streaming](https://console.groq.com/docs/text-chat)

## Outcome

Implement Groq as the first model provider behind the provider-neutral Agents Bridge contract. The Bridge can request validated structured generation for reasoning skills and stream ordinary chat text, while retaining control of model selection, execution limits, usage, and budgets.

## Scope

- Implement the Groq adapter under `apps/agents-bridge/providers` using the shared provider contract from BSS-005. Use the `worker1` provider implementation only as a reference for the adapter boundary, response normalization, bounded retries, cancellation, and tests; do not import its Agents Bridge runtime, registries, contracts, or Atlas-specific agents.
- Support structured generation and streamed chat as distinct adapter capabilities. Groq's current documentation does not support streaming with Structured Outputs, so structured requests use a complete response while ordinary chat can stream provider deltas.
- Resolve internal model aliases to explicitly configured Groq model IDs inside the Bridge. Clients and skills cannot choose an arbitrary provider, model ID, or endpoint.
- Qualify and record the initial Groq model and its structured-output mode. Reject unsupported model/schema combinations clearly; never silently discard schema constraints. Validate every structured result against the complete skill schema in the Bridge using AJV, regardless of provider-side guarantees.
- Read `GROQ_API_KEY` only at the Bridge configuration boundary or from the deployment secret provider. Keep credentials out of contracts, responses, logs, and test snapshots.
- Normalize provider responses, finish/refusal states, reported token usage, and failures into Bridge-owned contracts. Represent missing provider usage as unavailable; do not estimate price or calculate budgets in the adapter.
- Respect Bridge-supplied timeout, cancellation, attempt, request-size, and response-size limits. Retry only eligible pre-completion transient failures with bounded backoff; never replay already-emitted chat deltas.
- Keep provider rate limits, capacity controls, usage persistence, and cost/budget decisions in the Bridge runtime and its usage manager.
- Run the adapter inside the Compose-managed Agents Bridge service from BSS-005; do not create a separate provider container or manual boot command.

## Acceptance criteria

- The Groq adapter implements the provider-neutral contract and has no dependency on worker1-specific Bridge or agent modules.
- Structured-generation requests use an explicitly qualified model and supported JSON Schema mode. The Bridge rejects invalid output against the full skill schema even when Groq reports successful constrained generation.
- Chat streaming yields normalized text deltas, propagates cancellation, and terminates with a normalized completion or error event.
- Provider/model selection is server-controlled; unconfigured aliases and unsupported capabilities fail before sending a provider request.
- Transient failures follow the configured bounded retry policy; authentication, invalid-request, rate-limit, timeout, and malformed-response failures map to stable Bridge error codes without leaking provider response bodies or secrets.
- Provider-reported token usage is normalized when available. No pricing, budget reservation, or trusted Atlas state is owned by the adapter.
- With configured local development credentials, `docker compose up` makes the Bridge provider path available without a separate provider boot step; the adapter adds no standalone Compose service.
- Mocked conformance tests cover request mapping, schema validation, model capability checks, streaming, retries, cancellation, response bounds, usage normalization, and secret-safe errors; ordinary CI tests make no live Groq calls.

## Validation

- Run the adapter and provider-contract conformance tests with mocked HTTP/SSE responses.
- Run a separately gated live qualification test only when explicit Groq credentials and a selected model are available; verify the configured structured-output mode and usage fields against the live API.
- Run Bridge type-check, adapter/contract tests, and build; the ticket-set fixture-suite exclusion applies.
- Boot the Bridge through `docker compose up` before any manually gated live qualification check; no live provider call is part of ordinary Compose boot or CI validation.

## Review checkpoint

- **Review question:** Can Groq serve the Bridge's structured reasoning and streamed chat paths through the neutral provider contract without taking ownership of Atlas truth or Bridge policy?
- **Combined acceptance:** Both adapter capabilities pass contract tests, the selected model/schema combination is explicitly qualified, provider behavior is bounded and normalized, and Bridge-owned budgets and authority remain outside the adapter.
- **Commit to review:** Pending implementation commit.
