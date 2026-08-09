# CES-GF-ATLAS-V2-010A - Emergency Change Audit and Live Diagnostics

**Status:** Planned
**Depends on:** ATLAS-V2-010

## Outcome

Return to a trustworthy baseline and make live extraction failures observable
without exposing document contents, credentials, prompts, or hidden reasoning.

## Scope

- Audit every uncommitted change made after the failed live run.
- Keep the JSON Schema `const` compatibility fix only if its provider contract
  and regression tests prove it independently.
- Keep semantic identity changes only if different evidenced relationships from
  one source statement remain distinct and deterministic.
- Remove automatic replacement of a paraphrase with an arbitrary whole source
  unit; invalid meaning must remain rejected.
- Preserve safe failure stages for schema, source ID, exact statement, exact
  term, duplication, truncation, and coverage failures.
- Persist sanitized, schema-validated intermediate facts, rejected-fact reason
  codes, provider attempt metadata, and source-scope identities.
- Do not persist secrets, complete prompts, provider hidden reasoning, or
  unrestricted document text beyond already-authorized evidence.

## Acceptance

- The worktree contains no unaudited emergency extraction behavior.
- A paraphrased fact cannot become accepted merely by substituting a larger
  cited paragraph.
- Two different relationships from one exact statement receive distinct stable
  identities.
- A failed live run leaves enough sanitized evidence to locate the failed stage.
- Existing valid V2 fixture behavior remains deterministic.

