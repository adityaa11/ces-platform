Planning decision for HMN-IDSER-007-002:

Select the second bounded path.

IDSER-006's recorded PASS remains the accepted dependency closure for IDSER-007. Do not reopen IDSER-006 and do not modify `packages/atlas-db/tests/extraction-acceptance.integration.test.ts` under IDSER-007 authority.

The reproduced `assert.deepStrictEqual` failure at the IDSER-006 extraction-acceptance test is a pre-existing test-harness/runtime container mismatch: it reproduces at the approved predecessor HEAD `266f5a33d9d141a04a6558fe18b06ea3d9f50920`, before any committed IDSER-007 checkpoint exists, and therefore is not a direct regression introduced by IDSER-007.

Under the shared Atlas Review Contract, approved predecessor work stays closed unless the current frozen ticket requires otherwise. GO is required to validate IDSER-007's ticket-derived Review Contract and regressions directly affected by IDSER-007 implementation; this pre-existing container-identity assertion does not become a new IDSER-007 acceptance condition.

Record the failed predecessor-suite invocation as a non-blocking baseline/harness observation if relevant. It must not be represented as passing evidence, but it also must not block IDSER-007 READY_FOR_CK unless IDSER-007 implementation introduces an independently observable behavioral regression against the consumed IDSER-006 invariant.

Authorization:

- IDSER-006 remains PASS and closed.
- No IDSER-006 production code or extraction-acceptance test repair is authorized under IDSER-007.
- Resume the existing uncommitted IDSER-007 initial implementation.
- Complete all IDSER-007 ticket-required Compose, PostgreSQL/queue, concurrency, bounded-selection, semantic-case, rollback/replay, and query-plan evidence.
- Preserve the existing IDSER-007 frozen Review Contract without adding the Node/runtime assertion mismatch as a completion row.
- If IDSER-007-specific validation exposes an actual behavior regression attributable to IDSER-007 changes, handle that separately as an in-scope direct regression.

Decision: RETURN_TO_GO

Expected next command: `go IDSER-007`