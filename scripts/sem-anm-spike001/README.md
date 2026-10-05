# SEM-ANM-SPIKE001

Run deterministic validation with `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike001/test.mts`.

Run the bounded live qualification with `corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike001/run.mts`. It loads only `ANOMAN_API_KEY` from repository `.env`, performs one Gate A call and, only when strict JSON Schema succeeds, two identical Gate B calls. Sanitized evidence is written only beneath ignored `.atlas-data/sem-anm-spike001/`.
