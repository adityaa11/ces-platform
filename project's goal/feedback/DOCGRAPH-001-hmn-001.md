# HMN Authorization: DOCGRAPH-001

Ticket: DOCGRAPH-001
Batch: DOCGRAPH-BATCH-01
HMN authorization ID: HMN-DOCGRAPH-001-001
Invocation: explicit user `hmn` delegation
Current workflow state: initial GO experiment incomplete; CPU execution path closed; CUDA-gated continuation pending

Frozen ticket reference: `project's goal/Backend_Phase/tickets/Docling_Graph_Phase/DOCGRAPH-001-docling-graph-semantic-feasibility.md`
Current HEAD: `aa4cf9aa8b4f4e9305957edde90f4b695a3aff83`
Relevant GO commit: `aa4cf9a` (`docs(docgraph): record environment-blocked feasibility checkpoint`)
Relevant CK artifact: none for DOCGRAPH-001
Relevant CFC commit: none
Prior HMN authorization: none
Worktree state: pre-existing unrelated user changes and ignored local spike artifacts remain preserved; no production-scope changes authorized.

## Diagnosis

The controlled CPU fixture reached genuine local NuExtract inference after
verified environment/model loading, but took 1,538.544 seconds. The user has
explicitly directed that this performance-unacceptable execution mode stop.
The live process inspection found no remaining matching Python inference
subprocess, so there was no process to terminate at this HMN boundary.

The exact controlled-run evidence is retained in ignored
`.atlas-data/docling-graph-spike/fixture/run-7/metrics.json`: Python 3.13.16,
Docling 2.132.0, Docling Graph 1.9.1, complete cached
`numind/NuExtract-2.0-2B` revision
`5eb4a99746edc2ac44900f56a5c9431d3c03b16d`, successful local model loading,
local inference start/completion, `device: cpu`, and no external inference
calls. Its empty proposal is not semantic evidence.

The host has an NVIDIA GeForce RTX 4050 Laptop GPU, while the isolated Python
currently exposes CPU-only Torch and cannot yet execute CUDA. That condition
is a preflight blocker, not permission to rerun on CPU or use hosted
inference.

After the initial process inspection, a separate CPU-only full-Safara runner
was observed from `C:\venvs\docgraph`, outside this authorization's controlled
fixture scope and without `--require-cuda`. Its two inference processes (PIDs
32220 and 11376) were stopped. It is excluded from the evidence set.

## Ticket-authority trace

- RC-DOCGRAPH-001-02 requires local NuExtract-2.0-2B execution with no hosted
  inference; the frozen ticket permits the local isolated execution path and
  forbids remote fallback.
- RC-DOCGRAPH-001-04 and RC-DOCGRAPH-001-07 require the real existing Atlas
  extraction and reconciliation finalizers/parsers; neither contract nor
  finalizer may change for the follow-up.
- RC-DOCGRAPH-001-10 requires a truthful non-production report. The updated
  report records the CPU observation without treating it as semantic proof.

## Decision

`RETURN_TO_GO` — no committed complete implementation checkpoint or CK finding
exists for DOCGRAPH-001. The user supplied the bounded continuation direction:
same controlled fixture on the local RTX 4050 through CUDA. This is an
execution-mode continuation within the frozen local-only model target, not a
new semantic contract, provider choice, or production decision.

## Authorized scope

Prepare and perform one CUDA-gated controlled extraction-fixture experiment
only after the isolated environment's CUDA preflight proves it can see the RTX
4050. Use exactly `numind/NuExtract-2.0-2B`, the same serialized fixture,
transport, templates, finalizers, and unchanged Atlas semantic-v1 validation.
Use `run_vlm.py --require-cuda`; it must fail closed rather than use CPU.

## Required validation

Record the CUDA/Torch device preflight, exact model cache revision, source and
transport hashes, local-only provider evidence, latency, and the existing
Atlas finalizer/parser result for the same controlled fixture. Preserve the
CPU run as performance evidence only; do not compare semantic feasibility
until the CUDA result has the ticket-required finalization evidence.

## Forbidden work

No CPU retry, hosted inference, model substitution, semantic-v1 modification,
finalizer/transport/fixture alteration, production route/worker/queue/database
change, or semantic `PASS`/`FAIL` claim from the CPU run. Do not reopen
DOCSPIKE-001 or alter BSS-V2-004.

## Handoff

Expected next command: `go` for the CUDA-gated controlled fixture only, after
the isolated environment has a CUDA-capable Torch runtime. If CUDA preflight
cannot be satisfied, record the environment boundary and return to human
planning authority; do not fall back to CPU.

## Execution outcome

The specified CUDA environment subsequently passed preflight and ran the exact
controlled fixture with `--require-cuda`: Torch 2.14.1+cu126, CUDA 12.6, and
RTX 4050. Local inference completed in 20.677 seconds with the frozen model,
cache revision, fixture, and transport, and without external inference.

The model returned no candidates, source dispositions, or questions for the
fixture's eleven authorized source units. The frozen finalizer cannot supply
the missing accounting without semantic invention. The authorized continuation
therefore ends at terminal `FAIL`; the PRD and reconciliation matrix was not
started, and no CPU fallback occurred.
