# BSS-V2-004-03-03 GO checkpoint

- **Ticket:** BSS-V2-004-03-03 — NormalizedDocument source-unit and user-prompt pipeline
- **Batch:** BSS-V2-BATCH-04.03-03
- **State:** `awaiting_review`
- **Review target:** this bounded implementation commit
- **Predecessors:** BSS-V2-004-03-01 CK `PASS` (`BSS-V2-BATCH-04.03-01-472fd2c-supplemental-verification.md`); BSS-V2-004-03-02 CK `PASS` (`BSS-V2-BATCH-04.03-02-18bd83e-verification.md`); BSS-V2-004-02 accepted `NormalizedDocument v1` boundary

## Bounded implementation

`@atlas/skills` now builds an offline provider-neutral reasoning packet from an accepted `NormalizedDocument v1`. It enumerates pages, text blocks, tables, and labeled visual regions in a canonical page/type/locator order; assigns packet-local `slot-000001`-style IDs; and keeps exact page/locator lineage in the local `sourceSlotMap`. The provider-facing user payload contains only each temporary slot and its source content, so a returned slot remains untrusted until a later ticket resolves it through the retained local map.

Empty text/table sources and unlabeled visuals are recorded as explicit rejections. Duplicate locators, more than 10,000 eligible units, and a user payload over 1,000,000 UTF-8 bytes fail closed before any provider boundary. The packet binds the already-approved extraction profile, compiler prompt, and proposal JSON Schema without selecting or calling a provider.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence and outcome | Status |
| --- | --- | --- | --- |
| RC-BSSV2-0040303-01 | Same `NormalizedDocument v1` must produce the same ordered units, temporary IDs, mappings, and packet bytes without network or mutable identity. | `semantic-skills.test.ts` repeat-builds a fixture containing text, tables, and labeled visuals; it asserts the exact canonical slot order and byte-identical packet. | PROVEN |
| RC-BSSV2-0040303-02 | Every eligible source must be represented or explicitly rejected under frozen bounds; omitted, duplicate, dangling, or over-bound units fail closed. | The builder records empty/unlabeled input in `rejectedSourceUnits`; focused negatives reject duplicate locators, 10,001 units, and an over-byte payload before a packet is returned. The payload is derived directly from every local slot, so no local slot can be omitted or dangle. | PROVEN |
| RC-BSSV2-0040303-03 | Temporary slots map exactly to original page/locator/source material without minting trusted Atlas IDs. | Fixture assertions round-trip provider payload slots/content to the local `sourceSlotMap`, which retains page, locator type, locator ID, and source content. Slot values are packet-local `slot-######` values only. | PROVEN |
| RC-BSSV2-0040303-04 | Construction remains provider-neutral and performs no semantic classification, extraction finalization, or persistence. | Static source check rejects concrete-provider names, `DocumentStore`, candidate-ID generation, finalization, provider identity selection, and networking. The focused and Bridge suites retain the existing generic-provider boundary coverage. | PROVEN |

Required validation passed:

```text
corepack pnpm --filter @atlas/skills typecheck
corepack pnpm --filter @atlas/skills test
docker compose run --rm --build --no-deps atlas sh -lc "corepack pnpm --filter @atlas/skills typecheck && corepack pnpm --filter @atlas/skills test && corepack pnpm --filter @atlas/contracts typecheck && corepack pnpm --filter @atlas/contracts test"
docker compose run --rm --build --no-deps agents-bridge sh -lc "corepack pnpm --filter @atlas/agents-bridge typecheck && corepack pnpm --filter @atlas/agents-bridge test"
git diff --check
```

All commands passed. The Bridge suite reports four existing opt-in Compose/PostgreSQL tests as skipped; this source-packet-only ticket neither changes nor relies on them. No external call was made, and the BSS-V2-004-02 D1 stop remains unchanged.

Internal readiness: READY_FOR_CK
