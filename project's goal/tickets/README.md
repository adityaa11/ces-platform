# CES Ticket Roadmap

Ticket IDs remain stable even if scheduling changes. Phase membership is recorded in each ticket's title and metadata, while directories keep the growing plan navigable.

## Phases

| Phase | Scope | Ticket plan | Status |
|---:|---|---|---|
| 1 | Deterministic Core and Reference Adapter | [CES-000](phase-1/CES-000-parent-mvp.md) | Planned |
| 2 | Verification Integration, Container Publishing, and Pull-Request Enforcement | To be planned | Not started |
| 3 | Evidence-Backed PRD and Business-Document Extraction | To be planned | Not started |
| 4 | Production Adapter Ecosystem and Incremental Stack Support | See the main architecture roadmap | Not started |
| 5 | Organizational Governance, Exceptions, Upgrades, and Impact Analysis | To be planned | Not started |

Phase 4 establishes composable, independently versioned adapter components, compatibility rules, production generic guidance, support levels, approval, and incremental stack support driven by real projects. It does not require one monolithic adapter for every possible technology combination. None of those Phase 4 capabilities are part of Phase 1.

## Ticket metadata

Every ticket records:

- **Phase:** delivery phase and name;
- **Parent:** parent ticket or `None`;
- **Status:** `Planned`, `In Progress`, `Blocked`, or `Done`.

Acceptance criteria may be checked only when the ticket's required evidence is attached or linked.
