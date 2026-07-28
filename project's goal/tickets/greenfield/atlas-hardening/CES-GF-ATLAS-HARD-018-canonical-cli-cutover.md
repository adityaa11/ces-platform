# CES-GF-ATLAS-HARD-018 — Canonical CLI Cutover and Legacy Isolation

**Stage:** Corrective Atlas hardening
**Status:** Planned

## Objective

Make the hardened pipeline the only default `atlas run` path and prevent legacy
compatibility code from silently intercepting extraction, review, graph,
approval, publication, or qualification.

## Dependencies

- ATLAS-HARD-009 through ATLAS-HARD-014.
- ATLAS-HARD-016 and ATLAS-HARD-017.

## Work

- Add one canonical orchestrator outside the CLI parser for CLI and future UI.
- Migrate every Atlas command to canonical artifacts and decisions end to end.
- Remove legacy candidate arrays, compatibility proposal construction, fixed
  rule-heading parsing, and legacy review compilation from the default path.
- Fail closed when a canonical stage is unavailable; never fall back silently.
- Isolate legacy support behind a separately named compatibility command or
  internal migration harness with a deprecation date.
- Give canonical and legacy runs distinct pipeline IDs, directories, schemas,
  manifests, and telemetry.
- Permit legacy projection only after canonical approval for named consumers,
  always with a loss report.
- Add dependency tests forbidding default CLI/Bridge imports of legacy Atlas
  provider, candidate, and review contracts.

## Outputs

Canonical orchestrator, migrated commands, canonical manifest, isolated legacy
boundary, deprecation record, migration diagnostics, and dependency tests.

## Acceptance criteria

- [ ] `atlas run` cannot execute or fall back to legacy extraction.
- [ ] The manifest identifies the canonical pipeline and all hardened stages.
- [ ] Review and graph artifacts derive directly from `ProposedProjectModel`.
- [ ] Approval uses proposal-bound decisions and atomic canonical materialization.
- [ ] Legacy commands/artifacts are explicit, opt-in, non-production, and
      cannot overwrite canonical output.
- [ ] Default CLI and Bridge dependency tests reject legacy imports.
- [ ] Legacy fixtures remain only for migration/regression verification.
- [ ] Safara and three structurally different domains use the same default path.
- [ ] ATLAS-HARD-015 is rerun only after this cutover passes.

## Tests and evidence

No-fallback failure, canonical manifest, legacy isolation, directory collision,
dependency boundary, review/resume, approval, deterministic replay, and
cross-domain end-to-end runs.

## Out of scope

Production approval UI implementation.

