# Atlas Docling Graph Semantic Feasibility Spikes

- **State:** `awaiting_review`
- **Ticket prefix:** `DOCGRAPH`
- **Implementation context:** [Atlas Docling Graph Semantic Feasibility Spike](../../atlas-docling-graph-semantic-feasibility-spike-implementation-context.md)
- **Predecessor evidence:** DOCSPIKE-001 is CK-resolved in [DOCSPIKE-BATCH-01 verification](../../../feedback/DOCSPIKE-BATCH-01-2ca2c18-verification.md).

## Purpose

This set contains bounded, independent experiments. DOCGRAPH-001 is terminal
`FAIL` for its local VLM/NuExtract path and is closed. DOCGRAPH-002 tests only
the distinct local LLM/Ollama/Qwen inference path; it inherits the proven
serializer, fixtures, transport, finalizers, contracts, and boundaries rather
than re-opening DOCGRAPH-001 or creating another methodology.

```text
repository PRD -> proven local perception -> NormalizedDocument v1
               -> deterministic source serialization -> local Docling Graph proposal
               -> Atlas-owned finalizers -> existing semantic v1 parsers
```

It is not a production provider migration, service, worker, route, database, graph-store, semantic-v2, or BSS-V2-004 change. A successful experiment supports later architecture planning only.

## Delivery order

| Order | Ticket | Review batch | Dependencies | Bounded review question |
| ---: | --- | --- | --- | --- |
| 1 | [DOCGRAPH-001](DOCGRAPH-001-docling-graph-semantic-feasibility.md) | `DOCGRAPH-BATCH-01` | CK-resolved DOCSPIKE-001 perception evidence; unchanged current semantic v1 parsers/contracts; BSS-V2-004 remains independently blocked | **Terminal FAIL:** the CUDA-local NuExtract proposal omitted all 11 required source dispositions. This result is closed and may not be remediated or re-opened. |
| 2 | [DOCGRAPH-002](DOCGRAPH-002-docling-graph-local-llm-semantic-feasibility.md) | `DOCGRAPH-BATCH-02` | DOCGRAPH-001 terminal report/HMN evidence; accepted DOCSPIKE-001 perception baseline; unchanged current semantic v1 parsers/contracts | Can the official Docling Graph local LLM backend, constrained to Ollama `qwen3:4b` on the RTX 4050, produce source-grounded, fully accounted proposals through the same unchanged Atlas finalizers? |

## Execution and review controls

Keep each ticket `planned` until explicit `go` authorization. GO runs all frozen rows to one terminal `PASS`, `PASS_WITH_LIMITS`, `FAIL`, or `ENVIRONMENT_BLOCKED`; it may repair only spike-local implementation/evidence defects and must not short-stop after setup or a single model call. DOCGRAPH-002 first runs its controlled extraction gate; a semantic failure there is terminal `FAIL` and prohibits the real PRD and reconciliation rows. CK reviews the frozen review contract only and does not authorize integration. CFC is limited to frozen spike defects. HMN is required for a contract, authority, model-target, production-routing, persistence, or source-truth decision outside the ticket.

Use a repo-local `.venv-docling-graph/` with pinned dependencies. Keep generated source-derived artifacts beneath ignored `.atlas-data/docling-graph-spike/`; never commit model weights, caches, raw debug dumps, global-environment files, credentials, or source material. The report is the committed evidence summary.

## Completion

The set completes only after one terminal classification is supported by the complete runner: local micro-smoke, deterministic serialization, controlled extraction and reconciliation fixtures, all three real-document extractions, real Atlas parser validation, Safara rerun characterization, graph/provenance/resource observations, affected tests, `git diff --check`, and the feasibility report. `PASS` or `PASS_WITH_LIMITS` does not activate Docling Graph or authorize a later architecture shape.
