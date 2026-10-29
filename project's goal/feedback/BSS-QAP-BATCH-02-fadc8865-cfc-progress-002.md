# BSS-QAP-BATCH-02 replacement CFC checkpoint 002 — BSS-QAP-002 R2

- **Ticket:** `BSS-QAP-002` — R2 ID-free writer contract cutover.
- **Batch:** `BSS-QAP-BATCH-02`.
- **Remediation base / evidence revision:** `fadc8865c40095b57680d5c82a3592e7e234eae3`.
- **Applicable replacement freeze:** `project's goal/feedback/BSS-QAP-BATCH-02-local-payload-replacement-contract-freeze-002.md`.
- **HMN authorization consumed:** `HMN-BSS-QAP-002-004` at `project's goal/feedback/BSS-QAP-002-hmn-004.md`.
- **Authorized clauses:** `RCK-002.a` and `RCK-002.b` only.
- **State:** `awaiting_review`.

## Scope and protected history

This is the one bounded local evidence-remediation cycle authorized by
`HMN-BSS-QAP-002-004`. Historical `CK-001.a`, every `RCK-001` outcome, and
the protected parser, runtime, migration, and accounting evidence were not
reopened. After the initial payload observation, the user explicitly
authorized removal of the contaminated writer images and a fresh image build.
The remediation adds `.codex-tools` to `.dockerignore`; the host diagnostic
tree is thereby excluded from every future Docker build context. No Compose
service was started, no Docker volume was reset, and no migration was
executed. Isolated payload inspection used only `--network none --read-only`.
The reconciliation regression used its ticket-permitted local fixture and
completed its cleanup.

## Working closure matrix

| Replacement clause | Status | Frozen-oracle evidence and outcome |
| --- | --- | --- |
| `RCK-002.a` | `PROVEN` | Fresh image build completed for every inventoried writer-capable artifact: agents-bridge `sha256:4bc07955088bba12524589f94ff54fcf5cc69f84373efbe257d43ea0778d6616`, worker `sha256:ab38719ef82cc31c77faf6597067be86fedfbb3ce5ec0f9858f8c8ded63f9e8a`, bootstrap `sha256:aada2be81bc0d86c19bd11abfb16074a9ed4d907f14ffa9c2471171e37a48fe4`, atlas `sha256:d802d8d6c72c2be6b20420376bf4cc89239420d3d7519c3289a70c6114a0cee5`, and migrate `sha256:5f31e6214770b4b9202b5e188431007eab9c3acf548580f402e791616e683c5b`. Each isolated classified payload search returned `TOTAL=7 DIRECT=7 NESTED=0 INVALID=0 CODEX_TOOLS_PRESENT=no`. The direct files are the permitted immutable/R1 classes `0023`, `0028`, `0067`, `0076`, `0078`, `0091`, and `0112`; there were no nested copies, so no SHA-256 comparison was applicable. `packages/atlas-db/scripts/migrate.mjs` continues to load only its explicit migration list from direct `../migrations/${name}.sql` paths. The binary payload oracle passes. |
| `RCK-002.b` | `PROVEN` | Re-recorded read-only inventory confirmed `ces-platform-postgres-1` as the sole current workspace container and `current_database() = atlas_dev`. `pg_stat_activity` showed only the evidence `psql` session, with no remote address or hostname; the host listener is `127.0.0.1:5432`; 209 scheduled tasks yielded zero matching local writer/connection references. All five writer-capable images passed `RCK-002.a`; no remote, unknown, or unclassified local client/writer remains. No production or staging inference is made. |

## Validation record

```text
docker compose build atlas-migrate agents-bridge-pgboss-bootstrap agents-bridge atlas agents-bridge-worker
PASS — built five fresh writer-capable images without starting services.
Build context transfer: 182.55 kB; .dockerignore excludes .codex-tools.

docker run --rm --network none --read-only --entrypoint sh <each fresh image>
  -lc '<obsolete-writer classified payload scan>'
PASS for each of five images — TOTAL=7 DIRECT=7 NESTED=0 INVALID=0,
CODEX_TOOLS_PRESENT=no. The seven direct permitted classes are 0023, 0028,
0067, 0076, 0078, 0091, and 0112; no nested migration exists to compare.

docker exec ces-platform-postgres-1 ... read-only current_database()/pg_stat_activity query
PASS — atlas_dev; evidence psql only; no remote client address/hostname.

Get-NetTCPConnection -LocalPort 5432 -State Listen; Get-ScheduledTask read-only inventory
PASS — loopback listener; 0 matching task references.

corepack pnpm --filter @atlas/db test:reconciliation-acceptance
PASS, 1/1 (32.1s) against the configured local atlas_dev target. Expected
CREATE INDEX IF NOT EXISTS notices were non-failing. This directly validates
the in-scope restart-worker environment correction in
packages/atlas-db/tests/reconciliation-acceptance.integration.test.ts.
```

## Shadow-CK result and handoff

Both authorized replacement clauses are `PROVEN` against their frozen binary
oracles. The remediation diff is limited to preventing local Codex diagnostic
artifacts from entering Docker payloads, preserving the authorized
reconciliation regression correction, and recording this evidence. No direct
regression is known.

Internal readiness: `READY_FOR_CK`

This checkpoint is `awaiting_review`. CK verification must use only
`RCK-002.a`, `RCK-002.b`, this bounded remediation diff, and direct
regressions introduced by that diff. CFC does not issue `PASS`.
