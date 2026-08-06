# CES-GF-ATLAS-V2-009 - Legacy Removal and Qualification

**Status:** Planned  
**Depends on:** ATLAS-V2-000 through ATLAS-V2-008

## Outcome

Delete the superseded runtime paths and prove that only the recursive v2 system
can execute in production.

## Removal scope

- Workflow-only/focused-projection compiler paths and Mermaid artifact writers.
- V1 model-review workspace, detail-index, and fixed-tab contracts.
- V1 workspace/detail/detail-tab API readers and routes.
- Old static UI implementation and unused renderer dependencies.
- Duplicated CLI Atlas assembly.
- Tests and fixtures that require superseded artifacts or navigation.

## Qualification

- HARD-027 passes through the real CLI/provider/artifact/API/UI path.
- At least two non-Safara PRDs select different appropriate graph structures.
- No Safara labels or fixture topology appear in production compiler code.
- Import and artifact scans find no active v1 path.
- Production build, contract, browser, approval, determinism, and security gates
  pass.
- Completion is prohibited while a v1 fallback or parallel route remains.
- Every entry in the ATLAS-V2-000 rewrite/delete ledger is closed.
