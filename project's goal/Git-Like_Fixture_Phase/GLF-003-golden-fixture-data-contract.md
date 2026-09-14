# GLF-003: Golden fixture data contract

- **State:** complete
- **Review batch:** BATCH-19
- **Depends on:** GLF-002
- **Baseline:** Architecture Checkpoint sections 2, 4–12, 16–20, 22–24; UI/UX Prototype PRD 9.1, 9.4; Fixture Data-Intent Contract

## Outcome

Define and generate the Git-like golden fixture JSON required by the approved
skill contracts and by the later workspace-selector/UI work.

## Scope

- Generate source-grounded Safara scenarios in default `codex` mode.
- Supply immutable artifacts, extraction candidates, proposals, assertions,
  revisions, branches, HEAD refs, materialized state, dependencies, and
  UI-facing projections.
- Include Master and one incremental branch with distinct accepted current truth.
- Include revision-level skill execution provenance and a staged proposal that
  does not alter accepted state.
- Provide one repository command that discovers PDFs under `docs/PRD/`, runs
  the five shared skills through a dependency-ordered pipeline, and writes the
  candidate fixture bundle only after deterministic contract gates pass.
- Use `codex` as the default execution adapter. The adapter boundary must keep
  a future `agents_bridge` implementation substitutable without changing skill
  input/output contracts or repository authority.

## Execution plan

The single command is an orchestration entry point, not a replacement for the
skill contracts. It must make each stage's input, output, execution mode, skill
ID, and skill version inspectable.

1. Discover immutable PRD PDFs under `docs/PRD/` and extract their page text.
   Independent PDFs may be processed concurrently by `atlas.prd-extraction`.
2. Assemble the extracted candidates and accepted base context with
   `atlas.fixture-repository` to create the repository candidate.
3. Use `atlas.fixture-changes` to stage the incremental-branch proposal; it
   must not change accepted state or a branch HEAD.
4. Materialize accepted branch HEAD states deterministically, then invoke
   `atlas.fixture-projections` for the branch-aware read candidates.
5. Run `atlas.fixture-verification` over the repository and projection bundle,
   then run deterministic topology/provenance/branch-isolation gates before
   publishing the generated fixture output.

The five stages are therefore one topologically ordered command, not five
independent terminal commands. Extraction of separate source PDFs is the only
intended parallel segment. The current skills are instruction and schema
contracts rather than executable binaries, so GLF-003 must add the orchestration
script and the `codex` adapter; this ticket does not require a live Agents
Bridge or provider integration.

## Acceptance criteria

- Every field required by GLF-004 and GLF-005 has an explicit fixture owner and
  relationship path.
- Branch records expose stable IDs, labels, and existing `headRevisionId` values.
- Materialized state and projections identify branch ID and matching HEAD revision.
- Exact evidence/page provenance, supersession history, and dependencies resolve.
- A single documented terminal command processes the checked-in `docs/PRD/`
  inputs in the stated order and records inspectable per-stage provenance.
- A failed skill schema or deterministic gate prevents fixture output from being
  published as a valid golden bundle.

## Validation

- Run fixture-contract, topology, provenance, and branch-isolation tests.
- Resolve Master and incremental branch data through one pure fixture read contract.
- Run the orchestration command against the checked-in Safara PDFs and verify
  the generated bundle plus each stage's recorded contract/provenance.
