# SEM-ANM-PROMPT-003-BATCH-02 GO checkpoint

- **Ticket:** `SEM-ANM-PROMPT-003-02` — Differential generated artifacts and provenance
- **Batch:** `SEM-ANM-PROMPT-003-BATCH-02`
- **Ticket state:** `awaiting_review`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Anoman_Spike_Phase/SEM-ANM-PROMPT-003-02-differential-artifacts-and-provenance.md`
- **Implementation / review target:** recorded in the commit containing this checkpoint.

## GO checkpoint

- **GO status:** `READY_FOR_CK`; CK has not issued a result.
- **Scope:** Offline PROMPT-003 artifacts and exact structural differential evidence only.
- **Predecessor:** PROMPT-003-01 CK `PASS` at `8a30c1f65019540846fe61b809188c50641a6fd3`; PROMPT-002 remains its approved immutable authority.
- **Identities:** predecessor reference `67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083`; predecessor prompt `80935e3f64f77a0569ff91e30ce7c7d7d08d1c78747dbbee304c28de88a538c5`; predecessor/provider schema `c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b`; policy body `2f2e13a0cce0d0ad578718bb52e69d69abfbd9bb0d6dfb593ab6b010d930cb10`; generated prompt `da008b14342f9414f6c64fd2315379a82b3b7dcdc4263550d83fd795d6a82ed1`; generated provenance `90e9e3b6a6607dedd4c135c485dbfc9223741a6200be6bd28519d4bb7f4b5200`.

## Validation

| Command / observation | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt003/generate.mts` | PASS; regenerates the four bounded artifacts and rejects schema byte drift. |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt003/differential-artifacts.test.mts` | PASS; two builds and checked-in artifacts are byte-identical; exact structural restoration, provenance, frozen identities, fixture leakage, and reconciliation exclusion pass. |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt003/prompt-compiler.test.mts` | PASS; the predecessor compiler seam retains exact policy identity, placement, and input preservation. |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt002/prompt-compiler.test.mts` | PASS; immutable predecessor prompt/schema compiler behavior remains intact. |
| `git diff --check` | PASS; no whitespace error in the bounded implementation. |

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- | --- |
| `RC-PROMPT3-02-001` | Acceptance `RC-PROMPT3-02-001` | Emit prompt, unchanged schema, provenance, and hashes in the bounded directory. | `generate.mts` writes all four files; the differential harness reads and byte-compares each to a fresh deterministic build. | PROVEN |
| `RC-PROMPT3-02-002` | Acceptance `RC-PROMPT3-02-002` | Schema bytes equal PROMPT-002 and Zod reference retains its approved hash. | Generator compares schema bytes to PROMPT-002; the harness fixes the reference and schema SHA-256 values above. | PROVEN |
| `RC-PROMPT3-02-003` | Acceptance `RC-PROMPT3-02-003` | Removing only the cross-field section restores every PROMPT-002 provenance section and order exactly. | `differential-artifacts.test.mts` deep-compares the filtered PROMPT-003 sections against predecessor provenance, including all represented properties. | PROVEN |
| `RC-PROMPT3-02-004` | Acceptance `RC-PROMPT3-02-004` | Inspectable fixed-policy provenance gives title, ownership, source marker, and exact body. | The harness deep-compares the sole policy section to the frozen `CROSS-FIELD SEMANTIC COMPOSITION` / `STATIC_POLICY` record with `(fixed policy)` and exact body. | PROVEN |
| `RC-PROMPT3-02-005` | Acceptance `RC-PROMPT3-02-005` | Two builds are byte-identical; fixture leak, reconciliation, provider, repair, and predecessor-mutation exclusions pass. | Independent builds/check-in comparisons pass; fixture and reconciliation-description negatives pass; bounded paths contain only local generator/assertion logic and no predecessor changes. | PROVEN |
| `SR-PROMPT3-02-IB-01`, `SR-PROMPT3-02-ID-01`, `SR-PROMPT3-02-RB-01` | SecurityReadiness / review binding | Derived artifacts are attributable without changing predecessor authority. | Hash manifest links predecessor, generated, and policy identities; byte comparison and exact provenance restoration retain immutable predecessor evidence. | PROVEN |
| `SR-PROMPT3-02-ES-01`, `SR-PROMPT3-02-PC-01`, `SR-PROMPT3-02-VS-01`, `SR-PROMPT3-02-RB-02` | SecurityReadiness / review binding | Exact deterministic oracle, no heuristic or prohibited coupling, and inspectable provenance. | The structural deep-equality oracle, repeat-build byte checks, generated evidence, local-only bounded diff, and exclusion negatives pass. | PROVEN |
| `SR-PROMPT3-02-UP-01` | SecurityReadiness | No provider governance, credential, or production decision is made. | No environment, provider client, network, parser/finalizer, or production path was added or invoked. | PROVEN |

No applicable row is unresolved, implemented without proof, or blocked.

Internal readiness: READY_FOR_CK. This is not a self-issued CK `PASS`.
