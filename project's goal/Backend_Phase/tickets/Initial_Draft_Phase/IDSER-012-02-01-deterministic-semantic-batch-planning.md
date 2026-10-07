# IDSER-012-02-01: Deterministic semantic batch planning and provider resource envelopes

- **State:** `planned`
- **Review batch:** `IDSER-BATCH-12-02-01`
- **Dependencies:** IDSER-012-01-02 CK `PASS`; BSS-V2-004-03-01/02/03/05 CK `PASS`; BSS-V2-005/006 contracts CK `PASS`
- **Parent:** [IDSER-012-02](IDSER-012-02-provider-admitted-multi-batch-semantic-extraction.md)

## Outcome

From one accepted/perceived `NormalizedDocument v1`, create one document-level semantic execution plus a deterministic complete batch plan. Build an exact provider request and RequestResourceEnvelope for each batch without making a provider call.

## Review Contract

| Row | Required behavior | Binary closure oracle |
| --- | --- | --- |
| RC-0120201-01 | Same NormalizedDocument/profile versions produce the same ordered batch plan, stable batch IDs and plan hash. | PASS iff repeat build is deterministic and independent of provider/runtime state. |
| RC-0120201-02 | Every eligible source unit is represented exactly once across the batch plan or the document fails closed. | PASS iff duplicate, omitted, dangling or individually-unfit source units cannot silently continue. |
| RC-0120201-03 | Every batch is bounded by the active semantic WorkloadEnvelopeProfile and prepared through the approved provider-neutral source/prompt compiler. | PASS iff no batch exceeds corpus/request structural bounds and no provider-specific lifecycle branch appears. |
| RC-0120201-04 | Each batch receives a valid RequestResourceEnvelope derived from the exact request plus versioned estimator/accounting/safety policy. | PASS iff resource vectors stay within planning ceilings and weighted billing metadata is not substituted for TPM. |
| RC-0120201-05 | No provider work, semantic result acceptance, candidate materialization or reconciliation is emitted. | PASS iff this child is pure preparation plus durable document/batch planning only. |

## Security Refactor Readiness

**Status:** `applicable`.

- **Inherited boundaries:** `BOUNDARY-0120201-NORMALIZED-SOURCE` accepts only Atlas-accepted `NormalizedDocument v1`; `BOUNDARY-0120201-COMPILER` retains the provider-neutral source/prompt compiler; `BOUNDARY-0120201-NO-TRANSPORT` keeps preparation separate from provider transport and Atlas result acceptance.
- **Trust boundary:** `TRUST-0120201-PLAN-BUILD` converts accepted normalized source units plus versioned profiles into bounded requests and resource claims that later admission will trust.
- **Sensitive assets:** `ASSET-0120201-SOURCE-CORPUS` covers normalized document content and compiled request material; it must not be copied into admission metadata or ordinary evidence.
- **Identity context:** `IDENTITY-0120201-BATCH-PLAN` binds project/bundle/document/execution, normalized artifact, source-unit set, compiler/schema/workload/estimator/accounting versions, ordered batch IDs, and plan hash.
- **Extension seams:** `SEAM-0120201-STRUCTURAL-BOUND`, `SEAM-0120201-TOKEN-ESTIMATOR`, `SEAM-0120201-RESOURCE-ENVELOPE`, and `SEAM-0120201-PLAN-HASH` permit later policy/version changes without provider-specific lifecycle branching.
- **Prohibited couplings:** `COUPLING-0120201-PROVIDER-LIFECYCLE` forbids adapter identity in lifecycle planning; `COUPLING-0120201-WEIGHTED-AS-TPM` forbids billing weights as rate-limit truth; `COUPLING-0120201-SILENT-TRUNCATION` forbids omitted/duplicated/unfit units; `COUPLING-0120201-EARLY-EFFECTS` forbids provider work, candidate materialization, or reconciliation.
- **Verification seams:** `VERIFY-0120201-COVERAGE` proves exact source-unit partitioning; `VERIFY-0120201-DETERMINISM` proves stable order/IDs/hash; `VERIFY-0120201-BOUNDARY` proves structural and envelope ceilings; `VERIFY-0120201-NEGATIVE-EFFECTS` inspects DB/queue/transport absence.
- **Unresolved security policy:** `SEC-GAP-0120201-CONTENT-POLICY` leaves future privacy, legal, residency, retention, and provider-content policy outside this ticket.
- **Review bindings:** `REV-READY-0120201-01` verifies plan identity and exact source coverage; `REV-READY-0120201-02` verifies compiler/bounds/estimator seams with boundary and invalid-profile fixtures; `REV-READY-0120201-03` verifies prohibited provider coupling and zero downstream effects.

## Workflow evidence

Implementation must close every Review Contract row with deterministic fixtures and a compact closure ledger, record exact Compose commands/counts and scoped state observations, reach `READY_FOR_CK`, and only then move to `awaiting_review`. This ticket grants no GO by itself.
