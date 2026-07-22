# Phase 2 reference client

This is the complete version-controlled client side of the Phase 2 boundary.
It pins the approved CES commit and Laravel reference adapter, stores approved
requirements, and owns its bootstrap script. `.ces-runtime/` and generated
outputs are deliberately excluded.

From the repository root:

```bash
corepack pnpm build
node examples/phase-2-client/scripts/run-ces.mjs
```

The clean-run guarantee requires network access and the exact Node.js and pnpm
versions declared by the pinned CES checkout.
