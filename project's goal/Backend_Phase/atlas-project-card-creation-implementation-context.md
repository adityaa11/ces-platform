# Atlas Project Card Creation and PRD Intake Implementation Context

## Status

This document is the implementation context for the next production-shaped Atlas Backend Phase slice on:

```text
branch: codex/new-atlas-backend
```

It covers the transition from an authenticated `/home` route with an empty production project library to a real production project card created from user-entered project metadata and uploaded PRD PDFs.

This context intentionally stops after the uploaded PRD source bytes are stored through the approved `DocumentStore` boundary and the Atlas project/domain metadata is durably committed.

The resulting production Project Card state is:

```text
Waiting for extraction
```

This context does not start Document Perception, Semantic Extraction, reconciliation, review, CES, or publication.

Primary references:

- `project's goal/Backend_Phase/README.md`
- `project's goal/Backend_Phase/atlas-backend-production-baseline-mistral-synced.md`
- `project's goal/Backend_Phase/atlas-core-architecture-checkpoint-v2-mistral-enriched-v2.md`
- `project's goal/Backend_Phase/atlas-sign-in-home-implementation-context.md`
- `project's goal/Backend_Phase/atlas-sign-out-implementation-context.md`
- `project's goal/Backend_Phase/tickets/Stack_Setup/README.md`
- `project's goal/Backend_Phase/tickets/Stack_Setup/BSS-007-document-store-foundation.md`
- `project's goal/Backend_Phase/tickets/Stack_Setup/BSS-009-document-perception-pipeline.md`
- `project's goal/Backend_Phase/tickets/Stack_Setup/BSS-009-01-atlas-perception-authority.md`
- `project's goal/Backend_Phase/tickets/Stack_Setup/BSS-009-02-bridge-perception-integration.md`
- current `apps/atlas/app/home/page.tsx`
- current `apps/atlas/app/demo/page.tsx`
- current `apps/atlas/components/ProjectLibrary.tsx`
- current `apps/atlas/components/ProjectCard.tsx`
- the user-supplied Project Library screenshot for the `+ New project` placement

The central rule is:

> A successful production project creation creates Atlas-owned project authorization and Initial Draft source-document state, stores each uploaded PRD as immutable bytes through `DocumentStore`, and then stops with the project waiting for extraction.

The complete phase boundary is:

```text
authenticated user
      |
      v
+ New project
      |
      v
project metadata + PRD PDFs
      |
      v
server-side validation
      |
      v
DocumentStore.put(...)
      |
      v
immutable PRD source bytes
      |
      v
Atlas PostgreSQL metadata
      |
      +-- project
      +-- creator membership
      +-- empty Master identity/state
      +-- Initial Draft identity/state
      +-- document metadata
      |
      v
Project Card
      |
      v
Waiting for extraction
      |
      v
STOP
```

The next phase may begin Document Perception and later Semantic Extraction. This phase must not do so.

---

# 1. Visual Reference and `+ New project` Placement

The user-supplied screenshot shows the existing `/demo` Project Library.

The blue rectangle identifies the existing:

```text
+ New project
```

button in the upper-right area of the Projects heading row.

The production `/home` route must display the same control in the same Project Library heading location.

The required visual relationship is:

```text
Your workspace
Projects                                         + New project
See what each project is...
```

The production button must reuse the established Atlas component language rather than introduce a second production-only visual design.

The production button must not reuse fixture persistence behavior.

The intended separation is:

```text
/demo
    + New project
        -> fixture creation behavior
        -> /api/local-fixtures
        -> fixture processing simulation

/home
    + New project
        -> production project creation behavior
        -> Atlas project application boundary
        -> PostgreSQL + DocumentStore
        -> Waiting for extraction
```

The shared presentation may remain visually reusable, but the runtime authority must be explicit.

---

# 2. Current Production State

The approved sign-in/home implementation currently establishes:

```text
/home
    |
    +-- real Better Auth session
    +-- real session user name/email
    +-- production ProjectLibrary mode
    +-- projects = []
```

The current route effectively ends at:

```tsx
<ProjectLibrary
  mode="production"
  projects={[]}
  user={user}
/>
```

That empty state was intentional because production project persistence was previously out of scope.

The current `ProjectLibrary` also intentionally hides project creation in production mode:

```text
canCreate = mode === "fixture" && ...
```

That restriction was correct before this context.

This context is the explicit authorization to replace the production empty-only project boundary with real project creation and real production project reads.

---

# 3. Existing Fixture Creation Must Not Become Production Authority

The existing `/demo` creation path currently performs fixture behavior such as:

```text
createFixtureProject(...)
POST /api/local-fixtures
base64-encoded uploaded files
fixture workspace IDs
fixture processing job
"Extraction has started"
```

That behavior remains useful for `/demo`.

It is not the production implementation.

Production `/home` must not:

```text
call createFixtureProject(...)
POST to /api/local-fixtures
encode PRD bytes into fixture JSON
create fixture processing jobs
invent fixture memberships
use fixture workspaces as persisted Atlas state
announce that extraction has started
```

`/demo` remains fixture authority.

`/home` becomes Atlas/PostgreSQL/DocumentStore authority.

---

# 4. Precise Scope Boundary

This context includes:

```text
authenticated production Project Library
        |
        v
+ New project button
        |
        v
Create a project dialog
        |
        v
Project ID
Project Name
Project Description
PRD PDFs
        |
        v
production create request
        |
        v
Atlas authorization
        |
        v
immutable PRD storage
        |
        v
project/domain metadata persistence
        |
        v
authorized project listing
        |
        v
Waiting for extraction Project Card
```

This context ends before:

```text
pg-boss perception submission
DocumentPerceptionRequest creation
document_perception_execution creation
source grant creation
Agents Bridge execution
Mistral OCR
NormalizedDocument creation
normalized_document_cache writes
Semantic Extraction
SemanticCandidates
retrieval
reconciliation
review state
review projection
chatbot mediation
resolved knowledge
Main Workflow
Project Facts
CES
approval
publication
Master HEAD advancement
```

No ticket generated from this context may silently cross that line.

---

# 5. Authority Boundaries

The approved Backend Phase boundaries remain authoritative.

## 5.1 Better Auth

Better Auth owns:

```text
identity
credentials
session persistence
session cookies
```

The current session tells Atlas:

```text
who is creating the project
```

It does not itself own the project.

## 5.2 Atlas

Atlas owns:

```text
project identity
project authorization
project membership
Master identity/state
Initial Draft identity/state
source-document identity
source-document metadata
project-card projection
later workspace/revision/truth lifecycle
```

## 5.3 PostgreSQL

PostgreSQL stores Atlas-owned production metadata.

Raw PRD PDF bytes must not be stored in normal PostgreSQL document rows.

## 5.4 DocumentStore

`DocumentStore` owns immutable source bytes.

The existing BSS-007 contract remains authoritative:

```ts
interface DocumentStore {
  put(input: PutDocumentInput): Promise<StoredDocument>;
  read(storageKey: string): Promise<Uint8Array>;
}
```

Production project creation must consume this boundary rather than writing directly to `.atlas-data`.

## 5.5 Agents Bridge

Agents Bridge has no role in this phase.

It must not be called during project creation.

## 5.6 pg-boss

The queue exists but must not be used by this phase.

No perception or extraction job is submitted merely because PRDs have been uploaded.

---

# 6. Successful Project Creation Outcome

A successful production project creation must result in one coherent Atlas project state.

Conceptually:

```text
Project
|
+-- creator membership
|     role = owner
|
+-- Master
|     state = empty / no published work
|
+-- Initial Draft
      |
      +-- PRD document 1
      +-- PRD document 2
      +-- ...
      |
      +-- extraction has not started
```

At minimum, Atlas must persist enough domain state to represent:

```text
project
project creator/owner membership
empty Master identity/state
Initial Draft identity/state
uploaded source documents
```

These must be real Atlas records, not data encoded only inside a Project Card.

The physical schema may use separate tables or an equivalent normalized representation, but the architecture distinction must remain visible.

Do not collapse:

```text
Master
Initial Draft
uploaded documents
```

into one client-only status string.

---

# 7. Project Identity

The current Create a project modal exposes a human-entered stable Project ID.

Preserve the existing UI contract:

```text
Project ID:
3-48 lowercase letters, numbers, and hyphens
example: customer-portal-v2
```

The submitted Project ID remains the stable human-facing project key.

The production repository must enforce uniqueness at the database boundary, not only in the browser.

The server may also use an internal generated database identifier if that better fits the persistence model.

If an internal identifier is introduced:

```text
human Project ID != internal database primary key
```

The human Project ID must remain stable and visible on the Project Card.

Neither value may be used as a filesystem path.

Neither value may be used as a caller-controlled `DocumentStore` key.

---

# 8. Creator Membership and Authorization

Project creation is the first production flow in this Backend Phase that creates Atlas project authorization.

On successful creation:

```text
current Better Auth user
        |
        v
Atlas project_member
        |
        v
role = owner
```

The creator becomes the initial project owner.

This does not create:

```text
organization membership
global Atlas admin role
editor memberships
viewer memberships
invitations
sharing
```

Those remain later authorization features.

The production `+ New project` control must not require an existing project role.

A new authenticated user has no project role before creating the first project.

Correct rule:

```text
authenticated user
    -> may invoke production project creation
    -> successful creation gives that user owner membership in the new project
```

Incorrect rule:

```text
must already be project owner/editor before creating first project
```

The current fixture `canCreate` rule must therefore not be reused as the production authorization rule.

---

# 9. Master and Initial Draft Creation

The architecture checkpoint defines the initial lifecycle as:

```text
Create Project
    |
    v
Empty Master
    +
Initial Draft
    |
    v
Initial PRD processing
```

This implementation creates the first two durable project/workspace identities:

```text
Empty Master
Initial Draft
```

The Initial Draft receives the uploaded PRD source documents.

The Master has no published work.

No accepted semantic revision exists yet.

Therefore this context does not require:

```text
published revision
resolved knowledge
accepted assertions
publication event
Master HEAD advancement
```

If `workspace_head` or revision persistence is not otherwise required to represent the empty state, do not create fake revisions solely to populate the Project Card.

The card must be able to truthfully say:

```text
Master
No published work
Nothing has been published yet.
```

because no publication exists.

---

# 10. PRD Intake Form Contract

The production `/home` Create a project dialog should preserve the existing proven fixture-era field contract.

Fields remain:

| Field | Required | Contract |
|---|---|---|
| Project ID | Yes | 3-48 lowercase letters, numbers, and hyphens |
| Project Name | Yes | 1-80 characters |
| Project Description | No | 0-280 characters |
| PRD PDFs | Yes | one or more PDF files |

Expected validation messages may continue to use the current wording:

```text
Enter a project ID.
Use 3-48 lowercase letters, numbers, and hyphens, for example customer-portal-v2.
That project ID is already in use.
Enter a project name.
Project name must be 80 characters or fewer.
Project description must be 280 characters or fewer.
Select at least one PRD PDF.
Only PDF files can be added.
```

Client validation remains usability behavior.

Server validation is authoritative.

Production validation constants and validators must not depend on `@atlas/fixtures` as runtime authority.

If the existing fixture validation values are still the desired product contract, move or reproduce the stable validation contract in a production-safe shared boundary and let fixtures adapt to it where useful.

---

# 11. PDF Limits and Future Perception Compatibility

BSS-009 already freezes the current perception-source limit:

```text
application/pdf
byte_size > 0
byte_size <= 20 MiB
```

The production project intake must not accept an individual PRD that the existing approved perception pipeline can never consume.

Therefore each uploaded PRD must be:

```text
media type: application/pdf
size: > 0
size: <= 20 MiB
```

Server-side validation must enforce this even if the browser reports a PDF MIME type.

The implementation must also validate enough source structure to reject an obvious non-PDF payload masquerading as `application/pdf`.

The original file name is metadata only.

Never use the original file name as:

```text
filesystem path
DocumentStore key
database primary key
authorization identity
```

A bounded maximum file count and total request size must also be enforced at the request boundary. The ticket may bind those limits to the existing application/server upload capacity, but must not leave the multipart request unbounded.

---

# 12. Production Upload Transport

The fixture flow currently base64-encodes files into JSON.

Production must not do that.

The production browser request should use:

```text
multipart/form-data
```

through a same-origin authenticated request.

Representative endpoint:

```http
POST /api/projects
```

Representative fields:

```text
projectId
projectName
projectDescription
prdFiles[]
```

The browser must send the normal Better Auth session cookie through the same-origin request.

Do not add:

```text
base64 PDF JSON transport
client-generated bearer token
custom JWT
localStorage auth token
sessionStorage auth token
```

The exact route file may follow the current Next.js application structure, but one production project-creation boundary must be authoritative.

---

# 13. Production Project Creation Service

Project creation must be implemented as a server-side Atlas application/domain operation rather than as UI mutation logic.

Conceptually:

```text
POST /api/projects
      |
      v
resolve Better Auth session
      |
      v
validate request
      |
      v
check project ID availability
      |
      v
store all PRD bytes through DocumentStore
      |
      v
create Atlas project/domain metadata
      |
      v
commit
      |
      v
return created project summary
```

The React component must not:

```text
write PostgreSQL directly
write .atlas-data directly
construct DocumentStore paths
create membership records itself
decide authorization from client state
```

The server owns all of those boundaries.

---

# 14. DocumentStore Integration

For every accepted PRD:

```text
uploaded File bytes
      |
      v
Uint8Array
      |
      v
DocumentStore.put({
  bytes,
  mediaType: "application/pdf"
})
      |
      v
StoredDocument
```

The current BSS-007 adapter returns:

```text
storageKey
contentHash
byteSize
mediaType
```

The storage key is generated by the storage boundary and is opaque.

The production project service must never construct a path such as:

```text
projects/<projectId>/<filename>
```

The storage adapter remains responsible for physical placement.

The Atlas document metadata must preserve the storage identity needed for later BSS-009 perception without exposing it to the browser.

At minimum Atlas must persist, per PRD:

```text
document/artifact ID
project identity
Initial Draft workspace identity
original file name
DocumentStore storage key
SHA-256 source digest
byte size
media type
created by
created at
```

The `DocumentStore` currently returns:

```text
sha256:<64 lowercase hex>
```

while the approved BSS-009 perception tables use a raw 64-character lowercase SHA-256 digest.

The project intake boundary must normalize and validate this deliberately.

Do not introduce two conflicting source hashes.

A future perception execution should be able to derive:

```text
artifact_id
document_storage_key
source_sha256
mime_type
byte_size
```

from the Atlas document record without rereading fixture metadata or rediscovering the upload.

The Atlas document/artifact ID created here should therefore remain stable enough to become the later BSS-009 `artifact_id`.

---

# 15. Immutable Source Rule

Uploaded PRDs are source documents.

Once project creation succeeds, their accepted bytes are immutable.

Changing the project later does not rewrite an existing PRD.

A later change creates a new document or Addendum according to the later workspace/correction lifecycle.

This phase must preserve:

> Durable project knowledge originates from immutable human-readable documents.

Even though this phase does not yet derive knowledge from those documents.

---

# 16. PostgreSQL Domain Persistence

The Backend Phase baseline already reserves the Atlas schema for production domain state.

This implementation is authorized to introduce the minimum real Atlas domain persistence required for project creation.

Conceptual responsibilities are:

```text
atlas.project
atlas.project_member
atlas.workspace
atlas.document
```

Equivalent table names are acceptable if the responsibility boundaries remain explicit.

The minimum persisted relationships are:

```text
project
  |
  +-- member
  |     user_id = Better Auth user ID
  |     role = owner
  |
  +-- Master workspace/state
  |
  +-- Initial Draft workspace/state
        |
        +-- document
        +-- document
        +-- ...
```

The schema must support the following production read:

```text
list projects accessible to current user
```

without enumerating every Atlas project and filtering in the browser.

The database must enforce the stable Project ID uniqueness rule.

Storage keys must be private server-side metadata.

Raw PDF bytes must not be stored in ordinary Atlas PostgreSQL rows.

---

# 17. Atlas Core and Repository Boundary

Preserve the existing BSS-003 architecture:

```text
Atlas Core
    |
    v
repository interfaces
    |
    v
PostgreSQL / Drizzle implementation
```

Do not move Drizzle-specific queries into Atlas Core.

A reasonable production responsibility split is:

```text
packages/atlas-core
    project creation command/service
    project authorization rules
    project listing contract
    document metadata contract
    repository interfaces

packages/atlas-db
    schema
    migration
    Drizzle repository implementations

packages/document-store
    existing DocumentStore contract
    existing local development adapter

apps/atlas
    session resolution
    multipart HTTP boundary
    UI submission
    /home Project Library projection
```

Exact file names may follow repository conventions, but these ownership boundaries must remain intact.

---

# 18. Creation Ordering and Atomic Visibility

PostgreSQL and `DocumentStore` are different persistence systems.

The current `DocumentStore` contract exposes:

```text
put
read
```

and does not expose delete/rollback semantics.

This context must not pretend the two systems form one distributed transaction.

Use the following safety rule:

> A production project must not become visible in PostgreSQL until every required PRD has been successfully stored.

Recommended orchestration:

```text
1. authenticate request
2. validate all project fields
3. validate all PRD metadata/content
4. preflight Project ID availability
5. write every PRD through DocumentStore
6. collect immutable storage metadata
7. begin one PostgreSQL transaction
8. create project
9. create creator owner membership
10. create empty Master identity/state
11. create Initial Draft identity/state
12. create document metadata rows
13. commit transaction
14. return success
```

If any `DocumentStore.put(...)` fails:

```text
no project/domain rows are committed
no Project Card appears
```

If PostgreSQL fails after bytes were already written:

```text
the project must not become partially visible
the unreferenced stored object must not become Atlas project authority
```

Because BSS-007 does not currently expose deletion, this ticket must not silently redesign the storage contract solely to simulate rollback.

Unreferenced storage cleanup may be handled by a later operational cleanup capability if required.

The important correctness boundary for this phase is:

```text
no dangling visible project that references missing PRD bytes
```

---

# 19. Duplicate Submission Behavior

The client must disable the production create action while a request is in flight.

Only one create request may be active for the dialog at a time.

The server must still enforce Project ID uniqueness because client disabling is not an authority boundary.

A duplicate Project ID must return a bounded conflict response.

Recommended HTTP shape:

```text
409 Conflict
```

The UI may map this back to:

```text
That project ID is already in use.
```

Do not rely on an in-memory `libraryProjects.some(...)` check as the production uniqueness guarantee.

---

# 20. Production `/home` Project Read

After this context, `/home` no longer hard-codes:

```text
projects = []
```

Instead:

```text
authenticated session
      |
      v
current Better Auth user ID
      |
      v
Atlas project membership repository
      |
      v
authorized production projects
      |
      v
Project Card projection
```

A user with no project memberships still receives:

```text
projects = []
```

A user who creates a project receives that project.

A different user who has no membership must not see it.

The project query must be authorization-scoped on the server.

Do not:

```text
SELECT every project
send all projects to browser
filter by user in React
```

---

# 21. Production Project Card View Model

The current `ProjectCard` consumes `ProjectFixture`.

That was acceptable while production `/home` always supplied an empty array.

It is no longer an acceptable production data contract once real projects exist.

The production Project Card must not require fixture types to represent real Atlas state.

Introduce or refactor toward a production-safe shared presentation model.

Representative shape:

```ts
type ProjectCardViewModel = {
  projectId: string;
  name: string;
  summary: string;
  state: "waiting-for-extraction" | /* later states */;
  master: {
    summary: string;
    detail: string;
  };
  initialDraft: {
    processedPrds: number;
    totalPrds: number;
    progress: number;
  };
  metrics: readonly {
    label: string;
    value: string | number;
  }[];
  action: {
    enabled: boolean;
    label: string;
    unavailableReason?: string;
  };
};
```

This is illustrative, not a requirement to use that exact TypeScript shape.

The architectural requirement is:

```text
fixture domain record
        |
        v
fixture adapter
        |
        v
shared Project Card presentation

production Atlas record
        |
        v
production projection
        |
        v
shared Project Card presentation
```

Not:

```text
production Atlas project
        |
        v
pretend it is ProjectFixture
```

`@atlas/fixtures` remains regression/golden material.

---

# 22. Canonical `Waiting for extraction` Meaning

For this implementation context, `Waiting for extraction` has a precise meaning:

```text
project exists
creator membership exists
empty Master exists
Initial Draft exists
one or more PRD source documents exist
all accepted PRD bytes are in DocumentStore
document metadata is committed
no extraction has started
```

It must not mean:

```text
perception job queued
OCR running
NormalizedDocument available
Semantic Extraction running
```

The card state should be derived from real Atlas project/document state.

Do not persist a UI-only card badge as the only source of lifecycle truth.

At this checkpoint the deterministic projection is effectively:

```text
Initial Draft has uploaded PRDs
AND no downstream extraction state exists
    -> Waiting for extraction
```

A later extraction implementation may extend that projection with states such as:

```text
Extracting
Ready for review
Needs attention
```

This context does not implement those production transitions.

---

# 23. Required Project Card Content

A newly created production project must render a card consistent with the current Project Library visual language.

Its truthful state is:

```text
status:
Waiting for extraction

Master:
No published work
Nothing has been published yet.

Initial Draft:
0 of N PRDs processed
0%

metrics:
0 published facts
N PRDs uploaded
Waiting for extraction
```

The exact metric labels may preserve the current Project Card layout, but they must not claim extracted facts or completed work.

The project description supplied by the user may populate the card summary.

If the description is empty, use a bounded neutral fallback rather than inventing project meaning.

The card must not display:

```text
Extracting
Ready for review
Published
extracted facts > 0
published facts > 0
100% extraction
```

for a project created by this context.

---

# 24. Production Card Navigation

The current shared Project Library calculates `demoHref(...)` for every project.

That must not be used for a real production project.

A production Project Card created in this phase must never navigate into:

```text
/demo
```

because extraction/workspace production routes are not part of this scope.

Until a production project/workspace route is explicitly implemented, the production card must have no enabled project-opening action.

It may:

```text
render the existing disabled/unavailable primary action
```

or:

```text
omit the primary action
```

as long as it does not create a fake production route or send the user to fixture authority.

The unavailable reason should make the lifecycle boundary clear, for example:

```text
Project processing has not started yet.
```

Do not add a production Share action in this phase.

Project sharing remains out of scope.

---

# 25. `+ New project` Production Behavior

On `/home`, an authenticated user must see:

```text
+ New project
```

in the same heading position highlighted by the supplied screenshot.

Clicking it opens the existing Create a project interaction or a production-safe refactor of the same dialog.

The visual form can be reused.

The submit implementation must differ by authority:

```text
fixture mode
    -> existing fixture create handler

production mode
    -> production project create submission
```

Do not use one ambiguous handler that may accidentally POST production users to `/api/local-fixtures`.

A small production submission helper is recommended so request state remains independently testable.

Representative responsibility:

```text
createProjectSubmission(...)
    |
    +-- one in-flight request
    +-- multipart request
    +-- safe response parsing
    +-- no database logic
    +-- no DocumentStore logic
```

The server, not the helper, owns project creation.

---

# 26. Production Create Button and Success Copy

The fixture modal currently uses:

```text
Create and process
```

and the fixture success path may announce:

```text
Extraction has started.
```

That copy is not true for this production phase.

Production copy must not imply downstream processing has started.

Preferred production submit label:

```text
Create project
```

or an equivalent bounded label such as:

```text
Create and upload
```

Preferred success feedback:

```text
Project <name> created. PRDs are waiting for extraction.
```

After success:

```text
close dialog
refresh/reconcile the production project list
show the new Waiting for extraction card
```

Do not show:

```text
Atlas is processing your project
Extracting text and structure
Extraction has started
```

until an extraction/perception phase actually owns that behavior.

The existing fixture copy may remain unchanged on `/demo`.

---

# 27. Server Error Contract

The production create boundary should return bounded errors that the UI can safely map.

Representative classes:

```text
400 Bad Request
    malformed fields
    missing PRD
    invalid Project ID
    invalid PDF payload

401 Unauthorized
    no valid Better Auth session

409 Conflict
    Project ID already exists

413 Payload Too Large
    file or request exceeds accepted bounds

415 Unsupported Media Type
    unsupported PRD media

500 Internal Server Error
    storage/database/internal failure
```

Do not return:

```text
DATABASE_URL
filesystem path
DocumentStore root
storage key
session cookie
raw SQL error
stack trace
raw internal exception
```

The browser should receive safe user-facing messages.

---

# 28. Authentication and CSRF Boundary

`POST /api/projects` is a cookie-authenticated state-changing route.

It must:

```text
resolve the current Better Auth session server-side
reject unauthenticated requests
enforce the application's same-origin/CSRF policy
```

Do not treat:

```text
the presence of a user object in React
```

as authorization.

Do not manually copy session cookies into JSON.

Do not expose session identifiers to the Project Card.

---

# 29. Document Security

The production upload boundary must preserve the existing Backend Phase document-security direction.

Required rules:

```text
PDF-only intake
server-side media validation
bounded file size
bounded request size
opaque generated DocumentStore key
no caller-controlled filesystem path
no original filename as path
no raw PDF bytes in logs
no storage key in client response
no raw PDF bytes in PostgreSQL metadata rows
```

Do not expose a public filesystem URL for locally stored PRDs.

Later document access must continue through Atlas authorization.

Agents Bridge must not receive a DocumentStore path.

---

# 30. BSS-009 Compatibility Without Starting BSS-009 Execution

The project/document records created here must be ready for the approved BSS-009 handoff later.

A future perception phase should be able to take an Atlas document and construct:

```text
artifact_id
document_storage_key
source_sha256
mime_type
byte_size
```

without changing the source bytes.

However this phase must not create:

```text
atlas.document_perception_execution
atlas.document_perception_source_grant
atlas.normalized_document_cache
```

as a side effect of project creation.

It must not submit:

```text
atlas-document-perception-v1
```

to pg-boss.

This is intentional.

The presence of an approved perception pipeline does not mean every upload automatically starts it.

---

# 31. Local Development DocumentStore Adapter

BSS-007 currently provides:

```text
LocalFilesystemDocumentStore
```

as the development adapter.

This context may use that adapter in the supported Docker Compose backend environment.

The production-shaped application logic must depend on:

```text
DocumentStore
```

not on:

```text
LocalFilesystemDocumentStore internals
.atlas-data path knowledge
Node filesystem calls in Atlas Core
```

A later S3/R2 implementation must be able to replace the local adapter without changing project/domain semantics.

Do not turn the current local filesystem location into project identity.

---

# 32. `/demo` Regression Boundary

`/demo` must remain functional after this implementation.

It continues to own:

```text
fixture project cards
fixture project creation
fixture processing simulation
fixture sharing
golden/stress scenarios
```

Production refactoring may extract shared presentation types/components, but it must not delete fixture behavior merely because `/home` now has real project creation.

The intended result is:

```text
                    shared presentation
                    /                 \
                   /                   \
               /demo                   /home
                 |                       |
          fixture authority        Atlas authority
          fixture creation         real project creation
          fixture projects         PostgreSQL projects
          fixture file JSON        DocumentStore bytes
          simulated extraction     Waiting for extraction
```

---

# 33. Existing Authentication Behavior Must Remain Frozen

This project-creation context does not reopen:

```text
SUS sign-up implementation
SIN sign-in implementation
SOUT sign-out implementation
```

Preserve:

```text
sign-in success -> /home
/home without session -> /sign-in
/home identity -> Better Auth session
sign-out -> Better Auth session invalidation -> /sign-in
/demo -> fixture authority
```

Project creation adds Atlas authorization after authentication.

It does not replace authentication.

---

# 34. Expected Implementation Surfaces

The exact ticket decomposition may vary, but the likely implementation surface includes the following areas.

## 34.1 Atlas Core

Likely new or extended project/document domain boundaries under:

```text
packages/atlas-core/
```

Responsibilities:

```text
project creation contract
project listing contract
membership authorization
workspace creation semantics
document metadata contract
repository interfaces
```

## 34.2 Atlas DB

Likely changes under:

```text
packages/atlas-db/
```

Responsibilities:

```text
Atlas domain migration
Drizzle schema
project repository
membership repository
workspace repository
document repository
authorization-scoped project listing
```

The current migration sequence ends at the approved BSS migrations.

Use the next repository-consistent migration sequence at implementation time rather than rewriting an approved BSS migration.

## 34.3 DocumentStore

Expected to remain structurally unchanged:

```text
packages/document-store/
```

Use the approved BSS-007 contract.

A DocumentStore contract change is a scope-expansion signal and should be justified before implementation.

## 34.4 Atlas Application

Likely changes under:

```text
apps/atlas/app/home/page.tsx
apps/atlas/app/api/projects/route.ts          NEW or equivalent
apps/atlas/components/ProjectLibrary.tsx
apps/atlas/components/ProjectCard.tsx
```

Likely supporting production boundaries may include:

```text
apps/atlas/components/project-create-submission.ts
apps/atlas/lib/project-service.ts
```

or repository-equivalent locations.

The exact names are not frozen.

The authority boundaries are.

---

# 35. Project Library Refactor Constraint

The current `ProjectLibrary.tsx` mixes:

```text
shared presentation
fixture creation
fixture hydration
fixture sharing
fixture project types
```

Production project creation must not make that coupling deeper.

A bounded refactor is authorized where necessary to separate:

```text
shared Project Library presentation
fixture-specific behavior
production-specific behavior
```

The implementation does not need to redesign the full Project Library.

It does need to ensure that production `/home` does not import fixture authority as the source of:

```text
project identity
project creation
membership
workspace identity
card lifecycle truth
```

Mode-specific adapters/wrappers are acceptable.

Shared UI is desirable.

Shared authority is not.

---

# 36. Project Card State Must Come From Production Data

The production card must be built from server-authorized Atlas data.

It must not derive lifecycle state from:

```text
component-local timeout
fake processing flag
fixture processing job
project name
PRD filename
hard-coded demo scenario
```

At the end of this phase the server can deterministically project:

```text
project exists
+
Initial Draft has N accepted source PRDs
+
no downstream extraction exists
=
Waiting for extraction
```

The UI only renders that result.

---

# 37. No Extraction Trigger Hidden in Project Creation

The following implementation shortcut is forbidden:

```text
create project
    |
    v
store PRDs
    |
    v
"while we are here" enqueue BSS-009
```

The user has deliberately separated the project/document intake checkpoint from extraction.

The reason is architectural and review-related:

```text
Project Creation / Source Persistence
        |
        | independent review checkpoint
        v
Document Perception / Extraction
```

This makes the source boundary independently testable before provider/model execution is introduced.

---

# 38. Application-Level Validation

Add production integration coverage that proves the complete bounded flow.

A representative successful test should:

1. create or use a unique Better Auth test user;
2. establish a real authenticated session;
3. request `/home` and confirm the production `+ New project` control is available;
4. submit a production project with valid metadata and at least one synthetic PDF;
5. assert project creation succeeds;
6. assert the creator has owner membership;
7. assert the empty Master representation exists;
8. assert the Initial Draft representation exists;
9. assert one document record exists per uploaded PRD;
10. assert each document record contains the expected private storage metadata;
11. read each stored object through `DocumentStore` and verify byte identity;
12. verify SHA-256, byte size, and media type match;
13. request `/home` again;
14. assert the new production Project Card appears;
15. assert its state is `Waiting for extraction`;
16. assert it shows `0 of N PRDs processed`;
17. assert it shows `N PRDs uploaded`;
18. assert it shows no published Master work;
19. assert there is no enabled `/demo` project action;
20. assert no perception/extraction job or normalized result was created.

---

# 39. Authorization Validation

Use at least two real test users.

Prove:

```text
User A creates Project A
User A sees Project A on /home
User A is owner of Project A

User B has no membership
User B does not see Project A on /home
```

Do not use fixture session roles to prove this boundary.

The authorization proof must come from real Atlas project membership state.

---

# 40. Failure Validation

Add focused coverage for:

```text
missing Project ID
invalid Project ID
duplicate Project ID
missing Project Name
overlong Project Name
overlong Project Description
no PRD files
zero-byte PRD
non-PDF content
spoofed PDF media type where practical
PRD over 20 MiB
oversized multipart request
unauthenticated create
untrusted origin / CSRF rejection
DocumentStore failure
PostgreSQL transaction failure
double submit
```

For storage failure:

```text
no production project becomes visible
```

For database failure after source writes:

```text
no partial project becomes visible
```

The test does not need to solve orphan cleanup.

It must prove orphaned storage cannot become visible project authority.

---

# 41. BSS Regression Validation

The project-creation ticket set must preserve the approved stack foundations.

At minimum keep green:

```text
@atlas/document-store tests
Atlas DB migration checks
BSS-004 auth lifecycle
sign-up regressions
sign-in regressions
sign-out regressions
authenticated /home regressions
/demo fixture regressions
rendered HTML/CSP checks
directly affected type checks
directly affected lint
application build
```

Do not weaken BSS-007 tests to make production project creation pass.

Do not modify approved BSS-009 behavior merely because the new document rows will feed it later.

---

# 42. Security Logging Rules

Never log:

```text
raw PRD bytes
base64 PRD contents
session cookie
Cookie header
BETTER_AUTH_SECRET
DATABASE_URL
absolute filesystem path
DocumentStore configured root
raw password
raw internal exception
```

Normal operational logs may identify a bounded internal project/document ID where appropriate, but should not expose sensitive document content.

Original filenames should be treated as untrusted human metadata.

---

# 43. Explicit Non-Goals

This implementation context does not include:

```text
Document Perception execution
Mistral OCR
Agents Bridge calls
pg-boss project/extraction job scheduling
NormalizedDocument creation
semantic extraction
SemanticCandidates
retrieval
reconciliation
review persistence
review projection
chatbot context
chatbot mediation
corrections
Addenda
resolved knowledge
Main Workflow production data
Project Facts production data
CES production data
Changes Done production data
workspace switcher production behavior
new workspace creation after Initial Draft
project sharing
invitations
editor/viewer management
project deletion
document deletion
document replacement
document download UI
publication
Master HEAD advancement
approval
global route middleware
OAuth
MFA
JWT browser architecture
S3/R2 implementation
```

Do not absorb those features into this ticket set.

---

# 44. Acceptance Criteria

## AC-01 - Production create control

Authenticated `/home` displays the `+ New project` button in the existing Project Library heading position shown in the supplied screenshot.

## AC-02 - Fixture button behavior preserved

`/demo` keeps its fixture creation behavior and remains fixture authority.

## AC-03 - Production create path

The `/home` button submits to a production Atlas project-creation boundary, not `/api/local-fixtures`.

## AC-04 - Real session authority

The creator identity comes from the current Better Auth server session.

## AC-05 - Real project persistence

Successful creation persists a real Atlas project.

## AC-06 - Creator ownership

Successful creation persists owner membership for the authenticated creator.

## AC-07 - Empty Master

Successful creation establishes an empty Master identity/state with no published work.

## AC-08 - Initial Draft

Successful creation establishes the project's Initial Draft identity/state.

## AC-09 - Required PRDs

At least one valid PDF PRD is required.

## AC-10 - Immutable bytes

Every accepted PRD is stored through the BSS-007 `DocumentStore` contract.

## AC-11 - No raw PDF database storage

Raw PRD bytes are not persisted in ordinary PostgreSQL Atlas rows.

## AC-12 - Private storage metadata

The DocumentStore key remains server-side and is not exposed as UI/project identity.

## AC-13 - Source metadata

Atlas persists stable document/artifact identity, source SHA-256, byte size, media type, original filename, project/workspace relation, creator, and creation time or equivalent metadata.

## AC-14 - Perception-compatible size

Each accepted PRD is greater than zero bytes and no larger than 20 MiB.

## AC-15 - No base64 production transport

Production PDF upload does not use the fixture base64 JSON transport.

## AC-16 - Authorized project listing

`/home` lists only projects the current user is authorized to access.

## AC-17 - Production view model

Real production projects are not represented by treating `ProjectFixture` as the production domain contract.

## AC-18 - Waiting state

A newly created production Project Card renders `Waiting for extraction`.

## AC-19 - Correct draft progress

The card renders `0 of N PRDs processed` and `0%`.

## AC-20 - Correct PRD metric

The card renders the actual number of uploaded PRDs.

## AC-21 - No fake published state

The card shows no published Master work and no published facts.

## AC-22 - No demo navigation

A production Project Card does not navigate to `/demo`.

## AC-23 - No production sharing yet

The newly created production card does not expose fixture-backed Share behavior.

## AC-24 - No extraction announcement

Production success copy does not say that extraction has started.

## AC-25 - No perception job

Project creation does not enqueue `atlas-document-perception-v1`.

## AC-26 - No perception state

Project creation does not create a perception execution, source grant, or NormalizedDocument cache.

## AC-27 - No semantic state

Project creation creates no SemanticCandidate, assertion, reconciliation, review, resolved knowledge, CES, or publication state.

## AC-28 - Duplicate protection

Project ID uniqueness is enforced by the production server/database boundary.

## AC-29 - Partial failure safety

A failed upload or failed database commit does not expose a partially created production project.

## AC-30 - Existing auth preserved

Approved sign-up, sign-in, authenticated-home, and sign-out behavior remains valid.

## AC-31 - DocumentStore preserved

BSS-007 remains the storage-neutral source-byte contract and is not replaced by direct filesystem writes.

## AC-32 - Fixture isolation

Production `/home` never silently hydrates or mutates fixture projects.

---

# 45. Planning Constraints for Ticket Generation

When Codex decomposes this context into tickets, it must preserve the phase cut instead of rediscovering the architecture.

The frozen inputs are:

```text
identity authority = Better Auth
project authorization authority = Atlas
project metadata persistence = PostgreSQL
source PDF persistence = DocumentStore
local development adapter = LocalFilesystemDocumentStore
production project route = /home
fixture route = /demo
production create control = + New project
project creation requires >= 1 PRD
PRD media type = application/pdf
max PRD size = 20 MiB each
new project Master = empty
new project workspace = Initial Draft
new card state = Waiting for extraction
perception/extraction trigger = out of scope
```

A reasonable dependency shape is:

```text
Atlas project/document domain + persistence
        |
        v
DocumentStore-backed project creation service
        |
        v
production project create HTTP boundary
        |
        v
/home + New project wiring
        |
        v
production Project Card projection
        |
        v
integration + authorization + regression checkpoint
```

Ticket generation must not create an extraction ticket from this context.

Ticket generation must not reopen BSS-007 or BSS-009 unless implementation discovers a concrete incompatibility that cannot be solved through their published interfaces.

If such an incompatibility appears, stop and surface it as a scope decision.

For each generated ticket, apply the existing Backend Phase security-readiness process with only the bounded ticket context rather than performing an uncontrolled full-system security redesign.

---

# 46. Non-Negotiable Guardrails

> `/demo` remains fixture authority.

> `/home` uses real Atlas project state.

> Better Auth answers who the user is. Atlas answers which projects the user may access.

> A user does not need a pre-existing project role to create their first project.

> Project creation gives the creator owner membership in that project.

> PRD bytes go through `DocumentStore`, never through fixture storage.

> The original filename is metadata, never a storage path.

> Raw PDF bytes do not belong in ordinary PostgreSQL project rows.

> Production Project Cards must not depend on `ProjectFixture` as their domain contract.

> `Waiting for extraction` means the PRDs are durably stored and extraction has not started.

> Uploading a PRD does not automatically authorize BSS-009 execution in this phase.

> No production card may link into `/demo`.

> No success message may claim extraction has started.

> The project becomes visible only after all required source bytes are stored and Atlas metadata is successfully committed.

---

# 47. Definition of Done

The completed implementation should be explainable in one sentence:

> An authenticated Atlas user can open `/home`, use the `+ New project` control in the established Project Library heading, create a real Atlas project with an empty Master and Initial Draft, upload one or more bounded PDF PRDs whose immutable bytes are stored through `DocumentStore`, receive owner membership, and then see an authorized production Project Card in `Waiting for extraction` state without starting perception, extraction, reconciliation, review, CES, or publication.
