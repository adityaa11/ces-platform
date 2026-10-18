# BSS-V2-006-05-01 — Authorized enforcement-policy provenance

- **State:** `approved`; executable leaf, not GO/CFC/HMN authority or CK PASS.
- **Review batch:** `BSS-V2-BATCH-06-05-01`.
- **Parent:** [BSS-V2-006-05 split map](BSS-V2-006-05-policy-driven-optional-capacity-dimensions-anoman.md).
- **Dependencies:** all parent predecessors remain mandatory; no BSS-V2-006 runtime implementation is authorized by this leaf.

## Outcome

BSS-V2-005 alone introduces the immutable, versioned, provider-neutral enforcement-selection policy bound to the exact `anoman-shared-prod` profile version `2026-10-18.1`. It derives one authenticated effective policy only when an explicit server-side authorization permits the unknown, unpublished RPD to be `not_enforced`; all known positive dimensions remain `enforced`. The provider profile remains immutable and unaltered.

## Authorized scope

Add the policy schema, provenance/approval binding, validation and deterministic effective-policy derivation. Establish exact domain/profile/route/version binding, policy revision and revocation semantics. Absence, stale/foreign/forged approval; unknown enforced window/accounting/reset; unknown dimension without its authorized exception; known zero; and any caller-supplied mask fail closed. No route activation, plan publication, snapshot endpoint, BSS-V2-006 admission change, transport, provider call or migration-0076 rewrite belongs here.

## Review contract

`RC-00605-01` is discharged only when the real migration-0076 Anoman fixture retains RPM=20, TPM=40,000, concurrency=25 and RPD=unknown, and a distinct authorized immutable exclusion is both necessary and sufficient for the effective policy. Missing, forged, stale, wrong-domain/version, or revoked exclusions block. Assert that known RPD remains enforced, known zero never becomes usable, and neither route/model nor client can choose a conflicting domain mask.

## SecurityReadiness

- `SR-0501-T1`: immutable catalogue/profile provenance crosses into a separately approved BSS-V2-005 policy authority.
- `SR-0501-A1`: policy approval, profile version, quota-domain identity and enforcement decision are sensitive authority assets.
- `SR-0501-C1`: prohibit direct BSS-V2-006 publication, caller-selected masks, profile mutation and fabricated numeric/reset values.
- `SR-0501-R1`: CK verifies immutable source/approval/version binding and every fail-closed negative above with PostgreSQL migrations and roles.

## Hard stop

If the BSS-V2-005 policy owner, authorization provenance, immutable storage, or permitted unknown-exclusion rule cannot be frozen, stop `BLOCKED_AUTHORITY`. Parent hard-stop and boundary clauses are incorporated without change.
