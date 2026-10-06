# Review: IDSER-001 / IDSER-BATCH-01

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-001-domain-and-persistence-foundation.md` / `IDSER-BATCH-01`
- Reviewed commit: `8f89626d0b95649f962be83a03094bf95fca81e5`
- Frozen ticket reference: IDSER-001 at the reviewed commit; state `awaiting_review`.
- Result: `CHANGES_REQUIRED`

## Evidence

- `HEAD` is `8f89626d0b95649f962be83a03094bf95fca81e5` (`feat(atlas): add idser domain persistence foundation`). The commit contains the IDSER-001 implementation and its awaiting-review checkpoint. The working tree has no tracked changes; untracked PDFs and planning/review documents do not modify the committed implementation target.
- Static review covered the committed migrations `0009`-`0012`, the Core contracts, the semantic-foundation repository seam, and its integration test against IDSER-001's storage contract, invariants, acceptance criteria, and explicit review bindings.
- `docker compose ps` could not connect to the Docker engine: access to `npipe:////./pipe/docker_engine` was denied (Docker config access was also denied). No Compose migration, PostgreSQL, permission, or package checks were performed during this review.

## Findings

| ID | Classification | Requirement / authority | Location | Evidence | Required correction |
|---|---|---|---|---|---|
| CK-001 | IMPLEMENTATION_DEFECT | IDSER-001 scope and invariants; acceptance criterion 3: manifest mutation after processing starts must be rejected while lifecycle remains usable. | `packages/atlas-db/migrations/0009_idser001_domain_persistence_foundation.sql`, `atlas.assert_bundle_manifest_mutable`; migrations `0010` and `0011` preserve this behavior. | The trigger rejects every `UPDATE` to a bundle member whenever its bundle state is not `waiting`. That includes required processing updates such as changing a member from `pending` to `perceiving` or recording execution IDs and completion state. The trigger therefore makes the declared member lifecycle unusable after processing begins. | Restrict post-start immutability to manifest identity/membership fields (including insert/delete and changes to bundle/document/sequence), while allowing permitted lifecycle fields to advance. Add database-backed coverage that starts a bundle, rejects manifest edits, and accepts valid member lifecycle updates. |
| CK-002 | IMPLEMENTATION_DEFECT | IDSER-001 required storage contract and scope invariants; acceptance criterion 3; mandatory binding `REV-READY-IDSER-001-01`: wrong-scope membership, result, evidence, and relationship references must fail. | `packages/atlas-db/migrations/0009_idser001_domain_persistence_foundation.sql`, definitions of `extraction_bundle_document`, `semantic_execution`, `semantic_extraction_result`, `semantic_candidate`, `semantic_evidence`, `knowledge_index`, `semantic_reconciliation_result`, and `reconciliation_relationship`. | Bundle membership references a document only by globally unique `document_id`, without requiring its project/workspace to match the bundle. Result and candidate rows carry independent project/workspace/bundle/document values but lack composite constraints tying them to the referenced execution/result/member. Evidence independently references a candidate and document, so evidence for another document can be attached. Reconciliation and relationship rows similarly do not constrain denormalized scope values to the referenced bundle, result, or indexed semantics. These definitions permit wrong-scope links that the ticket explicitly requires PostgreSQL to reject. | Add relational composite keys/foreign keys (or equivalent database-enforced constraints) connecting bundle membership to the bundle's project/workspace and document scope, and connecting each result, candidate, evidence, index, reconciliation result, and relationship to the exact owning bundle/document/project/workspace/semantic records. Add database-backed negative cases for each required wrong-scope boundary. |

## Scope-change observations

None identified.

## Decision

Two implementation-repairable violations of the frozen IDSER-001 contract remain. The checkpoint result is `CHANGES_REQUIRED`. Compose evidence could not be rerun in this environment; the findings above are established directly by the committed database definitions and trigger behavior. Keep IDSER-001 at `awaiting_review`; a bounded CFC remediation and re-review are required before IDSER-002.
