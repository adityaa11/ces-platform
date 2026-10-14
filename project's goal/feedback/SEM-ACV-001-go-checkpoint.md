# SEM-ACV-001 GO checkpoint

- **Ticket:** `SEM-ACV-001` — Accepted-context decision verifier
- **Authorization:** `HMN-SEM-ACV-001-001`; explicit user `GO SEM-ACV-001`
- **State:** `awaiting_review`
- **Implementation commit:** `96a57f4` (`feat(sem-cutover): add accepted-context verifier`)
- **Base:** `e686049`
- **Frozen ticket:** `project's goal/Backend_Phase/tickets/Semantic_Cutover_Phase/SEM-ACV-001-accepted-context-decision-verifier.md`

The implementation commit changes only the permitted verifier, its deterministic
test fixture, and the narrow package export. It introduces no issuer, status
service, persistence, redemption, finalizer, worker, provider, repository,
runtime, or publication work. Existing dirty finalizer, worker, fixture, and
planning material was preserved. This verifier remains an offline consumer of
an independently injected verification mechanism; it cannot establish a
production authority.

## Validation results

```text
corepack pnpm --filter @atlas/skills typecheck
  exit 0
corepack pnpm --filter @atlas/skills exec jiti tests/accepted-context-decision-verifier.test.ts
  exit 0; 4 passed, 0 failed
corepack pnpm --filter @atlas/skills test
  exit 0; 18 passed, 0 failed
git diff --cached --check
  exit 0
```

The focused fixture uses a test-only HMAC trust root, fixture issuer, signed
decision, signed authority state, and controlled clock. It performs actual
signature verification for both raw inputs, so a constructed accepted-looking
object, changed identity, or caller-attestation-shaped value has no authority.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence and validation | Status |
| --- | --- | --- | --- |
| `RC-ACV-01` | Only controlled authenticated decisions confer authority; raw assertions, brands, hashes, and attestation identifiers do not. | HMAC fixture verifies both decision and authority state. The forged signature and missing-state cases reject before a verified result. | PROVEN |
| `RC-ACV-02` | Exact project, workspace, bundle, document, source SHA-256, distinct perception/semantic execution identities, relationship revision, owned/context locators, asset identity/hash, role, necessity, and authorization binding. | Positive fixture includes every binding. Foreign project, changed asset hash, duplicate owned/context source, and malformed source-hash negatives reject. | PROVEN |
| `RC-ACV-03` | Trusted decision expiry, state expiry/freshness, issuer identity, and per-decision status fail closed; no production service is created. | Controlled-clock expired decision and stale authority-state tests reject. Revoked, invalid, replayed, or missing trusted status rejects. | PROVEN |
| `RC-ACV-04` | Actual positive verification and valid idempotent repeat; trusted invalid/replayed status rejects; no redemption or atomic anti-replay is claimed. | Focused test repeats the same authenticated decision with identical result and verifies trusted `invalid`/`replayed` rejections. Source inspection asserts no stateful effect APIs. | PROVEN |
| `RC-ACV-05` | Pure provider-neutral boundary with zero excluded-path effects; REL-03, SEM-005, and interoperability stay unchanged. | `96a57f4` contains only the three authorized package paths. Focused purity test and package regression suite pass; excluded files are absent from the commit. | PROVEN |

Internal readiness: READY_FOR_CK. This is not a self-issued CK `PASS`; it proves
only the offline verifier qualification and returns control to independent CK.
