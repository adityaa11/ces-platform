# GO checkpoint: IDSER-012-05-04-01

- **Ticket:** [IDSER-012-05-04-01](../Backend_Phase/tickets/Initial_Draft_Phase/IDSER-012-05-04-01-authorized-v3-reference-resolution.md)
- **Batch:** `IDSER-BATCH-12-05-04-01`
- **State:** `awaiting_review`
- **Predecessor:** `IDSER-012-05-03-02` CK PASS at `1aec9f22`; its ticket-specific historical-evidence exception is limited to that predecessor and is not reused here.
- **Implementation commits:** `8cc581de` (`feat(idser): resolve authorized v3 references`), `8f017f7c` (`fix(idser): bind v3 resolution to accepted cache identity`)

## Review Contract Closure

| Row | Ticket authority | Required proof | Evidence / command | Status |
| --- | --- | --- | --- | --- |
| `RC-01205-0401-01` | Frozen contract row 01 | Authorized, SELECT-only resolution validates v3 plan/handoff, source/cache, scope, immutable membership, locators, and accepted media without fallback. | `PostgresSemanticBatchV3ReferenceResolver` joins the authenticated project/session and accepted perception/cache records, recomputes both v3 hashes, and validates scope, source, cancellation, batch and locator bindings. `corepack pnpm --filter @atlas/db test:semantic-batch-v3-reference-resolution` passed 2/2. | `PROVEN` |
| `RC-01205-0401-02` | Frozen contract row 02 | Foreign, stale, cancelled, v1/v2/mixed, missing/substituted membership, locator/asset, and changed-commitment inputs fail closed. | The resolver rejects absent/foreign rows, cancellation, non-v3 parse results, replay-hash mismatch, scope/source/cache disagreement, membership/order disagreement, and missing/substituted accepted assets. Focused test exercises cancelled, tampered, foreign, mixed-version, and missing cases; the v3 boundary suite retains commitment tamper coverage: `corepack pnpm --filter @atlas/db test:immutable-semantic-corpus-plan-v3` passed 4/4. | `PROVEN` |
| `RC-01205-0401-03` | Frozen contract row 03 | Return only bounded identities/metadata; do not expose session authority, hydrated content, grants, or a logical request. | The exported result contains v3 references, source and media identities, selected locators, pinned identities, and bounded commitments only. Its test asserts the session token is absent and the resolver query is read-only and does not select normalized content. No execution, hydration, grant, provider, BSS, transport, result, or staging path was added. | `PROVEN` |

## Validation

- `corepack pnpm --filter @atlas/db typecheck` — pass.
- `corepack pnpm --filter @atlas/db test:semantic-batch-v3-reference-resolution` — pass, 2/2.
- `corepack pnpm --filter @atlas/db test:immutable-semantic-corpus-plan-v3` — pass, 4/4.
- `docker compose ps` — no services running. No Compose database was started because this ticket's focused read-only regression harness does not require a live canonical database; no canonical volume, provider, queue, or worker was touched.

Internal readiness: READY_FOR_CK
