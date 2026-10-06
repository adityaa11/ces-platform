# CK review: SEMIR-002 / SEMIR-BATCH-02

- **Result:** `CHANGES_REQUIRED`
- **Review type:** First review
- **Ticket:** `SEMIR-002`
- **Batch:** `SEMIR-BATCH-02`
- **Frozen ticket reference:** `project's goal/Backend_Phase/tickets/IR_Test_Phase/SEMIR-002-semantic-ir-zod-schema.md` at `f04d413a797699d5f67be1976fd4265d97741ecc`; state `awaiting_review`.
- **GO checkpoint:** `project's goal/feedback/SEMIR-BATCH-02-go-checkpoint.md`
- **Reviewed implementation commit:** `d7ea37f9c3c430efd83f9cf1d7a910a9cd3d2d7d` (`feat(semir): add semantic IR zod schema`). The checkpoint identifies this commit as the bounded target; the later ticket/checkpoint metadata commit is outside implementation scope.

## Review contract and evidence

Reviewed all six acceptance rows and mandatory bindings `SR-002-RB-01` through `SR-002-RB-03` against the implementation commit. The schema is isolated under `scripts/semantic-ir-v0/`, defines a proposal-only contract, keeps the listed semantic dimensions separate, and includes structural constraints for bounded roles, modality, evidence shape, and ranges. The offline checker maps the 43-case frozen corpus loaded from predecessor `8e865a9`.

Validation performed:

```text
node scripts/semantic-ir-v0/check-semir-002-schema.mjs
PASS: 43 frozen SEMIR-001 cases parse; independent dimensions, structural failures, and Zod JSON Schema descriptions verified; zero provider calls.

git diff --check d7ea37f9c3c430efd83f9cf1d7a910a9cd3d2d7d^ d7ea37f9c3c430efd83f9cf1d7a910a9cd3d2d7d
PASS (exit 0; no whitespace errors)
```

The implementation commit changes only the SEMIR-002 checker/schema and its README plus the GO checkpoint. It does not introduce a provider call or a production import, route, persistence, `NormalizedDocument v1`, old-parser, or reconciliation change. The Zod-generated JSON Schema contains the source-slot and disposition descriptions; the checker asserts generated descriptions for source-slot constraints, modality, unresolved aspects, and evidence. The required valid coexistence case includes possibility over obligation, polarity, conditions, triggers, temporal relation, quantity, scope, state, unresolved aspect, argument, and evidence.

## Findings

### CK-001 — Acceptance row 01 lacks required invalid discourse and slot examples

`RC-SEMIR-002-01` is ticket-authorized by SEMIR-002 Acceptance row 01: tests must prove valid and invalid disposition, discourse, and slot examples parse or fail as specified. The checker covers invalid disposition (`sourceDisposition: 'unknown'`, `check-semir-002-schema.mjs:40`) and valid corpus slots/discourse roles, but its negative fixture list (`:40-47`) contains neither an invalid `discourseRole` nor an empty `sourceSlot`. The schema enum and nonempty-string constraint exist, but the ticket expressly requires test evidence for those rejection cases.

## Frozen Finding Closure Matrix

| Clause | Exact ticket authority | Unsatisfied evidence | Observable correction | Binary closure oracle | Direct-regression boundary |
| --- | --- | --- | --- | --- | --- |
| `CK-001.a` | SEMIR-002 Acceptance row 01; `RC-SEMIR-002-01` | `scripts/semantic-ir-v0/check-semir-002-schema.mjs:40-47` has no negative case for an out-of-enum discourse role or empty source slot. | Add explicit invalid examples for both conditions to the checker’s structural rejection assertions. | **PASS iff** the checker contains an invalid-role fixture and an empty-slot fixture, and `node scripts/semantic-ir-v0/check-semir-002-schema.mjs` exits 0 with both rejected by `safeParse`. Evidence: those fixtures/assertions in `scripts/semantic-ir-v0/check-semir-002-schema.mjs` and the command outcome. | Check only row 01 parsing for disposition, discourse-role, and source-slot cases. The named checker must continue to pass its frozen 43-case valid corpus mapping and existing negative assertions; no broader regression suite is added by this clause. |

## Scope-change observations

None identified. No product, architecture, provider, deployment, or predecessor decision is needed to close this finding.

## Decision

The implementation appears structurally bounded and isolated, but the ticket-required invalid discourse-role and source-slot proofs are missing. `SEMIR-002` remains `awaiting_review`; result is `CHANGES_REQUIRED`. The frozen closure target is only `CK-001.a` above.
