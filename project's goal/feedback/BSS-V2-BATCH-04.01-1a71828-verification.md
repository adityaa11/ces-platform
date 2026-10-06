# BSS-V2-BATCH-04.01 CK verification after HMN-authorized CFC

- **Ticket:** BSS-V2-004-01 — Persistent local Docling perception service integration
- **Review type:** bounded verification of the HMN-authorized CFC remediation
- **Original CK artifact:** `BSS-V2-BATCH-04.01-3593232-review.md`
- **Prior verification:** `BSS-V2-BATCH-04.01-f8c901a-verification.md`
- **CFC checkpoint:** `BSS-V2-004-01-cfc-002-checkpoint.md`
- **Consumed HMN authorization:** `HMN-BSS-V2-004-01-002` (`AUTHORIZE_EVIDENCE_REMEDIATION`), selecting `CK-004.a` only
- **Reviewed remediation commit:** `1a71828edc63b732863e0cbe5926840e2a99aac5` — `fix(bridge): separate Docling qualification timing stages`
- **Result:** `PASS`

## Verification scope and evidence

The newer HMN artifact `BSS-V2-004-01-hmn-002.md` authorizes one additional bounded cycle after the prior `CHANGES_REQUIRED` result and names only `CK-004.a`. The CFC checkpoint records that authorization as consumed. This verification covers only the frozen CK-004.a oracle, the timing-instrumentation remediation diff, its reported evidence, and direct regressions introduced by that instrumentation.

The remediation commit follows the prior CFC remediation commit. Its changes instrument the existing Docling request/form/mapping path, add focused timing assertions, and update the qualification harness and checkpoint. The pinned Compose profile, provider topology, source-byte route, and 20,000 ms threshold are unchanged.

## Frozen clause outcomes

| Clause | Outcome | Evidence against the frozen oracle |
| --- | --- | --- |
| CK-001.a | RESOLVED (carried forward) | Retain the outcome recorded in `BSS-V2-BATCH-04.01-f8c901a-verification.md`; not reopened. |
| CK-002.a | RESOLVED (carried forward) | Retain the outcome recorded in `BSS-V2-BATCH-04.01-f8c901a-verification.md`; not reopened. |
| CK-003.a | RESOLVED (carried forward) | Retain the outcome recorded in `BSS-V2-BATCH-04.01-f8c901a-verification.md`; not reopened. |
| CK-004.a | RESOLVED | The CFC-002 checkpoint records separate values for cold boot to `/ready` (16,236 ms), exact-profile warm-up (4,066 ms), HTTP/request transfer, Docling-reported processing, mapping, normalization, parsing, and end-to-end latency. It gives all four required warm runs: Safara Full 4,015 ms, Finance 4,014 ms, Readiness 2,022 ms, and repeated Safara 4,024 ms, each within 20,000 ms and parser-valid. The committed instrumentation measures multipart serialization, POST round trip, response-body transfer, and mapping directly; HTTP/request transfer is reported as POST round trip less Docling-reported processing. The checkpoint also reports deterministic Safara/repeat output. These observations satisfy the original binary closure oracle. |
| CK-005.a | RESOLVED (carried forward) | Retain the outcome recorded in `BSS-V2-BATCH-04.01-f8c901a-verification.md`; not reopened. |

## Direct-regression check and validation record

Within the bounded timing-instrumentation diff, no direct regression was identified in the existing source mapping, request profile, timeout/error handling, or normalization/parser handoff. The provider test asserts that Docling processing, HTTP/request-transfer, and mapping timings are emitted. The CFC checkpoint reports passing provider tests, Bridge typecheck, Core and Contracts tests, Compose configuration, the pinned real Compose matrix, cold-boot readiness observation, and `git diff --check`. CK inspected the remediation code, focused assertions, and checkpoint but did not rerun those commands or the live Compose matrix.

## Decision

`PASS`. All original frozen clauses are proven: CK-001.a, CK-002.a, CK-003.a, and CK-005.a retain their resolved outcomes unchanged, and CK-004.a now satisfies its frozen timing-measurement oracle. No direct remediation regression remains. This completes the single HMN-authorized bounded verification; no further CFC cycle is authorized by this artifact.
