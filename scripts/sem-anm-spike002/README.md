# SEM-ANM-SPIKE-002

Offline gates:

```powershell
corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt001/test.mts
corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-prompt001/run.mts
corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike002/test.mts
```

After all offline gates pass, run exactly two authorized Anoman calls:

```powershell
corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike002/run.mts
```

Live evidence is written only under ignored `.atlas-data/sem-anm-spike002/`. The runner reads `ANOMAN_API_KEY` from the repository-root `.env`, makes no retry or fallback, and records only secret-safe response and telemetry fields.
