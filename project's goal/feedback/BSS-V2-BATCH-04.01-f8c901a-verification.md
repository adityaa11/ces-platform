# BSS-V2-BATCH-04.01 CK verification

- **Ticket:** BSS-V2-004-01 — Persistent local Docling perception service integration
- **Review type:** bounded verification after the single CFC remediation
- **Original CK artifact:** `BSS-V2-BATCH-04.01-3593232-review.md`
- **Original reviewed target:** `359323288d9c1f1db88f6f6c77402ae4683c1217`
- **CFC checkpoint:** `BSS-V2-004-01-cfc-checkpoint.md`
- **CFC remediation commit:** `f8c901a3d171d5df02d954dba56e6945eec5a65c` — `fix(bridge): close Docling qualification findings`
- **Result:** `CHANGES_REQUIRED`

## Verification scope and evidence

Verified only CK-001.a through CK-005.a from the original frozen finding matrix, the remediation diff in `f8c901a`, evidence needed by those oracles, and direct regressions in the affected readiness, mapping, timeout, qualification, and resource-profile paths. The remediation commit follows the recorded review target directly and changes the Docling adapter, worker startup, provider tests, Compose configuration, qualification harness, and this CFC checkpoint.

The CFC checkpoint reports passing provider tests, typecheck, Core/Contracts tests, Compose config validation, real Compose qualification, and `git diff --check`. CK inspected the committed implementations and test/harness definitions but did not rerun those commands or the live Compose qualification. The unresolved result below is based on the qualification timing fields and their actual measurement boundaries in the committed harness, compared with CK-004.a's frozen oracle.

## Frozen clause outcomes

| Clause | Outcome | Evidence against the original frozen oracle |
| --- | --- | --- |
| CK-001.a | RESOLVED | `worker-main.ts` now runs `DoclingProvider.perceive` over the repository-owned PDF before starting the worker and publishing `/tmp/agents-bridge-worker.ready`. The CFC checkpoint reports a pinned Compose restart and readiness observation after this warm-up. This satisfies the exact-profile route-admission oracle. |
| CK-002.a | RESOLVED | `mapDoclingDocument` accepts only a positive integer source provenance page and skips units without one; the committed test covers missing and malformed provenance. The CFC checkpoint reports the required real fixture matrix still parses v1. |
| CK-003.a | RESOLVED | The committed provider test holds the conversion request open until its 25 ms deadline aborts it, asserts the timeout result and bounded completion under 500 ms, and the stalled request returns no payload to map. The CFC checkpoint reports the test passed. |
| CK-004.a | UNRESOLVED | **Expected state:** durable evidence with distinct values for cold boot, exact-profile warm-up, HTTP/request transfer, Docling-reported pipeline time, mapping/serialization, normalization/parsing, and end-to-end latency, plus all four warm runs <=20,000 ms. **Actual state:** the checkpoint records a restart-to-worker-readiness total, a warm-up total, and the four end-to-end values, but no individual stage values. The harness's `httpRequestTransferMilliseconds` times the synchronous conversion fetch through response headers, so it includes Docling processing; `mappingSerializationMilliseconds` is computed by subtracting that interval from total provider time, leaving readiness/version calls and response handling mixed with mapping. The harness does not isolate mapping/serialization. Evidence: `scripts/bss-v2-004-01/qualify-docling.mts` (`measuredFetch`, `run`, and returned timing fields) and the checkpoint's CK-004.a row. The reported restart-to-worker-ready time also does not separately identify Docling cold boot apart from worker warm-up. |
| CK-005.a | RESOLVED | The committed Compose profile explicitly sets CPU device, four threads with rationale, one Docling Serve worker, and local conversion concurrency one. The qualification harness records available CPU count, memory observation, those profile values, and `cudaDeviceUse: false`; the CFC checkpoint records the pinned CPU Torch identity and `cuda_available: False`. Against the original closure oracle, the required resource-profile evidence is present. |

## Decision

`CHANGES_REQUIRED`. CK-004.a remains unresolved: the qualification output names the required timing categories, but the implementation does not measure HTTP transfer and mapping/serialization as separate stages, and the CFC checkpoint does not preserve their individual values. The original end-to-end gate values are within 20,000 ms; that does not satisfy the frozen stage-measurement oracle.

No direct remediation regression was identified within the bounded verification scope. Control returns to human/planning authority under the CK workflow. This verification does not authorize another CFC pass.
