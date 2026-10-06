# DOCGRAPH-001: Docling Graph local semantic feasibility

**Ticket:** DOCGRAPH-001
**Review batch:** DOCGRAPH-BATCH-01
**Ticket state:** awaiting_review
**Date:** 2026-10-02

## Result

`DOCGRAPH-001 RESULT: FAIL`

The earlier isolated-environment setup blocker was subsequently cleared. The
CPU attempt is retained only as a performance observation: it took 1,538.544
seconds for the controlled extraction fixture and is performance-unacceptable.
The terminal `FAIL` classification is based exclusively on the later CUDA
fixture: local inference completed in 20.677 seconds but returned an empty
proposal for all eleven authorized source units. That cannot be finalized
honestly through unchanged Atlas semantic v1 source accounting.

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

Those earlier recovery observations are retained as history. They no longer
describe the current environment: the isolated environment now imports the
frozen Docling and Docling Graph versions, loads the complete local model
cache, and has started local inference. The current limiting condition is CPU
performance, followed by the need for a CUDA-capable Torch runtime.

## Model, locality, and security boundaries

- Required model: `numind/NuExtract-2.0-2B` (complete local cache verified;
  not substituted).
- CPU execution occurred once on the controlled fixture; future inference is
  CUDA-gated and may not fall back to CPU.
- External inference calls: none.
- No PRD content was sent to a remote service.
- Atlas semantic v1 changed: no.
- Production routes changed: no.
- BSS-V2-004 state changed: no.

## CPU execution boundary and CUDA continuation

The most recent controlled fixture invocation (`fixture/run-7`) used the
unchanged local transport with SHA-256
`9a78e278140b548e66cd55b259f113a334a52163fa0cfb0c5c40597eefd74035`.
Its ignored `metrics.json` records Python 3.13.16, Docling 2.132.0, Docling
Graph 1.9.1, local `numind/NuExtract-2.0-2B` cache snapshot
`5eb4a99746edc2ac44900f56a5c9431d3c03b16d`, provider
`docling-graph-vlm-local`, no external inference calls, and `device: cpu`.
The model-load portion completed in 0.001 seconds; local inference completed
only after 1,538.544 seconds. The returned empty proposal is retained only as
an aborted performance observation and is not sent to Atlas finalizers or used
for semantic evaluation.

At the HMN boundary, no matching Python inference subprocess remained in the
live process table. Therefore no termination signal was sent; the CPU path is
nevertheless closed and must not be retried. The host exposes an NVIDIA
GeForce RTX 4050 Laptop GPU (6,141 MiB, driver 561.00), but both the isolated
environment and explicit Python currently report CPU-only Torch 2.14.1 and
`torch.cuda.is_available() == false`. CUDA semantic inference is consequently
not runnable until the isolated environment has a CUDA-capable Torch runtime.

After that boundary, a separate unapproved CPU process was detected running
`C:\venvs\docgraph\Scripts\python.exe -u ...run_vlm.py` against the full
Safara serialized input (not the controlled fixture and without
`--require-cuda`). Its inference child had accumulated roughly 1,500 CPU
seconds and 6.6 GB resident memory. Both exact inference PIDs (32220 and
11376) were forcibly stopped. This second process produces no admissible
DOCGRAPH-001 semantic evidence.

The runner now supports `--require-cuda`, which fails before model loading if
CUDA is unavailable and expressly forbids CPU fallback. The next bounded
experiment must use the same `fixture/serialized.json`, model/cache revision,
PDF transport, extraction template, Atlas finalizers, and unchanged semantic
v1 validation, invoking:

```powershell
.\.venv-docling-graph\Scripts\python.exe scripts\docling-graph-spike\run_vlm.py --require-cuda --source .atlas-data\docling-graph-spike\fixture\serialized.json --output .atlas-data\docling-graph-spike\fixture\cuda-run-1
```

The CUDA preflight must first demonstrate `torch.cuda.is_available() == true`
and identify the RTX 4050. It remains local-only: no hosted inference,
semantic-contract change, or changed finalizer is permitted.

## CUDA controlled-fixture result

The qualified `C:\venvs\docgraph\Scripts\python.exe` environment reported
`torch==2.14.1+cu126`, CUDA 12.6, `torch.cuda.is_available() == true`, and
`NVIDIA GeForce RTX 4050 Laptop GPU`. Running the frozen
`fixture/serialized.json` through `run_vlm.py --require-cuda` completed with
`device: cuda`, the same NuExtract cache revision, the same transport SHA-256
(`9a78e278140b548e66cd55b259f113a334a52163fa0cfb0c5c40597eefd74035`), no
external inference calls, and 20.677 seconds total inference time.

The resulting `proposal.json` has zero candidates, zero source dispositions,
and zero questions, while the frozen fixture has eleven non-empty authorized
source units. The unchanged extraction finalizer has a hard pre-parser check:
it rejects a proposal when the source-disposition count differs from the
serialized-source count. The empty output therefore cannot be completed
without inventing eleven classifications, which this ticket forbids.
Transient `tsx` execution was blocked by a missing `esbuild` dependency; that
toolchain observation does not authorize a substitute parser or change the
deterministic source-accounting failure.

Because the controlled semantic fixture fails, expansion to Safara, Finance,
Readiness, rerun, and reconciliation scenarios is not authorized. No CPU
fallback occurred.

## Baseline and parser boundary

DOCSPIKE-001's CK verification records the local perception baseline as PASS.
Its existing ignored normalized Safara artifact remains available and was
inspected only to confirm the current source-unit shape. The real existing
`parseSemanticExtractionResult(...)` and
`parseSemanticReconciliationResult(...)` functions remain the intended
finalization boundary; no Python clone or weaker contract was introduced.

## Required experiment rows not run

The CUDA controlled fixture is the terminal semantic failure boundary. No PRD
run, Safara rerun, reconciliation, graph/provenance evaluation, or related
semantic validation was run after the fixture failure, because it cannot repair
complete source accounting without changing the frozen semantic contract.

## Limits and next planning recommendation

Do not adopt this local model path for Atlas semantic work. A future planning
decision may diagnose the spike template/backend behavior or compare an
authorized alternative, but must not treat the empty CUDA output as useful
semantic evidence, weaken semantic v1, or use hosted inference as a workaround.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / observation | Status |
| --- | --- | --- | --- |
| RC-DOCGRAPH-001-01 | Isolated pinned Docling 2.132.0 and Docling Graph 1.9.1 import/run. | Isolated Python 3.13.16 imports Docling 2.132.0 and Docling Graph 1.9.1; prior Windows lock evidence is historical only. | PROVEN |
| RC-DOCGRAPH-001-02 | Local NuExtract-2.0-2B smoke with no hosted inference. | CUDA 12.6 / RTX 4050 local run completed using the frozen cache and local provider with no external inference calls. | PROVEN |
| RC-DOCGRAPH-001-03 | Repeated deterministic serialization with exact source accounting. | The frozen fixture serialization is retained; its eleven source IDs make the empty output's accounting failure observable. | PROVEN |
| RC-DOCGRAPH-001-04 | Controlled extraction and real extraction-parser finalization. | CUDA proposal contains zero candidates/dispositions/questions for eleven authorized source units. The unchanged finalizer's mandatory disposition-count guard precludes honest finalization. | UNRESOLVED |
| RC-DOCGRAPH-001-05 | Three PRD runs and unchanged parser acceptance. | Not run: controlled extraction failed before expansion was authorized. | NOT_APPLICABLE |
| RC-DOCGRAPH-001-06 | Safara nine-anchor coverage report. | Not run: controlled extraction failed before expansion was authorized. | NOT_APPLICABLE |
| RC-DOCGRAPH-001-07 | Ten-type controlled reconciliation and real parser finalization. | Not run: controlled extraction failed before expansion was authorized. | NOT_APPLICABLE |
| RC-DOCGRAPH-001-08 | Equivalent Safara rerun determinism evidence. | Not run: controlled extraction failed before expansion was authorized. | NOT_APPLICABLE |
| RC-DOCGRAPH-001-09 | Graph/provenance assessment while Atlas evidence remains authoritative. | Not run: controlled extraction failed before expansion was authorized. | NOT_APPLICABLE |
| RC-DOCGRAPH-001-10 | Truthful non-production terminal report. | This report records the CUDA-local source-accounting failure, excludes CPU evidence from semantic judgment, and leaves production unchanged. | PROVEN |

Internal readiness: `READY_FOR_CK` for review of the terminal `FAIL`
classification. The model ran locally on CUDA at acceptable latency, but the
controlled fixture failed mandatory source accounting without a permitted
semantic repair.
