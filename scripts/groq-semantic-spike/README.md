# SEMSPIKE-001 local runner

Run local contract checks with `node packages/atlas-contracts/node_modules/jiti/lib/jiti-cli.mjs scripts/groq-semantic-spike/test.mts`.
Run the two authenticated frozen-route attempts with `node packages/atlas-contracts/node_modules/jiti/lib/jiti-cli.mjs scripts/groq-semantic-spike/run.mts` after setting `GROQ_API_KEY` in the environment. The runner uses only `openai/gpt-oss-120b`, `reasoning_effort=medium`, non-streaming strict JSON Schema, and a direct HTTP request. Generated, redacted artifacts are written only below `.atlas-data/groq-semantic-spike/`.
