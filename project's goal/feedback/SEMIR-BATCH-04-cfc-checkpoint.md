# CFC checkpoint: SEMIR-004 / SEMIR-BATCH-04

- **Ticket / batch:** `SEMIR-004` / `SEMIR-BATCH-04`
- **Remediated review:** `project's goal/feedback/SEMIR-BATCH-04-60b5f89-review.md`
- **Reviewed target:** `60b5f89eb0895ad2570de0ffee3cd5507e712fc0`
- **State:** `awaiting_review`
- **Authorization:** First bounded CFC pass for the consolidated `CHANGES_REQUIRED` review; no HMN authorization is required or consumed.

## CFC working progress view

| Frozen clause | Status | Closure evidence and frozen-oracle result |
| --- | --- | --- |
| `CK-001.a` | `PROVEN` | `scripts/semantic-ir-v0/check-semir-004-harness.mts` serializes the generated provider schema and asserts, then safely reports, descriptions for source slot/disposition, modality, unresolved aspect, and evidence constraints. The documented one-command harness exits 0 with 43 known-good, 19 semantic, and 3 accounting results. **Oracle passed.** |
| `CK-001.b` | `PROVEN` | The same fixture-safe report records `accounting.complete: true` for 43 parsed slots and a named `{ id, expectedDimension, observedStatus: "FAIL" }` outcome for all mutations. In particular it reports failures for `MUT-EVIDENCE-QUOTE-NOT-PRESENT`, `MUT-EVIDENCE-WRONG-SLOT`, `MUT-EVIDENCE-FOREIGN-CASE`, `MUT-ACCOUNTING-MISSING`, `MUT-ACCOUNTING-DUPLICATE`, and `MUT-ACCOUNTING-UNKNOWN`; it emits no source text or credentials. **Oracle passed.** |

## Commands and outcomes

```text
pnpm --filter @atlas/contracts exec jiti ../../scripts/semantic-ir-v0/check-semir-004-harness.mts  PASS
node scripts/semantic-ir-v0/check-semir-001-corpus.mjs                                           PASS
node scripts/semantic-ir-v0/check-semir-002-schema.mjs                                           PASS
node scripts/semantic-ir-v0/check-semir-003-oracle.mjs                                           PASS
pnpm --filter @atlas/contracts test                                                               PASS (11 tests)
git diff --check -- scripts/semantic-ir-v0/check-semir-004-harness.mts                          PASS
```

Direct regressions checked: the real `parseNormalizedDocument` v1 parser boundary, all 43 parsed-slot mappings, 19 semantic mutations, three accounting mutations, generated schema descriptions, contract tests, fixture safety, and zero provider calls. No schema semantics, normalizer, perception route, provider, persistence, worker, or production path changed.

## Review handoff

Internal readiness: READY_FOR_CK

This is one bounded remediation checkpoint for `CK-001.a` and `CK-001.b`. It does not issue `PASS`; CK must verify only the frozen clauses, this remediation diff, and direct regressions.
