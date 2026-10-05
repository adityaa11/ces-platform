# SEM-ANM-PROMPT-002-BATCH-02 CK review — `cb84f7a`

- **Ticket:** `SEM-ANM-PROMPT-002-02` — Deterministic extraction-prompt compiler
- **Batch:** `SEM-ANM-PROMPT-002-BATCH-02`
- **Reviewed checkpoint:** `cb84f7aac2c9715eadf5f820696415914da5a97a` — `feat: compile deterministic Anoman extraction prompt`
- **Review-target record:** `project's goal/feedback/SEM-ANM-PROMPT-002-BATCH-02-go-checkpoint.md`; it explicitly binds this commit as the review target.
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Anoman_Spike_Phase/SEM-ANM-PROMPT-002-02-deterministic-extraction-prompt-compiler.md`
- **Incorporated context and source:** `project's goal/Backend_Phase/SEM-ANM-PROMPT-002-trimmed-v2-implementation-context.md` and the frozen Zod reference; both are present and unchanged at the reviewed checkpoint.
- **Implementer checkpoint:** `project's goal/feedback/SEM-ANM-PROMPT-002-BATCH-02-go-checkpoint.md`
- **Review type:** first CK review
- **Result:** `PASS`

## Review target and evidence

The ticket is `awaiting_review`. The recorded target exists and is an ancestor of `HEAD`; the subsequent commit only binds the review target in the GO checkpoint. The reviewed implementation and ticket paths have no working-tree changes. Other workspace changes do not overlap the target, so the named commit is unambiguous.

Executed validation:

- `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt002/generate.mts` — PASS twice consecutively. Both runs produced reference SHA-256 `67cd0908c634271871df4a6ca8a440b46d188c76f56e9ab3702073d193a2c083`, provider-schema SHA-256 `c478bdf27be6fcf56c999ad2f1780be6de126aecc20d1503f2277867e3b8c14b`, and prompt SHA-256 `80935e3f64f77a0569ff91e30ce7c7d7d08d1c78747dbbee304c28de88a538c5`.
- `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt002/prompt-compiler.test.mts` — PASS; the deterministic coverage, provenance, policy, reconciliation-exclusion, and fail-closed schema cases passed.
- `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt002/test.mts` — PASS; PROMPT-002-01 reference integrity and provider-schema projection remain valid with the expected hashes.
- `git diff --check cb84f7aac2c9715eadf5f820696415914da5a97a^ cb84f7aac2c9715eadf5f820696415914da5a97a` — PASS.

Inspection confirmed that provider schema conversion uses public `z.toJSONSchema(...)`; the compiler resolves local references, traverses schema descriptions, and fails clearly for unsupported forms, missing descriptions, broken references, and cycles. The generated prompt carries all 16 frozen kinds, `candidate`/`non_fact`, the primary-kind/overlapping-facets principle, and the orthogonal `unresolved`/`needs_resolution` distinction. Fixed prompt sections match the wording in context §§8.1–8.8. The provenance artifact maps generated semantic sections to schema properties, exact descriptions, and ownership. Reconciliation definitions are excluded; the relationship description's incidental contrast is allowed by context §10. No provider call, finalizer, reconciliation integration, or production coupling was introduced. The committed change is bounded to the ticket, checkpoint, compiler, fixed sections, generator, tests, and generated artifacts.

## Review Contract disposition

| Row | Disposition | Review evidence |
| --- | --- | --- |
| `RC-PROMPT2-02-001` | **PROVEN** | Compiler renders output shape and semantic sections from the converted schema/descriptions; provenance and exact-description tests demonstrate Zod ownership. |
| `RC-PROMPT2-02-002` | **PROVEN** | The generated prompt and test assert the exact 16 kinds and `candidate`/`non_fact`; no PROMPT-001 three-kind fallback is present. |
| `RC-PROMPT2-02-003` | **PROVEN** | The generated kind description preserves primary role and overlapping facets; the test checks overlap language and excludes the legacy three-kind form. |
| `RC-PROMPT2-02-004` | **PROVEN** | Frozen descriptions and assertions preserve `unresolved` versus `needs_resolution`, including a specific kind with `needs_resolution=true`. |
| `RC-PROMPT2-02-005` | **PROVEN** | Static role, task, reference, candidate-splitting, conflict, general, accounting, and output rules match the frozen context; required policy assertions pass. |
| `RC-PROMPT2-02-006` | **PROVEN** | Compiler consumes the extraction schema only; test checks reconciliation definitions and relationship schema fields are absent from extraction output. |
| `RC-PROMPT2-02-007` | **PROVEN** | Provenance includes generated section, source property, exact source descriptions, and static-versus-Zod ownership; the suite checks trace text appears in generated sections. |
| `SR-PROMPT2-02-IB-01` | **PROVEN** | Generator verifies the frozen reference hash; output remains derived and has no truth authority. |
| `SR-PROMPT2-02-TB-01` | **PROVEN** | Implementation and executed commands are offline; no provider client or model call is in the bounded diff. |
| `SR-PROMPT2-02-ID-01` | **PROVEN** | Generated provenance and traceability assertions attribute semantic content to its Zod property and description. |
| `SR-PROMPT2-02-ES-01` | **PROVEN** | Schema conversion, fixed policy, compiler, generator, and provenance are inspectable bounded seams. |
| `SR-PROMPT2-02-PC-01` | **PROVEN** | Frozen reference integrity, schema-driven rendering, reconciliation exclusion, and offline scope are verified. |
| `SR-PROMPT2-02-VS-01` | **PROVEN** | Fixed wording and semantic distinctions are asserted; reconciliation exclusion and deterministic rendering passed. |
| `SR-PROMPT2-02-UP-01` | **NOT_APPLICABLE** | Ticket and parent context leave provider governance, retention, and route qualification unresolved and outside this offline ticket. |
| `SR-PROMPT2-02-RB-01` | **PROVEN** | Dependency/diff inspection, fixed-section output, reference hash, and absence of provider execution confirm the offline derived-artifact boundary. |
| `SR-PROMPT2-02-RB-02` | **PROVEN** | Provenance, traversal tests, and reconciliation-exclusion checks demonstrate traceability and the approved extraction boundary. |

## Findings

None. All applicable ticket-derived Review Contract rows are proven; the provider-governance row is explicitly not applicable to this offline ticket.

## Frozen Finding Closure Matrix

No findings were issued; there are no remediation clauses or closure oracles to freeze.

## Separate scope-change observations

None. No unresolved product, policy, architecture, dependency, or deployment decision prevents a ticket-based review.

## Decision

`PASS`. The committed checkpoint satisfies the frozen `SEM-ANM-PROMPT-002-02` requirements and explicit review obligations. This CK result applies only to `SEM-ANM-PROMPT-002-BATCH-02`; ticket `-03` remains outside this review.
