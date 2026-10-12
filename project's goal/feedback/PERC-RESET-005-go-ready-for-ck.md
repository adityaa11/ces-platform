# PERC-RESET-005 GO authenticated Project A creation checkpoint

- **Ticket:** `PERC-RESET-005` — Authenticated Project A creation and workspace contract
- **Batch:** `PERC-RESET`
- **Authorized checkpoint:** `GO PERC-RESET-005`
- **Dependency:** `PERC-RESET-004`, approved after independent CK `PASS` (`PERC-RESET-BATCH-04-e03e3dc-review.md`)
- **Ticket state:** `awaiting_review`
- **Created project:** `safara-professional-perception` (`156d4756-55cf-491f-9fa1-bea3c37ecb84`)
- **Date:** 2026-10-13
- **Scope boundary:** one authenticated multipart project creation and its persisted initial state only. No manual provider, semantic, review, or Master-publication work was performed.

## Creation evidence

The source remained in place at
`C:\Workspace\atlas\ces-platform\docs\example\Safara_Buyer_Business_PRD_Professional.pdf`.

| Property | Observed value |
| --- | --- |
| Header | `%PDF-` |
| Media type persisted by the application | `application/pdf` |
| Size | `314167` bytes |
| SHA-256 | `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df` |
| Authenticated request | Fresh local user authenticated through `/api/auth/sign-in/email`; cookie was used only for the same-origin request and is not recorded here |
| Creation route/result | `POST http://localhost:3001/api/projects`, multipart/form-data, HTTP `201` |
| Response | `projectId=safara-professional-perception`, `documentCount=1` |

The target stable ID was checked unused before the request. Exactly one project was created; no second professional project was created.

## Persisted observations

The following read-only query was executed against the canonical Postgres service:

```powershell
$sql | docker exec -i atlas-canonical-perception-postgres-1 psql -U atlas -d atlas_dev -At
```

The query joined `atlas.project`, `atlas.workspace`, `atlas.document`,
`atlas.extraction_bundle`, `atlas.extraction_bundle_document`, and
`atlas.document_perception_execution` by stable project ID and counted semantic
effects for that same project.

| Record | Observed value |
| --- | --- |
| Project owner | `created_by_user_id` matches the authenticated creator on both project and document |
| Workspaces | exactly two: Master `4450b546-4a9f-40c8-98bf-841185770c63` (`master`, `empty`) and Initial Draft `f3bcd148-6e06-4b52-a50d-badd8e87e04a` (`initial_draft`, `draft`) |
| Immutable document | `5b178308-31e1-497d-b859-14a08b2fcf55`; belongs to Initial Draft; original filename, media type, size, and SHA-256 match the source above |
| Bundle | `e9811a0d-a833-4965-a098-4b69f884b719`; belongs to Initial Draft; `perception_admission_policy=staged-fair-local-v1`; expected count `1` |
| Ordered member | sequence `1`, belongs to the same Initial Draft and bundle, and references the one document |
| Perception kickoff | execution `39cc9cad-9d74-4cfa-8eb6-9c435d03022e`; `capability_identity=docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1`; `contract_version=v1` |
| Observed automatic state | execution `completed`; member `perceived`; bundle remained `processing` with completed count `0` at this ticket's observation point |
| Semantic effects | `atlas.semantic_execution=0`; target-associated semantic pg-boss jobs `0`; the complete live pg-boss inventory was only `atlas-document-perception-v1:1` |

The route state advanced before observation. This is reported as an observed
perception state only; it is not a claim of Ticket 006's source-evidence
acceptance work.

## Project card observation

The authenticated Atlas home-card service was invoked with a short-lived
internal identity signature generated inside the Atlas container; no secret or
session token was emitted. It returned HTTP `200` and exactly one card for the
new project:

```text
projectId: safara-professional-perception
state: extracting
documentCount: 1
master.label: No published work
initialDraft: 0 of 1 PRDs processed (0%)
action: Workspace unavailable
```

This establishes that the supported authenticated UI projection can discover
the project while not claiming Master publication or semantic readiness.

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / validation | Status |
| --- | --- | --- | --- | --- |
| RC-PERC-RESET-005-01 | Actions 1–2 | Existing PDF with exact identity; one fresh stable ID created by the real authenticated multipart route | PowerShell signature/hash/size check; preflight DB availability query; authenticated `POST /api/projects` returned `201` | PROVEN |
| RC-PERC-RESET-005-02 | Actions 2–3; binary oracle | Project ownership, exactly one empty Master and one draft Initial Draft, and exactly one immutable Initial Draft source | Project/workspace/document query returned the owner-bound project, exactly two required workspace rows, and one matching source row | PROVEN |
| RC-PERC-RESET-005-03 | Action 3; binary oracle | One staged bundle and ordered member bound to Initial Draft and source | Bundle/member query returned one `staged-fair-local-v1` bundle and sequence-one member in Initial Draft | PROVEN |
| RC-PERC-RESET-005-04 | Action 4 | Supported project-card/UI projection can find the project without asserting publication/readiness | Authenticated `/internal/home-projects` read returned HTTP `200` and the card shown above, including `No published work` | PROVEN |
| RC-PERC-RESET-005-05 | Action 5; binary oracle | Perception kickoff resolves to RUN-003; no semantic execution/job, review, published Master, or alternate perception route | Persisted execution identity is `docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1`; target semantic execution/job counts are zero; Master remains `empty`; predecessor 004's approved single-route evidence is consumed unchanged | PROVEN |

Internal readiness: `READY_FOR_CK`.

This is an implementation readiness handoff only. It is not a CK `PASS` and
does not authorize `PERC-RESET-006`.
