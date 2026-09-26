# PCC-006: Project-card creation end-to-end and regression checkpoint

- **State:** `awaiting_review`
- **Review batch:** `PCC-BATCH-06`
- **Depends on:** PCC-001 through PCC-005 `PASS`
- **Execution environment:** Docker Compose is the authoritative environment for the full two-user flow, PostgreSQL, Better Auth, migrations, DocumentStore, app tests/builds, and regression evidence; host-local commands are diagnostic only.
- **Baseline:** `SRC-PCC-01` review/Compose rules; `SRC-PCC-02` §§38–47 and AC-01–AC-32; `SRC-PCC-04`; `SRC-PCC-05`; `SRC-PCC-06`

## Outcome

Prove the complete bounded production flow against real Better Auth,
PostgreSQL, and the approved local `DocumentStore` adapter while preserving
authorization isolation, fixture behavior, security boundaries, frontend
quality, and the hard stop before Document Perception.

This is the final checkpoint for the ticket set. It does not add new product
behavior or repair an incomplete predecessor by weakening its acceptance
criteria.

## Scope

- Create or use two unique real Better Auth test users and establish isolated sessions through the approved auth boundary.
- Request authenticated `/home`, confirm the production `+ New project` control, submit a unique project with valid metadata and one or more synthetic PDFs through `POST /api/projects`, and confirm the successful response.
- Verify the database contains the real project, creator owner membership, empty Master, Initial Draft, and one document metadata row per uploaded PRD.
- Read each stored object through `DocumentStore` and verify byte identity, SHA-256, byte size, and `application/pdf` media type; verify raw bytes are absent from ordinary Atlas rows and logs.
- Request `/home` again and verify the new authorized card, exact waiting-state meaning, `0 of N PRDs processed`, `0%`, `N PRDs uploaded`, no published Master work, no `/demo` action, and no fixture Share action.
- Verify User B without membership cannot see or access User A's project through `/home` or the project read boundary.
- Exercise the failure matrix: missing/invalid metadata, duplicate Project ID, no PRD, zero-byte PRD, non-PDF/spoofed content, 20 MiB overflow, oversized request, unauthenticated request, rejected origin/CSRF, storage failure, PostgreSQL failure, and double submit.
- Prove storage failure and database failure do not expose a partially created Atlas project, even if a storage object becomes unreferenced.
- Inspect pg-boss/perception tables and service calls to prove no `atlas-document-perception-v1` job, perception execution, source grant, normalized cache, Bridge call, semantic state, review state, CES state, or publication state was created.
- Run the approved auth, stack, `/demo`, CSP/render, build, test, type, lint, and directly affected regression checks in Docker Compose.
- Perform frontend review-gate inspection for the changed Project Library/card/dialog at desktop, narrow desktop/tablet, mobile, 200% zoom or equivalent reflow, light/dark themes, keyboard focus, loading, success, validation-error, request-error, empty, and unavailable-action states.

Keep test cleanup limited to unique test identities and test-created data in
the supported environment. Do not add production cleanup/admin routes or fixed
reusable accounts.

## Acceptance criteria

- The complete real-user flow succeeds from authenticated `/home` through production project creation and back to the authorized waiting card.
- The creator is the persisted owner; a second user without membership cannot see the project.
- Every accepted PRD is stored through BSS-007 and can be read back byte-identically; the source metadata is sufficient for later BSS-009 handoff.
- The project is not visible until all source writes and the Atlas metadata transaction succeed.
- The card truthfully reports waiting for extraction and does not claim extraction, review readiness, extracted facts, published facts, publication, or 100% progress.
- No production card links to `/demo`, exposes fixture sharing, or mutates fixture state.
- Invalid, unauthenticated, cross-origin/CSRF, duplicate, oversized, unsupported, storage-failure, database-failure, and double-submit paths are bounded and retryable where appropriate.
- No raw PDF bytes, base64 payload, session cookie, auth secret, database URL, filesystem path, storage key, raw SQL, stack trace, or provider credential is returned or logged.
- No downstream BSS-009 execution or semantic/domain state is created as a side effect.
- `/demo`, sign-up, sign-in, sign-out, Better Auth lifecycle, BSS-007, BSS-009, CSP, build, and directly affected frontend behavior remain valid.
- Frontend review gate VIS-001 through VIS-015 passes for the affected production/fixture shared surfaces, or any non-blocking finding is recorded explicitly in the checkpoint evidence.

## Validation evidence required

Record the exact reviewed `HEAD`, Compose service health, commands, test counts,
intentional skips, environment limitations, and visual inspection results.

Start PostgreSQL with `docker compose up -d postgres` and wait for `healthy`
before database-backed checks. Use `docker compose up -d --build` for the full
stack, and run all package/application commands through the Compose-managed
`atlas` service. A host-local database, Node/pnpm run, or fixture-only result is
not authoritative checkpoint evidence.

At minimum, run the relevant equivalents of:

```text
docker compose up -d --build
docker compose ps
docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/app test
docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/auth test
docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db migration:check
docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/document-store test
docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/app lint
```

Add the directly affected `@atlas/core`/`@atlas/db` typechecks and tests and
the application-level integration command used for the real two-user flow.
`docker compose ps` is a health gate, not a substitute for these checks.

## Security Refactor Readiness

Status: applicable

### Inherited boundaries

- `BOUNDARY-PCC-006-01` Better Auth, Atlas/PostgreSQL, DocumentStore, Agents Bridge, pg-boss, and fixtures retain their declared authorities.
- `BOUNDARY-PCC-006-02` The checkpoint measures the frozen PCC ticket set; it does not authorize new project, document, extraction, or security policy.

### Trust boundaries

- `TRUST-PCC-006-01` The test exercises browser-shaped cookie/multipart requests through the real application boundary.
- `TRUST-PCC-006-02` Assertions connect persisted owner membership and document metadata to the exact stored source bytes.
- `TRUST-PCC-006-03` Negative assertions measure that failed/unauthorized states do not become visible Atlas authority.

### Sensitive assets and identity context

- `ASSET-PCC-006-01` Test credentials, cookies, source bytes, storage metadata, database configuration, and auth secrets must remain bounded and absent from logs/evidence.
- `IDENTITY-PCC-006-01` User A/User B isolation must be proven using real Better Auth identities and Atlas membership, not fixture roles.

### Required seams

- `SEAM-PCC-006-01` Application integration coverage must exercise the production HTTP/service/read seams together while preserving package-level BSS and auth proofs.
- `SEAM-PCC-006-02` Failure tests must prove non-visibility after storage/database failure without adding cleanup authority to production.
- `SEAM-PCC-006-03` Frontend inspection must compare every affected use of the shared components, not only the happy-path `/home` render.

### Prohibited couplings

- `COUPLING-PCC-006-01` Do not replace real integration evidence with fixture-only tests, fixed accounts, or weakened assertions because the environment is inconvenient.
- `COUPLING-PCC-006-02` Do not use test cleanup, direct database writes, or fixture sessions as production implementation paths.
- `COUPLING-PCC-006-03` Do not treat a green card render as evidence that extraction, review, CES, or publication has started.

### Intentionally unresolved security policy

- `SEC-GAP-PCC-006-01` Full security-baseline review, operational orphan cleanup, malware scanning, abuse prevention, sharing policy, and later document access policy remain future work.

### Mandatory review bindings

- `REV-READY-PCC-006-01`
  Ref: `SEAM-PCC-006-01`
  Question: Does end-to-end evidence exercise the real auth, upload, persistence, DocumentStore, and authorized-read boundaries together?
  Evidence: reviewed integration test, database/storage assertions, and exact commands/results.
- `REV-READY-PCC-006-02`
  Ref: `SEAM-PCC-006-02`
  Question: Do storage and database failure paths prevent any partially visible project without adding unsafe cleanup authority?
  Evidence: injected failure runs and two-user/read visibility assertions.
- `REV-READY-PCC-006-03`
  Ref: `SEAM-PCC-006-03`
  Question: Does the final UI remain coherent and accessible across all affected route/theme/responsive states while `/demo` remains unchanged in meaning?
  Evidence: visual captures/inspection notes, render tests, and frontend review gate result.

## Review checkpoint

- **Review question:** Does the complete production project-card flow satisfy the frozen creation context without fixture leakage, partial visibility, private-data exposure, or downstream extraction side effects?
- **Combined acceptance:** Real two-user/auth/storage/database evidence, failure coverage, no-perception proof, regression checks, and frontend review evidence are recorded against the reviewed commit.
## Implementation checkpoint

- **Implemented:** PCC-006 strengthens the Compose-backed production integration proof. It verifies the persisted owner membership, empty Master and Initial Draft, document workspace association, immutable source bytes/SHA-256/size/media-type metadata, and source-specific absence of perception executions, grants, normalized cache, and derived assets. Compose-only `storage` and `database` fault seams exercise the real HTTP boundary and prove no project becomes visible after either failure.
- **Validated:** rebuilt Compose Atlas/PostgreSQL services were healthy. The focused production two-user suite passed **2/2** (`project-create` and `project-home`), with the latter proving User B cannot see User A's waiting card. The storage-failure configuration passed **1/1**; the database-failure configuration passed **1/1**. Targeted ESLint passed for the boundary and focused tests; `git diff --check` passed.
- **Environment note:** The normal Atlas Compose service was restored after the failure runs. Broader ticket-required package/build/browser suites remain to be recorded before review.
- **Next state:** `awaiting_review`; this commit is the PCC-006 checkpoint and requires CK before any completion decision.
