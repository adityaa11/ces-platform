# SEMIR-001 GO checkpoint — semantic qualification corpus

- **State:** `awaiting_review`
- **Review batch:** `SEMIR-BATCH-01`
- **Authority:** `SEMIR-001`, SEMIR context §§7–17
- **Provider calls:** `0`

## Bounded change

Added an isolated human-authored corpus of 40 non-confidential authorized fixture sources, an ID/coverage/contrast validator, and its authoring guide. No schema, extraction heuristic, provider integration, production semantic contract, `NormalizedDocument v1`, canonical vocabulary, or reconciliation behavior changed.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / command | Status |
| --- | --- | --- | --- |
| RC-SEMIR-001-01 | 30+ stable, authorized human-authored cases with dimension expectations | `scripts/semantic-ir-v0/semir-001-corpus.mjs`; validator reports 40 | PROVEN |
| RC-SEMIR-001-02 | §13 coverage including explicit gaps/ambiguity | `coverage` mapping and validator | PROVEN |
| RC-SEMIR-001-03 | A–E material contrasts; nested possible obligation and missing applicability | cases 001–015; validator checks all members and 007 interpretation | PROVEN |
| RC-SEMIR-001-04 | Independent disposition/discourse cases | cases 035–039 and source dispositions | PROVEN |
| RC-SEMIR-001-05 | 3+ multi-proposition and explicit context classes | cases 023, 024, 034; all cases classify context | PROVEN |
| RC-SEMIR-001-06 | No architecture/provider/production decision; checks pass | isolated corpus-only paths; commands below | PROVEN |
| SR-001-RB-01 | Authorized safe fixture provenance and no-provider record | each case authorization; this checkpoint | PROVEN |
| SR-001-RB-02 | Semantic requirements, not hidden extraction or truth logic | corpus/code-path inspection; no parser/schema | PROVEN |
| SR-001-RB-03 | Deterministic coverage proof | corpus validator output | PROVEN |

Validation executed:

```text
node scripts/semantic-ir-v0/check-semir-001-corpus.mjs
git diff --check
```

Both commands passed. No external requests or provider calls were made.

Internal readiness: READY_FOR_CK
