# Review: BATCH-19 - Golden fixture data contract

- Reviewed commit: `47b67a8d17c9a001ab3e1958fb7ea0d890e3a71c`
- Ticket: GLF-003
- Baseline: Architecture Checkpoint sections 2, 4–12, 16–20, 22–24; UI/UX Prototype PRD 9.1, 9.4; Fixture Data-Intent Contract
- Result: `CHANGES_REQUESTED`
- Review round: 3

## Findings

| ID | Priority | Location | Requirement | Disposition | Requested observable outcome |
|---|---|---|---|---|---|
| F-001 | Blocker | `apps/atlas/scripts/generate-golden-fixture.mjs:46-62,121-123,128-169` | GLF-003 requires a `codex` execution adapter and an `agents_bridge` boundary whose provenance reflects the actual selected executor | Accepted | Make the adapter own stage execution and return the response/provenance produced by that executor. The current `codex` and `agents_bridge` adapters both only call the same generator-owned `buildResponse` callback; the generator also passes a marker object that makes `SKILLS_MODE=agents_bridge` succeed without a real bridge. Do not label a local pass-through response as `agents_bridge`; either provide a configured bridge executor or fail explicitly. |
| F-002 | Blocker | `apps/atlas/scripts/generate-golden-fixture.mjs:166-169` | GLF-003 execution plan requires `atlas.fixture-verification` to inspect the repository and complete projection bundle before deterministic publication gates | Accepted | Feed the actual generated repository and all branch projections to verification, use its returned evidence-based report, and reject publication unless every required check is `pass`. The current verification input is a synthetic `all-branches`/`all-heads` projection, while the response is hardcoded to pass and does not inspect its input; the surrounding validator cannot make that skill report an actual verification result. |
| F-003 | Important | `apps/atlas/scripts/generate-golden-fixture.mjs:54-62,128,132` | GLF-003 requires deterministic, inspectable per-stage provenance and the repository skill requires deterministic ordering for inspectable fixture diffs/hashing | Accepted | Collect concurrent extraction/projection responses in deterministic input order before appending to `context.pipeline`, or sort the trace by explicit stage/branch/artifact keys. A fixture test run regenerated the tracked bundle with an order-only diff because `pipeline.push` occurs on Promise completion, making repeated generation non-reproducible. |

## Resolved from prior review

- Prior F-003: recursive PDF discovery and derived artifact metadata are fixed.
- Prior F-004: the exported HEAD-keyed pure read contract is fixed and used by tests.
- Prior F-005: the GLF-001/BATCH-17 and GLF-002/BATCH-18 delivery rows are fixed.

## Decision

BATCH-19 remains `CHANGES_REQUESTED`. The fixture suite passes 13/13 and the
prior discovery, read-contract, and ticket-state findings remain resolved. The
current checkpoint still records requested execution mode as if it were actual
adapter execution, fabricates the verification response, and produces a
nondeterministic pipeline trace. Resolve F-001 through F-003 in the permitted
remediation scope, then re-run `ck`; do not begin GLF-004.
