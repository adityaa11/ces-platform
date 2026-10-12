# PERC-RESET-003 CK review — b3d91c8

- **Ticket:** `PERC-RESET-003` — RUN-003 zero-visual validity and exact asset coverage
- **Batch:** `PERC-RESET-BATCH-03`
- **Review type:** first independent CK review of completed GO handoff
- **Ticket state:** `awaiting_review` (operational handoff from the user's explicit CK request and GO state `READY_FOR_CK`; the GO checkpoint does not record a separate ticket-state field)
- **Reviewed target commit:** `b3d91c8b055d0e8b79cdef73f3d6b567f6fe950e` (`HEAD` at review start)
- **GO checkpoint:** `project's goal/feedback/PERC-RESET-003-go-checkpoint.md` (`READY_FOR_CK`)
- **Result:** `CHANGES_REQUIRED`

## Target and authority

The frozen ticket was read from the local source-package copies at:

- `project's goal/Backend_Phase/tickets/Perception_Reset_Phase/PERC-RESET-003-zero-visual-and-verified-asset-accounting.md`
- `project's goal/Clean up/Atlas_Canonical_Perception_Reset/tickets/PERC-RESET-003-zero-visual-and-verified-asset-accounting.md`

The copies had identical SHA-256 `9df82612465b39fadd6fc7af4ae719e1c51ca6bf8b38e99f1ee0003ca459f94f`. The source ticket is not present in the reviewed commit tree; the user explicitly identified that local source as the frozen authority. Its R3-01 through R3-05 clauses were used without modification.

The reviewed target equaled `HEAD`. The working tree contained unrelated dirty/untracked work, but the scoped production and test paths inspected below were clean against the target; review conclusions refer only to committed blobs at the target SHA. No files other than this CK artifact were changed for the review.

Authority is the frozen PERC-RESET-003 ticket, its explicitly incorporated RUN-003 identity and staged-perception boundary, and repository evidence. No successor-ticket requirements were imported.

## Review Contract

| Clause | Ticket authority | Required behavior and proof | Evidence and status |
|---|---|---|---|
| R3-01 | Frozen ticket, Binary review contract R3-01 | RUN-003 text with zero visual regions/descriptors normalizes successfully with no derived-asset handoff calls. | Worker test asserts zero calls and successful delivered result; the database qualification later reaches durable `perceived` with `derived_assets=[]`. **PROVEN** by code inspection and recorded GO execution. |
| R3-02 | Frozen ticket, Binary review contract R3-02 | Tables with zero pictures remain structural output without forced visual evidence. | Worker test retains table ID/content while visual regions remain empty; database-backed test reads the table from normalized cache. **PROVEN** by code inspection and recorded GO execution. |
| R3-03 | Frozen ticket Outcome and Binary review contract R3-03 | N captured visuals produce N distinct, exact page/locator/source/profile/media/hash-bound durable assets, with verified readback and no collision or cross-document mismatch. | Two-visual integration test covers distinct refs, page/locator, PNG, byte length, hash, verified/accepted timestamps, and durable resolver readback. **UNRESOLVED — CK-001.a:** profile is stored but not constrained to the exact RUN-003 capture profile at Atlas handoff/acceptance. |
| R3-04 | Frozen ticket, Binary review contract R3-04 | Missing or foreign/misbound/altered/invalid visual evidence rejects before acceptance and is not silently dropped. | Worker and PostgreSQL tests include positive controls and rejection assertions for missing/extra/duplicate descriptors, foreign source, wrong page/locator, missing/duplicate refs, altered bytes, hash/length/media mismatch, invalid grant, and damaged readback; rejection assertions inspect `accepted_at IS NULL`. **PROVEN** by code inspection and recorded GO execution, subject to the R3-03 profile-binding finding. |
| R3-05 | Frozen ticket, Binary review contract R3-05 | Accepted zero-visual RUN-003 result uses its exact cache identity, reaches durable `perceived`, and creates no semantic work or additional source documents. | Integration fixture uses `docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1`; queries persisted cache, member/execution state, scoped semantic rows, background semantic jobs, and before/after document count. **PROVEN** by code inspection and recorded GO execution. |

## Evidence reviewed

### Implementation history

Reviewed the complete implementation history through the target:

- `23a6102471d3374558ed211e088e53cc2102cb5a` (`23a6102`): worker permits empty RUN-003 visual coverage while requiring exact descriptor coverage when visuals exist; authority collects zero or more assets but requires one ref per visual; focused tests added.
- `636176d785f35e6300a6b6879877edd7bce23385` (`636176d`): worker locator narrowing and negative assertions for wrong-page/extra descriptors and colliding references.
- `b63f7b2344bba0bd0157aa770ca8b264ffae5722` (`b63f7b2`): HMN-001-authorized ancillary terminating-guard type correction in `packages/atlas-skills/src/provisional-relationship-packet.ts`; checkpoint records unchanged RUN-003 behavior and typecheck remediation.
- `b3d91c8b055d0e8b79cdef73f3d6b567f6fe950e` (`b3d91c8`): database-backed assertions and qualification record; no production code change.

### Focused worker and authority evidence

- `apps/agents-bridge/tests/document-perception-worker.test.ts:58-66` asserts that zero-visual text/table output is delivered, table structure remains, and handoff count is zero.
- `apps/agents-bridge/tests/document-perception-worker.test.ts:68-85` rejects missing, foreign-source, duplicate, wrong-page, extra, and colliding descriptor/ref cases before delivery.
- `packages/atlas-db/tests/perception-authority-asset-accounting.test.ts:5-12` proves the pure authority collector accepts empty visual coverage and requires an asset ref for every present visual.
- `apps/agents-bridge/src/document-perception-worker.ts:64-103` validates visual-region/descriptor cardinality and page/locator coverage, hands off each descriptor, rejects colliding refs, and attaches refs before normalization.
- `packages/atlas-db/src/perception-authority.ts:33-55` validates source grant, source digest, page/locator shape, media type, bytes/hash/size, durable write/readback, and manifest persistence. Lines 180-193 validate unique refs, manifest cardinality, media, page/locator, and persisted bytes before acceptance. Profile is only checked as a generic string at line 35 and is not selected or compared by the acceptance query at lines 186-188; see CK-001.a.

### Two-visual database test

`packages/atlas-db/tests/derived-assets.integration.test.ts:40-60` stages two visual locators and asserts distinct refs, exact retry identity, and rejection of conflicting hash, size, page, source, media, oversized bytes, and invalid grant. Lines 62-78 use two refs in a single normalized result and assert misbound locator/page, foreign source, duplicate/missing refs, and altered bytes all reject while no manifest becomes accepted. Lines 79-100 prove accepted execution completion, exactly two verified/accepted manifest rows bound to `visual-1`/`visual-2` on page 1 with distinct refs and expected media/length/hash, durable resolver readback for each, cache invalidation preservation, authorization scoping, and fail-closed altered readback.

The profile value is inserted in the manifest and used on normal positive paths, but the integration test does not exercise a wrong profile and Atlas does not reject one; this is the sole finding.

### Zero-visual lifecycle, cache, and side-effect evidence

`apps/agents-bridge/tests/perception-integration.test.ts:27-37` creates the test request with the exact RUN-003 capability identity. Lines 64-68 set both fixtures to the existing `staged-fair-local-v1` policy. Lines 97-112 provide offline synthetic Docling-shaped text/table content with zero visual regions and no provider network call. Lines 156-157 snapshot source-document count before delivery; lines 169-190 assert completed execution, persisted RUN-003 cache row with `derived_assets=[]`, retained text/table content, staged member `perceived`, zero semantic executions for the target document, zero semantic/background jobs, and unchanged source-document count. Lines 199-204 repeat delivery and reassert idempotency and zero semantic/source-document effects.

The semantic-execution query is scoped to the target document. The background job count is global to the isolated qualification database and selects the semantic/background queue name. The document count compares the whole isolated database immediately before and after delivery, after fixture setup. These assertions are meaningful for the tested acceptance effects.

### PostgreSQL setup, failed attempts, and cleanup evidence

The GO record `project's goal/feedback/HMN-PERC-RESET-003-002-qualification.md` records the isolated database/role, localhost-only endpoint, identified labeled container/volume/network/image, migrations, migration check, pg-boss bootstrap, final suite commands, and cleanup. This is documentary evidence reviewed, not an independently inspected Docker state.

The record distinguishes historical skipped attempts from final execution: the earlier GO checkpoint records one skipped DB suite and two skipped integration tests while `DATABASE_URL` was unset; those are not counted as PASS. The later HMN-authorized qualification record reports final database-backed runs with zero skips: `derived-assets.integration.test.ts` 1/1 and `perception-integration.test.ts` 2/2. The same final record reports focused worker 12/12, authority 2/2, migrations 0000–0024, migration check, and pg-boss bootstrap.

The initial PostgreSQL fixture error was a test-only schema mismatch: a sequence created in `public` was referenced as `atlas.<name>`. At the reviewed target, `apps/agents-bridge/tests/perception-integration.test.ts:121-126` creates the sequences under `atlas` and the trigger functions call `nextval('atlas.<name>')`; cleanup drops those same schema-qualified sequences at lines 223-226. This is a valid fixture correction, not an acceptance relaxation. The synthetic bundle policy is set to `staged-fair-local-v1`, the existing policy whose production acceptance path stops at `perceived`; this specifically exercises R3-05 and leaves the strict visual acceptance logic intact.

Cleanup of the three HMN-labeled Docker resources and temporary test data is supported by the qualification record only. CK did not recreate PostgreSQL, start Docker, call external providers, or independently re-execute the final database qualification.

## Finding CK-001 — Exact RUN-003 asset profile is not enforced at Atlas acceptance

**Authority:** Frozen PERC-RESET-003 Outcome requires one exact page/locator/source/profile/media hash binding per captured visual; R3-03 requires exact bound descriptors/assets, with no cross-document mismatches. R3-04 also requires invalid evidence to reject before accepted `perceived`.

**Evidence:** `apps/atlas/perception-internal.ts:126-133` decodes and casts derived metadata to `DerivedAssetDescriptor` without runtime schema validation. `packages/atlas-db/src/perception-authority.ts:35` checks that `descriptor.profile` is syntactically valid, but does not require `atlas-digital-pdf-run-003-capture-v1` or bind it to the execution's capability identity. The manifest stores that supplied profile at lines 50-54. During result acceptance, lines 186-188 select manifest rows without `profile` or `source_sha256` and compare only reference cardinality, media type, page, and locator; the accepted normalized result carries no profile field that is otherwise compared. Thus an authenticated handoff with a different syntactically valid profile can be persisted and its asset can be accepted under the RUN-003 cache identity. The two-visual test exercises only the expected profile and cannot detect this mismatch.

### Frozen Finding Closure Matrix

| Clause | Ticket authority | Unsatisfied evidence | Observable correction and binary closure oracle |
|---|---|---|---|
| **CK-001.a** | Frozen PERC-RESET-003 Outcome and Binary review contract R3-03; R3-04 fail-closed invalid-evidence requirement. | Atlas accepts and records any profile string matching the generic syntax check; there is no proof that each accepted manifest profile equals the RUN-003 capture profile bound to the execution. | **Required state:** a visual asset whose supplied profile differs from `atlas-digital-pdf-run-003-capture-v1` is rejected before the manifest can be accepted; valid RUN-003 assets remain bound to that exact profile and the existing page/locator/source/media/hash/length checks continue to pass. **Proof location:** focused database-backed negative and positive assertions in `packages/atlas-db/tests/derived-assets.integration.test.ts` (or an equally direct authority test), plus the final no-skip DB suite result recorded in a CK/CFC checkpoint. **Direct-regression boundary:** RUN-003 derived-asset handoff and acceptance profile binding only; preserve source grants, exact bytes/hash/readback, replay, staged `perceived` lifecycle, zero-visual acceptance, and semantic/source-document side-effect boundaries. |

## Independent verification versus GO evidence reviewed

- **Independently performed:** read the frozen local ticket copies and confirmed identical hashes; confirmed target SHA and scoped paths; inspected committed blobs and the four-commit history; reviewed worker, Atlas handoff, acceptance, cache/lifecycle logic, focused tests, DB-backed test assertions, fixture corrections, and the final qualification/cleanup record; derived CK-001.a from the frozen exact-profile requirement.
- **GO evidence reviewed, not independently repeated:** reported focused and database-backed test executions, migration and pg-boss bootstrap, PostgreSQL identity, Docker isolation, and resource cleanup.
- **Not performed by CK:** no tests, migrations, Docker/PostgreSQL provisioning or startup, external provider calls, or runtime cleanup verification.

## Decision

R3-01, R3-02, R3-04, and R3-05 are supported by committed implementation and sufficient focused/database-backed assertions as recorded. R3-03 remains unsatisfied because the exact RUN-003 profile is not enforced through the trusted Atlas manifest/acceptance boundary. Result: **`CHANGES_REQUIRED`** for frozen clause `CK-001.a`.

**PERC-RESET-004 successor gate:** **Do not start.** The phase README requires PERC-RESET-001–003 to be reviewed before PERC-RESET-004. Advance only after the exact frozen clause is resolved, its evidence is independently verified in the permitted bounded review cycle, and CK issues `PASS`. This CK review does not authorize PERC-RESET-004 or CFC remediation.
