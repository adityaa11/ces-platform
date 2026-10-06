# CK verification: IDSER-001 / IDSER-BATCH-01

- Ticket / batch: `project's goal/Backend_Phase/tickets/Initial_Draft_Phase/IDSER-001-domain-and-persistence-foundation.md` / `IDSER-BATCH-01`
- Reviewed remediation commit: `63fb27f`
- Original reviewed commit: `8f89626d0b95649f962be83a03094bf95fca81e5`
- Frozen ticket reference: IDSER-001 at `awaiting_review`.
- Review type: bounded post-CFC verification of the original consolidated findings; no new full review was performed.
- Result: `CHANGES_REQUIRED`

## Verification evidence

- The remediation delta is limited to migration `0013`, migration registration, the semantic-foundation integration test, and the IDSER-001 CFC checkpoint note.
- CK-001 is resolved in `0013_idser001_scope_and_lifecycle_remediation.sql`: updates that preserve `bundle_id`, `document_id`, and `sequence` can advance member lifecycle fields; manifest identity changes, insertions, and deletions remain guarded after processing starts. The integration test now exercises a post-start member update and rejects a sequence change.
- CK-002 is not fully resolved. The migration adds many composite scope constraints, but `knowledge_index_candidate_scope_fkey` references only `semantic_candidate(id)` while `knowledge_index`'s project/workspace/bundle/document columns remain independently writable. Its `UNIQUE` keys do not assert that those scope values match the candidate. Also, `reconciliation_relationship.target_semantic_id` retains only the original single-column foreign key to `knowledge_index(semantic_id)`; there is no composite target constraint tying the target to the relationship's project/workspace/bundle. Both paths still permit a relationship/index to refer across the required scope boundary.
- `docker compose ps` remains unable to connect to the Docker engine because access to `npipe:////./pipe/docker_engine` is denied. No Compose migration or database-backed verification was run. `git diff --check 8f89626d0b95649f962be83a03094bf95fca81e5..HEAD` passed.

## Original findings

| ID | Original status | Verification |
|---|---|---|
| CK-001 | RESOLVED | Member lifecycle updates work at the trigger logic level while manifest identity remains protected. The committed integration test now covers a post-start lifecycle update and a rejected sequence edit. Runtime execution could not be repeated because Docker is unavailable. |
| CK-002 | UNRESOLVED | Composite scope enforcement remains incomplete for the knowledge-index-to-candidate scope and optional relationship target scope, as described above. |

## Direct remediation regressions

No direct regression in the behavior needed to assess CK-001 or CK-002 was identified in the reviewed delta.

## Decision

CK-001 is resolved. CK-002 remains unresolved, so this bounded verification result is `CHANGES_REQUIRED`. The remaining issue is limited to the original scope-integrity finding; do not start another CFC pass from this verification. Keep IDSER-001 at `awaiting_review` and return control to human/planning authority.
