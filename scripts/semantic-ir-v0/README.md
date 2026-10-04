# Semantic IR v0 qualification corpus

`semir-001-corpus.mjs` is the frozen, human-authored requirements corpus for Semantic IR v0. It intentionally describes source meaning dimensions rather than JSON or extraction rules. Every source is a non-confidential, authorized fixture; no provider output contributed to it.

Run `node scripts/semantic-ir-v0/check-semir-001-corpus.mjs` to verify stable IDs, required source metadata, disposition/context classification, coverage mappings, all mandatory A–E contrast members, the nested possible-obligation case, three multi-proposition cases, and a valid `needs_review` boundary.

The coverage object maps the §13 families directly to case IDs. Discourse role is represented as an expectation dimension so it stays independent of source disposition. Context-dependent cases deliberately retain unresolved meaning and do not attempt context retrieval. This directory contains neither a schema nor extraction logic, so later tickets may consume the corpus without inheriting production or provider behavior.
