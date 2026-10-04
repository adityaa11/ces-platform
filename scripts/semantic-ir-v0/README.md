# Semantic IR v0 qualification corpus

`semir-001-corpus.mjs` is the frozen, human-authored requirements corpus for Semantic IR v0. It intentionally describes source meaning dimensions rather than JSON or extraction rules. Every source is a non-confidential, authorized fixture; no provider output contributed to it.

Run `node scripts/semantic-ir-v0/check-semir-001-corpus.mjs` to verify stable IDs, source metadata, proposition and source-grounded evidence expectations, every §13 member, A–E material contrast distinctions, the nested possible-obligation case, three multi-proposition cases, and a valid `needs_review` boundary.

The `coverage` object maps broad §13 families and `requiredMembers` maps every individual required member directly to stable case IDs. Discourse role is represented as an expectation dimension so it stays independent of source disposition. Context-dependent cases deliberately retain unresolved meaning and do not attempt context retrieval. This directory contains neither a schema nor extraction logic, so later tickets may consume the corpus without inheriting production or provider behavior.

## SEMIR-002 schema gate

`SEMIR-002` adds an isolated Zod proposal contract; parsing it only establishes structure and never truth, canonicalization, reconciliation, persistence, or production routing.

Run the SEMIR-002 offline schema gate with:

```sh
node scripts/semantic-ir-v0/check-semir-002-schema.mjs
```

The checker reads the frozen SEMIR-001 predecessor blob at commit `8e865a9`, rather than the shared working tree, so its 43-case mapping evidence stays anchored to the approved predecessor. It makes no provider call and does not emit provider data.

## SEMIR-003 semantic oracle

`SEMIR-003` compares independently materialized, untrusted Semantic IR proposals by semantic dimension. It keeps structural validation, evidence validation, semantic evaluation, and corpus-wide accounting separate. The oracle does not classify source text, repair a proposal, canonicalize vocabulary, or treat a case ID as an answer.

Run the complete offline qualification command with:

```sh
node scripts/semantic-ir-v0/check-semir-003-oracle.mjs
```

It evaluates all 43 frozen known-good fixtures, permits a surface-only predicate variation when every other dimension remains equal, and asserts the required modality, polarity, applicability, unresolved-meaning, discourse, evidence, and accounting corruptions fail on their named dimensions. No provider call or artifact emission occurs.

## SEMIR-004 real NormalizedDocument gate

Run the complete real-document qualification harness with:

```sh
pnpm --filter @atlas/contracts exec jiti ../../scripts/semantic-ir-v0/check-semir-004-harness.mts
```

The harness materializes only the approved frozen corpus text into a deterministic
`NormalizedDocument v1`, parses it with the repository's real
`parseNormalizedDocument` boundary, and derives the manifest slots from the
parsed blocks. It proves evidence grounding, exact accounting, semantic and
accounting mutations, and generated-schema descriptions, emitting only safe
fixture identifiers, a digest, and validation counts.
