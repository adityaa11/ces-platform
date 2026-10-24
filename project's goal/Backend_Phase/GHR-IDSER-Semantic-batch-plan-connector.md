# Implementation Context — GHR HTTP Delivery to Semantic Batch Plan

**Status:** GO — Implementation Authorized  
**Repository:** `adityaa11/ces-platform`  
**Branch:** `codex/new-atlas-backend`  
**Scope:** Replace GHR local receiver invocation with direct internal HTTP delivery.

## 1. Objective

Implement real HTTP delivery from GHR to the Semantic Batch Plan receiving endpoint.

Currently, `apps/agents-bridge/src/ghr/delivery-worker.ts` invokes the local receiver:

```ts
receiveVerifiedBatchPlan({
  selector,
  canContinue,
  payload: rawPayload,
});
```

Replace this invocation with an HTTP POST to:

```http
POST /internal/semantic/batch-plan
```

The destination must be declared in the existing GHR semantic branch route file:

`apps/agents-bridge/src/ghr/routes/semantic/branches/batch-plan.route.ts`

The GHR route index must resolve this registered destination rather than relying on hardcoded endpoints inside the delivery worker.

Target flow:

```text
GHR pg-boss delivery job
  → Load immutable handoff
  → Validate header, hash and policy
  → resolveMainRouteBinding()
       → mainRouteIndex.semantic
       → semanticRegistry
       → batch-plan.route.ts
       → /internal/semantic/batch-plan
  → HTTP POST to registered endpoint
  → Semantic Batch Plan HTTP receiver
  → Validate and parse payload
  → HTTP 200 parsed_only
  → GHR persists terminal delivery receipt
```

This is a transport cutover only. No planning or downstream execution is authorized.

## 2. Route Registration — Single Source of Truth

Modify:

`apps/agents-bridge/src/ghr/routes/semantic/branches/batch-plan.route.ts`

The branch registration must explicitly declare the HTTP destination.

Target shape:

```ts
export const semanticBatchPlanRoute = Object.freeze({
  branch: "batch-plan",
  producerProcessKey: "perception.acceptance",
  policyVersion: "v1",
  handlerVersion: "v1",
  bodyContractType: "SemanticBatchPlanInput",
  bodyContractVersion: "v1",

  canContinue: false,

  payloadByteLimit: 2048,
  wrappedBodyByteLimit: 2081,

  receiver: {
    transport: "http",
    method: "POST",
    path: "/internal/semantic/batch-plan"
  }
} as const satisfies BranchRegistration);
```

Adjust the `BranchRegistration` TypeScript contract to support this HTTP destination metadata.

Requirements:

- `batch-plan.route.ts` owns the exact registered endpoint path.
- Preserve all existing immutable selector pins.
- Keep `canContinue: false`.
- Preserve payload and wrapper byte limits.
- The receiving endpoint must use this same registered path.
- The HTTP service origin is supplied by trusted deployment configuration.
- No endpoint URL may come from the handoff payload.
- Do not introduce a second route registry.
- Do not hardcode the semantic endpoint in `delivery-worker.ts` or the generic dispatcher.
- Do not retain an alternate local delivery path.

The destination path must have one authoritative declaration.

## 3. GHR Index Resolution

Preserve the existing index composition:

```text
ghr/main-route-index.ts
  → routes/semantic/index.ts
  → branches/batch-plan.route.ts
```

`resolveMainRouteBinding()` must continue to resolve routes through exact trusted header selectors.

Its returned registration must now contain the HTTP receiver metadata.

Example:

```ts
const registration = resolveMainRouteBinding(
  selector(header)
);

const destination = registration.receiver;
```

The resolver must remain a pure lookup operation.

It must not perform HTTP requests, parse Semantic Batch Plan payloads, or invoke IDSER planning functions.

The GHR delivery dispatcher consumes the registered destination and performs the HTTP request.

## 4. Semantic Batch Plan HTTP Endpoint

Implement:

```http
POST /internal/semantic/batch-plan
```

Register this endpoint in the existing Fastify server.

The endpoint's path must come from the semantic branch declaration in `batch-plan.route.ts`, not from a second independently maintained string.

Keep the HTTP receiving logic in a separate receiver module, with the registration wired to the authoritative branch path.

Responsibilities:

1. Authenticate the internal GHR service caller.
2. Validate the received GenericHandoffEnvelope/v1.
3. Verify header, route pins and body integrity.
4. Require `can_continue === false`.
5. Parse the canonical `SemanticBatchPlanInput/v1` body using the existing `@atlas/db` parser.
6. Return the parse-only acknowledgement.

The HTTP endpoint must not call `resolveBackground()` or any planning function.

Use a raw-body boundary that preserves the original serialized JSON bytes and prevents duplicate-key or noncanonical payloads from bypassing existing validation.

### Successful response

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "handoffId": "ghr-handoff-123",
  "bodySha256": "<verified body digest>",
  "disposition": "parsed_only"
}
```

The handoff identity and digest must match the request.

No IDSER-side database persistence or background job is needed for this false-only behavior.

## 5. GHR HTTP Forwarding

Modify:

`apps/agents-bridge/src/ghr/delivery-worker.ts`

Remove the direct invocation of `receiveVerifiedBatchPlan()`.

After successful GHR verification and route resolution, forward the original immutable handoff envelope through HTTP.

Conceptual implementation:

```ts
const registration = resolveMainRouteBinding(
  selector(header)
);

const acknowledgement = await httpDispatcher.deliver({
  destination: registration.receiver,
  envelope: verifiedEnvelope
});

assertValidAcknowledgement(
  acknowledgement,
  header
);

await terminalize(
  database,
  header.handoffId,
  activeClaim,
  "parsed_only",
  null
);
```

The code above describes the required responsibilities; integrate them with the existing worker APIs.

The dispatcher must:

- Support the registered HTTP transport.
- Accept destinations only from trusted route registrations.
- Use the configured private service origin.
- Authenticate using a server-owned credential.
- Preserve the original body bytes.
- Enforce HTTP timeouts and response-size limits.
- Reject redirects and unregistered destinations.
- Validate successful acknowledgements before terminalizing delivery.
- Respect existing lease fencing and retry authority.

Only a valid HTTP 200 acknowledgement may produce the `parsed_only` terminal receipt.

### HTTP failure handling

| Response or failure | Required result |
|---|---|
| 200 and valid matching acknowledgement | `parsed_only` |
| 400/422 invalid contract | Receiver rejection, quarantine |
| 401/403 authentication failure | Fail closed; no successful receipt |
| 404/405 unknown endpoint | Fail closed; no local fallback |
| 408/429/5xx, timeout or network error | Transient delivery; bounded retry |
| 200 with invalid acknowledgement | Reject; no successful terminal receipt |

Preserve the existing retry, `finalAttempt`, lease generation and terminal receipt semantics.

## 6. Application and Worker Wiring

Use the existing services.

```text
agents-bridge-worker
   │
   │ HTTP POST
   ▼
http://agents-bridge:3002
   │
   ▼
/internal/semantic/batch-plan
   │
   ▼
Semantic Batch Plan receiver
```

The complete private URL is assembled from two trusted sources:

- **Service origin:** deployment configuration, e.g. `http://agents-bridge:3002`
- **Endpoint path:** `semanticBatchPlanRoute.receiver.path`

No hardcoded route path in the HTTP transport.

Modify the necessary composition points:

- `apps/agents-bridge/src/main.ts`
- `apps/agents-bridge/src/app.ts`
- `apps/agents-bridge/src/worker-main.ts`
- `apps/agents-bridge/src/production-worker-composition.ts`
- `apps/agents-bridge/src/worker.ts`
- Relevant configuration modules and Docker Compose service environments

Reuse the existing Fastify application. Do not introduce a new microservice or additional HTTP server.

Do not use Better Auth sessions for this internal communication.

Required transport configuration must fail closed if missing or invalid. Do not introduce a feature flag or activation switch.

## 7. Receiver Ownership and Cleanup

The old local receiving implementation currently exists under:

```text
ghr/routes/semantic/
  branches/batch-plan.route.ts
  bodies/semantic-batch-plan-input.v1.ts
  receivers/batch-plan.receiver.ts
```

Keep the branch route declaration under GHR.

Move the actual HTTP receiving and parsing behavior into the receiving module used by the Fastify endpoint.

The HTTP endpoint registration must reference the path from `batch-plan.route.ts`.

Remove the obsolete direct receiver invocation and associated exports once the HTTP cutover is complete.

Reuse `parseSemanticBatchPlanInputV1()` from `@atlas/db`.

Do not create a second independent parser, route declaration or compatibility execution path.

## 8. Explicitly Out of Scope

Do not activate or implement:

- `can_continue: true`
- `resolveBackground()`
- `proposeStructuralFitCorpusPartition()`
- `inventoryMultimodalCandidates()`
- `partitionMultimodalStructuralFit()`
- BSS admission or capacity planning execution
- ImmutableSemanticCorpusPlan/v3 persistence
- SEM execution
- Provider calls
- Downstream queue publication

Do not change GHR issuance, policy versions, handler versions, immutable payload contract or existing persisted records.

The endpoint must reject `can_continue:true`.

## 9. Required Validation

Update the existing GHR tests and add real HTTP integration coverage.

Required positive cases:

1. `resolveMainRouteBinding()` resolves `semantic/batch-plan`.
2. The returned registration contains `POST /internal/semantic/batch-plan`.
3. The GHR delivery worker uses that registered endpoint.
4. A real HTTP POST reaches the Fastify endpoint.
5. Service authentication succeeds.
6. IDSER parses the canonical five-field payload.
7. HTTP 200 returns the correct `parsed_only` acknowledgement.
8. GHR persists the delivery receipt only after successful acknowledgement.
9. Duplicate deliveries preserve a single logical terminal receipt.

Required negative cases:

1. Unknown main, branch, policy or handler fails closed.
2. Invalid service credential is rejected.
3. Modified body/hash is rejected.
4. Noncanonical or duplicate-key payload is rejected.
5. `can_continue:true` is rejected.
6. HTTP timeout and 5xx follow bounded retry behavior.
7. Missing or invalid acknowledgement cannot terminalize successfully.
8. Unreachable endpoint never falls back to local execution.
9. Worker restart and lease recovery preserve delivery identity.

Use a real local HTTP listener for transport-level integration testing, alongside existing unit tests.

Preserve the GHR-03B no-downstream-effect invariant:

```text
No semantic execution
No semantic candidate creation
No BSS admission
No downstream queue publication
```

## 10. Acceptance Criteria

Implementation is complete when:

- The HTTP destination path is declared in `ghr/routes/semantic/branches/batch-plan.route.ts`.
- `resolveMainRouteBinding()` returns the HTTP destination metadata.
- `delivery-worker.ts` performs HTTP forwarding instead of invoking the local receiver.
- Fastify serves `POST /internal/semantic/batch-plan`.
- The route registration and Fastify registration use the same authoritative path.
- Successful HTTP acknowledgement is required for the `parsed_only` receipt.
- All existing route pins and GHR issuance semantics remain unchanged.
- No duplicate delivery path remains.
- No IDSER planner or downstream execution is activated.
- Typechecks, unit tests and HTTP integration tests pass.

## 11. GO Instruction

Proceed directly with implementation on `codex/new-atlas-backend`.

Use the existing GHR index and registry design. Make `batch-plan.route.ts` the single source of truth for the HTTP endpoint path.

Do not redesign GHR routing, add a second registry, reopen planning tickets, or expand this transport cutover into IDSER planning execution.

After implementation, report:

1. Changed files and commit SHA.
2. Registered HTTP destination.
3. Exact GHR → route index → HTTP dispatcher → endpoint call path.
4. HTTP request and acknowledgement contract.
5. Test and negative-case results.
6. Confirmation that local receiver delivery was retired.
7. Confirmation that no downstream process was activated.

Raise only genuine implementation blockers that cannot be resolved within this scope.