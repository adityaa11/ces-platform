# BSS-V2-004-01 CFC checkpoint

- **Ticket:** BSS-V2-004-01 — Persistent local Docling perception service integration
- **Review remediated:** `BSS-V2-BATCH-04.01-3593232-review.md`
- **Reviewed target:** `359323288d9c1f1db88f6f6c77402ae4683c1217`
- **State:** `awaiting_review`
- **Authorization:** first bounded CFC pass for the consolidated `CHANGES_REQUIRED` review; no HMN authorization is required or consumed.

## CFC working progress view

| Frozen clause | Status | Closure evidence and frozen-oracle result |
| --- | --- | --- |
| CK-001.a | PROVEN | `apps/agents-bridge/src/worker-main.ts` performs a repository-owned, non-confidential PDF conversion with the fixed `atlas-digital-pdf-no-ocr-v1` profile before it writes `/tmp/agents-bridge-worker.ready`. A fresh pinned Compose restart reached `/ready` in **12,228 ms**. A temporary qualified worker (`bss-v2-004-01-warm-admission`) published its readiness marker only after that profile warm-up completed. **Oracle passed:** ordinary route admission is gated by exact-profile initialization. |
| CK-002.a | PROVEN | `mapDoclingDocument` now discards source items without a positive integer provenance page rather than assigning page 1. `tests/docling-provider.test.ts` proves both missing and malformed provenance cannot create an invented page, and the real fixture matrix below still parses `NormalizedDocument v1`. **Oracle passed.** |
| CK-003.a | PROVEN | `tests/docling-provider.test.ts` holds the conversion request until the configured 25 ms deadline aborts it, asserts stable timeout classification, and completes in under 500 ms. Because the stalled request never returns a payload, no mapper, partial result, or fallback runs. **Oracle passed.** |
| CK-004.a | PROVEN | `scripts/bss-v2-004-01/qualify-docling.mts` now records HTTP/request transfer, Docling-reported processing, mapping/serialization, normalization, parsing, end-to-end, explicit warm-up, and resource profile. The pinned Compose run recorded warm end-to-end values: Safara Full **4,019 ms**, Finance **4,012 ms**, Readiness **2,017 ms**, Safara repeat **2,013 ms** — all <= 20,000 ms. The exact-profile warm-up was **4,055 ms**; cold boot is recorded above. **Oracle passed.** |
| CK-005.a | PROVEN | The same real qualification record reports 16 available CPUs, 16,560,840,704 bytes available memory, four CPU threads with the bounded local-qualification rationale, one Docling Serve worker, local conversion concurrency one, and `cudaDeviceUse: false`. The pinned container separately reported `torch 2.14.1+cpu` and `cuda_available: False`. **Oracle passed.** |

## Commands and outcomes

```text
pnpm --filter @atlas/agents-bridge exec jiti tests/docling-provider.test.ts  PASS (4 tests)
pnpm --filter @atlas/agents-bridge typecheck                            PASS
pnpm --filter @atlas/core test                                          PASS
pnpm --filter @atlas/contracts test                                     PASS
docker compose config --quiet                                           PASS
docker compose exec -T agents-bridge-worker ... qualify-docling.mts     PASS
git diff --check                                                        PASS
```

The Compose qualification used `quay.io/docling-project/docling-serve-cpu:v1.36.0@sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7` over the private Compose route. It produced parser-valid `NormalizedDocument v1` for the four required warm runs and deterministic primary/repeated Safara output. Direct regressions checked: source-grounded mapping/page assignment, timeout/cancellation classification, fixed profile readiness, Compose validity, Core perception behavior, and Contracts parsing.

## Review handoff

Internal readiness: READY_FOR_CK

This is one bounded remediation checkpoint for CK-001.a through CK-005.a. It does not issue `PASS`; CK must verify the frozen clauses, this remediation diff, and direct regressions only.
