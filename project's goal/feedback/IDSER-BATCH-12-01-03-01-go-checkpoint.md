# GO checkpoint: IDSER-012-01-03-01 / IDSER-BATCH-12-01-03-01

- **Ticket authority:** `IDSER-012-01-03-01-qualified-docling-capture-and-deterministic-evidence-mapping.md`
- **State:** `awaiting_review`
- **Predecessor:** IDSER-012-01-02 CK PASS at `c4c103b`.

The bounded implementation adds the RUN-003 capture-only profile, deterministic mapping, transient validated PNG descriptors, and an isolated Docling-only Compose qualifier. The ordinary route rejects this profile and the worker refuses it before normalization/result acceptance. No Atlas database, job, semantic, or durable asset seam is included.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence / validation | Status |
| --- | --- | --- | --- |
| RC-012010301-01 | Exact capture profile and identity; mismatch fails readiness. | Adapter options plus `docling-provider.test.ts`; route rejects capture profile for ordinary admission. | PROVEN |
| RC-012010301-02 | Complete deterministic Safara text/table mapping. | Real qualifier: 254 texts, 4 tables, 69-cell frozen fixture result; table-grid negative tests. | PROVEN |
| RC-012010301-03 | Five source-only figures on documented pages. | Real qualifier maps 5 transient visuals; PNG/media/dimension/bounds negatives. | PROVEN |
| RC-012010301-04 | Stable compliant IDs and trusted locators/excerpts. | Deterministic IDs; duplicate/provenance/self-ref rejection tests. | PROVEN |
| RC-012010301-05 | Sequential, two-concurrent, held-third real-PDF proof. | Isolated Compose run: sequential 8.118/8.016s Docling processing; concurrent pair 11.717/11.509s, 12.060s wall; third held at 250ms and completed after release in 20.105s. | PROVEN |
| RC-012010301-06 | Profile/cache evidence cannot mix. | Profile-specific identity and activation-gate rejection tests. | PROVEN |
| RC-012010301-07 | Geometry/order/provenance preserved and invalid input fails. | TOPLEFT conversion, malformed page/bounds tests, real repeated mapping. | PROVEN |
| RC-012010301-08 | Bounded transient visual handoff only. | Five descriptors carry source/profile/page/locator/geometry/hash/bytes; mapped V1 output has no `derived/` reference. | PROVEN |
| RC-012010301-09 | No premature activation. | `document-perception-worker.ts` rejects asset-handoff capture; route registry rejects normal capture configuration. | PROVEN |

Qualification used Docling Serve `1.36.0`, runtime `2.132.0`, one Uvicorn worker and local conversion concurrency two. Real response sizes were 456493–456495 bytes (under 10485760); the live `docker stats` concurrent sample observed 2.615 GiB / 15.42 GiB memory and 1141.94% host-normalized CPU. The server log showed workers 0 and 1 process the pair while the third queued until a completion. No Atlas service was present in the Compose project.

Validation passed:

```text
corepack pnpm --filter @atlas/agents-bridge typecheck
node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs apps/agents-bridge/tests/docling-provider.test.ts
docker compose -f docker-compose.idser-012-01-03-01-qualification.yml up --build --abort-on-container-exit --exit-code-from qualification
git diff --check
```

Internal readiness: READY_FOR_CK

This is implementation readiness only; GO does not issue PASS.
