# Frontend Awareness v2

Project-agnostic Codex frontend skill for:

- new projects
- future frontend work
- refactoring existing UI
- visual consistency
- responsive behavior
- accessibility
- frontend review

Core architecture:

```text
GLOBAL FRONTEND AWARENESS
        |
        v
PROJECT CONTEXT ANALYSIS
        |
        v
PROJECT VISUAL CONTRACT
        |
        v
SCREEN INFORMATION PATTERN
        |
        v
IMPLEMENTATION
        |
        v
RENDERED VISUAL REVIEW
```

Install:

Copy `.agents` into the repository root.

Recommended project contract location:

```text
docs/frontend/PROJECT_FRONTEND_CONTRACT.md
```

For a new project:

```text
Use $frontend-awareness.

This project does not yet have an established visual language.

First derive and create docs/frontend/PROJECT_FRONTEND_CONTRACT.md using the
frontend-awareness visual-language derivation process.

Then implement the requested frontend according to that contract.

Render and visually inspect the result before completion.
```

For existing UI refactoring:

```text
Use $frontend-awareness.

Refactor the affected UI toward the existing project frontend contract.

Preserve product semantics and behavior.

Render and visually inspect the result before completion.
```

All Markdown files in this package are ASCII-only.
