# CES-GF-ATLAS-V2-009D - End-to-End Qualification

**Status:** Implemented
**Depends on:** ATLAS-V2-009C

## Outcome

Prove all qualification fixtures through the same production V2 path.

## Scope

- Run semantic facts, graph selection, assembly, CLI publication, API loading,
  recursive navigation, and governance approval.
- Exercise the generic Agents Bridge route, including provider-result validation.
- Compare semantic hashes across identical repeated runs.
- Scan production code for fixture-specific labels and topology.

## Acceptance

- Golden and both non-Safara fixtures pass without adapters or fallback artifacts.
- Repeated inputs produce identical semantic and manifest hashes.
- Proposed and approved bundles retain identical evidence and topology.

## Implementation Evidence

- All three V2 fixtures run through semantic finalization, graph selection,
  assembly, CLI publication, UI loading/navigation, and governance approval.
- Repeated publication is byte-identical for knowledge and run manifests;
  approval preserves proposed evidence and topology exactly.
- The actual Atlas semantic-fact agent is exercised through the shared generic
  Agents Bridge endpoint, and invalid provider-result input is rejected.
- Qualification identified and fixed generic assembly ordering and prevented
  partial diagnostic graph hints from becoming unapprovable knowledge children.
- The focused V2 end-to-end suite passes 12 tests across four files.
