# CES-GF-ATLAS-V2-005 - Artifact and CLI Replacement

**Status:** Implemented
**Depends on:** ATLAS-V2-004

## Outcome

Make `atlas run` publish one deterministic v2 knowledge bundle and stop
producing workflow-only/fixed-detail artifacts.

## Scope

- Replace duplicated Atlas CLI assembly paths with one orchestrator.
- Publish canonical knowledge graph, hierarchy, evidence, diagnostics, and run
  manifest artifacts.
- Preserve atomic publication, canonical JSON, hashing, and source manifests.
- Treat renderer output as optional derived output only.
- Fail closed on contract or qualification errors.

## Acceptance

- Repeated identical runs have identical semantic hashes.
- The live provider path produces the same v2 schema as fixtures.
- No `proposed-workflow-detail-graphs.json`, workflow index, or per-workflow
  `flow.mmd` is produced by v2.
- No v1 artifact fallback is consulted by the v2 command.

## Implementation evidence

- `ces atlas run` now invokes the V2 semantic-fact, graph-selection, and
  recursive-assembly pipeline; `atlas analyze` remains an explicitly legacy
  diagnostic command until V2-009 removes it.
- V2 publishes only `atlas-knowledge.json`, `atlas-evidence.json`,
  `atlas-diagnostics.json`, `source-manifest.json`, and `run-manifest.json`
  through the existing atomic directory swap.
- Fixture intermediate results and the generic Agents Bridge endpoint both
  converge on the same validated semantic-fact output contract.
