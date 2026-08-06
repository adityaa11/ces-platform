# CES Central Agents Bridge Ticket Plan

**Status:** Generic infrastructure; Atlas semantics are out of scope

The bridge provides provider-neutral execution for registered agents. The
[generic architecture](../../../CES_AGENTS_BRIDGE_ARCHITECTURE.md) is its
authority. ATLAS-V2-002 owns the Atlas agent contract and uses only the generic
registered-agent endpoint.

| Order | Ticket | Outcome |
|---:|---|---|
| 1 | [AGB-001](CES-GF-AGB-001-service-boundary-and-contracts.md) | Generic contracts and trust boundary |
| 2 | [AGB-002](CES-GF-AGB-002-secure-shared-runtime.md) | Secure generic runtime |
| 3 | [AGB-003](CES-GF-AGB-003-gemini-provider-adapter.md) | Provider adapter |
| 4 | [AGB-005](CES-GF-AGB-005-production-operations.md) | Generic production operations |

No Bridge ticket may define Atlas semantic facts, graph selection, hierarchy,
artifacts, approval, or a legacy Atlas compatibility route.
