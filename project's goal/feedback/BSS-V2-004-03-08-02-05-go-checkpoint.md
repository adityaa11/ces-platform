# BSS-V2-004-03-08-02-05 GO checkpoint — concrete Anoman multimodal transport conformance

- **Ticket authority:** `BSS-V2-004-03-08-02-05`; explicit user `GO BSS-V2-004-03-08-02-05`.
- **Base SHA:** `f701146960974e1b9207b9a80e5433c410957cfc`.
- **Candidate implementation SHA:** `77304fcbb868e4993b57b21c84c8e0d475376a34`.
- **Required predecessors:** `08-02-03` CK PASS (`fe788151d3c93dc8a4218a6312c8213b1a31a3c7`), `08-02-04` CK PASS (`0cb26011e8290ae52032b10c92c00ebcf3fffb4f`), and sole Anoman adapter owner `BSS-V2-004-03-04` CK PASS (`dbd42f2`).
- **Permitted implementation files:** `apps/agents-bridge/src/providers/anoman.ts` and `apps/agents-bridge/tests/anoman-provider.test.ts`. This checkpoint and its ticket-state line are workflow evidence only.
- **Ownership:** `BSS-V2-004-03-04` remains sole adapter lifecycle/route/configuration owner. This change adds only its permitted image serialization and fake-transport conformance seam; it does not alter route selection, worker activation, semantic schemas, source classification, admission, or fallback/retry behavior.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / exact validation | Status |
| --- | --- | --- | --- |
| RC-01 | Exact ordered text/image parts use a bounded Anoman wire encoding while preserving the pinned model, JSON mode, deadline/cancellation, and no source reclassification or provider schema authority. | `AnomanProvider.structuredMultipart` first uses the approved neutral capability preflight, then maps only ordered text and PNG bytes to OpenAI-compatible `text` / `image_url` parts. The rebuilt Compose test `tests/anoman-provider.test.ts` passes its exact ordering, bounded data-URL encoding, pinned object-mode, cancellation and no-side-effect negatives (6/6). | PROVEN |
| RC-02 | Retain Anoman text-only, Gemini, routing, normalized errors/usage/redaction; reject unsupported or invalid/oversized media before HTTP side effects. | Rebuilt Compose tests passed: `anoman-provider` 6/6, `multipart-provider-capabilities` 3/3, `gemini-provider` 8/8, `provider-capabilities-boundary` 2/2, and `route-registry` 7/7. The fake fetch counter stays zero for bad media and cancelled multipart requests; legacy text Anoman capture and redacted provenance remain covered. | PROVEN |
| RC-03 | No actual Anoman call, retry/fallback, semantic provider activation, job/reservation, reconciliation, or published truth; explicitly state transport conformance is not vision qualification. | Every request observation uses injected fake transport only. One valid request has `external_provider_attempt_count = 0` and fake transport count `1`; invalid/cancelled cases have fake transport count `0`. No composition-root, worker, job, admission, reconciliation, UI, Facts, CES, or publish code changed. This ticket records that transport conformance is not provider vision/perception qualification. | PROVEN |

## Validation

The host package runner is currently unable to read pre-existing workspace pnpm links (`EACCES` under `node_modules`), so validation used the repository's clean Docker Compose image. The image was rebuilt from the candidate source and uses only deterministic fake transports; no provider credential or external request was supplied.

```text
docker compose run --build --rm --no-deps agents-bridge sh -c "... jiti tests/anoman-provider.test.ts; ... typecheck"
PASS — Anoman test 6/6; @atlas/agents-bridge typecheck PASS

docker compose run --rm --no-deps agents-bridge sh -c "... jiti tests/multipart-provider-capabilities.test.ts; ... jiti tests/gemini-provider.test.ts; ... jiti tests/provider-capabilities-boundary.test.ts; ... jiti tests/route-registry.test.ts"
PASS — multipart 3/3; Gemini 8/8; boundary 2/2; route registry 7/7

git diff --check
PASS
```

The changed files contain no credentials or retained source image bytes. The
fake request assertion derives a tiny in-memory fixture encoding only; it does
not write image content/base64 to logs, SQL, snapshots, or this evidence.

Internal readiness: READY_FOR_CK. This checkpoint is implementation readiness
only and does not issue a CK `PASS`.
