# SEM-ANM-SPIKE-003

Run the offline release gate before the two authorized Anoman calls:

```powershell
corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt002/test.mts
corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt002/qualification.test.mts
corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike003/test.mts
corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike003/run.mts
```

The runner consumes only frozen PROMPT-002 bytes, makes exactly two calls with no retry or fallback, and writes secret-safe evidence only under ignored `.atlas-data/sem-anm-spike003/`.
