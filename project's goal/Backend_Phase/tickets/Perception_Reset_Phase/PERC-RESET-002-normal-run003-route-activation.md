# PERC-RESET-002 — Sole normal RUN-003 perception route

**Stage:** 2/8 · **Type:** small configuration/route cutover · **Dependency:** 001 complete · **GO:** `GO PERC-RESET-002` only.

**Workflow state:** `approved` — independent CK `PASS` is recorded in `project's goal/feedback/PERC-RESET-BATCH-02-9a0ef58-verification.md`.

## Outcome

Make the ordinary `docker-compose.yml` the canonical configuration for exactly **one** enabled `atlas.document.perceive` route, backed by `atlas-digital-pdf-run-003-capture-v1` with no qualification-only override or legacy fallback. This will be the profile used in manual runs after canonical boot.

## Scope

Inspect `docker-compose.yml`, `apps/agents-bridge/src/{route-registry,config,worker-main}.ts`, `providers/docling.ts`, Atlas D1 terminal identity and the reviewed `IDSER-012-01-03-01/02` records. Fix only these normal-route seams:

- `DOCLING_OPTION_PROFILE=atlas-digital-pdf-run-003-capture-v1` on the normal worker.
- Qualified `AGENTS_BRIDGE_QUALIFIED_ROUTES` identity on **both** Bridge service and worker; exactly one perception mapping.
- `ATLAS_D1_PERCEPTION_CAPABILITY_IDENTITY` aligned with RUN-003 full cache/route identity, never old `docling-digital-pdf`.
- Specific qualification-ref-backed normal RUN-003 approval instead of an obsolete blanket rejection. **Do not** enable `AGENTS_BRIDGE_QUALIFICATION_ONLY` in canonical Compose or permit arbitrary unqualified Docling profiles.
- Existing private Docling versions/digest, limits, concurrency and no-OCR contract retained.
- Ensure that normal Compose will mount the actual cache volume protected by 001 under `/root/.cache` in the new canonical Docling service (explicit volume name / managed migration in 004). Do not create an unused fresh cache volume under the new Compose project by accident.
- No enabled Mistral/Gemini/other perception fallback; avoid changing unrelated adapter code unless directly essential to exact-route enforcement.

No new runtime is started on this ticket; use static/isolated **non-Docker** tests where possible because 001 cleared all **obsolete** Docker runtime state but deliberately retained the downloaded Docling model-cache volume (and pinned image if present). If focused tests demand Docker, defer their real runtime proof to 004 and record that explicitly instead of launching a transient legacy stack.

## Binary review contract

- **R2-01:** effective intended Compose values are internally aligned for RUN-003 across Atlas and both Bridge services.
- **R2-02:** with `qualificationOnly=false`, the exact reviewed RUN-003 route is permitted; unqualified/mismatched route/profile/identity fails closed.
- **R2-03:** no second normal perception route or automatic fallback exists. Historical profile can remain as unit-test fixture but is not selected by canonical route.
- **R2-04:** staged perception still ends at `perceived`, without semantic execution activation.

## Evidence and stop

Changed-file list, original/current route diffs, config assertion tests, approved qualification references and source-level negative paths. Stop on required revision of Docling binary, independent permission policy or unrelated semantic interfaces. Do not mutate REL-03. **Terminal:** `READY_FOR_CK`, `CHANGES_REQUIRED`, or `BLOCKED`.
