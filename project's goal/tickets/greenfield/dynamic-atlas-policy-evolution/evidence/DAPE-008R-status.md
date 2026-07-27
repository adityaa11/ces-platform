# DAPE-008R real-provider validation status

**Status:** Not run

The deterministic semantic-quality evidence contract and CLI quality gate are
implemented. No live provider claim is recorded because `GEMINI_API_KEY` was
not available during implementation.

## Opt-in commands

Run the existing transport probe:

```text
GEMINI_LIVE_TEST=true GEMINI_API_KEY=<secret> corepack pnpm exec vitest run apps/agents-bridge/src/providers/gemini/gemini.live.test.ts
```

After the approved Safara run and human review, create the redacted report:

```text
node apps/cli/dist/index.js atlas quality-report --input <redacted-mapping.json> --output <quality-report.json>
```

Exit `0` is a passing release decision, `7` requires review, `12` is a
semantic-quality gate failure, and input/provider execution errors remain
separate. The input and output must contain hashes, IDs, metrics, and pinned
versions only—never PRD text, prompts, responses, credentials, or headers.
