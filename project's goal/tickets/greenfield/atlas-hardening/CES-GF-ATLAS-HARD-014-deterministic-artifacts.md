# CES-GF-ATLAS-HARD-014 — Deterministic Artifacts

**Stage:** Atlas hardening publication
**Status:** Planned

## Objective

Make all semantic, graph, coverage, finding, decision, and report artifacts
byte-stable for identical accepted inputs and pinned configuration.

## Dependencies

- ATLAS-HARD-009 through ATLAS-HARD-013.
- Completed DAPE-008 deterministic CLI and regression foundation.

## Work

- Define canonical key, array, newline, whitespace, numeric, and serialization
  ordering for every hardening artifact.
- Isolate timestamps and operational data in run metadata.
- Pin Atlas/contract/parser/prompt/provider/model/configuration revisions and
  input hashes.
- Add semantic hashes, cross-artifact identity checks, atomic staging, and
  golden regression fixtures.
- Ensure reports and Mermaid projections do not introduce nondeterminism.

## Outputs

Complete extraction and approval artifact suites, `run-manifest.json`, hashes,
and regression evidence.

## Acceptance criteria

- [ ] Equivalent accepted inputs produce byte-identical semantic artifacts.
- [ ] Current timestamps never appear in semantic content.
- [ ] All arrays, graph nodes, edges, findings, and decisions have stable order.
- [ ] Every artifact resolves to one pinned model/source/configuration revision.
- [ ] Semantic drift changes a reviewed regression hash.
- [ ] Failed runs publish no partial artifact set.

## Tests and evidence

Repeated runs, permuted provider output, locale/timezone variation, newline
variation, changed configuration, changed source, atomic interruption, and
golden hash fixtures.

## Out of scope

Guaranteeing that nondeterministic providers return identical raw text.
