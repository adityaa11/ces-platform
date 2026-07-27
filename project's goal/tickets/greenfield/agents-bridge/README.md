# CES Greenfield Central Agents Bridge Ticket Plan

**Status:** Planned

This work introduces a centrally deployable provider service for CES agent
workflows. The first supported workflow is the existing Atlas provider
protocol backed by Gemini. Shared runtime infrastructure may later host other
agent workflows, but each workflow retains its own versioned, fail-closed
contract and endpoint.

The implementation specification is
[CES Atlas Bridge Provider](../../../CES_ATLAS_BRIDGE_PROVIDER.md).

## Delivery order

| Order | Ticket | Outcome | Depends on |
|---:|---|---|---|
| 1 | [CES-GF-AGB-001](CES-GF-AGB-001-service-boundary-and-contracts.md) | Approved centralized service boundary and Atlas endpoint contract | ATLAS-005 |
| 2 | [CES-GF-AGB-002](CES-GF-AGB-002-secure-shared-runtime.md) | Reusable authenticated, bounded, testable bridge runtime | AGB-001 |
| 3 | [CES-GF-AGB-003](CES-GF-AGB-003-gemini-provider-adapter.md) | Hardened Gemini structured-output adapter | AGB-002 |
| 4 | [CES-GF-AGB-004](CES-GF-AGB-004-atlas-gemini-vertical-slice.md) | Atlas-to-Gemini endpoint that returns validated Atlas results | AGB-003 |
| 5 | [CES-GF-AGB-005](CES-GF-AGB-005-production-operations.md) | Deployable, observable, rate-limited centralized service | AGB-004 |

## Architectural rules

- Centralize provider credentials, transport controls, retries, quotas, and
  redacted operational telemetry.
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
          /v1/atlas/analyze
                    |
                    | server-side provider credential
                    v
             Gemini generateContent
```

Future endpoints require their own contracts and tickets. They are not implied
by completion of the Atlas endpoint.

