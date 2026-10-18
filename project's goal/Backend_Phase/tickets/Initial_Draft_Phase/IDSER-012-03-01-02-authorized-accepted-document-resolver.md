# IDSER-012-03-01-02 — Authorized accepted-document resolver

- **State:** `approved`; **Review batch:** `IDSER-BATCH-12-03-01-02`; CK verification `PASS` is recorded in `IDSER-BATCH-12-03-01-02-e378f93-verification.md`.
- **Batch:** `IDSER-BATCH-12-03-01-02`.
- **Parent:** [IDSER-012-03-01 split map](IDSER-012-03-01-ghr-body-contract-accepted-document-resolver.md).
- **Dependencies:** `-03-01-01` CK `PASS`; existing Atlas auth/data/store conventions and accepted perception/cache/asset authority.

## Outcome

Implement the narrow Atlas-owned authenticated read-only resolver that redeems a successfully parsed input into one typed, scoped accepted-document result for the planner. **STOP before corpus partition, BSS read, persistence, GHR delivery, SEM intake, or any state change.**

## Authorized scope

After reusing the approved parser, resolve `normalizedDocumentRef` only through an Atlas-owned parameterized scoped lookup (or a demonstrably equivalent authorized API). Authenticate caller/service identity and enforce project, workspace, bundle, document, snapshot, lifecycle, expiry/cancellation, source SHA, completed execution, completion fingerprint, normalized version, cache key, and accepted media-grant authority. Return only the qualified normalized document plus bounded granted source/REL/media references. REL is included only if separately accepted authority provides it; otherwise return its explicit unavailable state.

The resolver must not expose broad cache listing, arbitrary path/storage access, media bytes, document recreation, acceptance mutation, perception replay, Bridge-side Atlas SQL, role widening, or a fake GHR issuer/route. A stale, altered, foreign, unaccepted, cross-document, cancelled, expired, or mismatched body fails closed.

## Frozen review contract

| ID | PASS iff |
| --- | --- |
| RC-012030102-01 | The actual `-01-01` fixture passes through the real parser and resolver to one scoped accepted normalized document with independently verified source, execution, fingerprint, lifecycle and grants. |
| RC-012030102-02 | Foreign scope, altered field, stale cache/version/fingerprint, cancellation, expired authorization, unaccepted status, missing/foreign media, and unauthorized REL all fail closed with no content leakage. |
| RC-012030102-03 | The resolver returns a bounded typed planner result rather than a second trusted header/domain contract; absent REL remains explicit and no graph is fabricated. |
| RC-012030102-04 | Positive reads and every reject case cause zero planner publication, BSS read/attempt/reservation, GHR issuance/delivery, SEM/provider call, cache/asset mutation, or semantic/reconciliation effect. |

## Security Readiness

- `SR-012030102-T1`: approved parser result → authenticated Atlas scoped redemption.
- `SR-012030102-T2`: accepted cache/source/derived-asset facts → bounded planner view.
- `SR-012030102-C1`: deny ref-as-permission, Bridge SQL, cache enumeration, raw bytes, recreated documents and any GHR authority.
- `SR-012030102-R1`: CK verifies actual repository/API privilege and all scope/lifecycle/grant fences; `SR-012030102-R2` verifies read-only counters.

## Evidence and hard stop

Exercise the real resolver with persisted accepted rows, not a mocked `resolve(ref)`. Preserve authenticated principal, selected fixture identities, query/API evidence, positive bounded response metadata and negative results. If an authorized least-privilege Atlas read boundary cannot be demonstrated, STOP `NORMALIZED_DOCUMENT_AUTHORIZED_READ_GAP` to the Atlas owner. Do not bypass it. CK `PASS` yields only a resolved planner input for `-03-02-01` and `-03-02-02`.
