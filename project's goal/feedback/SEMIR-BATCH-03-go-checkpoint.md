# GO checkpoint: SEMIR-003 / SEMIR-BATCH-03

- **Ticket / batch:** `SEMIR-003` / `SEMIR-BATCH-03`
- **Ticket authority:** `project's goal/Backend_Phase/tickets/IR_Test_Phase/SEMIR-003-deterministic-oracle-and-mutations.md`
- **Predecessor gates:** `SEMIR-001 PASS` (`SEMIR-BATCH-01-8e865a9-verification.md`); `SEMIR-002 PASS` (`SEMIR-BATCH-02-bac0cd7-verification.md`).
- **State:** `awaiting_review`
- **Provider calls:** `0`

## Bounded implementation

Added an isolated Semantic IR oracle, frozen-fixture materialization, and one offline qualification command under `scripts/semantic-ir-v0/`. The evaluator accepts an expected and an observed untrusted proposal, validates the schema boundary, then reports source disposition, discourse, proposition count, predicate, arguments, qualifiers, unresolved aspects, evidence, and corpus accounting as individual dimensions. It does not inspect a case ID to choose an answer, classify source text, repair a proposal, canonicalize vocabulary, persist anything, or invoke a provider.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / command | Status |
| --- | --- | --- | --- | --- |
| `RC-SEMIR-003-01` | Acceptance row 01 | Each frozen corpus case passes applicable, evidence-backed dimensions. | `scripts/semantic-ir-v0/check-semir-003-oracle.mjs` executes 43 frozen `8e865a9` fixtures; `node scripts/semantic-ir-v0/check-semir-003-oracle.mjs` exits 0. | `PROVEN` |
| `RC-SEMIR-003-02` | Acceptance row 02 | Surface-only variation passes while force, polarity, applicability, threshold/unresolved, and discourse changes fail. | The checker passes uppercase/whitespace predicate variation and rejects the named modality, polarity, applicability, unresolved, and discourse mutations. | `PROVEN` |
| `RC-SEMIR-003-03` | Acceptance row 03; context §36 | All required modality, polarity, applicability, unresolved, and discourse mutations fail on their named dimension. | Stable `MUT-*` manifest in `semir-003-fixtures.mjs`; checker asserts the exact failed dimension for 16 applicable mutations. | `PROVEN` |
| `RC-SEMIR-003-04` | Acceptance row 04; context §36 | Invalid quote, wrong/foreign slot, and missing/duplicate/unknown result fail deterministically. | Stable evidence/accounting `MUT-*` manifest; checker asserts each named failure dimension. | `PROVEN` |
| `RC-SEMIR-003-05` | Acceptance row 05; context §37 | Per-case diagnostics expose passing/failing dimensions and expected/observed values safely. | `evaluateSemanticResult` returns case ID plus dimension checks; fixtures contain only authorized non-confidential corpus text and no secrets. | `PROVEN` |
| `RC-SEMIR-003-06` | Acceptance row 06; Frozen scope | Offline, no repair/provider/production coupling; affected checks and whitespace check pass. | Isolated scripts only; qualification and SEMIR-001/002 regression commands pass; `git diff --check` passes. | `PROVEN` |
| `SR-003-IB-01` / `SR-003-PC-01` | Security readiness / `SR-003-RB-01` | Untrusted input cannot pass by repair or source-derived answer. | Structural validation precedes semantic comparison; the oracle compares supplied proposals only and mutations cannot pass through repair. | `PROVEN` |
| `SR-003-ES-01` / `SR-003-RB-02` | Security readiness | Structure, evidence, semantics, and accounting remain separately observable. | `structure`, `*.evidence`, semantic qualifier, and `accounting.*` diagnostic dimensions are independently asserted. | `PROVEN` |
| `SR-003-VS-01` / `SR-003-RB-03` | Security readiness | Stable mutation IDs and intended dimension-specific failures exist. | `MUT-*` entries and exact-dimension assertions in the offline checker. | `PROVEN` |
| `SR-003-UP-01` | Security readiness | No live-provider retention or policy is introduced. | No provider route, client, output artifact, or retention path changed. | `PROVEN` |

## Validation

```text
SEMIR-001 predecessor verification (recorded)
PASS: `SEMIR-BATCH-01-8e865a9-verification.md` records the frozen 43-case corpus checker passing. The current working-copy corpus is an unrelated pre-existing modification and was not used by this ticket.

node scripts/semantic-ir-v0/check-semir-002-schema.mjs
PASS: 43 frozen cases parse, structural negatives and schema descriptions verified, zero provider calls.

node scripts/semantic-ir-v0/check-semir-003-oracle.mjs
PASS: 43 frozen known-good fixtures passed; 19 semantic mutations and 3 accounting mutations failed on named dimensions; zero provider calls.

git diff --check
PASS
```

Internal readiness: READY_FOR_CK
