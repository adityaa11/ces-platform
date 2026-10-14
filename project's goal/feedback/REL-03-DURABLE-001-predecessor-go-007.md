# GO checkpoint: REL-03-DURABLE-001 predecessor contract batch

- Ticket: `REL-03-DURABLE-001`
- Authorization: `HMN-REL-03-DURABLE-001-006`, amended by `HMN-REL-03-DURABLE-001-007`
- Scope: pure REL-03 / SEM-006 / SEM-005 predecessor preparation only
- State: `awaiting_review`

## Bounded change record

- REL-03 now exposes a typed wrapper over its existing strict qualification;
  it does not add relationship validation.
- SEM-006 projects qualified deferred tuples and returns a real `null`
  canonical result for wholly essential-deferred meaning.
- SEM-005 derives source and tuple universes from the exact request and parsed
  proposal, then invokes the existing complete-partition accounting validator.
- No source-authentication, worker, provider, SQL, migration, replay, durable
  stage, accepted-context, publication, or Master path changed.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / command | Status |
| --- | --- | --- | --- | --- |
| RC-PRE-001 | HMN-006 REL-03 handoff | Existing strict parse, lineage, source/asset, provenance and classification are carried unchanged. | `semantic-relationship-interoperability-bridge.test.ts`, `pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-relationship-interoperability-bridge.test.ts` (7/7) | PROVEN |
| RC-PRE-002 | HMN-006 SEM-006 | Ordinary/mixed deterministic projection and truthful wholly deferred `canonicalResult: null`. | `semantic-extraction-finalizer.sem-cutover-006.test.ts`, same focused command (4/4) | PROVEN |
| RC-PRE-003 | HMN-006 SEM-005 | Exact request/proposal universes, complete partition, bindings, deferred links, pending visuals and deterministic identities. | `provisional-semantic-sidecar.test.ts` (11/11); interoperability production-shaped sequence (7/7) | PROVEN |
| RC-PRE-004 | HMN-006 coordinated proof | Strict parse -> REL-03 -> SEM-006 -> SEM-005 remains pure and preserves distinct perception/semantic identities. | interoperability test `HMN-006`; both package typechecks pass | PROVEN |
| RC-PRE-005 | HMN-006 adversarial matrix | Forged/foreign/duplicate tuple, source, evidence, descriptor, revision and malformed provenance paths reject before any durable effect. | three focused suites above (22/22); no external effects exercised | PROVEN |

Validation additionally run:

```text
pnpm --filter @atlas/skills typecheck                         PASS
pnpm --filter @atlas/agents-bridge typecheck                  PASS
git diff --check                                              PASS
```

Internal readiness: READY_FOR_CK

`REL-03-DURABLE-001` remains `awaiting_review`. `SEM-CUTOVER-007` remains
blocked. This is not a CK result and does not claim runtime source
authentication or post-authorization substitution rejection.
