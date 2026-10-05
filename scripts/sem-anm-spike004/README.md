# SEM-ANM-SPIKE-004

This isolated runner consumes the approved PROMPT-003 artifacts unchanged and makes exactly two independent Anoman calls. It writes every raw provider response and its full validation trail only to ignored `.atlas-data/sem-anm-spike004/`.

Run the mandatory local gates before the runner:

```powershell
node scripts/sem-anm-prompt003/prompt-compiler.test.mts
node scripts/sem-anm-prompt003/differential-artifacts.test.mts
node scripts/sem-anm-prompt003/qualification.test.mts
corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike004/test.mts
corepack pnpm --filter @atlas/contracts exec jiti ../../scripts/sem-anm-spike004/run.mts
```
