# CES Phase 2 — Thin Adapter-Neutral Integration Contract

## Status and Purpose

This document is the source of truth for the approved thin Phase 2 contract.
Phase 2 exists only to make the Phase 1 compiler safely consumable by another
process. Its primary consumer is Phase 3.

The approved phase boundary remains:

```text
Phase 1
→ deterministic compilation and adapter artifacts

Phase 2
→ stable, pinned, adapter-neutral execution boundary

Phase 3
→ PRD extraction, clarification, and approved Requirement Package generation
```

Phase 2 remains limited to the minimum integration layer required by Phase 3.

No Phase 1 redesign is required.

---

# Approved Architecture Boundary

```text
Phase 1 compiler
→ produces deterministic Phase 1 artifacts and exit codes

Phase 2 runner
→ validates the client integration contract
→ prepares the pinned CES runtime
→ invokes Phase 1
→ inspects structured Phase 1 artifacts
→ creates execution-report.json
→ publishes one transactionally consistent output
```

The Phase 2 runner owns:

```text
execution-report.json
```

Phase 1 must not be modified merely to generate the Phase 2 report.

The selected adapter remains defined by:

```text
.ces/project.yaml
```

Phase 2 must remain adapter-neutral.

---

# 1. CES Commit Identity

The exact Git commit is the authoritative CES implementation identity.

Approved lock shape:

```yaml
schema_version: "1.0.0"

ces:
  commit: "<exact-40-character-commit-sha>"

adapter:
  id: "<adapter-id>"
  version: "<adapter-version>"
```

Example:

```yaml
schema_version: "1.0.0"

ces:
  commit: "0123456789abcdef0123456789abcdef01234567"

adapter:
  id: laravel
  version: "0.1.0"
```

## Commit validation rules

`ces.commit` must:

- match `^[0-9a-f]{40}$` exactly;
- identify an immutable Git commit;
- not contain a branch name;
- not contain a mutable tag;
- not contain an abbreviated commit SHA.

Required sequence:

```text
read locked commit
→ fetch the CES repository
→ checkout the exact commit
→ verify Git HEAD
→ continue only when HEAD equals the locked commit
```

The runner must verify:

```text
git rev-parse HEAD
= ces.lock ces.commit
```

The comparison is exact because the lock permits lowercase hexadecimal only.

## Repository source

The bootstrap runner must fetch the locked commit from the approved canonical
CES repository. The repository source is part of the version-controlled
bootstrap-runner configuration and must not be inferred from the adapter,
requirement, branch, or mutable tag. Supporting arbitrary CES repository sources
is outside the initial Phase 2 scope.

This check must happen before:

- dependency installation;
- build;
- adapter loading;
- Phase 1 invocation.

Branches and mutable tags must not be accepted as substitutes for the locked SHA.

---

# 2. CES Version Concepts

The following are separate concepts:

```text
CES implementation commit
CES release version
CES baseline version
adapter version
workspace package version
```

Until CES introduces an explicit canonical release-version metadata source, omit:

```yaml
ces:
  version: ...
```

from `.ces/ces.lock`.

Do not infer the CES release version from:

- `ces.baseline_version`;
- adapter version;
- workspace package version;
- Git tag;
- repository branch.

If a CES release version is introduced later, it must come from explicit metadata inside the pinned checkout.

---

# 3. Toolchain Version Contract

The runner must read required toolchain versions from the pinned CES checkout.

The current CES repository declares exact versions equivalent to:

```text
Node.js 24.12.0
pnpm 11.15.1
```

The preferred lock does not duplicate these versions.

Required runner behavior:

```text
checkout pinned CES commit
→ read required Node.js version
→ read required pnpm version
→ validate the current runtime
→ stop before installation when incompatible
```

If runtime versions are ever included in `.ces/ces.lock`, they must:

- be exact;
- match the pinned checkout;
- fail validation when different.

The guarantee is:

> Reproducible in a clean network-connected environment using the toolchain declared by the pinned CES checkout.

Offline reproducibility is not part of the initial Phase 2 contract.

---

# 4. Version Agreement Checks

The runner must reconcile:

```text
pinned CES checkout
.ces/ces.lock
.ces/project.yaml
```

Required checks:

```text
ces.lock adapter.id
= project.yaml ces.adapter.id

ces.lock adapter.version
= project.yaml ces.adapter.version
```

The runner must also verify that the pinned CES revision supports:

```text
project.yaml ces.baseline_version
```

Important:

```text
CES baseline version
≠ CES implementation commit
≠ adapter version
≠ workspace package version
≠ future CES release version
```

An adapter mismatch or unsupported baseline is a runner-owned `input_error`.

---

# 5. Client Workspace Contract

Use:

```text
client-project/
├── .ces/
│   ├── project.yaml
│   ├── ces.lock
│   ├── requirements/
│   │   └── REQ-001.yaml
│   └── generated/
│       └── REQ-001/
│           ├── core/
│           ├── adapters/
│           │   └── <adapter-id>/
│           └── execution-report.json
├── scripts/
│   └── run-ces.mjs
├── .ces-runtime/
├── src/
└── tests/
```

Ownership:

```text
Phase 3
→ writes approved Requirement Packages to .ces/requirements/

Phase 1
→ produces core and adapter artifacts

Phase 2
→ manages execution and writes execution-report.json
```

`.ces-runtime/` is a local runtime directory and should normally be ignored by Git.

---

# 6. Bootstrap Runner Versioning

The bootstrap runner lives outside the fetched CES checkout:

```text
client-project/scripts/run-ces.mjs
```

It is trusted code and must be version-controlled.

Approved rule:

> The client repository commit pins the client-side bootstrap runner. `.ces/ces.lock` pins the fetched CES implementation. These are separate parts of the reproducible execution boundary.

The runner must not replace or update itself from the fetched CES checkout during normal execution.

---

# 7. Runner and Phase 1 Exit Codes

The report must distinguish:

```text
runner_exit_code
phase_1_exit_code
```

## Omission rule

`phase_1_exit_code` must be omitted when Phase 1 was not invoked.

Do not emit:

```json
{
  "phase_1_exit_code": null
}
```

for pre-invocation failures.

Correct example:

```json
{
  "status": "execution_error",
  "runner_exit_code": 1
}
```

When Phase 1 runs, preserve its exit code:

```json
{
  "status": "blocked",
  "runner_exit_code": 3,
  "phase_1_exit_code": 3
}
```

---

# 8. Runner Input Errors vs Execution Errors

Runner-owned failures use two semantic statuses.

## Input errors

Use:

```text
input_error
```

for invalid integration inputs such as:

| Failure | Status |
|---|---|
| Invalid `.ces/ces.lock` | `input_error` |
| Invalid workspace configuration | `input_error` |
| Project/lock adapter mismatch | `input_error` |
| Unsupported baseline | `input_error` |
| Invalid pinned commit format | `input_error` |

## Execution errors

Use:

```text
execution_error
```

for operational failures such as:

| Failure | Status |
|---|---|
| Git checkout failure | `execution_error` |
| Network failure | `execution_error` |
| Dependency-installation failure | `execution_error` |
| Build failure | `execution_error` |
| Missing runtime | `execution_error` |
| Incompatible runtime | `execution_error` |
| Unexpected process failure | `execution_error` |

Both categories may initially use:

```text
runner_exit_code: 1
```

The report status and diagnostic code carry the semantic distinction.

---

# 9. Phase 1 Exit-Code Mapping

When Phase 1 is invoked:

| Phase 1 exit code | Phase 2 status |
|---:|---|
| `0` | `success` |
| `2` | `input_error` |
| `3` | `blocked` |
| `4` | `conflict` |
| `5` | `adapter_gap` |

`verification_failed` is not part of the initial compile-only runner.

It may be added later only if Phase 2 explicitly invokes:

```bash
ces verify
```

Then:

| Phase 1 exit code | Phase 2 status |
|---:|---|
| `6` | `verification_failed` |

---

# 10. Execution Report Conditional Fields

The following fields are conditional:

```text
requirement_id
compilation_id
ces
adapter
phase_1_exit_code
artifacts
```

Rules:

- omit fields that could not be validated;
- do not fabricate requirement or adapter identity;
- do not invent artifact paths;
- allow `artifacts` to be empty;
- list only files produced by the current execution.

Early input-error example:

```json
{
  "schema_version": "1.0.0",
  "status": "input_error",
  "runner_exit_code": 1,
  "artifacts": {},
  "diagnostics": [
    {
      "code": "CES_LOCK_INVALID",
      "source": "phase_2_runner",
      "severity": "error",
      "message": "The CES lock file is invalid."
    }
  ]
}
```

---

# 11. Diagnostic Contract

The runner must not parse arbitrary stderr to infer semantic details.

## Diagnostic sources

Use:

- Phase 2 lock and workspace validation;
- Phase 1 exit codes;
- `policy-manifest.json` for blocked and conflict outcomes;
- `adapter-report.json` for adapter gaps;
- runner-owned diagnostics for checkout, runtime, install, build, and publication failures.

## Initial Phase 1 input diagnostic

For Phase 1 exit code `2`, emit a stable generic diagnostic:

```json
{
  "code": "CES_INPUT_INVALID",
  "source": "phase_1_exit_code",
  "severity": "error",
  "message": "Phase 1 rejected the supplied input."
}
```

Do not infer field-level validation details from human-readable stderr.

A richer structured input-diagnostic interface requires a separately approved Phase 1 contract.

## Stable diagnostic shape

Required fields:

```text
code
source
severity
message
```

Optional fields:

```text
policy_id
requirement_id
rule_id
field_path
adapter_id
details
```

---

# 12. Transactional Output Publication

The required outcome is:

> Artifacts from different executions must never be mixed. The final output must represent exactly one execution.

Recommended publication process:

```text
create temporary sibling directory
→ compile into temporary directory
→ inspect current-run artifacts
→ generate execution-report.json
→ validate output
→ move existing final directory to backup
→ move temporary directory to final location
→ remove backup after success
→ restore backup if publication fails
```

This is transactional publication.

Cross-platform atomic directory replacement is not guaranteed.

## Completed Phase 1 diagnostic outcomes

Phase 1 exit codes:

```text
3 blocked
4 conflict
5 adapter_gap
```

are completed diagnostic outcomes.

Their current-run artifacts and `execution-report.json` must be transactionally published.

They must not be discarded merely because the Phase 1 exit code is nonzero.

Temporary output is discarded only when:

- the runner cannot produce a valid execution report;
- the produced output fails validation;
- publication fails and backup restoration is required;
- an unexpected operational failure prevents a valid completed outcome.

---

# 13. Artifact Rules by Outcome

## Success

May publish:

```text
core/requirement-package.json
core/policy-manifest.json
adapters/<adapter-id>/implementation-plan.json
adapters/<adapter-id>/implementation-task.md
adapters/<adapter-id>/test-manifest.json
adapters/<adapter-id>/verification-manifest.json
execution-report.json
```

## Blocked

May publish:

```text
core/requirement-package.json
core/policy-manifest.json
execution-report.json
```

Must not claim implementation artifacts.

## Conflict

May publish:

```text
core/requirement-package.json
core/policy-manifest.json
execution-report.json
```

Must not claim implementation artifacts.

## Adapter gap

May publish:

```text
core/requirement-package.json
core/policy-manifest.json
adapters/<adapter-id>/adapter-report.json
execution-report.json
```

Canonical adapter-gap report path:

```text
.ces/generated/REQ-001/adapters/<adapter-id>/adapter-report.json
```

Must not claim implementation artifacts that were not produced.

## Runner-owned input or execution error

When the error occurs before Phase 1 is invoked, the runner may publish only:

```text
execution-report.json
```

when a valid report can be created.

Artifacts may be empty.

## Phase 1 input error

When Phase 1 is invoked and returns exit code `2`, it may already have produced
valid current-run core artifacts before a later input or adapter-selection error.
The runner must inspect the temporary output and may publish:

```text
core/requirement-package.json
core/policy-manifest.json
execution-report.json
```

but only when those files were actually produced and pass validation. Artifact
presence must never be predicted from the exit code alone.

---

# 14. Implemented Policy Vocabulary

All examples must use Phase 1 policy identifiers that actually exist.

Do not use:

```text
FILE_RETENTION
```

unless it is formally introduced later.

Use an implemented policy such as:

```json
{
  "code": "CES_POLICY_BLOCKED",
  "source": "policy_manifest",
  "severity": "error",
  "message": "A mandatory policy could not be resolved.",
  "policy_id": "REPLACED_RESOURCE_LIFECYCLE"
}
```

Phase 2 documentation and tests must remain within the controlled Phase 1 vocabulary.

---

# 15. Determinism Contract

The following Phase 1 artifacts must remain byte-for-byte deterministic:

```text
requirement-package.json
policy-manifest.json
implementation-plan.json
implementation-task.md
test-manifest.json
verification-manifest.json
adapter-report.json
```

when each artifact is produced.

Execution reports for completed Phase 1 outcomes must also be deterministic:

```text
exit 0 → success
exit 3 → blocked
exit 4 → conflict
exit 5 → adapter_gap
```

They must not include:

- timestamps;
- execution duration;
- absolute machine paths;
- temporary-directory names;
- random identifiers;
- environment-dependent ordering.

Runner-owned operational failure reports guarantee:

- stable schema;
- stable status;
- stable diagnostic codes;
- stable field semantics.

Their human-readable messages are not required to be byte-for-byte identical across machines.

---

# 16. Adapter-Neutral Contract

Phase 2 must never hardcode:

```text
laravel
adapters/laravel/
```

as the universal execution contract.

The adapter is read from:

```yaml
ces:
  adapter:
    id: "<adapter-id>"
    version: "<adapter-version>"
```

The adapter output directory is:

```text
adapters/<adapter-id>/
```

Laravel may remain the first integration example, but replacing it with another approved adapter must not require a Phase 2 runner redesign.

---

# Approved Phase 2 Ticket Structure

## CES-P2-001 — Integration Contracts

Define and test:

- `.ces/ces.lock` schema;
- exact 40-character commit validation;
- authoritative commit semantics;
- adapter ID and version agreement;
- baseline support validation;
- toolchain discovery from the pinned checkout;
- bootstrap-runner version boundary;
- client workspace contract;
- execution-report schema;
- conditional fields;
- runner and Phase 1 exit-code separation;
- input-error and execution-error semantics;
- status mapping;
- diagnostic schema;
- deterministic completed-outcome reports;
- network assumptions.

## CES-P2-002 — Adapter-Neutral Bootstrap Runner

Implement and test:

- client-side bootstrap runner;
- `.ces-runtime/` management;
- exact commit checkout and HEAD verification;
- toolchain validation;
- frozen dependency installation;
- CES build;
- project/lock agreement checks;
- baseline compatibility checks;
- adapter-neutral compilation;
- Phase 1 exit-code preservation;
- generic Phase 1 input diagnostics;
- runner input and execution diagnostics;
- transactional output publication;
- current-run artifact inspection;
- runner-owned execution report.

## CES-P2-003 — End-to-End Integration and Basic CI

Prove:

```text
approved Requirement Package
→ bootstrap runner
→ exact pinned CES commit
→ selected adapter
→ current-run artifacts
→ transactionally published output
→ accurate execution-report.json
```

Cover:

- success;
- blocked;
- conflict;
- adapter gap;
- invalid requirement;
- invalid project;
- invalid lock;
- invalid commit format;
- incorrect checked-out HEAD;
- project/lock adapter mismatch;
- unsupported baseline;
- runtime mismatch;
- checkout failure;
- network failure;
- installation failure;
- build failure;
- repeated execution;
- stale-output prevention;
- transactional publication recovery;
- deterministic completed-outcome reports;
- basic repository CI.

---

# Scope Boundaries

The thin Phase 2 does not add:

- offline distribution;
- GHCR publication;
- package publication;
- reusable organization workflows;
- pull-request enforcement;
- artifact-drift detection;
- PRD extraction;
- business-rule extraction;
- clarification workflows;
- new production adapters;
- adapter composition;
- Phase 1 redesign;
- policy overrides;
- governance.

---

# Final Contract

The approved contract is:

```text
thin
adapter-neutral
pinned by exact commit
toolchain-aware
client-bootstrapped
machine-readable
transactionally published
deterministic for completed Phase 1 outcomes
safe from stale artifacts
ready to support Phase 3
```

This document is the approved basis for the three Phase 2 tickets. Superseded
feedback and acknowledgement documents are intentionally removed so this file
remains the single source of truth.
