# Review: BATCH-19 - Golden fixture data contract

- Reviewed commit: `e22583558bd018b0cfa3af8a1b78273e7f6cc6e4`
- Ticket: GLF-003
- Baseline: Architecture Checkpoint sections 2, 4–12, 16–20, 22–24; UI/UX Prototype PRD 9.1, 9.4; Fixture Data-Intent Contract
- Result: `CHANGES_REQUESTED`
- Review round: 1

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-001 | Blocker | `apps/atlas/scripts/generate-golden-fixture.mjs:19-100` | GLF-003 scope and execution plan: the documented command must run the five shared skills through a dependency-ordered pipeline, with a substitutable `codex` adapter and inspectable stage inputs/outputs | Accepted | Introduce an explicit provider-neutral adapter/orchestration boundary that loads each `atlas-skill.json`, invokes the five declared stages in order, and records their actual structured responses and provenance. The current `execution()` helper only manufactures provenance summaries while extraction, repository assembly, change staging, projection, and verification are all hardcoded in the generator. |
| F-002 | Blocker | `apps/atlas/scripts/generate-golden-fixture.mjs:16,41-64,100-103` | GLF-001 invalid/no-fallback mode contract; GLF-003 acceptance: a failed skill schema or deterministic gate must prevent publication | Accepted | Resolve `SKILLS_MODE` through the shared resolver so invalid values and unconfigured `agents_bridge` fail explicitly. Validate every stage response against its manifest with Ajv and run the full deterministic topology/provenance/evidence/branch gates before the final rename. Add a regression test proving invalid mode or failed schema/gate leaves the prior bundle unchanged. The current generator reads `process.env.SKILLS_MODE` directly, never invokes the resolver or Ajv, and can publish with an arbitrary mode string. |
| F-003 | Important | `apps/atlas/scripts/generate-golden-fixture.mjs:7-14,66` | GLF-003 execution plan step 1 and acceptance: discover and process the checked-in PDFs under `docs/PRD/` | Accepted | Discover all `.pdf` inputs beneath `docs/PRD/` in deterministic order and derive artifact IDs/relative paths from the discovered files. The fixed three-entry `files` array will silently omit a newly added incremental PRD. |
| F-004 | Important | `packages/atlas-fixtures/src/index.ts`; `packages/atlas-fixtures/tests/golden-fixture.test.mjs:19-24` | GLF-003 validation: resolve Master and incremental branch data through one pure fixture read contract; downstream GLF-004/005 require branch/HEAD-keyed fixture data | Accepted | Add and export one pure golden-bundle read contract that selects a branch, resolves its matching HEAD/materialized state, and exposes the shared projection data. Make the branch-isolation test use that contract; the current branch resolution exists only as an ad hoc test helper and the application-facing fixture package has no generated-bundle reader. |
| F-005 | Important | `project's goal/Git-Like_Fixture_Phase/README.md:32-34` | Atlas delivery controls require completed checkpoints to be reflected consistently in the ticket-set state table | Accepted | Update the committed delivery rows so GLF-001/BATCH-17 and GLF-002/BATCH-18 are `approved`, matching their approved ticket records and PASS feedback; retain GLF-003/BATCH-19 as `awaiting_review`. |

## Decision

BATCH-19 remains `CHANGES_REQUESTED`. The documented command completes on the
checked-in Safara PDFs, and the fixture tests pass 12/12 with a whitespace-clean
diff. The generated happy-path bundle has coherent branch HEADs, distinct
current values, source evidence, a staged proposal, and aligned projections.
However, the command records stage summaries instead of executing the shared
skill contracts, bypasses the validated execution-mode and schema gates, uses a
fixed input list, and does not provide the required pure fixture read contract.
The committed phase README also has stale prior-ticket states. Resolve the
Blockers and Important findings before BATCH-19 can pass; do not begin GLF-004.
