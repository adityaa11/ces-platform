# Atlas Docling Graph Semantic Feasibility Spike

- **State:** `awaiting_review`
- **Ticket prefix:** `DOCGRAPH`
- **Implementation context:** [Atlas Docling Graph Semantic Feasibility Spike](../../atlas-docling-graph-semantic-feasibility-spike-implementation-context.md)
- **Predecessor evidence:** DOCSPIKE-001 is CK-resolved in [DOCSPIKE-BATCH-01 verification](../../../feedback/DOCSPIKE-BATCH-01-2ca2c18-verification.md).

## Purpose

This set contains exactly one bounded experiment. It determines whether Docling Graph 1.9.1, through a local `numind/NuExtract-2.0-2B` execution path, can propose Atlas semantic extraction and reconciliation structure from the proven local Docling perception output while Atlas retains final semantic-contract authority.

```text
repository PRD -> proven local perception -> NormalizedDocument v1
               -> deterministic source serialization -> local Docling Graph proposal
               -> Atlas-owned finalizers -> existing semantic v1 parsers
```

It is not a production provider migration, service, worker, route, database, graph-store, semantic-v2, or BSS-V2-004 change. A successful experiment supports later architecture planning only.

## Delivery order

| Order | Ticket | Review batch | Dependencies | Bounded review question |
| ---: | --- | --- | --- | --- |
| 1 | [DOCGRAPH-001](DOCGRAPH-001-docling-graph-semantic-feasibility.md) | `DOCGRAPH-BATCH-01` | CK-resolved DOCSPIKE-001 perception evidence; unchanged current semantic v1 parsers/contracts; BSS-V2-004 remains independently blocked | Can the entire local experiment produce source-grounded, fully accounted semantic results that validate through unchanged Atlas extraction and reconciliation parsers? |

## Execution and review controls

Keep the ticket `planned` until explicit `go` authorization. GO runs all frozen rows to one terminal `PASS`, `PASS_WITH_LIMITS`, `FAIL`, or `ENVIRONMENT_BLOCKED`; it may repair only spike-local implementation/evidence defects and must not short-stop after setup or a single model call. CK reviews the frozen review contract only and does not authorize integration. CFC is limited to frozen spike defects. HMN is required for a contract, authority, model-target, production-routing, persistence, or source-truth decision outside the ticket.

Use a repo-local `.venv-docling-graph/` with pinned dependencies. Keep generated source-derived artifacts beneath ignored `.atlas-data/docling-graph-spike/`; never commit model weights, caches, raw debug dumps, global-environment files, credentials, or source material. The report is the committed evidence summary.

## Completion

The set completes only after one terminal classification is supported by the complete runner: local micro-smoke, deterministic serialization, controlled extraction and reconciliation fixtures, all three real-document extractions, real Atlas parser validation, Safara rerun characterization, graph/provenance/resource observations, affected tests, `git diff --check`, and the feasibility report. `PASS` or `PASS_WITH_LIMITS` does not activate Docling Graph or authorize a later architecture shape.
