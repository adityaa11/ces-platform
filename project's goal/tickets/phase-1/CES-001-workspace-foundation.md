# CES-001 — Phase 1: Establish the Workspace Foundation

**Phase:** 1 — Deterministic Core and Reference Adapter
**Parent:** [CES-000](CES-000-parent-mvp.md)
**Status:** Planned

## Goal

Create the TypeScript/Node.js ES-module monorepo on pnpm with strict dependency isolation.

## Work

- Add the root `package.json`, exact `packageManager`, supported Node version, and shared scripts.
- Add `pnpm-workspace.yaml` for `apps/*`, `packages/*`, and `adapters/*`.
- Enable the isolated linker, strict peers, no hoisting, no workspace cycles, and explicit `workspace:*` links.
- Add shared TypeScript and Vitest configuration.
- Scaffold package directories without introducing framework terminology into core packages.
- Add formatting/lint configuration only if it is deterministic and locally runnable.

## Acceptance criteria

- [ ] A clean `pnpm install` creates one committed lockfile.
- [ ] `pnpm build`, `pnpm typecheck`, and `pnpm test` are available at the root.
- [ ] Packages cannot import undeclared or phantom dependencies.
- [ ] Workspace cycles fail validation.
- [ ] Node and pnpm versions are pinned consistently.

## Required evidence

- [ ] Commit or diff shows the root workspace, package, TypeScript, and Vitest configuration files.
- [ ] Attach output from clean `pnpm install`, `pnpm build`, `pnpm typecheck`, and `pnpm test` runs.
- [ ] Attach a negative-test result proving an undeclared dependency or workspace cycle is rejected.
- [ ] Record the installed Node and pnpm versions and confirm they match the pinned versions.

## Exclusions

- No domain schemas, policies, adapters, or publishing automation.

