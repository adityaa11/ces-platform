# CK replacement-contract freeze: GHR-02B

- **Ticket:** `GHR-02B` — Atomic NDV1 acceptance integration and pointer-only pg-boss publication.
- **Batch:** no separate batch identifier declared.
- **Ticket state:** `awaiting_review`.
- **Historical implementation checkpoint:** `dde68c561b0c2e189f8543ad6d9adeed3644045b` (`dde68c56`).
- **Current documentation checkpoint:** `b4279a1883c72988d21dd06baf54a538a66973e5` (`b4279a18`).
- **Historical CK:** [GHR-02B-dde68c56-review.md](GHR-02B-dde68c56-review.md), result `CHANGES_REQUIRED`, finding `CK-001`, clause `CK-001.a`.
- **Planning amendment:** [GHR-02B-planning-amendment-001.md](GHR-02B-planning-amendment-001.md), `GHR-02B-PLANNING-AMENDMENT-001`.
- **HMN handoff:** [GHR-02B-hmn-001.md](GHR-02B-hmn-001.md), `HMN-GHR-02B-001`, decision `RETURN_TO_CK`.
- **Artifact kind:** append-only replacement-contract freeze under the explicit planning amendment.
- **Decision:** `REPLACEMENT_CONTRACT_FROZEN` — contract freeze only; not `PASS`, not a new implementation verification, not CFC authorization, and not a new workflow lifecycle state.

## Active tuple and historical records

The GO checkpoint records `awaiting_review` and identifies `dde68c56` as the
implementation target. `b4279a18` changes only workflow documentation. The
implementation target is therefore unambiguous. The unrelated dirty worktree
entries are outside the GHR-02B implementation and are not included in this
review.

The following records remain immutable and are not rewritten:

1. Frozen ticket: `project's goal/Backend_Phase/tickets/GHR_Phase/GHR-02B-atomic-ndv1-acceptance-and-pg-boss-publication.md`.
2. GO checkpoint: [GHR-02B-go-checkpoint.md](GHR-02B-go-checkpoint.md).
3. Historical CK: [GHR-02B-dde68c56-review.md](GHR-02B-dde68c56-review.md).
4. Planning amendment: [GHR-02B-planning-amendment-001.md](GHR-02B-planning-amendment-001.md).
5. HMN handoff: [GHR-02B-hmn-001.md](GHR-02B-hmn-001.md).

Historical `CK-001.a` remains unresolved as historical evidence. Historical
rows `GHR-02B-RC-02` through `GHR-02B-RC-05` remain `PROVEN` and protected.
This artifact does not rename, rewrite, or mark `CK-001.a` resolved.

## Amendment and supersession audit

The planning amendment identifies the exact superseded portions of the
historical clause:

1. The fresh signed-in normal project-card/PDF run need not occur in the
   isolated logical clone.
2. The normal project-card/PDF commit and failure proof need not both be
   obtained through the clone's full Atlas/Docling runtime.

The recorded reason is the clone-only Atlas dev server's failure to open its
port; reproducing that route would require the unavailable full Atlas/Docling
runtime. The amendment does not change production behavior, product scope,
ownership, or downstream authority.

The following remain active and are not superseded:

- same-transaction accepted-state, intent, and pointer-job atomicity;
- protected-clone transaction-only injected-failure rollback proof;
- GHR-02A's sole issuer, policy, header, body, and pin authority;
- replay/restart singleton deduplication;
- pointer-only queue metadata and the no-consumer/no-Bridge-state boundary;
- zero receiver, ACK, resolver, planner, BSS, SEM, provider,
  reconciliation, and projection effects; and
- all other frozen ticket, security, boundary, validation, and direct-regression
  obligations.

No CFC, new code, canonical mutation, clone rebuild, consumer, receipt/lease,
delivery, semantic, provider, or ticket-scope expansion is authorized.

## Historical clause mapping

`CK-001.a` is the sole historical replacement target. Its original ticket
authority was the frozen ticket's **Required real-source validation
environment** and `GHR-02B-RC-01`. Its historical unsatisfied condition was
the absence of a fresh normal signed-in project-card/PDF run and matching
rollback proof through the isolated clone route.

The historical clause remains preserved exactly in the original CK artifact.
Only its clone-exclusive proof portion is replaced for effective acceptance.
The historical identifier is not reused or renumbered.

## Frozen replacement clause

The replacement namespace is distinct and stable. This artifact freezes one
replacement clause: `RCK-001.a`.

### RCK-001.a — Canonical normal-path proof plus protected-clone atomic rollback

**Active acceptance obligations**

1. A fresh signed-in normal project-card upload of a PDF from `docs/example/`
   in the running canonical Compose project `atlas-canonical-perception`,
   performed under the user's explicit canonical-write authorization, must
   create a fresh accepted project/workspace/bundle/document/execution and
   commit exactly one GHR-02A intent plus exactly one pointer-only
   `GenericHandoffJob/v1` job. PostgreSQL and pg-boss evidence must identify
   the accepted lifecycle facts, intent, and queue payload.
2. The existing protected PostgreSQL clone integration must prove the
   transaction-only injected-failure condition: no accepted state, intent, or
   job remains committed after controlled publication failure.
3. The active non-superseded GHR-02B rows and direct-regression boundaries
   remain binding. This replacement clause does not authorize a consumer,
   delivery worker, receipt/lease state, semantic work, or any downstream
   effect.

**Required evidence**

- The GO checkpoint records canonical source `atlas-canonical-perception` and
  the fresh authorized run `ghr-02b-canonical-20261024`, yielding project
  `d58ef5a5-d010-44f3-a21d-7e79a1186cee`, workspace
  `fe6144a3-7526-468a-a4cc-4ba66f1586f3`, bundle
  `e114c28c-cfe1-4d34-828b-bdfff2e99a3d`, document
  `199e181f-7211-4809-a9b3-ed262d2b209c`, execution
  `9af1bf28-55cb-4ee1-825d-990ce127bdd8`, and fingerprint
  `eb94f6e4cab4804c3c40e51066d1bdbc2c1783367c647e431fddaddf4772f437`.
- The GO checkpoint records one immutable intent and the exact pointer-only
  queue object, with no semantic or Bridge delivery state.
- The protected clone is recorded as
  `atlas-ghr02b-qualification-postgres`, database `atlas_ghr02b`, host port
  `15434`; its recorded `test:ghr-02b` result includes injected publication
  rollback and no dangling job.

**Binary closure oracle**

`RCK-001.a` is closed only when the amended acceptance record demonstrates
both of the following: (a) the authorized canonical normal-path run has the
fresh accepted lifecycle and exactly one immutable GHR intent plus one
pointer-only `GenericHandoffJob/v1`; and (b) the protected-clone transaction
test shows that the controlled publication failure leaves no committed
accepted state, intent, or job. The evidence must retain the canonical-source
and clone identities. The direct-regression boundary is the frozen GHR-02B
implementation and its RC-02 through RC-05 behavior only; no new deployment,
consumer, delivery, semantic, provider, or downstream requirement may be
added.

**Freeze status:** `UNRESOLVED_FOR_REPLACEMENT_REVIEW`.

This status records the frozen oracle, not a claim that this artifact itself
verifies the implementation checkpoint. The historical `CK-001.a` outcome
remains visible even if a later bounded verification proves `RCK-001.a`.

## Checks performed for this freeze

- Confirmed the ticket is `awaiting_review` and the GO target resolves to
  `dde68c561b0c2e189f8543ad6d9adeed3644045b`.
- Confirmed the implementation diff is unchanged after `dde68c56`; later
  commits are documentation-only for this workflow record.
- `pnpm --filter @atlas/db test:ghr-02b-boundary` — PASS.
- `pnpm --filter @atlas/db test:ghr-02a-boundary` — PASS.
- `pnpm --filter @atlas/db typecheck` — PASS.
- `pnpm --filter @atlas/agents-bridge typecheck` — PASS.
- `git diff --check dde68c56^ dde68c56` — PASS.
- `pnpm --filter @atlas/db test:ghr-02b` — skipped in this shell because
  `DATABASE_URL` is absent; the protected-clone integration PASS recorded in
  the GO checkpoint is preserved as the evidence source and was not relabeled
  as a fresh local execution.

## Handoff

This freeze consumes `GHR-02B-PLANNING-AMENDMENT-001` and
`HMN-GHR-02B-001`. It does not authorize CFC. Under the bounded replacement
path, a fresh explicit user `hmn` invocation is required before any later
evidence-remediation cycle. No implementation or database mutation was made
by this CK action.
