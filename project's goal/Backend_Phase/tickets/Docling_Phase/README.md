# Atlas Docling Perception Feasibility Spike

- **State:** `awaiting_review`
- **Ticket prefix:** `DOCSPIKE`
- **Implementation context:** [Atlas Docling Perception Feasibility Spike](../../atlas-docling-perception-feasibility-spike-implementation-context.md)
- **Relationship to existing work:** independent experiment beside BSS-V2; it does not alter BSS-V2-004's blocked structured-extraction/reconciliation qualification.

## Purpose

This set contains exactly one bounded experimental ticket. Its sole question is whether local Docling can process the repository's required PRD PDFs and be mapped deterministically through the existing Atlas perception normalization path without changing `NormalizedDocument v1` or activating a production route.

```text
repository PDF -> local Docling -> deterministic provider-shaped result
               -> existing normalizePerceptionResult(...) -> NormalizedDocument v1
```

This is neither a production provider migration nor a semantic-extraction, reconciliation, or OCR-service program. It creates no new durable service boundary, public endpoint, customer configuration, external-inference request, or source-of-truth store.

## Delivery order

| Order | Ticket | Review batch | Dependencies | Bounded review question |
| ---: | --- | --- | --- | --- |
| 1 | [DOCSPIKE-001](DOCSPIKE-001-docling-perception-feasibility.md) | `DOCSPIKE-BATCH-01` | Existing BSS-009 perception/normalization seam only; no BSS-V2 PASS gate | Does the complete local experiment produce an Atlas-valid, deterministic perception result for the required digital PDFs without fabricating source data or changing authority? |

The ticket is intentionally atomic: extraction, mapping, real Atlas normalization, repeated-run evidence, report, and terminal classification are one proof. Completing installation, a Markdown export, or one PDF is not a checkpoint and does not authorize a follow-on integration.

## Execution and review controls

Keep the ticket `planned` until an explicit `go` authorization. GO runs the entire experiment to a terminal `PASS`, `PASS_WITH_LIMITS`, or `FAIL`, then records the committed implementation and evidence before `awaiting_review`. CK checks whether the recorded evidence supports that classification; it does not review a production migration. CFC may repair only bounded spike implementation or evidence defects. HMN is required if progress would require a contract, authority, production-routing, or storage decision outside the frozen scope.

The preferred environment is an isolated local Python virtual environment under the spike implementation. Docling must not be added to root `pnpm` dependencies, the production Node runtime, or `docker-compose.yml`. If isolation requires Docker, use only a clearly spike-only local/loopback or Compose-network service and never use destructive Compose teardown.

Generated raw exports may contain source text. Keep them local under an ignored `.atlas-data/docling-spike/` path; commit only reproducible implementation material and the summarized report unless separately authorized.

## Completion

The set completes only when DOCSPIKE-001 has evidence for all three required digital PDFs, real Atlas normalization, primary-document determinism, the final capability matrix and historical comparison, and an honest terminal decision. A `PASS` may support later planning for a separate `DocumentPerceptionProvider` integration ticket; it does not activate or implement that route.
