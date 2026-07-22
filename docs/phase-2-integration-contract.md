# Phase 2 integration contract (v1.0.0)

The executable contracts live in `@company/ces-integration-contracts`; portable
JSON Schemas and fixtures live in `docs/contracts/phase-2/v1.0.0/`.

The client-owned, version-controlled runner is `scripts/run-ces.mjs`. It fetches
only the canonical CES repository configured in that runner. The lock cannot
override the repository. It must fetch and check out `ces.commit`, then require
`git rev-parse HEAD` to equal that lowercase SHA before install, build, adapter
loading, or compilation.

The pinned checkout is also the toolchain authority: `.node-version`,
`package.json#engines`, and `packageManager` must agree, and the active exact
Node.js and pnpm versions must match them. The supported baseline list is
versioned with the runner contract. Offline reproducibility is not guaranteed;
the supported guarantee is a clean network-connected environment.

The client owns `.ces/project.yaml`, `.ces/ces.lock`, `.ces/requirements/`, the
runner, and the ignored `.ces-runtime/`. Phase 3 owns approved requirement input;
Phase 1 owns temporary core and adapter output; Phase 2 owns
`execution-report.json` and transactional publication to
`.ces/generated/<requirement-id>/`.

Each execution creates a fresh checkout under an OS-managed temporary
directory. It never reuses a client-controlled `.git` directory. Git hooks are
disabled with a runner-owned empty hooks directory, global Git configuration is
replaced with an empty runner-owned file, dangerous Git redirection variables
are removed, and interactive credential prompts are disabled. The checkout is
removed after the execution.

Publication uses unique sibling staging and backup directories. A lock derived
from the canonical final path serializes final promotion. Active locks fail with
`CES_PUBLICATION_LOCKED` after five seconds; locks older than fifteen minutes
are stale and recoverable. A failure restores only that execution's backup.
Completed Phase 1 reports contain no timestamps, durations, absolute paths,
temporary names, execution IDs, or random identifiers. Internal run IDs appear
only in temporary paths, operational logs, and lock ownership metadata.

External commands run non-interactively with category-specific limits: 30
seconds for metadata/runtime checks, five minutes for Git network operations and
compilation, and ten minutes for installation and build. Timeout and cancellation
use `CES_COMMAND_TIMEOUT` and `CES_COMMAND_CANCELLED`. Child output is streamed
to execution-temporary logs while only a 64 KiB stdout and stderr tail is held in
memory. Installation uses the frozen lockfile with lifecycle scripts disabled;
the approved CES build is then invoked explicitly.

Exit codes 0, 2, 3, 4, and 5 map to success, input_error, blocked, conflict, and
adapter_gap. When invoked, the runner preserves that code. Before invocation,
runner input and operational failures both exit 1 but remain distinguishable as
input_error and execution_error, and omit `phase_1_exit_code`.

## Bootstrap runner

Build the client repository once so the version-controlled script can load its
runner module, then invoke it non-interactively:

```bash
corepack pnpm build
node scripts/run-ces.mjs \
  --requirement .ces/requirements/REQ-001.yaml \
  --output .ces/generated/REQ-001
```

`--workspace` may select a client root; it defaults to the current directory.
Requirement and output paths must stay inside that root. The runner reads
`.ces/ces.lock` and `.ces/project.yaml`, manages `.ces-runtime/checkout`, and
never passes an adapter selector to `ces compile`.

The runner accepts no repository argument. Its implementation contains the
approved canonical repository URL and rejects a non-canonical source at its
programmatic boundary. It validates the exact checkout HEAD and pinned Node.js
and pnpm declarations before frozen installation and build.

Stable runner diagnostics include `CES_LOCK_INVALID`, `CES_PROJECT_INVALID`,
`CES_ADAPTER_ID_MISMATCH`, `CES_ADAPTER_VERSION_MISMATCH`,
`CES_BASELINE_UNSUPPORTED`, `CES_CHECKOUT_FAILED`, `CES_HEAD_MISMATCH`,
`CES_NODE_VERSION_MISMATCH`, `CES_PNPM_VERSION_MISMATCH`,
`CES_INSTALL_FAILED`, `CES_BUILD_FAILED`, `CES_ARTIFACT_INVALID`, and
`CES_ARTIFACT_MISSING`, plus `CES_COMMAND_TIMEOUT`, `CES_COMMAND_CANCELLED`, and
`CES_PUBLICATION_LOCKED`. Human-readable stderr is never parsed for semantics.
