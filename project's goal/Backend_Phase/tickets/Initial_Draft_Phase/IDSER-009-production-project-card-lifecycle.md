# IDSER-009: Production project-card lifecycle — umbrella partition record

- **State:** `partitioned-planned`; it is no longer directly executable by GO.
- **Original batch:** `IDSER-BATCH-09`; children are `IDSER-BATCH-09-01` through `IDSER-BATCH-09-04`.
- **Depends on:** IDSER-008 `PASS`; frozen PCC-004/005/006 and auth/home boundaries.
- **Baseline:** SRC-IDSER-01 sections 26–28, 37, 41.8; AC-01/26/27/30/39; SRC-IDSER-08/09. See [README](README.md).

## Disposition and order

This record preserves the complete original IDSER-009 contract and planning history, but it is not a GO target. The child tickets own execution in this order; the umbrella is complete only after each child has CK `PASS`.

```text
IDSER-008 PASS -> 009-01 PASS -> 009-02 PASS -> 009-03 PASS -> 009-04 PASS -> IDSER-010
```

The split is by authority and proof surface, not by files. No child changes the original lifecycle semantics, creates a review surface, publishes facts, changes Master, or starts IDSER-010 work.

## Preserved functional contract and ownership

The required outcome remains: production cards truthfully show authorized persisted lifecycle and exact document progress. A review-ready card is not a review surface. The only states are `waiting-for-extraction` / **Waiting for extraction** (new waiting bundle with no active processing or technical failure), `extracting` / **Extracting** (active queued/running work after activation), `needs-attention` / **Needs attention** (terminal technical/integrity failure after supported retries or deterministic rejection), and `ready-for-review` / **Ready for review** (every member completed and the completion gate passed).

| Original IDSER-009 obligation | Implementation owner | Final proof owner |
|---|---|---|
| Membership-scoped project/workspace/bundle/member read; unrelated users receive no lifecycle/progress | 009-01 | 009-01; 009-04 browser negative |
| Bundle state, immutable expected N, completed X, workspace state, legacy/no-bundle distinction, malformed persisted state | 009-01 | 009-01 |
| Waiting, active processing, terminal technical failure and completion-gated ready map to four exact states | 009-02 | 009-02; 009-04 |
| Exact `X of N`, `floor(100 * X / N)`, 100 only X=N; OCR/extraction alone never increments X | 009-02 | 009-02; 009-04 |
| Semantic uncertainty differs from technical failure and may coexist with ready | 009-02 | 009-02; 009-04 |
| Intact legacy PCC no-bundle record stays waiting; invalid new bundle state fails closed | 009-01, 009-02 | 009-01, 009-02; 009-04 legacy proof |
| Zero published facts and Master `No published work` in every state | 009-02 | 009-02; 009-04 |
| Bounded safe failure reason; no provider body, prompts, SQL, execution/capability/private data | 009-01, 009-02 | 009-01, 009-02; 009-04 response proof |
| Authenticated refresh uses persisted state only; no timer, fixture, queue or local-storage progress | 009-02 | 009-02; 009-04 |
| Production review/workspace action remains unavailable; no production `/demo`, fixture Share, review UI or attention queue | 009-02, 009-03 | 009-03; 009-04 |
| Four-state shared-language rendering, non-color status, safe failure, accessible progress/status/action | 009-03 | 009-03; 009-04 rendered gate |
| Responsive/theme/shell/content matrix, keyboard/focus, sparse/multiple cards and direct auth/CSP/demo/card regression | 009-04 | 009-04 |

The original presentation contract is retained through 009-03/04: extend the existing Entity Library rather than redesign it; reuse shared tokens/components; do not solve valid long content with shrunken type or accidental truncation; retain accessible status without repeated noisy refresh announcements; inspect loading/error refresh as well as all states. The original implementation seams remain `project.ts`, `project-repository.ts`, `home-projects.ts`, `home-project-read-service.ts`, `project-creation-boundary.ts`, `project-card-view-model.ts`, `ProductionProjectCard.tsx`, `ProjectCardPresentation.tsx`, and `ProductionProjectLibrary.tsx`, allocated by the child contracts.

## Preserved security and review-binding ownership

| Original readiness item / binding | Owner | Preserved review evidence |
|---|---|---|
| Better Auth -> server identity -> membership-scoped Atlas read; persisted lifecycle trust boundary | 009-01 | `REV-READY-IDSER-009-01`: PostgreSQL read-model/membership proof |
| `SEAM-IDSER-009-01`: separate repository read, deterministic mapping and presentation | 009-01 / 009-02 / 009-03 | Each local child boundary; 009-04 composed path |
| `SEAM-IDSER-009-02`: safe failure/status mapping and existing refresh error/caching controls | 009-02 | Safe mapping/read-service proof; 009-04 browser proof |
| `COUPLING-IDSER-009-01`: no UI DB/semantic access, provider leakage, fixture identity, simulated progress or `/demo` fallback | 009-01 / 009-02 / 009-03 / 009-04 | Local boundary proof; `REV-READY-IDSER-009-02` route/auth/fixture negatives in 009-04 |
| `REV-READY-IDSER-009-03`: truthful accessible failure/status across themes and widths | 009-03 / 009-04 | Component semantics then frontend-gate rendered proof |
| Deferred sharing/review authorization and new public actions | all children | Explicitly unavailable; never implemented |

## Sizing self-check

| Child | GO + dominant proof | Bounded CK/CFC/HMN decision |
|---|---|---|
| 009-01 | One persisted-read authority + PostgreSQL tests | Isolation, integrity and non-leaking read only |
| 009-02 | One deterministic mapper + mapper/read-model tests | Mapping, redaction and fail-closed invariants only |
| 009-03 | One presentation authority + component/accessibility tests | Faithful accessible rendering only |
| 009-04 | One integration checkpoint + authenticated browser proof | Browser regression/visual observation only |

## Required final partition self-check

Each result is **YES** for 009-01, 009-02, 009-03 and 009-04: the individual hard stops, RC tables and explicit non-authority sections are the child-specific evidence for this assessment.

| Question | Result |
|---|---|
| Can GO understand the entire ticket before coding? | YES |
| Can GO implement the entire scope in one coherent layer? | YES |
| Can GO produce every mandatory proof before handoff? | YES |
| Does the ticket have one dominant proof harness? | YES |
| Can CK completely review it in one bounded pass? | YES |
| Are likely CK findings locally repairable by CFC? | YES |
| Would HMN receive only a narrow residual? | YES |
| Are unrelated sibling responsibilities explicitly deferred? | YES |
| Are inherited security obligations bounded to this scope? | YES |
| Is every original IDSER-009 obligation still owned somewhere? | YES |

Every row remains owned. No implementation, migration, GO, CK, CFC, or HMN action is authorized or claimed by this planning record.
