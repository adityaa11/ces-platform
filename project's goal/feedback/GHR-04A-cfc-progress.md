# GHR-04A CFC progress

- **Ticket:** `GHR-04A`
- **CK source:** [GHR-04A CK review](GHR-04A-c4ad7a57-review.md)
- **Reviewed implementation:** `c4ad7a57b30b96e078bf7457ad631b9bb2d54c89`
- **Remediation base:** `3b817971` (`docs(ghr): record GHR-04A checkpoint target`)
- **Scope:** ordinary bounded CFC for `CK-001.a`, `CK-001.b`, `CK-002.a`, and `CK-002.b`

This working view records the authorized clause IDs and current evidence locations. The CK review remains the sole source for ticket authority, required proof, and closure oracles.

| Clause | Current status | Evidence location |
| --- | --- | --- |
| `CK-001.a` | `PROVEN` | `apps/agents-bridge/src/ghr/http-dispatcher.ts`; `apps/agents-bridge/tests/ghr-04a-http-dispatcher.test.ts` |
| `CK-001.b` | `PROVEN` | `apps/agents-bridge/src/ghr/core/branch-registry.ts`; `apps/agents-bridge/tests/ghr-branch-registry.test.ts`; `apps/agents-bridge/tests/ghr-04a-http-dispatcher.test.ts` |
| `CK-002.a` | `PROVEN` | `apps/agents-bridge/tests/ghr-04a-http-dispatcher.test.ts` |
| `CK-002.b` | `PROVEN` | `apps/agents-bridge/tests/ghr-04a-http-dispatcher.test.ts` |

Resolved rows `GHR-04A-RC-01` and `GHR-04A-RC-04` remain protected as `PROVEN`; no worker, receiver, receipt, parser, downstream, or deployment behavior is authorized by this CFC.
