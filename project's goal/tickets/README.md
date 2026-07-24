# CES Ticket Roadmap

Ticket IDs remain stable even if scheduling changes. Phase membership is recorded in each ticket's title and metadata, while directories keep the growing plan navigable.

## Phases

| Phase | Scope | Ticket plan | Status |
|---:|---|---|---|
| 1 | Deterministic Core and Reference Adapter | [CES-000](phase-1/CES-000-parent-mvp.md) | Implemented locally |
| 2 | Thin Adapter-Neutral Integration Layer | [3-ticket plan](phase-2/README.md) | Implemented and hardened locally; CI pending |
| 3 | Greenfield Atlas and shared contracts | [Greenfield product plan](greenfield/README.md) | Planned; baseline gate closed |
| 4 | Architect and Forge | [Greenfield product plan](greenfield/README.md) | Planned |
| 5 | Assurance and advanced governance | [Greenfield product plan](greenfield/README.md) | Planned |

Phase 4 establishes composable, independently versioned adapter components, compatibility rules, production generic guidance, support levels, approval, and incremental stack support driven by real projects. It does not require one monolithic adapter for every possible technology combination. None of those Phase 4 capabilities are part of Phase 1.

Phase 2 is intentionally limited to a pinned, machine-readable execution boundary for Phase 3. Container publication, reusable organization workflows, and pull-request enforcement are deferred operational capabilities and are not required by the thin Phase 2 plan.

## Ticket metadata

Every ticket records:

- **Phase:** delivery phase and name;
- **Parent:** parent ticket or `None`;
- **Status:** `Planned`, `In progress`, `Implemented locally`, `Validated in CI`,
  `Released`, `Blocked`, or `Deprecated`.

Acceptance criteria may be checked only when the ticket's required evidence is attached or linked.
