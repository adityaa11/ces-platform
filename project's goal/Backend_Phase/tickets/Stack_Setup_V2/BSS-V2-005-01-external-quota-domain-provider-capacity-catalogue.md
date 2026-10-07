# BSS-V2-005-01: External quota-domain and provider-capacity catalogue

- **State:** `planned`
- **Review batch:** `BSS-V2-BATCH-05-01`
- **Dependencies:** BSS-V2-001/002 CK `PASS`; BSS-003 role/migration boundaries
- **Parent:** [BSS-V2-005](BSS-V2-005-quota-domain-capacity-foundation.md)

## Outcome

Represent secret-free external upstream quota domains and versioned capacity profiles with explicit known/unknown/zero RPM, TPM, RPD and concurrency limits plus source/effective metadata and quota-accounting policy identity.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00501-01 | Quota-domain identity is a server-controlled non-secret shared-capacity identity, not an API key/model synonym. | PASS iff multiple configured routes may share one domain, aliases expose no credentials, and invalid domain references fail. |
| RC-BSSV2-00501-02 | RPM/TPM/RPD/concurrency limits distinguish known positive, known zero and unknown. | PASS iff no unknown limit silently becomes positive and zero produces structural unavailability. |
| RC-BSSV2-00501-03 | Every capacity profile records source, source/version reference, observed/effective time and profile version. | PASS iff refreshed/operator-changed limits create traceable versions rather than mutating history invisibly. |
| RC-BSSV2-00501-04 | Quota accounting is versioned independently from billing/cost weighting. | PASS iff Anoman/provider weighted billing metadata cannot be treated as TPM unless an explicit accounting-policy version says so. |
| RC-BSSV2-00501-05 | Local Docling remains outside external quota-domain semantics. | PASS iff no local route needs fake RPM/TPM/RPD/provider-account metadata and existing local readiness remains valid. |

## Non-authority

No process fairness, planner allocation, runtime window counters, provider calls, product entitlement, price/cost ledger or customer allowance belongs here.

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-BSSV2-00501-BRIDGE-OPS` keeps provider capacity in Bridge operational configuration/persistence; `BOUNDARY-BSSV2-00501-ROUTE-REGISTRY` keeps route qualification server-controlled; `BOUNDARY-BSSV2-00501-LOCAL-DOCLING` excludes local perception from external quota semantics.
- **Trust boundary:** `TRUST-BSSV2-00501-CAPACITY-INPUT` is the admission of provider API/docs, operator configuration, or qualified observation into a versioned capacity profile with explicit provenance.
- **Sensitive assets:** `ASSET-BSSV2-00501-PROVIDER-ACCOUNT` is represented only by a non-secret alias; credentials and raw authorization material must never be persisted in catalogue fields or evidence.
- **Identity context:** `IDENTITY-BSSV2-00501-QUOTA-DOMAIN` binds quota domain, associated qualified routes/capabilities, capacity/accounting/source versions, observed/effective times, and profile version.
- **Extension seams:** `SEAM-BSSV2-00501-LIMIT-DIMENSION`, `SEAM-BSSV2-00501-CAPACITY-SOURCE`, `SEAM-BSSV2-00501-ACCOUNTING-POLICY`, and `SEAM-BSSV2-00501-PROFILE-VERSION` permit later provider-policy hardening without key/model coupling.
- **Prohibited couplings:** `COUPLING-BSSV2-00501-SECRET-IDENTITY` forbids API keys as domain IDs; `COUPLING-BSSV2-00501-MODEL-POOL` forbids assuming model/route isolation; `COUPLING-BSSV2-00501-BILLING-AS-QUOTA` forbids cost weight as TPM; `COUPLING-BSSV2-00501-DOCLING-QUOTA` forbids fake local-provider metadata.
- **Verification seams:** `VERIFY-BSSV2-00501-SCHEMA`, `VERIFY-BSSV2-00501-REDACTION`, `VERIFY-BSSV2-00501-SHARED-DOMAIN`, and `VERIFY-BSSV2-00501-HISTORY` cover validation, secret exclusion, multi-route sharing, and immutable provenance/versioning.
- **Unresolved security policy:** `SEC-GAP-BSSV2-00501-LIMIT-AUTHORITY` leaves future canonical provider-limit source and rotation/governance policy unresolved; unknown values remain unknown/conservative.
- **Review bindings:** `REV-READY-BSSV2-00501-01` verifies secret-free domain identity and shared-route mapping; `REV-READY-BSSV2-00501-02` verifies known/unknown/zero plus provenance/version history; `REV-READY-BSSV2-00501-03` verifies accounting separation, local Docling exclusion, and Bridge role boundaries.

## Workflow evidence

Implementation must close every Review Contract row using deterministic catalogue/configuration/migration/role tests, record exact Compose commands/counts and redacted state evidence in a compact closure ledger, then reach `READY_FOR_CK`. This ticket grants no GO by itself.
