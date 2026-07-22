# CES Phase 1 Final Hardening Feedback

**Final disposition (2026-07-22):** CES-013 through CES-017 are complete with reproducible evidence. All accepted hardening priorities are closed, the full repository check and mounted Docker contract pass, and Phase 1 is now **Done**.

## Repository review disposition — 2026-07-22

**Accepted with current-state corrections.** Priorities 1–5 describe verified implementation gaps and are approved as Phase 1 hardening work. They do not require a core redesign.

- Priority 1: accepted. Concrete obligation parameters are not propagated through adapter-derived artifacts, and media types are not represented as a resolved policy parameter.
- Priority 2: accepted. Policy-relevant requirement/assurance fields remain open strings, and `EXTERNAL_INPUT` lacks an explicit trust-boundary fact.
- Priority 3: accepted. Normal compilation still uses a separate CLI adapter ID and hardcoded `0.1.0`, rather than the project-pinned adapter ID/version.
- Priority 4: accepted. The Policy Manifest records only the policy registry content hash; capability and trait registry content is not fully hashed into compilation identity.
- Priority 5: accepted. `resolve-policy` currently treats `--output` as one Policy Manifest file rather than a core output directory containing both normalized artifacts.
- Priority 6: partially superseded. The Docker image build, CLI smoke test, and mounted-workspace compilation now pass and are recorded in CES-012 evidence. The project-pinned command and requested `core/` plus `adapters/<id>/` output layout remain open and belong to CES-017.
- Priority 7: partially superseded. README, examples, documentation links, repository CI, and Docker evidence are populated. Phase 1 is nevertheless returned to **In Progress** until CES-013 through CES-017 pass.

Hardening tickets [CES-013](tickets/phase-1/CES-013-parameter-propagation.md) through [CES-017](tickets/phase-1/CES-017-core-output-docker.md) have been created. CES-012 remains Done for its original examples/documentation/Docker acceptance; CES-017 owns the newly requested output-layout and project-pinned mounted-container contract.

The current implementation is aligned with the intended CES architecture.

Do not redesign the core.

The remaining work is to close several concrete implementation gaps before Phase 1 can be marked complete.

The approved architecture remains:

```text
Structured Requirement
→ Capability and Trait Resolution
→ Stack-Agnostic Policy Resolution
→ Immutable Policy Manifest
→ Selected Adapter
→ Implementation Package
→ CES Verification
```

Laravel remains only the first production-shaped reference adapter.

---

# Priority 1 — Preserve Concrete Requirement Values

## Problem

The structured requirement contains concrete values such as:

```yaml
allowed_media_types:
  - image/jpeg
  - image/png

maximum_size_bytes: 5242880
```

The Policy Manifest retains the file-size value, but the generated implementation task currently produces generic guidance such as:

```text
Apply the resolved maximum size.
```

The generated task does not clearly state:

```text
maximum size: 5242880 bytes
allowed types: image/jpeg and image/png
```

This means a developer or coding agent cannot implement the requirement correctly using only the generated implementation package.

## Required change

Ensure resolved policy parameters are passed through every stage:

```text
Requirement Package
→ Policy Manifest
→ Adapter Mapping
→ Implementation Plan
→ implementation-task.md
→ Test Manifest
→ Verification Manifest
```

The adapter output should preserve concrete parameters.

Example:

```json
{
  "policy_id": "FILE_SIZE_LIMIT",
  "parameters": {
    "maximum_bytes": 5242880
  },
  "implementation_guidance": [
    "Reject files larger than 5242880 bytes."
  ]
}
```

Media types must also be preserved.

Either:

1. add a dedicated policy such as:

```text
FILE_MEDIA_TYPE_ALLOWLIST
```

or:

2. include the allowlist as parameters under an existing file-validation policy.

Recommended policy:

```json
{
  "policy_id": "FILE_MEDIA_TYPE_ALLOWLIST",
  "parameters": {
    "allowed_media_types": [
      "image/jpeg",
      "image/png"
    ]
  }
}
```

## Required generated task output

`implementation-task.md` must contain concrete wording equivalent to:

```text
- Accept only image/jpeg and image/png.
- Reject files larger than 5,242,880 bytes.
- Verify actual file content instead of trusting only the filename or declared MIME type.
```

## Required tests

Add tests proving that generated artifacts contain:

```text
5242880
image/jpeg
image/png
```

Test at least:

* Policy Manifest parameters;
* implementation plan parameters;
* implementation task content;
* test obligations;
* verification checks.

---

# Priority 2 — Enforce Controlled Requirement Vocabulary

## Problem

Several policy-relevant fields currently accept unrestricted strings.

Examples include:

```text
actor.type
operation.action
operation.target_scope
input.type
input.media_category
effects
assurance.exposure
assurance.criticality
assurance.tenancy
assurance.data_classes
delivery_semantics
```

The resolver depends on exact values such as:

```text
authenticated_user
binary_file
image
own_resource
public_internet
```

A typo such as:

```yaml
input:
  type: binary-file
```

may pass schema validation but fail to derive:

```text
FILE_UPLOAD
BINARY_DATA
FILE_CONTENT_VERIFICATION
FILE_SIZE_LIMIT
```

This creates a silent policy omission.

## Required change

Use controlled enums or versioned vocabulary definitions for every field used by capability, trait, or policy rules.

Recommended examples:

```ts
ActorType =
  | "anonymous_user"
  | "authenticated_user"
  | "administrator"
  | "internal_service"
  | "external_system"
  | "scheduled_process";
```

```ts
InputType =
  | "text"
  | "number"
  | "boolean"
  | "binary_file"
  | "structured_object";
```

```ts
MediaCategory =
  | "image"
  | "document"
  | "audio"
  | "video"
  | "archive";
```

```ts
TargetScope =
  | "own_resource"
  | "tenant_resource"
  | "global_resource"
  | "unspecified";
```

Apply the same principle to assurance context.

Unknown values must not silently pass.

Use one of these behaviors:

```text
Unknown value
→ schema validation error
→ exit code 2
```

or:

```text
Explicit value: unknown
→ blocked policy resolution
→ exit code 3
```

Do not accept arbitrary policy-relevant strings.

## External input correction

Do not derive:

```text
EXTERNAL_INPUT
```

only because an input exists.

Add an explicit trust-boundary fact, such as:

```yaml
inputs:
  - name: profile_picture
    type: binary_file
    source: user
    trust_boundary: external
```

Derive `EXTERNAL_INPUT` from:

```text
input.source=user
```

or:

```text
input.trust_boundary=external
```

## Required tests

Add negative tests for:

```yaml
type: binary-file
media_category: images
target_scope: own
exposure: public
```

These must fail validation or resolve into an explicit blocked state.

Add positive tests for all supported vocabulary values.

---

# Priority 3 — Use the Adapter Version Pinned by the Project

## Problem

The project context already defines:

```yaml
ces:
  adapter:
    id: laravel
    version: "0.1.0"
```

However, the CLI currently accepts a separate adapter argument and loads a hardcoded adapter version.

This means `.ces/project.yaml` is not actually the authoritative source for adapter selection and versioning.

## Required change

Normal compilation must read:

```text
project.ces.adapter.id
project.ces.adapter.version
```

The normal command should be:

```bash
ces compile \
  --requirement <path> \
  --project <path> \
  --output <directory>
```

The CLI should internally perform:

```text
Read project context
→ resolve adapter ID
→ resolve adapter version
→ load exact adapter version
→ verify compatibility
→ compile adapter output
```

The adapter loader contract should conceptually be:

```ts
loadAdapter({
  adapterId: project.ces.adapter.id,
  adapterVersion: project.ces.adapter.version,
  testMode: false
});
```

## Adapter override behavior

An explicit adapter override may be allowed only for:

* adapter contract tests;
* fixture-adapter tests;
* explicit diagnostic workflows.

Use an explicit option such as:

```bash
--override-adapter test-fixture@0.1.0
--test-mode
```

Do not silently allow a CLI adapter argument to override the project configuration.

## Required failure cases

Compilation must fail when:

* adapter ID is unknown;
* adapter version is unavailable;
* adapter version is incompatible;
* CLI override conflicts with the project configuration;
* the test-fixture adapter is selected outside test mode.

Use adapter-gap or adapter-loading diagnostics with a clear nonzero exit code.

## Required tests

Add tests proving:

1. the project adapter ID is used;
2. the project adapter version is used;
3. an unavailable version fails;
4. a mismatched explicit override fails;
5. fixture selection requires test mode;
6. removing `--adapter` from normal compilation does not break compilation.

---

# Priority 4 — Include All Registry Content in the Compilation Identity

## Problem

The compilation ID currently accounts for policy-registry content, but capability and trait registry content is not fully included.

Changing a capability or trait rule without changing the registry version may alter the output while preserving the same compilation ID.

Example:

```text
CAP-FILE-001 changed
registry version unchanged
Policy Manifest changed
compilation_id unchanged
```

That breaks traceability and reproducibility.

## Required change

Calculate stable hashes for:

```text
Capability Registry
Trait Registry
Policy Registry
```

Include them in the Policy Manifest.

Example:

```json
{
  "capability_registry_version": "0.1.0",
  "capability_registry_hash": "sha256:...",

  "trait_registry_version": "0.1.0",
  "trait_registry_hash": "sha256:...",

  "policy_registry_version": "0.1.0",
  "policy_registry_hash": "sha256:..."
}
```

The `compilation_id` must include:

```text
Normalized Requirement Package
+ Project Assurance Context
+ Capability Registry Hash
+ Trait Registry Hash
+ Policy Registry Hash
+ Resolved Capabilities
+ Resolved Traits
+ Resolved Obligations
```

All values must be normalized before hashing.

## Required tests

Add tests proving that modifying any of the following changes the compilation ID:

* capability definition;
* capability resolver rule;
* trait definition;
* trait resolver rule;
* policy definition;
* policy resolver rule;
* policy parameter mapping.

Perform these tests without changing registry version strings.

Also prove that identical registry content with different file ordering produces the same hashes.

---

# Priority 5 — Correct the `resolve-policy` Output Contract

## Problem

The documented Stage A output is:

```text
requirement-package.json
policy-manifest.json
```

The current `resolve-policy` command writes only the Policy Manifest.

The normalized Requirement Package is only written by the combined compilation command.

This makes the independent core stage incomplete.

## Required change

Change the command contract to:

```bash
ces resolve-policy \
  --requirement <path> \
  --project <path> \
  --output <directory>
```

The output directory must contain:

```text
generated/core/
├── requirement-package.json
└── policy-manifest.json
```

The command must:

1. parse YAML or JSON;
2. validate the requirement;
3. normalize the requirement;
4. write the normalized Requirement Package;
5. resolve capabilities and traits;
6. resolve policies;
7. write the Policy Manifest;
8. return the correct exit code.

## Diagnostic behavior

Even when policies are blocked or conflicting, write both diagnostic artifacts before returning a nonzero exit code.

Example:

```text
requirement-package.json written: yes
policy-manifest.json written: yes
blocked obligations present: yes
exit code: 3
```

## Required tests

Add tests proving:

* both files are generated on success;
* both files are generated for blocked resolution;
* both files are generated for policy conflicts;
* output is byte-for-byte deterministic;
* YAML and JSON inputs produce equivalent normalized output.

---

# Priority 6 — Complete the Mounted Docker Compilation Test

## Current state

The Docker image builds successfully.

The current workflow verifies:

```bash
docker run --rm ces-cli:local --help
```

This proves the image starts, but it does not prove the CLI can read and write a mounted client workspace.

## Required change

Add a real Docker compilation smoke test.

Example:

```bash
mkdir -p .ces/generated/docker-smoke

docker run --rm \
  -v "$PWD:/workspace" \
  ces-cli:local \
  compile \
  --requirement /workspace/examples/profile-picture.requirement.yaml \
  --project /workspace/examples/laravel-project.yaml \
  --output /workspace/.ces/generated/docker-smoke
```

Do not pass a separate adapter argument if project-pinned adapter selection has been implemented.

## Required artifact checks

Verify that Docker creates:

```text
.ces/generated/docker-smoke/
├── core/
│   ├── requirement-package.json
│   └── policy-manifest.json
└── adapters/
    └── laravel/
        ├── implementation-plan.json
        ├── implementation-task.md
        ├── test-manifest.json
        └── verification-manifest.json
```

The workflow must fail when any expected artifact is missing.

Also verify:

* generated files are owned or writable by the host runner;
* mounted output paths are handled correctly;
* no container-only absolute paths appear in deterministic artifacts.

After this passes, CES-012 may be marked complete.

---

# Priority 7 — Synchronize Repository Status and Documentation

## Root README

Update the status from planning-only wording to the actual state.

Use wording equivalent to:

```text
Phase 1 status: implementation substantially complete.

Completed:
- deterministic stack-agnostic core;
- capability and trait resolution;
- policy resolution;
- Adapter SDK;
- test-fixture adapter;
- Laravel reference adapter;
- implementation compiler;
- verification engine;
- deterministic and boundary tests;
- local Docker image;
- repository CI.

Remaining:
- final Phase 1 hardening;
- mounted-workspace Docker compilation validation;
- parameter propagation and vocabulary corrections.
```

Populate all empty documentation links.

## Ticket roadmap

Update Phase 1 from:

```text
Planned
```

to:

```text
In progress
```

Do not mark Phase 1 complete until all critical hardening items are done.

## Parent ticket

Set:

```text
Status: In Progress
```

Update the ticket table so:

```text
CES-001 through CES-011: Done
CES-012: In Progress
```

Any new hardening work should be added as:

* additional acceptance criteria on the relevant ticket; or
* a new Phase 1 hardening ticket.

A dedicated ticket is cleaner.

Recommended:

```text
CES-013 — Phase 1 Contract and Traceability Hardening
```

It should cover Priorities 1–5.

## CLI documentation

The architecture document should consistently show one physical project file:

```bash
--project .ces/project.yaml
```

Do not document separate physical files such as:

```bash
--project-assurance
--project-technical
```

The CLI may internally split the contexts, but users maintain one project file.

---

# Recommended Ticket Breakdown

Create the following final hardening tickets.

## CES-013 — Requirement Parameter Propagation

Scope:

* preserve file size and media-type values;
* add a media-type allowlist policy or equivalent parameters;
* propagate parameters into all adapter outputs;
* update implementation-task rendering;
* add propagation tests.

## CES-014 — Controlled Vocabulary and Trust Boundaries

Scope:

* replace policy-relevant unrestricted strings with enums;
* add explicit input source and trust-boundary facts;
* update resolver rules;
* add invalid-vocabulary tests;
* prevent silent capability omissions.

## CES-015 — Adapter Pinning and Loading

Scope:

* load adapter ID/version from project context;
* remove required adapter selection from normal CLI compilation;
* support explicit test-mode override;
* reject incompatible versions;
* add adapter-loading tests.

## CES-016 — Registry Hashing and Compilation Identity

Scope:

* hash capability, trait, and policy registries;
* include registry hashes in manifests;
* strengthen compilation ID;
* add registry-mutation determinism tests.

## CES-017 — Core Output and Docker Validation

Scope:

* make `resolve-policy` emit both core artifacts;
* preserve diagnostic outputs on failure;
* add mounted-workspace Docker compile test;
* verify all expected artifacts;
* complete CES-012 evidence.

---

# Do Not Change These Architecture Decisions

Do not modify:

```text
Structured Requirement
→ capabilities and traits
→ stack-agnostic Policy Manifest
→ selected versioned adapter
→ implementation package
```

Keep these rules:

* the policy engine must not import adapters;
* technical context must not determine policy applicability;
* assurance context may affect policy resolution;
* adapters must not modify the Policy Manifest;
* unsupported mandatory policies must create adapter gaps;
* blocked obligations must prevent adapter compilation;
* conflicting policies must prevent adapter compilation;
* the fixture adapter remains test-only;
* Laravel remains only the first reference adapter;
* deterministic artifacts must remain timestamp-free;
* operational metadata must remain separate.

---

# Expected Completion Report

After implementing the changes, report:

1. tickets created or updated;
2. files changed;
3. schemas changed;
4. policies or registry rules added;
5. CLI behavior changes;
6. adapter-loading behavior changes;
7. generated artifact changes;
8. tests added;
9. Docker workflow changes;
10. remaining Phase 1 blockers.

Do not start Phase 2 work.

Do not add:

* GHCR publication;
* reusable client-project workflows;
* PRD extraction;
* additional production adapters;
* policy overrides;
* governance features.

The goal is to finish and harden Phase 1 without expanding its scope.
