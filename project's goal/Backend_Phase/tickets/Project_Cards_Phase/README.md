# Atlas Project Cards and PRD Intake Ticket Set

- **State:** `in_progress` — `PCC-001` / `PCC-BATCH-01` is approved; `PCC-002` / `PCC-BATCH-02` is awaiting review.
- **Primary baseline:** [Project Card Creation and PRD Intake Implementation Context](../../atlas-project-card-creation-implementation-context.md)
- **Phase boundary:** [Atlas Backend Phase README](../../README.md)
- **Architecture baseline:** [Atlas Core Architecture — Updated Checkpoint](../../atlas-core-architecture-checkpoint-v2-mistral-enriched-v2.md)
- **Frozen dependencies:** [BSS-007 DocumentStore](../Stack_Setup/BSS-007-document-store-foundation.md), [BSS-009 perception series](../Stack_Setup/BSS-009-document-perception-pipeline.md)
- **Frozen application dependencies:** [Sign-In and Authenticated Home Ticket Set](../Sign_In_Phase/README.md), [Sign-Out Ticket Set](../Sign_Out_Phase/README.md)

## Purpose

Move authenticated `/home` from an empty production project library to a real,
authorized project-card flow. A successful creation stores project metadata and
one or more immutable PRD sources, creates the creator's owner membership,
creates an empty Master and Initial Draft, and renders:

```text
Waiting for extraction
```

The phase stops after Atlas metadata is committed. It does not start Document
Perception, Semantic Extraction, reconciliation, review, CES, or publication.

The authority split is:

```text
Better Auth       -> identity and session
Atlas/PostgreSQL  -> project state, membership, workspace, document metadata
DocumentStore     -> immutable PRD bytes
@atlas/fixtures   -> /demo only
```

`/demo` remains fixture authority. `/home` must never create or hydrate fixture
projects, use `/api/local-fixtures`, or navigate a real project into `/demo`.

## Source accounting

This is a source-grounded implementation plan, not an accepted Atlas workspace,
semantic extraction result, or review projection. The following stable source
anchors are used by the tickets:

| Source | Evidence used |
|---|---|
| `SRC-PCC-01` | [Backend Phase README](../../README.md): fixture/production separation, authority rules, Compose validation, review controls |
| `SRC-PCC-02` | [Project Card Creation Context](../../atlas-project-card-creation-implementation-context.md): §§1–5, 6–18, 19–32, 34–47, including AC-01–AC-32 |
| `SRC-PCC-03` | [Core Architecture Checkpoint](../../atlas-core-architecture-checkpoint-v2-mistral-enriched-v2.md): project/workspace lifecycle and immutable document model |
| `SRC-PCC-04` | [BSS-007](../Stack_Setup/BSS-007-document-store-foundation.md) and [BSS-009 series](../Stack_Setup/BSS-009-document-perception-pipeline.md): storage-neutral source bytes and deferred perception |
| `SRC-PCC-05` | [Sign-In/Home context](../../atlas-sign-in-home-implementation-context.md) and [Sign-Out context](../../atlas-sign-out-implementation-context.md): frozen authenticated shell and fixture boundaries |
| `SRC-PCC-06` | [Atlas UI/UX Prototype PRD](../../../Atlas_UI_UX_Prototype_PRD.md) §§4.2–4.3, 7–9.4 and the supplied [Project Cards reference](<../../../UI References/Project Cards.PNG>): established library, dialog, responsive, and reusable-component language |
| `SRC-PCC-07` | Current `apps/atlas/app/home/page.tsx`, `apps/atlas/components/ProjectLibrary.tsx`, and `apps/atlas/components/ProjectCard.tsx`: actual implementation seams to refactor or extend |

No source candidate IDs, semantic annotations, accepted truth, or UI-specific
semantic fallback claims are emitted by this ticket plan. Project-card state
must be derived from persisted Atlas records once implemented.

## Delivery order

Each ticket is a separate review batch. A dependent ticket cannot begin until
the preceding checkpoint has a `PASS` review and the user authorizes the next
batch.

| Order | Ticket / batch | State | Depends on | Review question |
|---:|---|---|---|---|
| 1 | [PCC-001](PCC-001-atlas-project-domain-and-persistence.md) / `PCC-BATCH-01` | `approved` | BSS-003/BSS-004 approved; BSS-007 approved | Are the minimum Atlas project, membership, workspace, and document metadata records available behind persistence-neutral contracts without storing source bytes or starting perception? |
| 2 | [PCC-002](PCC-002-document-store-backed-project-creation.md) / `PCC-BATCH-02` | `awaiting_review` | PCC-001 `PASS`; BSS-007 approved | Does the server-side creation operation store all PRDs through `DocumentStore` before one PostgreSQL commit, creating no visible partial project and no extraction state? |
| 3 | [PCC-003](PCC-003-production-project-http-boundary.md) / `PCC-BATCH-03` | `planned` | PCC-002 `PASS`; approved Better Auth/session boundary | Does `POST /api/projects` authenticate the real session, enforce bounded multipart/CSRF input, map safe errors, and avoid fixture/base64 transport? |
| 4 | [PCC-004](PCC-004-authorized-home-project-read-and-card-projection.md) / `PCC-BATCH-04` | `planned` | PCC-001 `PASS`; SIN/SOUT sets frozen | Does `/home` read only authorized Atlas projects and project them into a production-safe card model whose waiting state comes from persisted state rather than fixture or UI timers? |
| 5 | [PCC-005](PCC-005-production-project-library-and-create-ui.md) / `PCC-BATCH-05` | `planned` | PCC-003 and PCC-004 `PASS` | Does `/home` expose the established `+ New project` interaction and truthful waiting card while `/demo` retains fixture creation, sharing, and processing behavior? |
| 6 | [PCC-006](PCC-006-project-card-creation-e2e-and-regression-checkpoint.md) / `PCC-BATCH-06` | `planned` | PCC-001 through PCC-005 `PASS` | Does the complete real-user flow prove storage fidelity, authorization isolation, failure safety, no perception trigger, frontend quality, and frozen-stack regressions? |

## Shared acceptance boundary

The complete set must satisfy the context's AC-01 through AC-32:

- authenticated `/home` shows `+ New project` in the established Project Library heading position;
- `/demo` remains fixture authority and keeps its existing create/share/processing behavior;
- production creation uses a real Better Auth session, Atlas/PostgreSQL metadata, and BSS-007 `DocumentStore` bytes;
- the creator receives owner membership, an empty Master, and an Initial Draft containing the accepted PRD metadata;
- every accepted PRD is a non-empty `application/pdf` no larger than 20 MiB, with bounded request/file-count limits;
- raw PDF bytes remain outside ordinary PostgreSQL rows and storage keys remain server-side metadata;
- `/home` lists only server-authorized projects and renders a production-safe card model;
- a new card says `Waiting for extraction`, `0 of N PRDs processed`, `0%`, `N PRDs uploaded`, and no published Master work;
- no production card links to `/demo`, exposes fixture Share, or claims extraction has started;
- duplicate IDs, partial storage/database failures, unauthenticated requests, invalid uploads, and CSRF/origin failures remain bounded;
- no pg-boss perception job, perception execution, source grant, normalized cache, semantic state, CES state, or publication state is created; and
- approved auth, BSS, `/demo`, CSP, build, and directly affected test boundaries remain green.

## Review controls

- Keep tickets `planned` until the user authorizes the relevant batch through `go`.
- Work only the current ticket or batch. Do not begin a dependent ticket from an `awaiting_review` predecessor.
- After implementation and validation, record the commit and set the ticket to `awaiting_review`.
- Use one consolidated CK artifact per review round for a batch; at most one CFC remediation commit may follow a `CHANGES_REQUIRED` review, and the review session is limited to three CK rounds. See the [CK skill](../../../../.agents/skills/ck/SKILL.md) and [CFC skill](../../../../.agents/skills/cfc/SKILL.md).
- Any requirement that changes the context or reopens BSS-007/BSS-009 is a `SCOPE_CHANGE`, not an implementation detail.

## Open planning finding

`PCC-003` deliberately carries `FINDING-PCC-003-01`: implementation must
reuse or explicitly establish the application's same-origin/CSRF check for the
new cookie-authenticated route. If the approved Better Auth trusted-origin
configuration is not sufficient for an application state-changing route, stop
for a scope decision instead of silently introducing a weaker or competing
policy.

## Execution environment

Docker Compose is the authoritative environment for every PCC implementation
and validation step that touches PostgreSQL, Better Auth persistence,
migrations, Atlas repositories, DocumentStore integration, or the application.

- Start the database first with `docker compose up -d postgres` and wait for the PostgreSQL health check to report `healthy`.
- Use `docker compose up -d --build` when the full Atlas/Agents Bridge stack is needed.
- Run package checks through the Compose-managed `atlas` service, for example `docker compose run --rm --build --no-deps atlas corepack pnpm --filter @atlas/db migration:check`.
- Run database-backed integration tests, auth lifecycle tests, repository tests, migrations, application builds, rendered HTML/CSP checks, and app tests inside Compose. The host filesystem may be used for source edits only.
- Host-local Node/pnpm commands and direct host database connections are diagnostic only; they are not authoritative evidence for a PCC checkpoint.
- Each implementation checkpoint must record service health, exact Compose commands, test counts, intentional skips, and environment limitations.

## Completion boundary

This set is complete when an authenticated user can create a real project from
`/home`, upload bounded PDF PRDs through multipart transport, see an authorized
production card in `Waiting for extraction`, and observe no downstream
perception/extraction/review/publication activity. The project remains ready
for a later, separately reviewed Document Perception phase.
