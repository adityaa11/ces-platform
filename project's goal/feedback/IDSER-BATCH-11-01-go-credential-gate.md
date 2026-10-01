# GO credential-gate record: IDSER-011-01 / IDSER-BATCH-11-01

- **Ticket:** `IDSER-011-01-live-runtime-credential-qualification.md`
- **State:** `BLOCKED_ENVIRONMENT` — not `awaiting_review`.
- **Reviewed implementation commit:** `1b6d245cc466f3d2069d17e060518b590bfd976e`.

## Secret-safe live evidence

After the deployment secret was supplied, the reviewed Compose stack was rebuilt
and recreated from the implementation commit. All four services (`postgres`,
`atlas`, `agents-bridge`, and `agents-bridge-worker`) reported healthy.

The root `.env`, the running `agents-bridge`, and the running
`agents-bridge-worker` each reported only the non-secret boolean that
`MISTRAL_API_KEY` was present. The actual worker-container command:

```text
docker compose exec -T agents-bridge-worker corepack pnpm --filter @atlas/agents-bridge qualification:live
```

reported `credentialPresent: true` and `outcome: failure` with the existing
stable adapter `errorCode: authentication`. It printed no API key, authorization
header, raw provider response, source content, or prompt.

The initial explicit model value from the configuration documentation page slug
was rejected as `invalid_request`. A local non-secret override set the current
Mistral Large 3 API ID `mistral-large-2512`; the worker then reached the real
provider but received the `authentication` classification above. This rules out
missing Compose propagation and stale containers. It does not claim whether the
provider-side cause is a rejected key or account/model authorization, because
the frozen Bridge boundary intentionally redacts provider response details.

## Review Contract Closure

| Row | Required proof | Evidence / exact validation | Status |
|---|---|---|---|
| `RC-011-01-01` | Healthy reviewed Compose services and migrations, attributable to the implementation commit. | Rebuilt/recreated four-service Compose stack from `1b6d245`; health reported for all services. Earlier `docker compose run --rm --no-deps atlas corepack pnpm --filter @atlas/db migration:check` passed. | PROVEN |
| `RC-011-01-02` | Real configured provider preflight success; unavailable or rejected provider remains unready. | Exact worker-container command above reached the real Mistral adapter with credential presence true and returned `authentication`; no mock/TestRuntime/fallback was used. | BLOCKED_ENVIRONMENT |
| `RC-011-01-03` | Non-secret configured/actual identities and safe evidence. | Qualification output recorded `provider: mistral`, HTTPS origin, configured model IDs, ZDR/limits/retry values, and stable error code only. Focused harness passed 3/3; typecheck passed; provider regressions passed 10/10. | PROVEN |

The next action is outside repository implementation: verify the key and that
its Mistral account is authorized for the selected model, then rerun the exact
worker-container command. Only a real-provider success can make this checkpoint
ready for CK.
