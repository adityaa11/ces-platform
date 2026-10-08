# CFC progress: IDSER-012-01-03-01 / IDSER-BATCH-12-01-03-01

- Original closure authority and all closure oracles: [CK review](IDSER-BATCH-12-01-03-01-9a02d4a-review.md), `Frozen Finding Closure Matrix`, clauses CK-001.a–f. Criteria remain there and in the frozen ticket.
- Active tuple: ticket `IDSER-012-01-03-01`; batch `IDSER-BATCH-12-01-03-01`; ticket state `awaiting_review`; reviewed commit `9a02d4aa12b5a06c39ddb35472f2f88c8214157e`; authorized checkpoint `IDSER-BATCH-12-01-03-01-go-checkpoint.md`.
- Initial CK result: `CHANGES_REQUIRED`. This is the first CFC cycle; there is no earlier CFC commit or CK handoff.

| CK clause | Current status | Current evidence location |
| --- | --- | --- |
| CK-001.a | PROVEN | `apps/agents-bridge/tests/docling-provider.test.ts`; `apps/agents-bridge/tests/idser-012-01-03-01-qualification.ts`; `project's goal/feedback/IDSER-BATCH-12-01-03-01-cfc-evidence.json` |
| CK-001.b | PROVEN | `apps/agents-bridge/tests/fixtures/idser-012-01-03-01-safara-run003-mapping.json`; qualification assertions and evidence JSON |
| CK-001.c | PROVEN | `parseNormalizedDocument` qualification assertions and 263-locator resolution evidence JSON |
| CK-001.d | PROVEN | Geometry cases in `apps/agents-bridge/tests/docling-provider.test.ts`; mapped geometry in frozen fixture |
| CK-001.e | PROVEN | `doclingCapabilityIdentity`, route identity assertion, cache lookup/invalidation test, and historical-evidence decision in CFC checkpoint |
| CK-001.f | PROVEN | Complete, truncated, and corrupt PNG cases in `apps/agents-bridge/tests/docling-provider.test.ts`; five real descriptor hashes in evidence JSON |

This working view tracks status and evidence locations only. The CK review remains the sole source of ticket authority, required behavior, and closure oracles.
