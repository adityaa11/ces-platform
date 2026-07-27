# CES Greenfield Central Agents Bridge Ticket Plan

**Status:** Planned

This work introduces a centralized, contract-driven, agent-agnostic and
provider-agnostic execution gateway for authorized CES workflows.

Atlas requirement extraction is the first registered agent, and Gemini
structured generation is the first provider adapter. Each workflow retains its
own versioned, fail-closed contracts and policy.

The authoritative architecture and implementation specification is
[CES Agents Bridge](../../../CES_AGENTS_BRIDGE_ARCHITECTURE.md).

## Delivery order

| Order | Ticket | Outcome | Depends on |
|---:|---|---|---|
| 1 | [CES-GF-AGB-001](CES-GF-AGB-001-service-boundary-and-contracts.md) | Versioned agent, provider, registry, and execution contracts | ATLAS-005 |
| 2 | [CES-GF-AGB-002](CES-GF-AGB-002-secure-shared-runtime.md) | Secure generic Agents Bridge runtime | AGB-001 |
| 3 | [CES-GF-AGB-003](CES-GF-AGB-003-gemini-provider-adapter.md) | Gemini structured-generation provider adapter | AGB-002 |
| 4 | [CES-GF-AGB-004](CES-GF-AGB-004-atlas-gemini-vertical-slice.md) | Registered Atlas extraction agent and compatibility route | AGB-003 |
| 5 | [CES-GF-AGB-005](CES-GF-AGB-005-production-operations.md) | Production-ready centralized deployment | AGB-004 |

## Architectural rules

- Centralize provider credentials, transport controls, retries, quotas, and
  redacted operational telemetry.
- Register agents, providers, and model aliases explicitly and fail startup on
  invalid or duplicate definitions.
- Keep workflow contracts and prompts isolated behind distinct endpoints.
- Never expose provider credentials to CES callers.
- Never allow callers to select arbitrary provider URLs, API versions, models,
  or prompts.
- Treat every model response as untrusted until workflow-specific
  transformation and final schema validation succeed.
- Keep the service stateless so multiple instances can run behind a load
  balancer.
- Preserve mandatory human review; centralized execution grants no approval
  authority to an agent.

## Initial topology

```text
Atlas CLI / CI jobs / authorized workers
                    |
                    | HTTPS + caller credential
                    v
          Central CES Agents Bridge
          /v1/agents/:agentId/execute
          /v1/atlas/analyze (compatibility)
                    |
                    | server-side provider credential
                    v
             Gemini generateContent
```

The initial generic execution mode is structured generation. Future execution
modes and tools remain reserved extension points until a proven workflow
requires them.
