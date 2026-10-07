# BSS-V2-005-01: External quota-domain and provider-capacity catalogue

- **State:** `approved` following CK `PASS` for reviewed commit `e8fa864`; **Review batch:** `BSS-V2-BATCH-05-01`.
- **GO checkpoint:** [BSS-V2-BATCH-05-01-go.md](../../../feedback/BSS-V2-BATCH-05-01-go.md).
- **CK verification:** [BSS-V2-BATCH-05-01-e8fa864-verification.md](../../../feedback/BSS-V2-BATCH-05-01-e8fa864-verification.md).
- **Dependencies:** BSS-V2-001/002 CK `PASS`; BSS-003 role/migration boundaries
- **Parent:** [BSS-V2-005](BSS-V2-005-quota-domain-capacity-foundation.md)
- **Planning authority:** [Provider admission/staged semantic context](../../atlas-provider-admission-staged-semantic-pipeline-implementation-context.md) §21.1

## Outcome

Represent secret-free quota domains and immutable/versioned capacity profiles with known/unknown/zero RPM, TPM, RPD and concurrency plus the exact per-dimension window/reset/refill semantics required to interpret them, source/effective metadata, and quota-accounting-policy identity.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-BSSV2-00501-01 | Quota-domain identity is server-controlled, non-secret shared-capacity identity, not an API key/model synonym. | PASS iff routes may share a domain, aliases expose no credential, invalid domain references fail. |
| RC-BSSV2-00501-02 | RPM/TPM/RPD/concurrency distinguish known positive, known zero and unknown. | PASS iff unknown never becomes positive and zero produces structural unavailability. |
| RC-BSSV2-00501-03 | Every non-instantaneous limit has a versioned window/refill policy and required parameters; concurrency is instantaneous. | PASS iff fixed/rolling/refill/provider-reset/daily semantics and RPD reset identity are explicit, and unknown reset semantics cannot become optimistic runtime refill. Conservative fallback is allowed only as separately versioned/provenanced input. |
| RC-BSSV2-00501-04 | Every profile records source/version reference, observed/effective time and immutable profile version. | PASS iff provider-fetched/operator-changed limits or window semantics create traceable versions. |
| RC-BSSV2-00501-05 | Quota accounting is versioned independently from billing/cost weighting. | PASS iff weighted billing metadata cannot become TPM without explicit accounting authority. |
| RC-BSSV2-00501-06 | Local Docling stays outside external quota semantics. | PASS iff no local route needs fake RPM/TPM/RPD/provider-account metadata. |

## Non-authority

No process fairness, planner allocation, runtime counters, provider calls, customer entitlement, price/cost ledger or final canonical provider-limit governance.

## Security Refactor Readiness

**Status:** `applicable`.

- **Trust boundary:** `TRUST-BSSV2-00501-CAPACITY-INPUT` admits provider API/docs/operator/qualified observations only into immutable capacity + window-policy versions with provenance.
- **Sensitive assets:** provider account is a non-secret alias; credentials/raw authorization never enter catalogue/evidence.
- **Identity context:** quota domain, routes, capacity/window/accounting/source versions and effective metadata.
- **Extension seams:** limit dimension, window policy, capacity source, accounting policy and profile version.
- **Prohibited couplings:** secret identity, model-is-domain, billing-as-quota, guessed reset/refill and fake Docling quota.
- **Verification seams:** schema/window validation, redaction, shared-domain mapping, immutable history and unknown/zero/reset negatives.
- **Unresolved policy:** canonical provider-limit source/rotation governance.
- **Review bindings:** CK verifies identity, limit/window semantics, immutable provenance/accounting separation, Docling exclusion and roles.

## Workflow evidence

Close every row with deterministic catalogue/configuration/migration/role/window fixtures and compact evidence; then `READY_FOR_CK`.
