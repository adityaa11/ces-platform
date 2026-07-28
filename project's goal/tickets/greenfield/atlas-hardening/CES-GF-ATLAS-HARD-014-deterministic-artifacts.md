# CES-GF-ATLAS-HARD-014 — Deterministic Artifacts

**Stage:** Atlas hardening publication
**Status:** Implemented

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
- Define determinism over identical accepted provider results and pinned
  configuration. Raw stochastic provider calls are separately qualified and
  are not falsely claimed to rediscover identical semantics on every call.

## Outputs

Complete extraction and approval artifact suites, `run-manifest.json`, hashes,
and regression evidence.

## Acceptance criteria

- [x] Equivalent accepted inputs produce byte-identical semantic artifacts.
- [x] The determinism claim names accepted normalized provider output and pinned
      configuration as part of the input boundary.
- [x] Current timestamps never appear in semantic content.
- [x] All arrays, graph nodes, edges, findings, and decisions have stable order.
- [x] Every artifact resolves to one pinned model/source/configuration revision.
- [x] Semantic drift changes a reviewed regression hash.
- [x] Failed runs publish no partial artifact set.

## Tests and evidence

Repeated accepted-result runs, permuted equivalent provider output, distinct raw
provider results, locale/timezone variation, newline variation, changed
configuration, changed source, atomic interruption, and golden hash fixtures.

## Completion evidence

- Added the dependency-neutral `@company/ces-atlas-artifacts` package.
- Canonical semantic bytes and per-artifact/bundle hashes are isolated from the
  timestamped run manifest.
- Manifest pins Atlas, contract, provider, model, input, configuration, and
  proposal revisions.
- Atomic directory publication cleans failed staging output.
- Artifact and architecture tests passed; package typecheck passed.

## Out of scope

Guaranteeing that nondeterministic providers discover identical semantics or
return identical raw text on independent calls.
