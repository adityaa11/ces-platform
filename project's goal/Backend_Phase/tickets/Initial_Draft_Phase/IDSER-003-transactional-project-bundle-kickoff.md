# IDSER-003: Transactional project bundle kickoff

- **State:** `planned`
- **Review batch:** `IDSER-BATCH-03`
- **Depends on:** IDSER-001 and IDSER-002 `PASS`; PCC-006 and BSS-006/007/009 frozen.
- **Baseline:** SRC-IDSER-01 sections 8-12, 23, 25, 37, 41.1-41.2; AC-01/02/03/05/06/24/37/38. See [README](README.md).
- **Execution environment:** Docker Compose for real PostgreSQL/pg-boss and DocumentStore integration.

## Outcome

Extend the existing authenticated PCC creation operation so all uploaded PRDs
belong to one ordered bootstrap bundle and the first perception job is durable
in the same transaction as the project graph.

## Inspected seams and edit scope

- Extend `packages/atlas-core/src/project-creation.ts` and `project.ts`, `packages/atlas-db/src/project-repository.ts`, and the Atlas transaction adapter introduced for this operation.
- Compose `packages/atlas-db/src/perception-authority.ts` with the caller's transaction through a bounded seam; preserve its source grant/result semantics and the Core PerceptionAuthority abstraction.
- Reuse `apps/agents-bridge/src/queue.ts` transactional producer pattern and `perception-job.ts` parser/queue identity. Locate any shared producer adapter at an appropriate existing package boundary rather than making Core import Bridge application runtime.
- Wire through `apps/atlas/project-creation-boundary.ts`; retain the real session, signed internal identity, membership, multipart, same-origin and safe-error boundaries.

## Atomic creation contract

```text
validate command -> DocumentStore.put ALL PRDs -> shared PostgreSQL transaction
  project + owner + empty Master + bootstrap initial_draft + document metadata
  extraction_bundle + ordered extraction_bundle_document rows
  D1 perception execution + source grant + atlas-document-perception-v1 job
-> commit -> bounded existing creation summary
```

- Preserve source-upload order from the command array as a persisted sequence; timestamps, filenames, hashes or later SQL row order must not reconstruct it.
- Exactly one bootstrap bundle represents this creation cohort. Store semantic/reconciliation contract versions and count N; X starts at zero. No second cohort is created on accidental internal replay.
- Use stable document ID as BSS-009 artifact identity. Derive stage idempotency from bundle/document/stage/version, never display wording or filenames.
- `PostgresAtlasProjectRepository.create` and `PostgresPerceptionAuthority.create` currently begin separate postgres.js transactions, while the queue producer accepts Drizzle transactions. Implement and test one actual transaction connection/adaptation shared by these operations. A separately committed nested call is not atomic composition.
- Reuse pg-boss APIs and restricted producer privileges; no handwritten replacement broker, in-memory after-commit callback, new polling service or queue framework.
- Queue availability/initialization uses the existing worker/pg-boss startup boundary. If enqueue cannot commit, creation fails with no visible partial graph. A null/deduplicated enqueue outcome must be reconciled with the matching logical identity, not blindly treated as a scheduled new operation.
- Only D1 perception is scheduled. Future document scheduling belongs to IDSER-007. Source grant expiration/failure must remain bounded; do not modify BSS-009 validity policy to make delayed jobs pass.
- Keep DocumentStore writes before metadata. Storage failure leaves no project; DB/queue failure may leave unreferenced immutable objects as already permitted by PCC. Do not invent DocumentStore deletion/rollback.
- Do not backfill old PCC cohorts or guess historical upload order. New flow tests explicitly extend PCC's former no-perception assertion; retain its storage, auth, atomicity and fixture regressions.

## Acceptance criteria

1. A real creation commits one owner/project, empty Master, bootstrap workspace, all document metadata, one bundle/ordered manifest, and only D1 perception execution/grant/job together.
2. Failure at any DB/queue write rolls back the entire graph/job; process death after commit cannot lose kickoff.
3. Concurrent duplicate project IDs remain race-safe and fail with a bounded conflict. No duplicate logical kickoff is accepted as a different execution.
4. Queue payload has only the BSS-009 request and idempotency identity, with no storage keys or PDFs. Public response remains safe and bounded.
5. Existing source validation/limits and `/demo` behavior remain unchanged; no semantic acceptance or progress completion is fabricated.

## Validation

- Compose integration tests inspect Atlas and pg-boss rows before/after commit, rollback, injected enqueue failure and crash immediately after commit.
- Test 1, 2 and 3 PRDs for exact input order; same filenames/content do not collapse different document/cohort identities.
- Test storage failure before transaction, duplicate IDs including concurrent requests, absent queue readiness, and transaction/queue adapter failure.
- Run Core creation tests, DB project/perception repository tests, transactional queue tests and affected app creation/auth tests. Preserve real BSS-007 byte/hash fidelity.
- Demonstrate first job visibility only after commit using a second DB connection; mocked enqueue call order alone is insufficient.

## Security Refactor Readiness

- **Status:** `applicable`.
- **Inherited boundaries:** PCC user authorization, DocumentStore source-before-metadata safety, BSS-006 producer permissions and BSS-009 scoped source grants.
- **Trust boundaries / assets:** authenticated intake -> source store -> Atlas transaction -> queue; PDFs, storage keys, ownership and capabilities.
- **Identity context:** server-derived creator and stable project/workspace/bundle/document/execution/version identities.
- **SEAM-IDSER-003-01:** One persistence-neutral orchestration/unit-of-work boundary composes existing responsibilities atomically.
- **SEAM-IDSER-003-02:** Typed source/queue failure mapping keeps internals and capabilities out of browser errors/logs.
- **COUPLING-IDSER-003-01:** No post-commit-only kickoff, direct filesystem storage, independent nested commit or Bridge trusted-state mutation.
- **Unresolved security policy:** orphan cleanup and historical cohort backfill remain deferred.
- **Planning findings:** PLAN-IDSER-01 is owned here; an evidenced inability to retain frozen BSS semantics is `SCOPE_CHANGE`, not permission to weaken atomicity.

| Mandatory review binding | Readiness reference | Question / evidence |
|---|---|---|
| REV-READY-IDSER-003-01 | SEAM-IDSER-003-01 | Do actual DB/job visibility and crash tests prove a shared transaction? Compose PostgreSQL evidence. |
| REV-READY-IDSER-003-02 | COUPLING-IDSER-003-01 | Are all sources stored before commit and only the first document queued? Ordered integration and import review. |
| REV-READY-IDSER-003-03 | SEAM-IDSER-003-02 | Are failure responses/logs bounded without source keys/credentials? Negative transport tests. |

## Review checkpoint

**Question:** Can a committed production project ever lose its first job or expose
a partial bundle graph? The answer must be no, with actual transaction evidence.

**Implementation checkpoint:** Not started; record commit and Compose evidence.
