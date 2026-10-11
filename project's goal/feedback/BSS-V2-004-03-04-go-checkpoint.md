# BSS-V2-004-03-04 GO checkpoint

- **Ticket:** BSS-V2-004-03-04 — Anoman reference `StructuredReasoningProvider` adapter
- **Batch:** BSS-V2-BATCH-04.03-04
- **State:** `awaiting_review`
- **Review target:** this bounded implementation commit
- **Predecessors:** BSS-V2-001 CK `PASS` (`88aac3c`); BSS-V2-002 qualified-route contract (`65c328d`); retained BSS-V2-003 Gemini adapter (`05c06c0`)

## Bounded implementation

The Agents Bridge now contains an `AnomanProvider` that implements only the
neutral `StructuredReasoningProvider` seam. It accepts already-prepared
messages, makes the pinned HTTPS `/v1/chat/completions` request with the
fixed `gemini-2.5-flash` identity, object response mode, no streaming, and
zero temperature, then returns untrusted parsed JSON and bounded normalized
provenance. It does not validate Atlas semantic meaning or generate prompts.

`ANOMAN_API_KEY` is deployment-only Bridge configuration. The route adapter
identity is pinned as `anoman-adapter-v1` and may be represented in the route
registry, but any enabled Anoman semantic route is rejected until the explicit
BSS-V2-004-03-06 qualification. Gemini remains a separate untouched adapter.
No live provider request was made.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence and validation | Status |
| --- | --- | --- | --- |
| RC-BSSV2-0040304-01 | Outcome; Review Contract row 01: neutral structured-reasoning conformance and private vendor types. | `tests/anoman-provider.test.ts` assigns the adapter to `StructuredReasoningProvider`; fake transport verifies only normalized messages/JSON/provenance. `tests/provider-capabilities-boundary.test.ts` rejects Anoman imports from generic execution modules. | PROVEN |
| RC-BSSV2-0040304-02 | Scope; Review Contract row 02: pinned request mode, bounds, cancellation, and normalized failures. | Fake-transport assertions capture the fixed endpoint/model/options and cover malformed JSON/content, request/response bounds, missing credentials, authentication, rate limit, provider failure, timeout-status, cancellation, and privacy gate. Error assertions exclude response bodies and credentials. | PROVEN |
| RC-BSSV2-0040304-03 | Outcome; Review Contract row 03; `BOUNDARY-BSSV2-0040304-ANOMAN-SECRET`: safe normalized provenance only. | Response fixtures prove provider/model/endpoint/latency/attempt, normalized usage, and allow-listed requested/served-model, routing/cache metadata. Provenance redaction assertion excludes prepared payload and API key. | PROVEN |
| RC-BSSV2-0040304-04 | Scope; Review Contract row 04; BSS-V2-002/003 regression requirements. | Route tests prove the additive pinned Anoman identity, server-controlled resolution, and rejection of an enabled pre-qualification route. Worker composition injects only its neutral capability. Compose Gemini regression passed 8 tests; generic semantic-worker regression passed 5 tests. | PROVEN |

## Validation evidence

Passed locally before the Compose proof:

```text
corepack pnpm --filter @atlas/agents-bridge typecheck
docker compose -f docker-compose.yml config --quiet
```

Passed in isolated Docker Compose containers with no dependencies started and
read-only overlays of only the current adapter, configuration, route, and test
sources:

```text
docker compose run --rm --no-deps agents-bridge \
  node apps/agents-bridge/node_modules/jiti/lib/jiti-cli.mjs \
  apps/agents-bridge/tests/anoman-provider.test.ts
# 4 passed, 0 failed

docker compose run --rm --no-deps agents-bridge \
  sh -c "route-registry.test.ts && provider-capabilities-boundary.test.ts && service.test.ts"
# 7 + 2 + 7 passed, 0 failed

docker compose run --rm --no-deps agents-bridge \
  sh -c "gemini-provider.test.ts && semantic-worker.test.ts"
# 8 + 5 passed, 0 failed
```

The last two Compose commands execute the fully spelled `node .../jiti-cli.mjs`
form recorded in the terminal. They use deterministic local fake transports;
no Anoman credential, authorization header, request payload, or live response
was emitted. `git diff --check` passed before this checkpoint was recorded and
is rerun for the committed review target.

Internal readiness: READY_FOR_CK. This is not a self-issued CK `PASS`.
