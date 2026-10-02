# DOCGRAPH-002: Docling Graph local LLM semantic feasibility

**Ticket:** DOCGRAPH-002  
**Review batch:** DOCGRAPH-BATCH-02  
**Ticket state:** awaiting_review  
**Date:** 2026-10-02

## Result

`DOCGRAPH-002 RESULT: FAIL`

The frozen controlled semantic gate completed with the exact local Docling
Graph LLM/Ollama/Qwen target, but its proposal is not admissible under the
unchanged Atlas source-accounting contract. It supplied ten candidates, zero
source dispositions, and zero questions for eleven authorized source units. It
also changed authorized colon-delimited source IDs into unrecognized
hyphen-delimited strings (for example, `fixture-p1-text-actor`). The unchanged
Atlas finalizer rejected that first invalid source ID. Atlas cannot honestly
complete the missing 11 dispositions or repair identifiers without semantic
invention, so the fail-fast gate is terminal `FAIL`.

No Safara, Finance, Readiness, reconciliation, determinism, or graph/provenance
run was started.

## Frozen environment and locality evidence

- Python: `C:\venvs\docgraph\Scripts\python.exe`, Python 3.13.16.
- Docling: 2.132.0; Docling Graph: 1.9.1.
- Ollama: `C:\Users\ASUS\AppData\Local\Programs\Ollama\ollama.exe`, version
  0.35.0; local model `qwen3:4b`, digest `359d7dd4bcda`.
- Exact runner configuration: `backend=llm`, `inference=local`,
  `provider_override=ollama`, `model_override=qwen3:4b`, structured JSON
  transport enabled, and an explicit `http://127.0.0.1:11434` provider URL.
- Device: NVIDIA GeForce RTX 4050 Laptop GPU (6,141 MiB; driver 561.00).
  During an actual local `qwen3:4b` call, `ollama ps` reported `100% GPU`, a
  3.2 GB model allocation, and 4096 context; NVIDIA tooling observed Ollama's
  `llama-server.exe`. GPU execution is therefore proven; no CPU-only fallback
  occurred.
- Locality: the runner records `external_inference_calls: none`; no Gemini,
  Mistral, OpenAI, OpenRouter, hosted fallback, or remote PRD processing was
  configured or used.

## Controlled extraction evidence

The unchanged controlled serialization had 11 source units and SHA-256
`2ade8089eff04194af8bde3ce342e78d3fe5bc5f3f15996de162849d92d615f7`.
Docling Graph produced a Pydantic-shaped proposal in 130.313 seconds. Its
recorded provider diagnostics show structured output was attempted and did not
fall back; model reasoning text was not used as proposal data.

The proposal is nevertheless semantically unusable:

- `source_dispositions: []`, so mandatory complete source accounting is absent.
- Every candidate references an unauthorized normalized/hyphenated source ID
  instead of the fixture's authorized ID.
- The non-fact source was turned into a candidate; several candidate meanings
  are generic or contradict the corresponding source. These observations
  confirm that the missing accounting cannot be treated as a harmless shape
  omission.

The unchanged finalizer was then executed through the workspace `tsx` launcher
and the real `parseSemanticExtractionResult(...)` entrypoint. It failed closed
before parser acceptance with:

```text
Unknown candidate source ID: fixture-p1-text-actor
```

This is admissible failure evidence, not a reason to normalize model IDs or
invent dispositions. The real parser consequently did not receive a valid
final result, as required by the frozen gate.

## Bounded launcher remediation

The original root `pnpm exec tsx` command could not find `tsx`. The workspace
already supplies `tsx` through `@atlas/agents-bridge`; invoking that launcher
then exposed a module-resolution defect for spike scripts outside a workspace
package. The extraction finalizer import now explicitly references the existing
`packages/atlas-contracts/src/index.ts` export. No validation, accounting,
source identity, parser, or final-result logic changed. The rerun reached the
real extraction finalizer and produced the expected fail-closed rejection above.

## Scope declarations

- DOCGRAPH-001 terminal semantic result changed: no.
- Atlas semantic v1 changed: no.
- Production routes changed: no.
- BSS-V2-004 state changed: no.
- CPU fallback: no.

## Review Contract Closure

| Row | Required proof | Evidence / outcome | Status |
| --- | --- | --- | --- |
| RC-DOCGRAPH-002-01 | Exact qualified local LLM/Ollama path. | Python/Docling versions and `llm/local/ollama/qwen3:4b` configuration recorded. | PROVEN |
| RC-DOCGRAPH-002-02 | Local RTX 4050 inference with no CPU/hosted fallback. | Actual-call `ollama ps` reported `100% GPU`; NVIDIA observed `llama-server.exe`; loopback provider and no external calls recorded. | PROVEN |
| RC-DOCGRAPH-002-03 | Unchanged 11-unit serializer and locator identity. | Existing serialized fixture retained source count 11 and SHA-256 recorded above. | PROVEN |
| RC-DOCGRAPH-002-04 | Fully grounded, accounted controlled proposal finalizable through real parser. | Zero dispositions and unauthorized model source IDs; unchanged finalizer rejected `fixture-p1-text-actor`. | UNRESOLVED — terminal semantic gate FAIL |
| RC-DOCGRAPH-002-05 | Three PRD extractions through unchanged parser. | Not run; RC-004 terminal gate failure prohibits expansion. | NOT_APPLICABLE |
| RC-DOCGRAPH-002-06 | Safara nine-anchor assessment. | Not run; RC-004 terminal gate failure prohibits expansion. | NOT_APPLICABLE |
| RC-DOCGRAPH-002-07 | Controlled ten-type reconciliation through real parser. | Not run; RC-004 terminal gate failure prohibits expansion. | NOT_APPLICABLE |
| RC-DOCGRAPH-002-08 | Safara rerun/determinism. | Not run; RC-004 terminal gate failure prohibits expansion. | NOT_APPLICABLE |
| RC-DOCGRAPH-002-09 | Graph/provenance assessment. | Not run; RC-004 terminal gate failure prohibits expansion. | NOT_APPLICABLE |
| RC-DOCGRAPH-002-10 | Truthful terminal non-production report. | This report records the GPU-local gate failure, preserves all frozen boundaries, and leaves DOCGRAPH-001 closed. | PROVEN |

Internal readiness: `READY_FOR_CK` for review of the terminal `FAIL`
classification. The controlled gate reached the correct local GPU inference
path but failed semantic-v1 source accounting; no permitted remediation exists
within this frozen ticket.
