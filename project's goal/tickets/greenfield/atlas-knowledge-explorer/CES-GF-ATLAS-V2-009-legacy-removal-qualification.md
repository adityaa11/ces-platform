# CES-GF-ATLAS-V2-009 - Legacy Removal and Qualification

**Status:** Implemented
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
- Text-PDF and scanned-PDF browser qualification proves page navigation,
  accurate highlights, evidence-card synchronization, range loading, and the
  explicit no-coordinate fallback.
- Completion is prohibited while a v1 fallback or parallel route remains.
- Every entry in the ATLAS-V2-000 rewrite/delete ledger is closed.

## Completion Evidence

ATLAS-V2-009A through ATLAS-V2-009F are implemented and separately committed.
The final clean-install, full-test, typecheck, production-build, architecture,
security, determinism, browser, approval, and zero-legacy-ledger gates pass.

## Required execution tickets

Execute and commit these in order. This parent ticket closes only after all six
are complete:

1. [ATLAS-V2-009A](CES-GF-ATLAS-V2-009A-runtime-surface-removal.md) — remove V1 UI and Bridge surfaces.
2. [ATLAS-V2-009B](CES-GF-ATLAS-V2-009B-cli-package-retirement.md) — remove legacy CLI assembly and retired packages.
3. [ATLAS-V2-009C](CES-GF-ATLAS-V2-009C-qualification-fixtures.md) — establish golden and generic qualification fixtures.
4. [ATLAS-V2-009D](CES-GF-ATLAS-V2-009D-end-to-end-qualification.md) — qualify the full V2 path.
5. [ATLAS-V2-009E](CES-GF-ATLAS-V2-009E-pdf-browser-qualification.md) — qualify PDF evidence behavior.
6. [ATLAS-V2-009F](CES-GF-ATLAS-V2-009F-final-gates-ledger-closure.md) — run final gates and close the ledger.
