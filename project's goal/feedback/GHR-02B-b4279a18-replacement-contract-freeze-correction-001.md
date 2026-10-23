# GHR-02B CK correction 001 — canonical Docker evidence

- **Corrects:** [GHR-02B-b4279a18-replacement-contract-freeze.md](GHR-02B-b4279a18-replacement-contract-freeze.md)
- **Ticket:** `GHR-02B`
- **Canonical Compose project:** `atlas-canonical-perception`
- **Decision:** `APPEND_ONLY_EVIDENCE_CORRECTION`
- **Scope:** evidence-location correction only; no production, ticket, or workflow-authority change.

## Correction

The earlier CK artifact incorrectly described the PostgreSQL integration as
unavailable because the host shell had no `DATABASE_URL`. The required
canonical Docker Compose environment was running and was inspected directly.
That shell-level absence was not evidence that the canonical environment was
unavailable.

No fixture was created and no canonical database or volume was mutated during
this correction. The inspection used the running PostgreSQL container
`atlas-canonical-perception-postgres-1` with read-only SQL.

## Canonical Docker observations

For the fresh authorized normal-path run recorded by the GO checkpoint:

- Project: `d58ef5a5-d010-44f3-a21d-7e79a1186cee`
- Workspace: `fe6144a3-7526-468a-a4cc-4ba66f1586f3`
- Bundle: `e114c28c-cfe1-4d34-828b-bdfff2e99a3d`
- Document: `199e181f-7211-4809-a9b3-ed262d2b209c`
- Execution: `9af1bf28-55cb-4ee1-825d-990ce127bdd8`
- Completion fingerprint: `eb94f6e4cab4804c3c40e51066d1bdbc2c1783367c647e431fddaddf4772f437`
- Execution/member state: `completed` / `perceived`
- Intent count: `1`
- Job: exactly one `atlas-generic-handoff-v1` job in `created` state
- Job data: `{"type":"GenericHandoffJob/v1","handoffId":"ghr-handoff-v1-bae775ca92633f15867d1f04a0a8cc468da33f53c229f23ea3a6cf23a63e0d7f"}`
- Singleton key: `ghr-ndv1-v1-bae775ca92633f15867d1f04a0a8cc468da33f53c229f23ea3a6cf23a63e0d7f`, matching the immutable intent idempotency key
- Semantic execution count: `0`
- Semantic candidate count: `0`
- Bridge delivery table: absent (`bridge.generic_handoff_delivery = NULL`)

The running container inventory was healthy for Atlas, agents-bridge,
agents-bridge-worker, Docling, and PostgreSQL. The canonical evidence
therefore satisfies the amended positive normal-path evidence location for
`RCK-001.a). The protected-clone rollback result remains the previously
recorded transaction-only evidence; it was not rerun against canonical.

## Corrected interpretation

Replace only the prior artifact's statement that the integration environment
was unavailable with this Docker evidence. The replacement-contract freeze
decision remains unchanged: `REPLACEMENT_CONTRACT_FROZEN`. This correction is
not a `PASS`, does not authorize CFC, and does not rewrite historical
`CK-001.a`.
