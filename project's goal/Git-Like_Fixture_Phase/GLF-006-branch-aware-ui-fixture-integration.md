# GLF-006: Branch-aware UI fixture integration

- **State:** planned
- **Review batch:** BATCH-22
- **Depends on:** GLF-003-02 approved, GLF-005-01
- **Baseline:** Architecture Checkpoint sections 12–17, 22.6–22.8, 24; UI/UX Prototype PRD sections 5–6, 9.1, 9.4; Fixture Data-Intent Contract; GLF-003-01; GLF-003-02

## Outcome

Refactor existing Atlas knowledge surfaces so the selected workspace HEAD,
rather than one accumulated workspace object, drives all fixture data reads.

## Scope

- Adapt Main Workflow, Project Facts, Changes, CES, Sources context, and
  chatbot-read fixture context to selected branch/head state.
- Render only materialized current state for normal reads.
- Preserve atomic candidate, source-inventory, assertion-history, and
  source-accounting relationships, with the selected branch/head and PRD-lens
  behavior retained across secondary document filtering and cross-links.
- Ensure workflow/facts/CES records share the same resolved fact IDs and HEAD.
- Preserve responsive behavior, theme parity, accessibility, routes, roles, and
  unrelated approved prototype behavior.

## Acceptance criteria

- Switching Master versus the incremental workspace changes every affected
  surface coherently from selected HEAD state.
- Unaffected facts and workflow topology remain stable when their referenced
  canonical facts did not change.
- Current reads never replay historical PRDs or use a model to reconstruct truth.
- Project Facts shows current value, provenance, and available history.
- CES identifies the same project revision as its source current truth.
- Every UI-visible workflow, Project Facts, CES, source-context, and
  chatbot-read record retains a resolvable candidate and source-inventory path;
  the UI must not substitute a separately curated or accumulated fixture view.

## Validation

- Run fixture provenance/reconciliation, rendering, and route-state tests for
  both workspaces, including cross-link preservation of branch, HEAD, and PRD
  lens context.
- Render and inspect all affected routes at desktop, tablet/narrow, and mobile
  widths, including light/dark themes where supported.
- Record visual validation and apply the frontend review gate before review.
