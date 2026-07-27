# CES-GF-AGB-005 local operations evidence

## Implemented evidence

- `docs/agents-bridge-operations.md` defines HTTPS ingress, secret injection,
  per-client issuance/rotation/revocation, incident response, confidential-data
  retention, stateless scaling, distributed admission coordination, and model
  replacement/rollback.
- `server.test.ts` covers rotating credentials, per-client request limits,
  client/provider concurrency, two independent runtime instances, and bounded
  redacted logs and request metrics.
- `provider.test.ts` covers provider status/retry metrics and verifies that
  credential, prompt, and source sentinels are absent.
- `operations.test.ts` executes a second deterministic agent through a second
  provider using the unchanged shared executor.
- `gemini.live.test.ts` is skipped unless `GEMINI_LIVE_TEST=true`; normal CI is
  key-free and network-free.
- `Dockerfile.agents-bridge` provides a non-root production image, and CI builds
  it.

## Validation

Validated locally on 2026-07-27:

- Agents Bridge TypeScript typecheck: passed.
- Focused operations suite: 19 passed, 1 live test skipped by its explicit
  environment guard.
- Repository suite excluding the pre-existing Windows-hanging
  `packages/bootstrap-runner/src/index.test.ts`: 39 files and 232 tests passed;
  the one live-provider test was skipped.
- Recursive workspace build: all 25 selected projects passed, including
  `apps/agents-bridge`.

The live Gemini probe and manual deployed HTTPS Atlas run require operator
credentials and an approved deployment. They remain release evidence pending,
not simulated local evidence.

## Local real-provider exercise

On 2026-07-27, the local loopback bridge processed an actual native-text PDF
through `gemini-3.5-flash-lite`. The extraction paused for human review as
expected, nine candidates were explicitly approved by the product owner, and
Atlas completed the Requirement Collection and system-intent graph.

Redacted result:

- provider HTTP status: `200`;
- extraction status: `awaiting_human_review`;
- final Atlas status: `completed`;
- source documents: `1`;
- approved candidates: `9`;
- generated graph formats: JSON, Markdown, and Mermaid;
- credentials, authorization headers, source text, prompts, and provider
  response content: not recorded in this evidence.

This validates the local real-provider path but does not replace the pending
deployed HTTPS release exercise.
