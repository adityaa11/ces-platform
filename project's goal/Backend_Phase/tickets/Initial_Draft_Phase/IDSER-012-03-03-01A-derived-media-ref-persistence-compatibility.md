# IDSER-012-03-03-01A — Canonical RUN-003 derived-media reference compatibility at immutable plan persistence

- **State:** `approved` following CK `PASS` for remediation commit `1db4f9cfba21f968dbaa11e8820fe316824078db`; **Review batch:** `IDSER-BATCH-12-03-03-01A`.
- **Batch:** `IDSER-BATCH-12-03-03-01A` (independent review and remediation boundary).
- **Position:** narrow compatibility successor to approved `IDSER-012-03-03-01`, inserted **before** `IDSER-012-03-03-02`. It is not a replacement persistence design, and does not invalidate the predecessor's recorded CK PASS.
- **Prerequisite evidence:** `IDSER-012-03-01-02` accepted-document resolver CK PASS; `IDSER-012-03-03-01` CK PASS on `470e7958ce553bee68e44b60f757bc6e74f59b99`, approved after verification. Preserve those historical oracles.
- **Blocked consumer:** `GO IDSER-012-03-03-02` encountered real accepted-source `derived/<uuid>` media refs rejected by persistence before the parser → resolver → planner → persistence → non-delivering fixture-receiver composition could be proven. `03-03-02` must not work around this failure and must wait for **this ticket's own CK PASS**.
- **Parent scope:** [`IDSER-012-03-03` split map](IDSER-012-03-03-durable-batch-handoff-ghr-output-compatibility.md), under [`IDSER-012-03`](IDSER-012-03-semantic-batch-planner-ghr-contract-hard-stop.md).

## 1. Actual defect, authorities, and final intended behavior

The existing and *approved* `PostgresAcceptedSemanticBatchPlanDocumentResolver.resolve` in `packages/atlas-db/src/semantic-batch-plan-input.ts` returns `AcceptedDocumentPlannerResultV1.media[]` from Atlas's accepted `document_perception_derived_manifest` and cache/asset bindings. For RUN-003, `assetRef` is the canonical string `derived/<lowercase-UUID-shaped-id>`.

That shape is already enforced by **migration `packages/atlas-db/migrations/0024_idser012_derived_assets.sql`**, with the exact database rule:

~~~regex
^derived/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$
~~~

This is an exact **lowercase character/segment grammar**, not a request to impose additional RFC-4122 version/variant semantics; existing migration accepts any lowercase hex in the documented groups.

The approved `canonicalImmutableSemanticCorpusPlanV1` in `packages/atlas-db/src/immutable-semantic-corpus-plan.ts` instead evaluates `!opaque(media.assetRef)` in its `source.media.some(...)` check. File-private `opaque` permits `[A-Za-z0-9._:-]` but **not** `/`; consequently an accepted RUN-003 reference fails with `ImmutableSemanticCorpusPlanError("Semantic corpus media metadata is invalid.")` before `PostgresImmutableSemanticCorpusPlanRepository.persist` can execute.

**Final behavior:** `source.media[].assetRef` accepts **only** the exact pre-existing `derived/<lowercase-UUID-shaped-id>` reference grammar, while every other field's validation, source/asset authorization owner, SQL scope proof, persistence/hash/idempotency/immutability behavior, and all downstream hard stops remain unchanged. Zero-visual `source.media: []` remains allowed.

**Security distinction:** a reference matching this regex is *syntactically well formed*, **not** a source grant or evidence of ownership. Accepted media provenance is furnished by the approved authenticated resolver; it must not be bypassed or recreated inside this change. The subsequent `03-03-02` composition proves that the resolver's actual authorized output is what reaches the planner/persistence interface.

## 2. Exact production patch (freeze this shape; do not improvise)

**Sole production file permitted:**
`packages/atlas-db/src/immutable-semantic-corpus-plan.ts`.

**Exact file-private predicate to introduce adjacent to the existing `opaque` and `sha` predicates:**

~~~ts
const canonicalDerivedAssetRef = (value: unknown): value is string =>
  typeof value === "string"
  && /^derived\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value);
~~~

**Exact replacement in `canonicalImmutableSemanticCorpusPlanV1`:** within the *existing* `source.media.some(...)` condition only, replace `!opaque(media.assetRef)` with `!canonicalDerivedAssetRef(media.assetRef)`. Leave the remainder of that expression literally intact:

~~~ts
if (source.media.some((media) =>
  !canonicalDerivedAssetRef(media.assetRef)
  || !opaque(media.locatorId)
  || !positive(media.pageNumber)
  || media.mediaType !== "image/png"
  || !sha(media.sha256)
  || !positive(media.byteLength)
)) throw new ImmutableSemanticCorpusPlanError("Semantic corpus media metadata is invalid.");
~~~

This expanded formatting is illustrative of the **one existing conditional expression**, not permission to add a new validation stage. The resulting code may keep the original single-line formatting.

**Nonnegotiable invariants:**

1. `canonicalDerivedAssetRef` is local to the existing persistence source file; no new exported public API, `type`, schema version, adapter, service, bridge, method, or package.
2. Do **not** relax/change `opaque` globally. In particular, scope IDs, `normalizedDocumentRef`, `perceptionExecutionId`, `perceptionCapability`, BSS provenance IDs/versions, proposal IDs, batch IDs, `locatorId` and other locator identifiers keep their original exact validation.
3. Do **not** accept generic paths, URLs, `derived` without one `/`, multiple separators, uppercase, unbounded lengths, other prefixes, URL encodings, traversal, backslashes, query fragments, or a bare UUID. Do **not** normalize/trim/decode/case-fold/rewrite refs.
4. Do **not** alter `ImmutableSemanticCorpusPlanInputV1`, `PersistedSemanticCorpusPlanV1`, `canonicalImmutableSemanticCorpusPlanV1` signatures, `PostgresImmutableSemanticCorpusPlanRepository.persist/cancel` signatures, accepted source SQL, transaction/lock strategy, SQL role, stored table names, parent-child plan structure, cancellation ancestry, existing error class or existing media-invalid error text.
5. Keep `stable`, `digest`, `immutable`, `planHash`, `handoffContents`, `idempotencyKey` derivation and `replayImmutableSemanticCorpusPlanHashV1` **bit-for-bit unchanged**. Do not silently rewrite or backfill historical plans. A genuinely different media binding changes immutable plan content/hash; if presented with a colliding existing proposal/idempotency identity, the existing conflict-on-different-content fence rejects. This ticket does **not** change the version-authorizing replan rules.
6. No database migration, DDL, new media catalogue or separate accepted-asset lookup is authorized. Migration `0024` remains the authoritative shape constraint. Migration `0085`/`0086` plan/handoff/append-only controls remain unchanged.
7. Media is **reference-only metadata**: never persist PNG bytes, PDF text, prompt content, raw store/storage paths, credential, provider response or a new authorization token.
8. Do not edit the approved resolver, parser, BSS snapshot reader, estimator, partitioner, or `03-03-01` ticket/CK evidence. Neither a surrogate slash-stripping identifier nor `derived%2F...` remapping is allowed.

If a supposed fix requires changes outside this one production file, stop with a concrete `BLOCKED_SCOPE` report and ownership/evidence; do not expand this ticket or fabricate a new boundary.

## 3. Exact test and evidence change surface

**Permitted test changes only:**
- `packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts` (add focused canonical and real-Postgres persistence regression cases; reuse its existing `input`, `fixture`, `cleanup` and `PostgresImmutableSemanticCorpusPlanRepository`).
- Existing `packages/atlas-db/tests/semantic-batch-plan-input.integration.test.ts` is the **upstream, unchanged** real accepted-media provenance regression to run and cite; modify it only if an exact direct regression makes that necessary, in which case STOP and request new authority instead of silently extending this ticket.

**Do not add** a parallel fake `persist` implementation, a second `resolve` function, a second parser, a new integration runner, a utility library, or a full `03-03-02` end-to-end fixture. `03-03-02` owns that entire composition and receiver.

### T-01 — Canonical-input positive and byte-preservation (no database required)

Add one focused deterministic test using the existing `input(suffix)` fixture and a **nonempty** `source.media` entry with:
- `assetRef = "derived/01234567-89ab-cdef-0123-456789abcdef"` (an exact grammar witness; do not call this fixture an actual accepted-media grant),
- existing `locatorId = "deferred"` and `pageNumber = 1`, `mediaType = "image/png"`, `sha256 = sha("media-fixture")`, `byteLength = 1`.

Require `canonicalImmutableSemanticCorpusPlanV1` to succeed and assert the immutable `planContent.source.media` metadata preserves the reference and all other media values **exactly as supplied** (no basename stripping, escaping, URL decoding or substitution). Independently replay stored-style content via the existing `replayImmutableSemanticCorpusPlanHashV1`, and verify same input yields identical canonical plan hash/content. Existing `media: []` baseline must continue passing. No change to `idempotencyKey` algorithm is authorized.

### T-02 — Fail-closed grammar matrix (no database required)

Using the same valid fixture and changing **only** `source.media[0].assetRef`, assert the existing typed `ImmutableSemanticCorpusPlanError` and existing `Semantic corpus media metadata is invalid.` message for all of:

- bare UUID without `derived/`;
- `derived`, `derived/`, and `derived//<uuid>`;
- prefix other than exactly `derived/` (including `derivedx/`);
- uppercased prefix or uppercased hexadecimal UUID character;
- insufficient/excess hex characters or wrong hyphen/group segmentation;
- non-hex characters in a group;
- leading/trailing whitespace, query/fragment, URL, and URL-encoded slash;
- `../` traversal attempt and backslash-containing path.

Also assert the *existing* checks still reject invalid `locatorId`, page number (zero), media type, sha256 and byte length. At least one representative unrelated opaque identity containing `/` (e.g. `scope.documentId` or `proposal.proposalId`) must still reject. Do not turn `canonicalDerivedAssetRef` into a standalone or public validation surface just for tests.

### T-03 — Real persistence of a nonempty canonical-media plan (real PostgreSQL)

Add **one** additional database-backed test beside the current immutable-persistence integration test; use its **existing** Atlas records, `fixture`/`cleanup` helpers, migrations, connection conventions and actual `PostgresImmutableSemanticCorpusPlanRepository`. Choose a unique `suffix` and one syntactically canonical `derived/` reference generated from `randomUUID()` for `source.media[]`. This is deliberately a **persistence shape fixture**, not evidence that an approved resolver granted that fixture's media. Do not insert a fake derived-manifest acceptance row or claim the test authenticates the fixture media.

- Persist an N=2 ready proposal using the existing fixture `proposal.batches`; require **one actual** `atlas.semantic_corpus_plan` and exactly **two actual** `atlas.planned_semantic_corpus_handoff` records (never an in-memory fake).
- Fetch `immutable_content` from PostgreSQL and assert the exact nonempty `source.media` metadata survives unchanged and its stored parent hash replays to the returned `planHash`. Handoff IDs/hashes/parent membership must remain the same semantics as `03-03-01`.
- Retry the exact input (including concurrent/restarted-style replay if available from existing test) and assert exactly the **same** parent/handoff refs; no duplicate rows.
- Mutate the media reference in an otherwise same proposal/identity and assert existing conflict-on-different-content behavior rejects rather than editing the previous immutable plan. Do not add a new idempotency policy or a new plan version to make this test green.
- For invalid media syntax, reject before a new plan/handoff write; show exact zero new plan and handoff rows for the invalid fixture.
- Compare already-existing real `pgboss.job` and Bridge BSS-work/attempt/reservation counters before/after, and document-scoped SEM/candidate/reconciliation counts; require **zero delta** in forbidden side effects. Do not invent a GHR outbox table or assert an absent service was called.
- Clean up through the existing isolated test harness and do not affect unrelated DB workloads.

**Test authority limit:** `T-03` proves database persistence/immutability for the canonical metadata **shape**, not independent media provenance. The unchanged upstream accepted-source integration test proves that real RUN-003 derived refs are granted/resolved by the approved Atlas resolver. `03-03-02` alone will prove both surfaces together with the actual BSS reader, estimator, partition and fixture receiver. Do not manufacture that composite evidence inside `01A`.

### T-04 — Existing predecessor regressions remain intact

Execute and record as independent passing commands (adapt only for the repo's documented local test/DB bootstrapping, never skip DB evidence and still claim PASS):

~~~sh
corepack pnpm --filter @atlas/db typecheck
node --env-file=.env packages/atlas-db/scripts/migrate.mjs --check
node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts
node --env-file=.env ./packages/atlas-db/node_modules/jiti/lib/jiti-cli.mjs packages/atlas-db/tests/semantic-batch-plan-input.integration.test.ts
git diff --check
~~~

Retain the historical `03-03-01` test coverage for contract-version fencing, BSS provenance shape, scope denial, partial-transaction rollback, append-only DB triggers, cancellation/replan ancestry, conflict, replay, and zero effects. A skipped or failed database test **cannot** be reported as CK PASS.

## 4. Frozen CK review contract

| ID | PASS iff |
| --- | --- |
| `RC-012030301A-01` | The sole production behavior delta is exactly the file-private canonical derived-asset-reference predicate used **only** in `source.media[].assetRef` validation, consistent byte-for-byte with migration `0024`'s lowercase reference grammar. No altered public shape, alternate adapter, global `opaque` relaxation, SQL/migration, or hash algorithm. |
| `RC-012030301A-02` | A nonempty canonical media list and the existing zero-media baseline both canonicalize; canonical content retains all media fields and the exact asset ref, and hash replay/determinism are preserved. |
| `RC-012030301A-03` | Every frozen malformed reference in T-02 and unchanged media-field/other-opaque-identity negatives fail closed through the original typed media/error boundaries. No path/URL normalization or scope widening. |
| `RC-012030301A-04` | A **real Postgres** N=2 immutable plan + 2 handoffs persist with exact canonical nonempty media metadata and deterministic stored hash; replay preserves IDs; same proposal with changed media conflicts without editing old records; malformed media writes zero new records. |
| `RC-012030301A-05` | Previously approved resolver's **actual** RUN-003 granted-media test and existing `03-03-01` PostgreSQL regression both PASS; provenance and persistence-shape evidence are expressly distinguished, not misreported as completed `03-03-02` composition. |
| `RC-012030301A-06` | The real positive persistence test has zero BSS work/attempt/reservation, queue, SEM/candidate/reconciliation effects, preserves append-only transaction/auth/role fences, and creates no GHR/SEM/BSS execution or alternative route. |

Reviewers must use the exact T-01..T-04 oracles, inspect the production diff and SQL/migration invariants, and record explicit PASS/FAIL per row. A passing unit regex test alone is **not** sufficient. CK may return `CHANGES_REQUIRED` under its normal bounded review process; this ticket is not self-approving.

## 5. Permitted file list and anti-drift fence

**Expected GO implementation diff:**
1. `packages/atlas-db/src/immutable-semantic-corpus-plan.ts` — one file-private predicate, one field-specific predicate replacement.
2. `packages/atlas-db/tests/immutable-semantic-corpus-plan.integration.test.ts` — T-01/T-02/T-03 coverage within current harness.
3. Standard `GO` checkpoint / CK evidence artifacts under `project's goal/feedback/`, according to the existing skill workflow.

**Expected unchanged:** `packages/atlas-db/src/semantic-batch-plan-input.ts` and its already-approved accepted-media tests; `apps/agents-bridge/src/idser-structural-fit-corpus-partition.ts` and all BSS readers/estimators; `packages/atlas-db/migrations/0024*,0085*,0086*`; all auth/roles, derived-asset store, GHR, SEM/provider/reconciliation modules and the approved predecessor `03-03-01` ticket/review evidence.

If Codex finds an independently real problem in any unchanged owner, log the exact location, offending accepted inputs and accountable owner, then STOP `BLOCKED_SCOPE`. Do not “fix while here,” alter the approved predecessor evidence, widen tests into a mock composite, introduce fallback identifiers, or assume the blocked `03-03-02` is proven.

## 6. CK evidence package and next authorized handoff

Record: code diff, migration `0024` regex comparison, before/after failing/good references, focused grammar rejection matrix, nonempty-vs-empty media cases, exact stored `source.media`, persisted `planId/planHash`, N=2 `handoffId/handoffHash`, replay/conflict traces, counters before/after, upstream resolver test result, exact executed commands and commit SHA. Redact credentials and raw source/media bytes.

**Close only this corrective seam at CK PASS.** After this ticket is independently CK-approved, a **new explicit** `GO IDSER-012-03-03-02` may resume the **same** already-approved parser → authenticated resolver → BSS prospective snapshot reader → demand estimator → structural partition → `PostgresImmutableSemanticCorpusPlanRepository.persist` → non-delivering `SemanticBatchPlanReady/v1` fixture-receiver path. `03-03-02` still owns RC-012030302-01..06 and must prove the actual end-to-end chain itself.

**HARD STOP:** no new GHR issuer/route/outbox/dispatch/ack; no BSS work/reservation/send; no SEM intake/provider call; no semantic truth/reconciliation/Master/CES changes. This ticket grants *format compatibility only*, not delivery or execution eligibility.
