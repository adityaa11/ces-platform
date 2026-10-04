# SEMSPIKE-005 isolated runner

Run local validation with `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/groq-semantic-spike-005/test.mts` and the two frozen live calls with `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/groq-semantic-spike-005/run.mts`.

The runner uses only the S1-S4 fixture, `GROQ_API_KEY`, `openai/gpt-oss-120b`, medium reasoning effort, non-streaming strict JSON Schema output, and a minimal schema-authority instruction. It stores raw provider output and generated schema only in ignored `.atlas-data/groq-semantic-spike-005/` evidence.
