# SEMSPIKE-002 runner

This runner is isolated from SEMSPIKE-001. It keeps the same model, fixture,
schema, validators, and finalizer; only its system instruction is strengthened.
Run local checks with `node packages/atlas-contracts/node_modules/jiti/lib/jiti-cli.mjs scripts/groq-semantic-spike-002/test.mts`. Run the two live attempts
with the corresponding `run.mts` command after setting `GROQ_API_KEY` in the
environment. Evidence is written only beneath ignored
`.atlas-data/groq-semantic-spike-002/`.
