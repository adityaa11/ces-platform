# CES Phase 1 guide

## Architecture and contracts

The implemented workflow is:

```text
structured Requirement Package
→ deterministic capability and trait resolution
→ stack-agnostic Policy Manifest
→ selected versioned adapter
→ implementation and verification artifacts
```

The core receives requirement facts and assurance context. Technical context is passed only to the adapter stage. Adapters may explain how to implement an obligation but cannot add, remove, weaken, or reinterpret policies. Every generated adapter item records its source Policy Manifest, policy ID, adapter version, mapping ID, and mapping version.

The Policy Manifest is portable: the Laravel and test-fixture adapters consume the same bytes. The fixture is a test-only contract probe, is rejected outside explicit test mode, and is not approved production guidance or the future Phase 4 `generic-guidance` adapter.

Normal `compile` and `compile-adapter` runs load the exact adapter ID and version declared at `project.ces.adapter`; no CLI adapter selection is required. The legacy `--adapter` option is rejected. A deliberate diagnostic workflow may use `--override-adapter <id>@<version>`, and test-fixture adapters additionally require `--test-mode true`. Unknown IDs and unavailable versions fail with exit code 2 before adapter artifacts are emitted.

An unsupported mandatory mapping produces `adapter-report.json` and exit code 5 without partial implementation artifacts. Verification performs bounded schema, identity, file, text-pattern, prohibited-pattern, and configured-test checks. Semantic correctness remains `human_review_required` and is not claimed as automated proof.

### Controlled facts and trust boundaries

Policy-relevant actor, operation, input type, trust boundary, media, effect, and assurance facts use exported versioned enums. Unknown spellings are rejected during schema validation with exit code 2; Phase 1 does not silently coerce them or treat them as an `unknown` value. In particular, use `binary_file`, `image`, `own_resource`, and `public_internet` exactly.

Every input declares `trust_boundary` as either `external` or `internal`. The resolver derives `EXTERNAL_INPUT` only from the explicit `external` value—not from the presence or type of an input. This fact controls input-validation and safe-logging policies.

## Local setup

Requirements are Node.js 24.12.0 and Corepack. The repository pins pnpm 11.15.1.

```sh
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm check
node apps/cli/dist/index.js --help
```

Compile the successful Laravel example:

```sh
node apps/cli/dist/index.js compile \
  --requirement examples/profile-picture.requirement.yaml \
  --project examples/laravel-project.yaml \
  --output .ces/generated/REQ-USER-014/laravel
```

Compile the same Policy Manifest with the contract fixture:

```sh
node apps/cli/dist/index.js compile \
  --requirement examples/profile-picture.requirement.yaml \
  --project examples/laravel-project.yaml \
  --override-adapter test-fixture@0.1.0 \
  --test-mode true \
  --output .ces/generated/REQ-USER-014/fixture
```

The blocked example stops after core resolution, writes its diagnostic Policy Manifest, emits no adapter files, and exits 3:

```sh
node apps/cli/dist/index.js compile \
  --requirement examples/profile-picture.blocked.yaml \
  --project examples/laravel-project.yaml \
  --output .ces/generated/REQ-USER-014/blocked
```

Verify an implementation project after adding `.ces/verification.json` and real evidence files:

```sh
node apps/cli/dist/index.js verify \
  --manifest .ces/generated/REQ-USER-014/laravel/verification-manifest.json \
  --project-root /path/to/client-project
```

## Docker

Build the pinned local image:

```sh
docker build -t ces-cli:local .
docker run --rm ces-cli:local --help
```

Run both compilation stages against a mounted workspace:

```sh
docker run --rm \
  -v "$PWD:/workspace" \
  ces-cli:local compile \
  --requirement /workspace/examples/profile-picture.requirement.yaml \
  --project /workspace/examples/laravel-project.yaml \
  --output /workspace/.ces/generated/REQ-USER-014/laravel
```

## Exit codes

| Code | Meaning |
|---:|---|
| 0 | Success |
| 2 | Input, argument, or schema error |
| 3 | Blocked obligation; diagnostic Policy Manifest written |
| 4 | Registry or policy conflict; diagnostic Policy Manifest written |
| 5 | Adapter gap; `adapter-report.json` written |
| 6 | Verification failure; `verification-report.json` written |

## Extending CES

### Add a capability or trait

Add the stable ID and declarative resolver rule in `packages/capability-registry`. Provide deterministic evidence paths and reasons, increment the appropriate registry version, and add resolver tests. Do not add framework terminology or infer facts from technical context.

### Add a policy

Add the canonical ID, definition, closure requirements, and declarative matching rules in `packages/policy-registry`. Add compatible/incompatible merge coverage, provenance expectations, and a content-mutation identity test. A policy describes stack-agnostic engineering intent; implementation APIs belong in adapters.

### Add an adapter

Create a package under `adapters/` that depends on the Adapter SDK and core contracts only. Declare versioned metadata, compatibility, classification, and an explicit mapping or gap for every mandatory policy. Each implementation, test, and verification item must retain mapping provenance. Register selection only at the CLI orchestration boundary and add portability, neutrality, gap, and deterministic-output tests.

## Phase boundaries

Phase 1 starts from structured YAML/JSON. Natural-language PRD extraction is a Phase 3 flow and is not implemented here. Composable adapter components, support-level resolution, dependency solving, production generic fallback, downloading, marketplaces, scaffolding, and approval are Phase 4 targets. Overrides, exceptions, and governance are Phase 5 targets.

The repository `.github/workflows/test.yml` validates CES itself. It is not a reusable client workflow, does not publish an image, and does not enforce client pull requests.
