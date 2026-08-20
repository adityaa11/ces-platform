# AUI-001: Foundation and fixture boundary

- **State:** ready
- **Review batch:** BATCH-01
- **Depends on:** None
- **Baseline:** UI/UX Prototype PRD 9.1-9.2

## Outcome

Establish the monorepo boundary so `apps/atlas` is the future Atlas UI and `packages/atlas-fixtures` is its only temporary source of product data.

## Scope

- Create the application and fixture-package boundaries.
- Establish `pnpm` as the workspace package manager and lockfile authority.
- Configure fixture-only data access for the UI.
- Establish a minimal, reusable styling and component foundation compatible with strict CSP.
- Add a clear prototype-only data-mode indicator where appropriate for reviewers.
- If Docker is needed, configure named volumes for dependencies and package caches rather than writing downloaded packages into the repository root.

## Acceptance criteria

- The UI application is located at `apps/atlas`.
- Fixture contracts and scenarios are located at `packages/atlas-fixtures`.
- The workspace uses `pnpm`.
- Any Docker-based local workflow keeps dependency downloads and caches in named volumes, outside the repository root.
- The UI does not call live services or embed large mock records in components.
- The foundation supports responsive layout and accessible interaction.
- The application can run with fixture data only.

## Validation

- Run the application build and relevant static checks.
- Verify a representative fixture record is rendered through the package boundary.
