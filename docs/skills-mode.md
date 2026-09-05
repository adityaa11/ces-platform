# Fixture authoring execution mode

`SKILLS_MODE` is one repository-wide default for authoring a *new* golden
fixture revision. It is not configured per skill, project, workspace, branch,
validation step, approval action, or commit action.

Copy `.env.example` into the repository's local environment configuration when
an explicit setting is needed. With no `SKILLS_MODE` value present, Atlas
resolves the default to `codex`.

| Value | Meaning |
|---|---|
| `codex` | Default fixture-authoring executor for this phase. |
| `agents_bridge` | Reserved future executor. Resolution fails unless an Agents Bridge executor is configured. |

Any present value other than the two values above—including an empty value—is
an error. Atlas does not silently fall back from an invalid configuration.

This setting selects only the authoring executor. Deterministic validation,
explicit approval, commit authority, and branch-HEAD movement remain separate
repository controls. Actual execution provenance is immutable fixture/revision
data (introduced by GLF-002 and GLF-003), rather than a mutable environment
value; changing `SKILLS_MODE` cannot rewrite or reinterpret an existing HEAD.
