# CES Agents Bridge Architecture

## Status and authority

This document defines only the generic CES Agents Bridge boundary. Atlas
semantics, prompts, extraction schemas, graph selection, and artifact contracts
are owned by the active ATLAS-V2 tickets and the two Atlas graph contexts.

## Purpose

The bridge is a stateless, provider-neutral execution gateway for explicitly
registered CES agents. It owns transport and operational controls, not product
meaning.

The bridge owns:

- caller authentication and per-agent authorization;
- agent, provider, and model-alias registries;
- provider credentials and transport translation;
- request/response size, timeout, retry, quota, and concurrency limits;
- redacted telemetry, correlation, and sanitized failures;
- validation that the selected registered agent returns its declared schema.

The registered agent owns:

- its versioned input, intermediate, and output schemas;
- prompt construction and trusted result transformation;
- domain-specific validation and review policy.

The bridge never owns:

- Atlas semantic facts or canonical identities;
- graph-type selection, graph membership, topology, or hierarchy;
- approval, publication, or evidence fabrication;
- caller-provided arbitrary prompts, schemas, provider URLs, physical models,
  credentials, or tools.

## Canonical API

```http
POST /v1/agents/:agentId/execute
```

Requests identify a registered agent version and provide only schema-validated
agent input plus bounded correlation metadata. The server resolves the allowed
provider and physical model from trusted configuration.

There is no permanent Atlas compatibility route. ATLAS-V2-002 defines and
registers the v2 extraction agent directly through the canonical API. Any
existing `/v1/atlas/analyze` implementation is legacy code owned for deletion
by ATLAS-V2-000 and ATLAS-V2-009.

## Trust and execution rules

1. Authenticate the caller and authorize the requested registered agent.
2. Resolve immutable agent, policy, provider, and model-alias versions.
3. Validate limits before provider execution.
4. Treat provider output as untrusted.
5. Run agent-owned trusted transformation and final schema validation.
6. Return only the validated agent result or a sanitized typed failure.
7. Record redacted operational metadata without storing confidential PRD text.

## Atlas integration rule

The bridge may execute the ATLAS-V2 semantic-fact agent, but it cannot narrow,
translate, or adapt the v2 result into candidate requirements, business-rule
arrays, workflow projections, Mermaid artifacts, or fixed UI detail contracts.
Original text and evidence supplied to the agent remain governed by ATLAS-V2.

## Acceptance

- A provider can be replaced without changing the registered agent contract.
- An agent can be added without changing shared execution logic.
- Invalid registrations and unresolved aliases fail startup.
- Callers cannot select arbitrary execution configuration.
- Provider output cannot bypass agent-owned validation.
- No bridge module imports Atlas graph, hierarchy, review, or artifact schemas.
- No Atlas-specific compatibility endpoint is required for v2 operation.
