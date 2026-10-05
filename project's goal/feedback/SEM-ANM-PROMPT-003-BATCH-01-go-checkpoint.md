# SEM-ANM-PROMPT-003-BATCH-01 GO checkpoint

- **Ticket:** `SEM-ANM-PROMPT-003-01` — Frozen cross-field policy and deterministic compiler insertion
- **Batch:** `SEM-ANM-PROMPT-003-BATCH-01`
- **Ticket state:** `awaiting_review`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Anoman_Spike_Phase/SEM-ANM-PROMPT-003-01-frozen-cross-field-policy-insertion.md`
- **Implementation / review target:** `8a30c1f65019540846fe61b809188c50641a6fd3` — `feat: insert frozen cross-field prompt policy`

## GO checkpoint

- **GO status:** `READY_FOR_CK`; CK has not issued a result.
- **Scope:** Offline compiler insertion and focused deterministic tests only.
- **Predecessor:** PROMPT-002 CK `PASS` at `e2ccb5b9529d641eca0136d73fd55f2e6e308739`, approved by `b49984c7b4fc2b9ea85b8de043cbc8338d4ac789`.
- **Frozen predecessor evidence:** Zod reference SHA-256 `67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083`; provider schema SHA-256 `c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b`; system-prompt SHA-256 `80935e3f64f77a0569ff91e30ce7c7d7d08d1c78747dbbee304c28de88a538c5`; provenance SHA-256 `27bb968c000d82897857f8076f7dfab1e04abaffcab2bed798c4fb8dc451f8c4`.
- **New frozen policy evidence:** §8 policy-body SHA-256 `2f2e13a0cce0d0ad578718bb52e69d69abfbd9bb0d6dfb593ab6b010d930cb10`; derived PROMPT-003 prompt SHA-256 `da008b14342f9414f6c64fd2315379a82b3b7dcdc4263550d83fd795d6a82ed1`.

## Validation

| Command / observation | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt002/test.mts` | PASS; frozen reference and provider-schema SHA-256 values match their approved predecessor values. |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt002/prompt-compiler.test.mts` | PASS; predecessor compiler still renders its accepted prompt/schema and validates the 16-kind boundary. |
| `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt003/prompt-compiler.test.mts` | PASS; policy-byte hash, exact single insertion, `STATIC_POLICY` ownership, adjacent questions/classification placement, provenance delta restoration, fixture-leak negatives, and two-build equality. |
| `git diff --check -- scripts/sem-anm-prompt002 scripts/sem-anm-prompt003` and `git diff --quiet -- scripts/sem-anm-prompt002` before commit | PASS; no PROMPT-002 tracked change or whitespace failure. |

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- | --- |
| `RC-PROMPT3-01-001` | Acceptance `RC-PROMPT3-01-001` | Consume PROMPT-002 as immutable input; source/artifact hashes pass and bounded diff changes no predecessor file. | The focused test reads the predecessor reference/schema and asserts their approved SHA-256 values. The compiler invokes `compileExtractionPrompt()` and consumes its structured provenance; validation recorded a clean PROMPT-002 diff. | PROVEN |
| `RC-PROMPT3-01-002` | Acceptance `RC-PROMPT3-01-002` | The title/body equal parent-context §8 byte-for-byte, appear once, and carry no S4 fixture/output leakage. | `cross-field-policy.mts` holds the exact frozen body; the test fixes its SHA-256, requires exactly one complete title/body occurrence, and rejects the concrete S4 source, S1–S4 labels, and Safara. | PROVEN |
| `RC-PROMPT3-01-003` | Acceptance `RC-PROMPT3-01-003` | The section is `STATIC_POLICY`, immediately after questions and immediately before source classification. | Structured-provenance assertions require the new section's owner/source attribution and contiguous `questions`, policy, `source-result-classification` IDs. | PROVEN |
| `RC-PROMPT3-01-004` | Acceptance `RC-PROMPT3-01-004` | Zod reference and provider schema remain at their approved byte hashes; no semantic definition changes. | PROMPT-002 integrity suite and focused test reproduce the approved reference/schema hashes. The bounded implementation changes only `scripts/sem-anm-prompt003/**` plus the ticket. | PROVEN |
| `RC-PROMPT3-01-005` | Acceptance `RC-PROMPT3-01-005` | No provider call/code, credential access, may/might/could heuristic, or response repair. | Changed-path inspection finds only an offline compiler, immutable policy constant, and local assertion harness. The focused test rejects the only prohibited heuristic pattern; all recorded commands are local. | PROVEN |
| `SR-PROMPT3-01-IB-01` | SecurityReadiness `SR-PROMPT3-01-IB-01` | Accepted prompt, Zod reference, schema, and provenance remain integrity inputs. | Approved hashes are recorded above; structured predecessor provenance is retained verbatim when the inserted section is removed. | PROVEN |
| `SR-PROMPT3-01-TB-01` | SecurityReadiness `SR-PROMPT3-01-TB-01` | Prompt construction is offline and separate from provider execution. | No provider client, network operation, credentials, or environment reads are present in the bounded diff; validation uses local `jiti` assertions only. | PROVEN |
| `SR-PROMPT3-01-ID-01` | SecurityReadiness `SR-PROMPT3-01-ID-01` | Preserve predecessor checkpoint/hashes plus reproducible policy identity and insertion provenance. | This checkpoint records predecessor approval/identities, the fixed policy digest, derived prompt digest, and focused provenance assertions. | PROVEN |
| `SR-PROMPT3-01-ES-01` | SecurityReadiness `SR-PROMPT3-01-ES-01` | Structured insertion and static-policy attribution are independently inspectable. | The compiler inserts a named provenance section from the predecessor sections, and the test asserts its ID, fixed-policy source, title, owner, body, and placement. | PROVEN |
| `SR-PROMPT3-01-PC-01` | SecurityReadiness `SR-PROMPT3-01-PC-01` | No coupling to Zod descriptions, provider schema, fixtures, heuristic repair, reconciliation, or production behavior. | Bounded-diff audit plus explicit fixture-leak and heuristic negatives; PROMPT-002 references and provider schema are integrity checked rather than modified. | PROVEN |
| `SR-PROMPT3-01-VS-01` | SecurityReadiness `SR-PROMPT3-01-VS-01` | Exact bytes, one occurrence, placement, predecessor hashes, and leakage negatives are deterministic. | The focused harness asserts each observation twice over two identical builds; all assertions passed. | PROVEN |
| `SR-PROMPT3-01-UP-01` | SecurityReadiness `SR-PROMPT3-01-UP-01` | Provider policy and live qualification remain unresolved. | No provider qualification, policy decision, or live call was attempted; this is an offline compiler-only checkpoint. | PROVEN |
| `SR-PROMPT3-01-RB-01` | Review binding `SR-PROMPT3-01-RB-01` | Accepted inputs remain unchanged and the new policy is attributable to frozen source. | Hash checks, bounded diff inspection, policy digest, and structured provenance assertions above. | PROVEN |
| `SR-PROMPT3-01-RB-02` | Review binding `SR-PROMPT3-01-RB-02` | Exactly one deterministic offline insertion has no fixture leak or semantic-repair seam. | Focused compiler test, two-build equality, negatives, generated prompt observation, and local-only changed-path audit. | PROVEN |

No applicable row is unresolved, implemented without proof, or blocked.

Internal readiness: READY_FOR_CK. This is not a self-issued CK `PASS`.
