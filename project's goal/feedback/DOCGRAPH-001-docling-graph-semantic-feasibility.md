# DOCGRAPH-001: Docling Graph local semantic feasibility

**Ticket:** DOCGRAPH-001
**Review batch:** DOCGRAPH-BATCH-01
**Ticket state:** awaiting_review
**Date:** 2026-10-02

## Result

`DOCGRAPH-001 RESULT: ENVIRONMENT_BLOCKED`

The required isolated Docling Graph environment could not be installed to an
importable state after the ticket-authorized recovery attempts. This result is
about the local setup only; it makes no claim about Docling Graph or
NuExtract-2.0-2B semantic quality.

## Scope and method

This GO checkpoint used the CK-resolved DOCSPIKE-001 perception evidence as
its input baseline and inspected the unchanged Atlas semantic-v1 parsers. No
perception mapper, semantic-v1 contract, production route, worker, queue,
database, provider configuration, or BSS-V2 state was changed.

The global Python installation was inspected only. The system `python` alias
points to the WindowsApps stub and is unusable, so the documented explicit
Python executable was used for the isolated environment.

## Environment and recovery history

| Attempt | Command/result |
| --- | --- |
| Global verification | `C:\\Users\\ASUS\\AppData\\Local\\Programs\\Python\\Python313\\python.exe --version` reported Python 3.13.16; importing `docling` reported 2.132.0. The global installation was not modified. |
| Initial isolated install | Created ignored `.venv-docling-graph` and installed the frozen `docling==2.132.0` plus `docling-graph[vlm]==1.9.1`. Pip reached package installation, then failed with `OSError: [WinError 32]` because `pylatexenc\\latexwalker\\__init__.py` was locked by another process. |
| Recovery retry | Re-ran the same pinned install in the same isolated environment after the lock attempt. It did not yield installed distributions. `pip show docling docling-graph` reported both absent and the required import failed with `ModuleNotFoundError: No module named 'docling'`. |
| Clean installer retry | Re-ran the exact pinned install with a fresh download path and no version/model substitution. The environment remained non-importable, with the same absent-distribution and import observations. |

The required `docling==2.132.0` and `docling-graph==1.9.1` import/version
smoke therefore never passed. Since that environment is a prerequisite for
the installed API inspection and mandatory local VLM path, the runner did not
attempt model acquisition, hosted inference, or any PRD semantic processing.

## Model, locality, and security boundaries

- Required model: `numind/NuExtract-2.0-2B` (not downloaded or substituted).
- Execution device: not applicable; the VLM backend could not be installed.
- External inference calls: none.
- No PRD content was sent to a remote service.
- Atlas semantic v1 changed: no.
- Production routes changed: no.
- BSS-V2-004 state changed: no.

## Baseline and parser boundary

DOCSPIKE-001's CK verification records the local perception baseline as PASS.
Its existing ignored normalized Safara artifact remains available and was
inspected only to confirm the current source-unit shape. The real existing
`parseSemanticExtractionResult(...)` and
`parseSemanticReconciliationResult(...)` functions remain the intended
finalization boundary; no Python clone or weaker contract was introduced.

## Required experiment rows not run

The environment failure prevented the required local NuExtract smoke,
deterministic graph-source serializer exercise, controlled extraction and
reconciliation fixtures, three PRD runs, Safara rerun, graph/provenance
evaluation, parser finalization runs, and related tests. They are not claimed
as passed, failed, or silently treated as non-fact evidence.

## Limits and next planning recommendation

Resolve the Windows file-lock/install failure in the isolated virtual
environment, then rerun this frozen ticket from its required environment
smoke through the full runner. Do not change the model target, use hosted
inference, or weaken semantic-v1 as a workaround.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / observation | Status |
| --- | --- | --- | --- |
| RC-DOCGRAPH-001-01 | Isolated pinned Docling 2.132.0 and Docling Graph 1.9.1 import/run. | Explicit Python is 3.13.16 and global Docling is 2.132.0 without mutation; isolated install repeatedly remained non-importable after WinError 32. | BLOCKED_ENVIRONMENT |
| RC-DOCGRAPH-001-02 | Local NuExtract-2.0-2B smoke with no hosted inference. | VLM backend unavailable because RC-01 environment did not import; no inference call occurred. | BLOCKED_ENVIRONMENT |
| RC-DOCGRAPH-001-03 | Repeated deterministic serialization with exact source accounting. | Not run; required spike environment unavailable. | BLOCKED_ENVIRONMENT |
| RC-DOCGRAPH-001-04 | Controlled extraction and real extraction-parser finalization. | Not run; required local model environment unavailable. | BLOCKED_ENVIRONMENT |
| RC-DOCGRAPH-001-05 | Three PRD runs and unchanged parser acceptance. | Not run; required local model environment unavailable. | BLOCKED_ENVIRONMENT |
| RC-DOCGRAPH-001-06 | Safara nine-anchor coverage report. | Not run; required local model environment unavailable. | BLOCKED_ENVIRONMENT |
| RC-DOCGRAPH-001-07 | Ten-type controlled reconciliation and real parser finalization. | Not run; required local model environment unavailable. | BLOCKED_ENVIRONMENT |
| RC-DOCGRAPH-001-08 | Equivalent Safara rerun determinism evidence. | Not run; required local model environment unavailable. | BLOCKED_ENVIRONMENT |
| RC-DOCGRAPH-001-09 | Graph/provenance assessment while Atlas evidence remains authoritative. | Not run; Docling Graph did not import. | BLOCKED_ENVIRONMENT |
| RC-DOCGRAPH-001-10 | Truthful non-production terminal report. | This report records the environment-only classification and unchanged state declarations. | PROVEN |

Internal readiness: `NOT_READY_FOR_CK` for a PASS/PASS_WITH_LIMITS/FAIL
semantic feasibility judgment. This is a completed `ENVIRONMENT_BLOCKED`
terminal GO classification; CK should verify the recorded setup evidence and
that no prohibited scope was changed.
