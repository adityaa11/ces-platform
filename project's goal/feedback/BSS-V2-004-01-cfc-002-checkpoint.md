# BSS-V2-004-01 CFC-002 checkpoint

- **Ticket:** BSS-V2-004-01 — Persistent local Docling perception service integration
- **Original frozen CK clause:** `CK-004.a` in `BSS-V2-BATCH-04.01-3593232-review.md`
- **Residual verification:** `BSS-V2-BATCH-04.01-f8c901a-verification.md`
- **Authorization:** `HMN-BSS-V2-004-01-002` (`AUTHORIZE_EVIDENCE_REMEDIATION`)
- **State:** `awaiting_review`

## Authorized closure evidence

| Frozen clause | Status | Exact evidence / oracle result |
| --- | --- | --- |
| CK-004.a | PROVEN | The production-shaped pinned-Compose qualification now outputs an explicit measurement-boundary legend and all required separate values. Cold boot to `/ready`: **16,236 ms**; exact-profile warm-up: **4,066 ms**. Warm run values were: Safara Full (request transfer **1,669 ms**, Docling processing **2,338 ms**, mapping **1 ms**, normalize **1 ms**, parse **0 ms**, end-to-end **4,015 ms**); Finance (**1,462**, **2,544**, **0**, **0**, **0**, **4,014 ms**); Readiness (**611**, **1,401**, **2**, **0**, **0**, **2,022 ms**); repeated Safara (**1,947**, **2,065**, **1**, **0**, **0**, **4,024 ms**). Request serialization and response-body transfer are additionally retained. HTTP/request transfer is defined as POST round trip less Docling's response-reported `processing_time`; mapping/serialization is timed directly from parsed Docling JSON to the generic mapped result. All four required runs were parser-valid `NormalizedDocument v1`, deterministic for Safara/repeat, and <=20,000 ms. **Frozen oracle passed.** |

## Validation

```text
pnpm --filter @atlas/agents-bridge exec jiti tests/docling-provider.test.ts  PASS (4 tests)
pnpm --filter @atlas/agents-bridge typecheck                            PASS
pnpm --filter @atlas/core test                                          PASS
pnpm --filter @atlas/contracts test                                     PASS
docker compose config --quiet                                           PASS
docker compose restart docling-serve; observe /ready                    PASS (16,236 ms cold boot)
docker compose exec ... qualify-docling.mts                             PASS (pinned Compose matrix)
git diff --check                                                        PASS
```

The remediation changes only the Docling timing instrumentation, its focused assertion, and the qualification harness. Resolved clauses CK-001.a, CK-002.a, CK-003.a, and CK-005.a were not reopened. The Compose route/profile, provider, topology, and latency threshold are unchanged.

HMN authorization consumed: `HMN-BSS-V2-004-01-002`

Internal readiness: READY_FOR_CK

This checkpoint requests bounded CK verification of CK-004.a, its evidence, and direct instrumentation regressions only; it does not issue `PASS`.
