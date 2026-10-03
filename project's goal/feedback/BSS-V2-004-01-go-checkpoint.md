# BSS-V2-004-01 GO checkpoint

## Review Contract Closure

| Row | Required proof | Evidence / outcome | Status |
| --- | --- | --- | --- |
| RC-BSSV2-004-01-01 | Pinned Compose-private CPU route and immutable identities | `docker compose ps` reports `quay.io/docling-project/docling-serve-cpu:v1.36.0@sha256:4ba36cb322283e3851d2a6c5f347dd1cc515d7afb8ea5cc1577da8b5bfe2fea7`, with only internal 5001/8080 ports. Running container packages: docling-serve 1.36.0, docling-slim 2.132.0, torch 2.14.1+cpu. Route tests pass. | PROVEN |
| RC-BSSV2-004-01-02 | Authorized bytes only; fixed server-controlled policy | `DoclingProvider` sends only multipart PDF bytes to `http://docling-serve:5001/v1/convert/file`; tests assert fixed Standard-PDF/no-OCR profile and reject non-PDF input. | PROVEN |
| RC-BSSV2-004-01-03 | Exact profile is ready/warm and service remains resident | `/health` and `/ready` passed. Restart-to-ready was observed separately at about 6.4 s; exact-profile warm-up was 6,074 ms. Container ID/start time remained `d5f6ebde58f3...` / `2026-10-03T14:05:10.073834059Z` across the four sequential warm runs. | PROVEN |
| RC-BSSV2-004-01-04 | Deterministic structural mapped output accepted by existing normalizer/parser | `scripts/bss-v2-004-01/qualify-docling.mts` uses Bridge `DoclingProvider -> normalizePerceptionResult -> parseNormalizedDocument`. All documents parsed v1; Safara and repeat share mapped SHA-256 `0e82225c...` and normalized SHA-256 `df5c9e33...`. | PROVEN |
| RC-BSSV2-004-01-05 | Every required warm route <= 20,000 ms | Warm end-to-end: Safara Full 6,019 ms; Finance 4,015 ms; Readiness 2,021 ms; Safara repeat 6,016 ms. Each begins with Bridge possession of bytes and ends after parser success. | PROVEN |
| RC-BSSV2-004-01-06 | Controlled safe failures; no partial success or fallback | `apps/agents-bridge/tests/docling-provider.test.ts` covers not-ready, unavailable network, mismatched identity, malformed JSON, mapper rejection, cancellation, bounded input, and malformed partial output. All pass. | PROVEN |
| RC-BSSV2-004-01-07 | Useful local provenance/timing without external-provider claims | Qualification harness records local service profile, source/output hashes, stage timing, parser result, and CPU runtime identity; it records neither source bytes nor raw Docling bodies. | PROVEN |

Validation executed:

```text
pnpm --filter @atlas/agents-bridge exec jiti tests/docling-provider.test.ts
pnpm --filter @atlas/core test
pnpm --filter @atlas/contracts test
docker compose exec ... qualify-docling.mts
git diff --check
```

All commands passed. Cold readiness and profile warm-up are reported separately and are not amortized into the four warm-route measurements.

## Commit record

- **Review target commit:** `c9a6d06` — `feat(bridge): qualify persistent Docling CPU route`
- **Ticket state at commit:** `awaiting_review`
- **Scope:** only BSS-V2-004-01 route/configuration, adapter, qualification harness/tests, ticket state, and this checkpoint were staged.

Internal readiness: READY_FOR_CK
