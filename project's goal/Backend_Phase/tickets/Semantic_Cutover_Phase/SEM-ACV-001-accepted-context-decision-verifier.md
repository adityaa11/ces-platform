# SEM-ACV-001 — Accepted-context decision verifier

**Status:** `awaiting_review` by `HMN-SEM-ACV-001-001` · **Size:** S · **Owner:** pure provider-neutral decision-verification boundary · **Dependencies:** committed readiness diagnostic `e686049`; explicit `GO SEM-ACV-001`. This ticket is a prerequisite for, not an amendment of, `SEM-CUTOVER-006`.

## Exact objective

Define and offline-qualify a pure verifier that accepts contextual evidence only
after it verifies an authenticated accepted-relationship decision against an
independently established authority source or authenticated receipt. The
verifier is a consumer of acceptance authority: it is never a decision issuer,
human-review workflow, registry, database, publication system, or stateful
redemption service.

The production authority source is an independently owned **Acceptance
Decision Authority**. It must issue the accepted decision and authenticated
status/trust material. That production owner does not exist in this ticket and
is not inferred from a caller's metadata, hash, TypeScript brand, or
attestation ID. The verifier must fail closed when it lacks sufficiently fresh,
authenticated authority material.

## Identity and trust contract

An authenticated decision and the verifier's authenticated authority state must
bind exactly:

- project, workspace, bundle, document, and source SHA-256;
- the **perception execution identity** carried by the relationship revision;
- relationship lineage ID and immutable revision hash;
- owned/context source slots and canonical locators, context asset identity,
  asset source identity, and asset hash;
- contextual role, necessity, authorization state, issuer identity, decision
  identifier/version, and authenticated issuance/expiry information; and
- the relation to any **semantic execution identity** only where a consuming
  composite declares one. The semantic execution is not a substitute for,
  rewrite of, or equality requirement on the perception execution. Their exact
  association with the same source snapshot must be authenticated where used.

The verifier receives raw decision material plus an independently established
verification mechanism and authenticated authority state. A verified-looking
object, matching fields or hashes, caller-supplied attestation, or compile-time
brand has no authority by itself.

## Pure replay semantics

This verifier performs no mutation and cannot redeem a decision. Identical,
authorized verification is valid repeatedly when authenticated authority state
permits it. It rejects a replayed or otherwise invalid context only when that
state establishes the decision/use is invalid, consumed, conflicting, foreign,
expired, revoked, or unauthorized. Stateful one-time redemption and atomic
anti-replay enforcement belong to a separately authorized lifecycle/persistence
owner and are explicitly out of scope.

## Future SEM-CUTOVER-006 boundary

`SEM-CUTOVER-006` may consume this contract only after this ticket's independent
CK PASS and a separate ownership-reconciliation HMN. Its finalizer must not
accept a caller-supplied `AcceptedContextEvidence` or a pre-verified-looking
structure. The later integration must pass raw decision material through the
qualified verifier using an injected independently owned trust source (or
authenticated receipt verifier) in the same finalization boundary; absence or
failure yields `SOURCE_RELATIONSHIP_BLOCKED` before canonical output. A brand,
cast, or finalizer-local hash check is not an alternate path.

## Review contract

| ID | PASS iff | Negative / boundary |
| --- | --- | --- |
| `RC-ACV-01` | The verifier accepts only a decision actually authenticated by the controlled authority mechanism; raw caller assertions cannot confer authority. | Forged objects, TypeScript brands, hashes, and caller attestation IDs reject. |
| `RC-ACV-02` | Exact project/workspace/bundle/document/source, distinct execution identities, revision, locators, asset, role, necessity, and authorization bindings are checked. | Foreign or mismatched binding rejects before a verified decision is returned. |
| `RC-ACV-03` | Trusted expiry, revocation, and authority-state freshness are checked; missing, unauthenticated, stale, or indeterminate state fails closed. | No production issuer/status service is fabricated. |
| `RC-ACV-04` | Controlled fixtures exercise actual positive verification and valid idempotent repeated verification, plus invalid/replayed-context rejection when trusted state says it is invalid. | The verifier neither mutates redemption state nor claims atomic anti-replay. |
| `RC-ACV-05` | The implementation remains pure and provider-neutral with zero finalizer, worker, provider, repository, SQL, runtime, review, Master, or publication effect. | REL-03, SEM-005, and interoperability contracts remain unchanged. |

## Authorized files

- `packages/atlas-skills/src/accepted-context-decision-verifier.ts`
- `packages/atlas-skills/tests/accepted-context-decision-verifier.test.ts`
- `packages/atlas-skills/src/index.ts` — exports only
- this ticket and the corresponding HMN/GO/CK evidence artifacts

## Required qualification

Use a deterministic, test-only fixture trust root, fixture issuer, fixture
status source, and controlled clock. The fixtures must exercise actual
authentication/verification behavior and be incapable of granting production
acceptance. Prove an authenticated exact-binding positive and valid idempotent
repeat; reject forged, foreign, mismatched, expired, revoked, duplicate or
invalid-use-as-reported-by-trusted-state, unsupported, malformed, missing, and
stale authority-state cases. The suite does not prove a real production issuer
exists and does not add a deployed issuer requirement to the existing offline
SEM-CUTOVER-006 CK oracle.

## Exclusions and STOP conditions

Do not modify any finalizer, worker, provider, packet/grant owner, REL-03,
SEM-005, interoperability owner, repository, SQL/migration, runtime, review,
Master, publication, or canonical RUN-003 path. Preserve all dirty/untracked
work and the REL-03 recovery snapshot.

Stop `OWNERSHIP_CONFLICT_BLOCKED` if implementation requires issuing a
decision, deploying/managing trust keys, persisting revocation or redemption
state, performing atomic anti-replay, or changing any excluded path. Stop
`BLOCKED_AUTHORITY` if no independently authenticated verification mechanism
can be represented even for the pure contract. Do not begin SEM-CUTOVER-006.

**Terminal:** independent CK PASS of this pure verifier contract, or an exact
blocked-owner record. A PASS proves only the offline verifier; production
accepted-context operation stays fail-closed until its independently owned
production authority exists.
