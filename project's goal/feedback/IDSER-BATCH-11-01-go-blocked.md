# GO blocked record: IDSER-011-01 / IDSER-BATCH-11-01

- **Ticket:** `IDSER-011-01-live-runtime-credential-qualification.md`
- **State:** `BLOCKED_ENVIRONMENT` — not `awaiting_review`.
- **Reviewed repository HEAD:** `749db157579c292a7ee8dbf73c77584bd9b45162`.
- **Predecessors:** all executable IDSER-010 children through IDSER-010-06 are recorded `PASS` in the ticket-set README.

## Bounded implementation

Added the smallest worker-configuration-based live qualification command:

```text
corepack pnpm --filter @atlas/agents-bridge qualification:live
```

It instantiates the existing `MistralProvider` from the same Bridge configuration
boundary used by `worker-main.ts`, makes one content-free structured JSON-schema
preflight call, and emits only configured/actual non-secret provider identities,
limits, retry policy, ZDR flag, credential presence, and a stable error code. It
does not create a project, process a document, invoke a semantic skill, use a
mock/TestRuntime/fallback, or print a credential, authorization header, raw
provider response, or source content.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence / exact validation | Status |
|---|---|---|---|
| `RC-011-01-01` | Reviewed four-service Compose image/configuration, migrations, health, and image attribution. | `docker compose up -d --build --force-recreate`; `docker compose ps` reported `postgres`, `atlas`, `agents-bridge`, and `agents-bridge-worker` healthy. `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/db migration:check` passed. The qualification harness is still uncommitted, so no immutable review commit can yet attribute this changed image. | BLOCKED_ENVIRONMENT |
| `RC-011-01-02` | Existing worker secret boundary supplies a real credential and the real provider preflight succeeds, or an honest unavailable/invalid result leaves the ticket unready. | Root `.env` had no declaration named `MISTRAL_API_KEY`. Inside the healthy `agents-bridge-worker`, `docker compose exec -T agents-bridge-worker corepack pnpm --filter @atlas/agents-bridge qualification:live` returned `{ "credentialPresent": false, "outcome": "failure", "errorCode": "authentication" }` with no provider call. | BLOCKED_ENVIRONMENT |
| `RC-011-01-03` | Redacted configured identity, limits, retries, ZDR, and actual adapter provenance identify `MistralProvider` without secret/provider-body/source leakage. | `docker compose run --rm --no-deps agents-bridge-worker corepack pnpm --filter @atlas/agents-bridge test:live-qualification` passed 3/3; `typecheck` passed; `jiti tests/mistral-provider.test.ts` passed 10/10. The blocked live output contained only provider/model/endpoint configuration and the stable error code. | PROVEN |

## Required next action

Place a non-empty `MISTRAL_API_KEY` declaration in the repository-root `.env`
file consumed by Docker Compose, then rerun the worker-container qualification.
The result must be a real-provider success before this checkpoint can become
`READY_FOR_CK`; no mock, fallback, or skipped live test qualifies.
