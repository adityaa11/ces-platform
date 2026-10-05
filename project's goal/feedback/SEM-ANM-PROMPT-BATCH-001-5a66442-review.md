# SEM-ANM-PROMPT-BATCH-001 CK review — `5a66442`

- **Ticket:** `SEM-ANM-PROMPT-001` — Zod-driven semantic prompt builder
- **Batch:** `SEM-ANM-PROMPT-BATCH-001`
- **Reviewed checkpoint:** `5a664426bf85f4b3a4386ebdef60ee57bab09b89` — `feat: add Zod semantic prompt builder`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Anoman_Spike_Phase/SEM-ANM-PROMPT-001-zod-driven-semantic-prompt-builder.md`
- **Frozen incorporated context:** `project's goal/Backend_Phase/SEM-ANM-PROMPT-001-implementation-context.md`, present in the reviewed checkpoint
- **Implementer checkpoint:** `project's goal/feedback/SEM-ANM-PROMPT-001-zod-semantic-prompt-builder.md`
- **Review type:** first CK review
- **Result:** `CHANGES_REQUIRED`

## Review target and evidence

The ticket is `awaiting_review`. Its workflow record names the exact committed review target, and the referenced implementation context is frozen in that target. The current worktree contains unrelated changes, but no uncommitted change overlaps the reviewed ticket paths; review is limited to `5a66442`.

Executed validation:

`corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt001/test.mts` — PASS; it reported deterministic prompt SHA-256 `5927a2b78903bc043c214f984bbcf3e91fa1971d216b1dd3e088e009e9cc72c4`.

`git diff --check 5a66442^ 5a66442` — PASS.

The review also inspected the committed implementation, fixture, coverage manifest, fixed sections, and local-ref resolver. No provider, credential, finalizer, or Atlas-contract coupling was found in the committed ticket diff.

## Review Contract disposition

| Row | Disposition | Review evidence |
| --- | --- | --- |
| RC-PROMPT-001 | PROVEN | Immutable checkpoint fixture and recorded hash are committed. |
| RC-PROMPT-002 | PROVEN | Zod schema defines the frozen snake_case visible contract and all required descriptions; completeness gate traverses the generated schema. |
| RC-PROMPT-003 | PROVEN | The builder consumes `z.toJSONSchema(...)`; no private Zod internals were found. |
| RC-PROMPT-004 | PROVEN | Recursive JSON-Schema rendering derives the visible output shape from schema properties, arrays, nullable alternatives, and enums. |
| RC-PROMPT-005 | PROVEN | Field descriptions and enum meanings are rendered from resolved JSON-Schema descriptions; the description-propagation test changes a Zod description without changing fixed text. |
| RC-PROMPT-006 | PROVEN | Fixed sections carry behavioral policy, and the committed anti-duplication assertions reject representative ontology text. |
| RC-PROMPT-007 | PROVEN | The local test observes each required fixed policy section in the generated prompt. |
| RC-PROMPT-008 | IMPLEMENTED_UNPROVEN | The 15-entry manifest captures the ticket's minimum named examples, but it does not enumerate every material checkpoint instruction. Its uniqueness calculation only compares already-unique instruction/authority pairs and cannot demonstrate complete single ownership of the full fixture. |
| RC-PROMPT-009 | PROVEN | The local test performs repeat generation and equal SHA-256 assertions. |
| RC-PROMPT-010 | IMPLEMENTED_UNPROVEN | The resolver implements cycle detection, but the only negative tests exercise a missing description and broken reference; no cyclic-reference schema is executed. |
| RC-PROMPT-011 | PROVEN | The committed diff is isolated to the local prompt-builder, ticket/context, and report; code inspection found no provider or Atlas-authority coupling. |
| RC-PROMPT-012 | PROVEN | The affected local suite and diff whitespace check passed; generated evidence remains ignored. |

## Findings

### CK-001 — Coverage audit does not prove complete, single ownership of the checkpoint

**Ticket authority:** `RC-PROMPT-008` requires every material checkpoint instruction to map to one authority; the ticket and incorporated context require a deterministic coverage/provenance audit with no unmapped or multiply-owned material instruction.

**Unsatisfied evidence:** `prompt-provenance.mts` contains only selected high-level entries. It does not account individually for the field-level instructions and material details in the frozen checkpoint, such as the nullability directions, individual field semantic meanings, applicability and quantitative rules, all resolution details, or each fixed policy bullet. Its duplicate check cannot detect a multiply-owned instruction because each input record already has one literal authority.

## Frozen Finding Closure Matrix

| Clause | Exact ticket authority and unsatisfied evidence | Observable correction | Binary closure oracle and direct-regression boundary |
| --- | --- | --- | --- |
| CK-001.a | RC-PROMPT-008: every material checkpoint instruction must have exactly one intended authority. The committed partial manifest and its uniqueness check do not prove that full fixture coverage or single ownership. | Replace the partial audit with a deterministic fixture-derived or explicit complete manifest that identifies every material instruction, its sole authority, and generated-prompt presence; make duplicate/unmapped ownership a failing assertion. | **Pass iff** the executed local test/audit reports every material checkpoint instruction mapped once, no unmapped entry, and no multiply-owned entry, with a durable coverage artifact locator. Direct-regression boundary: frozen checkpoint fixture, fixed/Zod ownership split, and prompt renderer only. |

### CK-002 — The cyclic local-reference fail-closed case is unproven

**Ticket authority:** `RC-PROMPT-010` requires missing-description and broken-ref/cycle negative tests to pass. The incorporated context requires local ref resolution to detect cycles and fail clearly on cyclic semantic schemas.

**Unsatisfied evidence:** `test.mts` asserts the missing-description and broken-reference paths. Although `resolveLocalRef` contains a cycle error branch, no test supplies a cyclic local `$ref` schema and observes that branch.

## Frozen Finding Closure Matrix

| Clause | Exact ticket authority and unsatisfied evidence | Observable correction | Binary closure oracle and direct-regression boundary |
| --- | --- | --- | --- |
| CK-002.a | RC-PROMPT-010: broken-ref/cycle negative tests must pass. No executed cyclic-local-reference case is committed. | Add a deterministic cyclic `$ref` test that invokes the builder/resolver and asserts the clear cycle failure. | **Pass iff** the ticket-local test command executes a cyclic local-reference schema and asserts the expected cycle failure, while the existing valid, missing-description, and broken-reference cases remain passing. Direct-regression boundary: JSON-Schema traversal and fail-closed behavior only. |

## Separate scope-change observations

None. Both findings trace directly to frozen ticket rows and are implementation-repairable without changing the provider contract, prompt semantics, or scope.

## Decision

`CHANGES_REQUIRED`. `CK-001.a` and `CK-002.a` are the complete frozen remediation target for this checkpoint. Return control to human/planning authority; a later CFC may address only an HMN-authorized subset of these clauses.
