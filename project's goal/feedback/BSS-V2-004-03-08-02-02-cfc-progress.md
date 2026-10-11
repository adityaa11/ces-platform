# CFC progress — BSS-V2-004-03-08-02-02

- **Remediation base:** `f2455aec34c3cb5e1799e63af93084754d53c58e`
- **Reviewed implementation:** `a31ba9c`
- **CK source:** `BSS-V2-BATCH-04.03-08.02-02-a31ba9c-review.md`
- **HMN authorization consumed:** `HMN-BSS-V2-004-03-08-02-02-CK-001.a-001` in `BSS-V2-004-03-08-02-02-hmn-001.md`
- **Authorized scope:** `CK-001.a` only

| Clause | Status before remediation | Evidence location | Authority and closure source |
| --- | --- | --- | --- |
| `CK-001.a` | `PROVEN` | `packages/atlas-core/src/derived-image-grant.ts`; `packages/atlas-core/tests/derived-image-grant.test.ts`, including `concurrent redemption claims a replay fence before awaiting authority validation` and `failed authority recheck leaves the replay fence consumed` | Frozen ticket RC-01/RC-02 and the required behavior, proof, harness, binary oracle, and direct-regression boundary in the CK artifact's Frozen Finding Closure Matrix. Criteria are not duplicated here. |

Resolved CK rows `RC-01` and `RC-03` remain protected. No other finding or clause is authorized.
