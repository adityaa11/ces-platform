# Company Engineering Standard (CES) Platform

## Purpose

The **Company Engineering Standard (CES)** platform is a centrally maintained, stack-agnostic engineering control plane for AI-assisted software development.

It is intended for a software house that develops many client projects using different technology stacks, including:

- Java / Spring Boot
- .NET
- Laravel
- NestJS
- Go
- future supported stacks

CES is **not** a runtime dependency of client applications. It runs around the development lifecycle:

- before a developer or coding agent generates code;
- while requirements are compiled;
- during pull-request verification;
- when company policies are upgraded;
- when a project adopts a new CES baseline.

The main principle is:

> Developers describe business requirements. CES determines the relevant engineering obligations, translates them into the project stack, and verifies the resulting implementation.

---

# Target Architecture

This section describes the long-term CES architecture. It includes capabilities scheduled after Phase 1, such as published container images, reusable workflows, PRD extraction, composable production adapters, and organizational governance.

The current Phase 1 implementation scope is narrower and is defined separately under **Recommended MVP Build Order**.

```text
                       GitHub Organization
                              │
                              ▼
                 company/ces-platform repository
                 ├── Requirement engine
                 ├── Capability registry
                 ├── Policy graph
                 ├── Adapter registry
                 ├── Compiler
                 ├── Verification engine
                 └── Reusable workflow
                              │
                publish versioned CES image
                              │
                              ▼
                 ghcr.io/company/ces-cli:2.3.0
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
   Laravel project      Spring project       Go project
   .ces/project.yaml    .ces/project.yaml    .ces/project.yaml
   PRD/requirements     PRD/requirements     PRD/requirements
   GitHub workflow      GitHub workflow      GitHub workflow
```

The graph has two major parts:

```text
Top:
Central CES ownership, governance, compilation, and publishing

Bottom:
Individual client projects consuming a released CES version
```

---

# 1. GitHub Organization

The GitHub organization owns the CES platform and the client repositories.

Example:

```text
github.com/acme-software-house/
```

Possible repositories:

```text
acme-software-house/
├── ces-platform
├── client-a-pos
├── client-b-erp
├── client-c-booking
└── shared-infrastructure
```

The CES repository belongs to the software house, not to any particular client project.

It centralizes:

- engineering standards;
- requirement schemas;
- business-rule structures;
- capability definitions;
- policy decisions;
- stack adapters;
- verification rules;
- versioning;
- company-wide engineering updates.

---

# 2. `company/ces-platform` Repository

The CES platform repository acts like a specialized compiler.

A normal compiler translates:

```text
Source code
→ machine code
```

CES translates business requirements in two explicitly separated stages:

```text
Stage A — Stack-agnostic CES core

Business requirement
→ structured requirement
→ business rules
→ capabilities and traits
→ engineering policies
→ Policy Manifest

Stage B — Adapter integration

Policy Manifest
+ project technical context
→ stack-specific implementation obligations
→ test obligations
→ verification requirements
```

The deterministic CES core ends at the **Policy Manifest**. Framework-specific interpretation begins only after Adapter Resolution.

Recommended responsibilities:

```text
company/ces-platform
├── Stack-agnostic core
│   ├── Requirement engine
│   ├── Business-rule model
│   ├── Capability and trait registry
│   ├── Policy graph
│   └── Policy Manifest compiler
├── Adapter system
│   ├── Adapter SDK
│   ├── Adapter registry
│   └── Laravel reference adapter
├── Implementation-package compiler
├── Verification engine
└── Reusable workflow
```

## Mandatory Stack-Agnostic Core Boundary

The CES core must not import, reference, or depend on:

- Laravel or PHP;
- Spring or Java;
- ASP.NET or C#;
- NestJS or TypeScript framework APIs;
- Go framework or database APIs;
- any other framework-specific implementation terminology.

The stack-agnostic core ends at the **Policy Manifest**.

Framework-specific implementation guidance begins only after **Adapter Resolution**.

The Laravel adapter is the first reference implementation used to validate the adapter contract. It must not become the default internal model of the CES core.

All adapter interactions must pass through a versioned adapter interface.

Adding a Spring, .NET, NestJS, or Go adapter must not require changes to:

- Requirement Package schemas;
- business-rule schemas;
- capability and trait definitions;
- policy definitions;
- policy-resolution logic;
- Policy Manifest schemas;
- core compiler contracts.

A new stack should require:

```text
New adapter package
+ adapter registry entry
+ adapter contract tests
```

It should not require rewriting the CES core.

## Dependency Direction

The allowed dependency direction is:

```text
Framework adapter
→ Adapter SDK
→ stack-agnostic core contracts
```

Core packages must never import from framework-adapter packages.

The core must be testable without loading the Laravel adapter.

---

# 3. Requirement Engine

## Responsibility

The Requirement Engine converts human-readable inputs into a standardized and versioned **Requirement Package**.

Supported input sources may eventually include:

- PRD;
- FSD;
- Change Request;
- user story;
- acceptance criteria;
- Markdown requirement;
- structured JSON or YAML;
- API specification;
- existing implementation evidence.

Example source requirement:

```text
Authenticated users can replace their profile pictures.
Only JPEG and PNG images up to 5 MB are accepted.
After a successful replacement commits, the previous image must be deleted through retry-safe cleanup.
```

Example Requirement Package:

```json
{
  "schema_version": "1.0.0",
  "requirement_id": "REQ-USER-014",
  "title": "Replace profile picture",
  "source": {
    "document": "PRD-User-Management-v2",
    "section": "4.3.2"
  },
  "operations": [
    {
      "actor": "authenticated_user",
      "action": "replace",
      "resource": "profile_picture",
      "target_scope": "own_resource"
    }
  ],
  "inputs": [
    {
      "name": "profile_picture",
      "type": "binary_file",
      "constraints": {
        "allowed_media_types": [
          "image/jpeg",
          "image/png"
        ],
        "maximum_size_bytes": 5242880
      }
    }
  ],
  "business_rules": [
    {
      "rule_id": "BR-USER-031",
      "type": "authorization",
      "statement": "Users may replace only their own profile picture"
    },
    {
      "rule_id": "BR-USER-032",
      "type": "validation",
      "statement": "Only JPEG and PNG images up to 5 MB are accepted"
    },
    {
      "rule_id": "BR-USER-033",
      "type": "lifecycle",
      "statement": "The previous image must be deleted after the replacement commits, and cleanup must be safe to retry"
    }
  ],
  "uncertainties": []
}
```

The Phase 1 Requirement Package must preserve optional source traceability even though automated PRD extraction is deferred:

```yaml
source:
  document_id: PRD-USER-MANAGEMENT
  document_version: "2.0"
  section: "4.3.2"
  change_request_id: CR-104
  parent_requirement_ids:
    - REQ-USER-001
```

These fields are optional for manually authored requirements. They allow Phase 3 extraction to add evidence without redesigning the core Requirement Package.

## Boundary

The Requirement Engine defines:

- what the requirement says;
- which actors are involved;
- what actions are performed;
- what resource is affected;
- which business rules are explicit;
- which constraints are explicit;
- which details remain unknown.

It must not decide:

- use Laravel Policy;
- use `@Transactional`;
- use Redis;
- use S3;
- use a queue;
- use a particular database implementation.

Those decisions belong to later stages.

## AI and Determinism

Requirement extraction may use AI because source input is natural language.

However, output must be constrained by:

- JSON Schema;
- controlled vocabularies;
- source references;
- confidence scores;
- conflict reporting;
- explicit unknown values;
- stable identifiers.

The extractor must not invent arbitrary capability names or silently add unstated business facts.

---

# 4. Capability Registry

## Responsibility

The Capability Registry contains the official company vocabulary for supported behaviors.

Example:

```yaml
capabilities:
  - id: AUTHENTICATION
    category: identity

  - id: FILE_UPLOAD
    category: data_ingress

  - id: IMAGE_PROCESSING
    category: media

  - id: PAYMENT_CAPTURE
    category: financial

  - id: REFUND
    category: financial

  - id: BACKGROUND_JOB
    category: asynchronous_processing

  - id: DATA_IMPORT
    category: bulk_processing
```

For the profile-picture requirement:

```text
Replace profile picture
        │
        ├── PROFILE_MANAGEMENT
        ├── FILE_UPLOAD
        └── IMAGE_PROCESSING
```

The resolver may also derive traits:

```text
AUTHENTICATED_ACTOR
EXTERNAL_INPUT
BINARY_DATA
USER_OWNED_RESOURCE
PERSISTENT_DATA
REPLACEABLE_RESOURCE
BROWSER_RENDERED_CONTENT
```

## Capability vs Trait

A capability describes:

> What kind of behavior exists?

A trait describes:

> What engineering characteristics the behavior has.

Example:

```text
Capability:
FILE_UPLOAD

Traits:
EXTERNAL_INPUT
BINARY_DATA
PERSISTENT_DATA
```

Another upload requirement could additionally include:

```text
CONFIDENTIAL_DATA
TEMPORARY_DATA
PUBLIC_DOWNLOAD
BULK_OPERATION
```

Those traits influence which policies apply.

---

# 5. Policy Graph

## Responsibility

The Policy Graph converts:

```text
Capabilities
+ traits
+ business rules
+ project assurance context
```

into:

```text
Mandatory obligations
Conditional obligations
Prohibited patterns
Blocked obligations
Unresolved decisions
```

Example rules:

```yaml
rules:
  - when:
      trait: USER_OWNED_RESOURCE
    require:
      - RESOURCE_LEVEL_AUTHORIZATION

  - when:
      capability: FILE_UPLOAD
    require:
      - FILE_SIZE_LIMIT
      - FILE_CONTENT_VERIFICATION
      - SERVER_GENERATED_STORAGE_KEY

  - when:
      trait: REPLACEABLE_RESOURCE
    require:
      - ATOMIC_RESOURCE_REPLACEMENT
      - REPLACED_RESOURCE_LIFECYCLE

  - when:
      trait: EXTERNAL_INPUT
    require:
      - INPUT_VALIDATION
      - SAFE_LOGGING
```

Example Policy Manifest:

```json
{
  "policy_manifest_id": "PM-REQ-USER-014",
  "requirement_id": "REQ-USER-014",
  "obligations": [
    {
      "policy_id": "RESOURCE_LEVEL_AUTHORIZATION",
      "status": "mandatory",
      "reason": "Trait USER_OWNED_RESOURCE"
    },
    {
      "policy_id": "FILE_SIZE_LIMIT",
      "status": "mandatory",
      "parameters": {
        "maximum_bytes": 5242880
      },
      "reason": "Business rule BR-USER-032"
    },
    {
      "policy_id": "FILE_CONTENT_VERIFICATION",
      "status": "mandatory",
      "reason": "Capability FILE_UPLOAD"
    },
    {
      "policy_id": "ATOMIC_RESOURCE_REPLACEMENT",
      "status": "mandatory",
      "reason": "Trait REPLACEABLE_RESOURCE"
    }
  ],
  "prohibitions": [
    {
      "policy_id": "CLIENT_CONTROLLED_STORAGE_PATH",
      "reason": "File paths must be generated by the trusted server"
    }
  ],
  "blocked_obligations": [
    {
      "policy_id": "REPLACED_FILE_DELETION",
      "reason": "Retention requirement is unresolved"
    }
  ]
}
```

## Deterministic Resolution

Once the Requirement Package is valid, policy resolution should be mostly deterministic.

```text
Requirement facts
→ capability rules
→ trait rules
→ policy graph
→ policy closure
→ obligation manifest
```

AI may help propose or review policy relationships, but a released CES policy version should not depend on model improvisation.

---

# 6. Project Context

Each client repository provides a small project profile.

Example:

```yaml
# .ces/project.yaml

schema_version: "1.0.0"

project:
  id: client-a-pos
  name: Client A POS

assurance:
  exposure: public_internet
  criticality: business_critical
  tenancy: multi_tenant
  data_classes:
    - personal
    - financial
  delivery_semantics: at_least_once

technical:
  language: php
  framework: laravel
  framework_version: "12"
  database: postgresql
  queue: laravel_queue
  storage: s3_compatible
  test_framework: phpunit

ces:
  baseline_version: "0.1.0"
  adapter:
    id: laravel
    version: "0.1.0"
```

The project context has two separate purposes.

## Technical Context

Used only after the Policy Manifest has been resolved:

```text
Laravel
PostgreSQL
Laravel Queue
S3-compatible storage
```

It selects an adapter and determines how an already-resolved obligation is implemented.

Technical context must not change whether a stack-agnostic policy applies. For example, `ATOMIC_RESOURCE_REPLACEMENT` must be resolved before CES knows whether the project implements it with Laravel, Spring, .NET, NestJS, or Go.

## Assurance Context

Used by the Policy Graph:

```text
Public internet
Multi-company
Personal data
Financial data
Business critical
At-least-once delivery
```

It determines policy strength and mandatory protections.

---

# 7. Adapter Registry

## Responsibility

Adapters translate stack-agnostic policy obligations into stack-specific implementation guidance.

Stack-agnostic policy:

```text
Multi-step state changes must be atomic.
```

Possible adapters:

```text
Laravel
→ DB::transaction()

Spring
→ @Transactional service boundary

.NET
→ transaction through the configured persistence layer

Go
→ database transaction using Begin/Commit/Rollback
```

Example Laravel adapter:

```yaml
adapter:
  id: laravel
  version: "0.1.0"

policy_mappings:
  INPUT_VALIDATION:
    patterns:
      - Laravel Form Request
    verification:
      - request_validation_test

  RESOURCE_LEVEL_AUTHORIZATION:
    patterns:
      - Laravel Policy
      - authorize against target resource
    verification:
      - unauthorized_resource_test
      - cross_tenant_test

  ATOMIC_RESOURCE_REPLACEMENT:
    patterns:
      - DB::transaction
      - dispatch cleanup only after commit
    verification:
      - rollback_test
      - cleanup_retry_test

  SERVER_GENERATED_STORAGE_KEY:
    patterns:
      - Laravel Storage abstraction with a server-generated path

  REPLACED_RESOURCE_LIFECYCLE:
    patterns:
      - queued cleanup dispatched only after commit
      - retry-safe cleanup job
    verification:
      - cleanup_after_commit_test
      - cleanup_retry_test
```

## Boundary

The adapter does not decide whether a policy is required.

The Policy Graph decides:

```text
ATOMIC_RESOURCE_REPLACEMENT is mandatory
```

The adapter decides:

```text
How the selected stack can implement and verify it
```

An adapter must not:

- add a mandatory policy that was not resolved by the core;
- silently remove or weaken a mandatory policy;
- reinterpret a business rule;
- change requirement facts;
- cause the core Policy Manifest to become framework-specific.

If the selected adapter cannot implement a mandatory policy, CES must produce an explicit **adapter gap**. It must not silently fall back to another pattern.

Example:

```json
{
  "policy_id": "ATOMIC_RESOURCE_REPLACEMENT",
  "adapter_id": "go",
  "status": "unsupported",
  "reason": "The selected adapter version has no mapping for this policy"
}
```

---

# 8. Compiler

## Responsibility

Compilation occurs in two stages.

## Stage A: Core Policy Compilation

The stack-agnostic core combines:

```text
Requirement Package
+ business rules
+ capabilities and traits
+ project assurance context
+ policy registry
```

and produces:

```text
Policy Manifest
```

This stage must run without Laravel or any other framework adapter.

## Stage B: Adapter Compilation

The adapter compiler combines:

```text
Policy Manifest
+ project technical context
+ selected adapter mappings
```

and produces an **Implementation Package**.

Example output:

```text
.ces/generated/REQ-USER-014/
├── requirement-package.json
├── policy-manifest.json
├── implementation-plan.json
├── implementation-task.md
├── test-manifest.json
└── verification-manifest.json
```

## Example `implementation-task.md`

```md
# Requirement

Authenticated users can replace their own profile pictures.

## Mandatory obligations

- Authorize against the target profile.
- Accept JPEG and PNG only.
- Enforce the 5 MB limit.
- Verify actual decoded image content.
- Generate a server-controlled storage key.
- Store the new reference atomically.
- Schedule old-object cleanup only after commit.
- Make cleanup safe to retry.
- Do not log file contents or signed URLs.

## Laravel implementation adapters

- Validation: Form Request
- Authorization: Policy
- Transaction: DB::transaction()
- Storage: Laravel Storage
- Cleanup: queued job after commit

## Required tests

- unauthenticated request is rejected;
- another user's profile cannot be modified;
- unsupported media is rejected;
- oversized upload is rejected;
- spoofed content type is rejected;
- failed persistence keeps the previous image active;
- cleanup retry is safe.
```

A human developer, Codex, Claude Code, or another coding agent receives only relevant obligations and adapter guidance.

It does not need the complete:

- capability registry;
- policy graph;
- standards library;
- adapter registry;
- security documentation.

This is where token efficiency comes from.

---

# 9. Verification Engine

## Responsibility

The Verification Engine checks whether the generated implementation satisfies the compiled obligations.

It consumes:

```text
Verification Manifest
+ generated code
+ test results
+ project configuration
```

Example:

```json
{
  "requirement_id": "REQ-USER-014",
  "checks": [
    {
      "check_id": "AUTH-001",
      "policy_id": "RESOURCE_LEVEL_AUTHORIZATION",
      "type": "required_test",
      "expected": "cross_owner_request_rejected"
    },
    {
      "check_id": "FILE-002",
      "policy_id": "FILE_SIZE_LIMIT",
      "type": "static_or_test",
      "expected_parameter": {
        "maximum_bytes": 5242880
      }
    },
    {
      "check_id": "CONSISTENCY-001",
      "policy_id": "ATOMIC_RESOURCE_REPLACEMENT",
      "type": "semantic_review",
      "expected": "metadata replacement is atomic"
    }
  ]
}
```

## Verification Levels

### Deterministic Static Checks

Examples:

- JSON and YAML schema validation;
- prohibited API usage;
- required configuration exists;
- migration includes a required constraint;
- route uses expected middleware;
- required test tags or IDs exist;
- committed secret detection;
- adapter-supported patterns are present.

### Runtime Verification

Examples:

- unit tests;
- integration tests;
- transaction rollback tests;
- duplicate-message tests;
- migration tests;
- load tests;
- cleanup retry tests.

### Semantic Verification

Examples:

- authorization is applied to the correct resource;
- state transition matches the business rule;
- cleanup ordering is truly safe;
- audit event captures the correct business meaning.

Semantic verification may require:

- a coding or review agent such as Codex or Claude Code;
- another model or verification tool;
- a human reviewer;
- a combination of these.

Not every engineering obligation can be proven through static analysis.

---

# 10. Reusable GitHub Workflow

The reusable workflow connects CES to client repositories.

Central workflow:

```text
company/ces-platform/.github/workflows/ces-verify.yml
```

Client caller workflow:

```yaml
name: CES Verification

on:
  pull_request:

jobs:
  ces:
    uses: company/ces-platform/.github/workflows/ces-verify.yml@v0.1.0
    with:
      project_config: .ces/project.yaml
      requirements_path: .ces/requirements
```

The workflow should:

```text
Checkout client repository
        ↓
Pull pinned CES image
        ↓
Validate project configuration
        ↓
Compile requirements
        ↓
Resolve policies
        ↓
Run adapter-specific verification
        ↓
Run required project checks
        ↓
Publish CES report
        ↓
Pass or fail the pull request
```

Projects should pin a released CES version instead of calling `main`.

Example:

```yaml
uses: company/ces-platform/.github/workflows/ces-verify.yml@v0.1.0
```

For maximum reproducibility, use an exact commit SHA.

---

# 11. Published CES Image

The central repository publishes a versioned CES container image.

Example:

```text
ghcr.io/company/ces-cli:0.1.0
```

The container includes:

- CES CLI;
- requirement schemas;
- capability registry;
- policy graph;
- adapters;
- compiler;
- verification engine.

It is a development and CI tool.

It is not shipped as part of the client application's runtime.

Example use:

```bash
docker run --rm \
  -v "$PWD:/workspace" \
  ghcr.io/company/ces-cli:0.1.0 \
  verify --project /workspace/.ces/project.yaml
```

---

# 12. Client Project Integration

Laravel, Spring, and Go projects consume the same CES baseline.

The project-specific difference is declared in `.ces/project.yaml`.

Examples:

```yaml
technical:
  framework: laravel
```

```yaml
technical:
  framework: spring_boot
```

```yaml
technical:
  framework: go
```

The policy remains the same.

Example:

```text
Policy:
RESOURCE_LEVEL_AUTHORIZATION
```

Adapter resolution:

```text
Laravel
→ Policy and server-side resource authorization

Spring
→ application/service authorization

Go
→ middleware plus domain/service authorization check
```

---

# 13. Minimum Client Repository Footprint

Each project should contain only a small CES integration layer.

```text
client-project/
├── .ces/
│   ├── project.yaml
│   ├── requirements/
│   │   └── REQ-USER-014.yaml
│   ├── overrides/
│   ├── generated/
│   └── ces.lock
├── .github/
│   └── workflows/
│       └── ces.yml
├── src/
└── tests/
```

Agent-specific configuration such as Codex skills or Claude Code instructions is optional and is not part of the required CES client footprint. Such integrations consume CES artifacts; CES core contracts must not depend on them.

## Example `ces.lock`

```yaml
ces_image: ghcr.io/company/ces-cli:0.1.0
baseline_version: "0.1.0"
requirement_schema_version: "1.0.0"
capability_registry_version: "0.1.0"
policy_registry_version: "0.1.0"

adapter:
  id: laravel
  version: "0.1.0"
```

This makes requirement compilation reproducible.

The `.ces/overrides/` location is reserved for future governance capabilities. Phase 1 must not define or implement policy override precedence, approved exceptions, approval metadata, expiration, or review workflows.

---

# 14. Target End-to-End Flow

This is the target workflow after Phase 3 requirement extraction exists. In Phase 1, the flow starts with an already structured Requirement Package in YAML or JSON; CES does not read or extract a natural-language PRD.

```text
1. Analyst writes PRD
       ↓
2. PRD is placed in .ces/requirements
       ↓
3. Requirement Engine extracts Requirement IR
       ↓
4. Evidence, conflicts, and unknowns are validated
       ↓
5. Capability Resolver selects capabilities and traits
       ↓
6. Project assurance context is applied
       ↓
7. Stack-agnostic Policy Graph resolves obligations and prohibitions
       ↓
8. Core compiler produces the Policy Manifest
       ↓
9. Project technical context selects Laravel, Spring, .NET, NestJS, or Go adapter
       ↓
10. Adapter compiler generates a universal implementation task, tests, and verification manifest
       ↓
11. A developer, Codex, Claude Code, or another compatible agent implements code and tests
       ↓
12. Verification Engine validates the implementation
       ↓
13. GitHub workflow passes or blocks the pull request
```

---

# 15. Current MVP Scope and Build Order

Do not begin with:

- PDF extraction;
- five framework adapters;
- malware-scanning infrastructure;
- complete ISO mappings;
- complex AI semantic verification;
- production dashboards;
- organization-wide policy approval systems.

Start with a deterministic core.

## Phase 1A: Stack-Agnostic Policy Compilation

Input:

```text
Structured Requirement YAML/JSON
+ project assurance context
+ Capability Registry
+ Trait Registry
+ Policy Registry
```

Output:

```text
Requirement Package
Policy Manifest
```

Build:

```text
Requirement schema
Business-rule schema
Project assurance schema
Capability and trait registry
Capability and trait resolver
Policy registry
Policy engine
Policy Manifest compiler
Core CLI commands
```

The following command must work without loading any framework adapter:

```bash
ces resolve-policy \
  --project examples/project-assurance.yaml \
  --requirement examples/profile-picture.yaml \
  --output generated/core
```

Expected output:

```text
generated/core/
├── requirement-package.json
└── policy-manifest.json
```

## Phase 1B: First Reference Adapter Integration

Implement one reference adapter:

```text
Laravel
```

Its purpose is to prove that the adapter contract can translate a Policy Manifest without changing the core.

Input:

```text
Policy Manifest
+ project technical context
+ Laravel reference adapter
```

Output:

```text
Implementation Task
Implementation Plan
Test Manifest
Verification Manifest
```

Command:

```bash
ces compile-adapter \
  --policy-manifest generated/core/policy-manifest.json \
  --project examples/laravel-project.yaml \
  --adapter laravel \
  --output generated/laravel
```

Expected output:

```text
generated/laravel/
├── implementation-plan.json
├── implementation-task.md
├── test-manifest.json
└── verification-manifest.json
```

## Phase 2: Verification

Add:

- schema validation;
- generated-file checks;
- required-test checks;
- prohibited-pattern checks;
- adapter contract verification;
- Laravel reference-adapter verification;
- reusable GitHub workflow.

The core verification suite must also run with a fake or test adapter so that Laravel is not required to test core behavior.

## Phase 3: Evidence-Backed Requirement Extraction

After deterministic compilation is reliable, add:

```text
Markdown PRD
→ Requirement IR
```

Require:

- source references;
- confidence;
- controlled enums;
- explicit unknowns;
- conflict detection;
- duplicate merging.

## Phase 4: Production Adapter Ecosystem and Incremental Stack Support

Establish a production adapter ecosystem rather than manually creating one monolithic adapter for every possible combination of language, framework, database, messaging system, object storage provider, and test framework.

Phase 4 should introduce:

- a production `generic-guidance` fallback;
- adapter component kinds;
- adapter discovery and resolution;
- compatibility rules;
- adapter composition;
- independently versioned adapter components;
- optional stack profiles that bundle compatible components;
- adapter scaffolding;
- adapter contract tests;
- adapter approval and publication processes;
- support diagnostics and adapter-gap reporting.

Approved adapter components should be added incrementally according to real project demand.

Example component kinds include language, application framework, persistence, database, messaging, queue, cache, object storage, testing, and verification. A project may use a convenience stack profile, but the underlying adapter components must remain independently versioned and composable.

Phase 4 must avoid a package for every complete stack combination. Instead, the future resolution model is:

```text
Policy Manifest
+ ProjectTechnicalContext
        ↓
Adapter Resolver
        ↓
Compatible approved adapter components
        ├── language
        ├── application framework
        ├── persistence
        ├── database
        ├── messaging or queue
        ├── storage
        └── testing and verification
        ↓
Composed Implementation Package
```

This component model is target architecture only. Phase 1 continues to treat the Laravel reference adapter and test-fixture adapter as complete adapters.

### Future support levels

Phase 4 adapter resolution should report one of these support levels per policy and component:

```text
full        approved stack-specific mapping, tests, and available verification
generic     implementation-neutral guidance without stack-specific verification
partial     only part of the policy is mapped; manual work or review remains
unsupported no approved safe guidance is available
```

Generic or partial support must disclose its limitations and may be disallowed by the project assurance profile. An unsupported mandatory obligation continues to fail compilation. Generic guidance must never be represented as equivalent to an approved stack-specific mapping, and the original adapter gap must remain visible.

```json
{
  "policy_id": "RESOURCE_LEVEL_AUTHORIZATION",
  "component_kind": "application_framework",
  "component_id": "fastapi",
  "support_level": "unsupported",
  "reason": "No approved FastAPI mapping exists"
}
```

### Production generic guidance

The future `generic-guidance` adapter may provide safe, implementation-neutral instructions when no approved component mapping exists. It must not invent framework APIs or claim full support. It is separate from the Phase 1 test-fixture adapter, which exists only to test portability and is not production guidance.

### Future adapter metadata

A future adapter component may declare metadata such as:

```yaml
schema_version: "1.0.0"

adapter:
  id: spring-boot
  version: "1.0.0"
  kind: application_framework

supports:
  policies:
    - INPUT_VALIDATION
    - RESOURCE_LEVEL_AUTHORIZATION
    - TRANSACTION_BOUNDARY

requires:
  - kind: language
    ids: [java]

compatible_with:
  - kind: persistence
    ids: [spring_data_jpa, jooq]

compatibility:
  technology_versions: ["3.x", "4.x"]
```

This descriptor is roadmap documentation, not a Phase 1 schema requirement.

### Stack profiles

A stack profile is a versioned convenience bundle that expands into independently versioned adapter components. It is not a source of policy rules, and projects must be able to override individual component selections.

```yaml
stack_profile:
  id: spring-standard
  version: "1.0.0"

components:
  language: java
  application_framework: spring_boot
  persistence: spring_data_jpa
  database: postgresql
  testing: junit
```

### Project technical-context evolution

The simple Phase 1 technical schema remains unchanged. Phase 4 may introduce a new schema version with typed component sections such as `language`, `application_framework`, `persistence`, `database`, `queue`, `object_storage`, and `testing`. This must be a deliberate schema migration rather than a premature Phase 1 expansion.

```yaml
technical:
  language:
    id: php
    version: "8.4"
  application_framework:
    id: laravel
    version: "12"
  persistence:
    id: eloquent
  database:
    id: postgresql
  queue:
    id: laravel_queue
    driver: redis
  object_storage:
    id: s3_compatible
  testing:
    id: phpunit
```

### Adapter scaffolding and approval

Future commands may include:

```bash
ces adapter scaffold fastapi
ces adapter validate adapters/fastapi
ces adapter test adapters/fastapi
```

A coding agent may generate an adapter candidate from policy definitions, the Adapter SDK, official documentation, company conventions, and representative repositories. The candidate remains untrusted until it passes schema validation, contract tests, compatibility tests, deterministic-output tests, policy-coverage checks, security review, engineering approval, and versioned publication.

CES must never silently generate and activate a framework adapter during normal project compilation.

### Phase 1 compatibility constraint

The Phase 1 Adapter SDK should avoid decisions that make future component metadata and composition impossible. It must not implement adapter dependency solving, profile expansion, dynamic downloading, production generic fallback, marketplace behavior, or approval workflows during Phase 1.

---

# 16. Suggested CES Repository Structure

```text
ces-platform/
├── apps/
│   └── cli/
├── packages/
│   ├── requirement-schema/
│   ├── requirement-engine/
│   ├── capability-registry/
│   ├── capability-resolver/
│   ├── policy-registry/
│   ├── policy-engine/
│   ├── project-schema/
│   ├── adapter-sdk/
│   ├── compiler/
│   └── verification-engine/
├── adapters/
│   ├── laravel-reference/
│   └── test-fixture/
├── future-adapters/
│   └── README.md
├── policies/
│   ├── security/
│   ├── consistency/
│   ├── performance/
│   ├── audit/
│   ├── lifecycle/
│   └── observability/
├── schemas/
├── examples/
│   ├── requirements/
│   └── projects/
├── tests/
│   ├── contracts/
│   ├── policy-resolution/
│   ├── adapters/
│   └── end-to-end/
├── .github/
│   └── workflows/
│       ├── test.yml
│       ├── publish-image.yml
│       └── ces-verify.yml
├── Dockerfile
└── README.md
```

A TypeScript implementation is reasonable for an MVP because it offers:

- strong schema tooling;
- straightforward YAML and JSON processing;
- good CLI libraries;
- package-based monorepo support;
- good GitHub and container integration.

This is an implementation choice, not an architectural requirement.

---

# 17. CES Implementation Brief

## Objective

Create an MVP monorepo for a Company Engineering Standard platform named `ces-platform`.

The platform is a development-time compiler and verification tool.

It must not become a runtime dependency of client applications.

The CES core must be stack-agnostic. The Laravel adapter is only the first reference adapter used to validate the adapter boundary.

The implementation must allow a Spring, .NET, NestJS, or Go adapter to be added without modifying the requirement, business-rule, capability, trait, policy, or Policy Manifest core.

## MVP Inputs

### Stack-Agnostic Core Input

The core receives:

1. a structured Requirement Package in YAML or JSON;
2. project assurance context;
3. a central capability and trait registry;
4. a central policy registry.

### Reference Adapter Input

The adapter stage receives:

1. the already-resolved Policy Manifest;
2. project technical context;
3. a selected versioned adapter.

The MVP implements Laravel as the first reference adapter.

## MVP Outputs

### Core Output

The core must deterministically generate:

- a validated Requirement Package;
- a resolved stack-agnostic Policy Manifest.

### Adapter Output

The Laravel reference adapter must translate the Policy Manifest into:

- a concise, agent-neutral implementation task;
- an implementation plan;
- a required-test manifest;
- a verification manifest.

Do not implement PDF or free-text PRD extraction in the first MVP.

## Required Modules

### Stack-Agnostic Core Modules

Create logical modules for:

- requirement schema and validation;
- business-rule schema and validation;
- project-assurance schema and validation;
- capability and trait registry;
- capability and trait resolver;
- policy registry;
- deterministic policy-graph resolution;
- Policy Manifest compiler;
- core verification contracts.

### Adapter Modules

Create:

- a versioned Adapter SDK;
- an adapter registry;
- a Laravel reference adapter;
- a minimal test-fixture adapter;
- an implementation-package compiler;
- adapter verification contracts.

### Tooling Modules

Create:

- verification engine;
- CLI;
- reusable workflow support.

No stack-agnostic core package may import from `adapters/`.

## Core Contracts

Define versioned schemas for:

- Requirement Package;
- Project Context;
- Capability;
- Trait;
- Policy;
- Policy Obligation;
- Policy Manifest;
- Adapter Mapping;
- Implementation Package;
- Test Manifest;
- Verification Manifest.

All generated outputs must include:

- schema version;
- source requirement ID;
- CES baseline version;
- policy registry version;
- deterministic source or reason for each resolved policy.

The stack-agnostic Policy Manifest must not contain:

- adapter ID;
- framework name;
- framework classes, annotations, functions, decorators, or package names;
- implementation-specific verification patterns.

Adapter-derived outputs must additionally include:

- adapter ID and version;
- adapter mapping version;
- deterministic mapping from each obligation to implementation and verification guidance.

## Initial Capabilities

Support:

- `PROFILE_MANAGEMENT`;
- `FILE_UPLOAD`;
- `IMAGE_PROCESSING`.

## Initial Traits

Support:

- `AUTHENTICATED_ACTOR`;
- `EXTERNAL_INPUT`;
- `BINARY_DATA`;
- `USER_OWNED_RESOURCE`;
- `PERSISTENT_DATA`;
- `REPLACEABLE_RESOURCE`;
- `BROWSER_RENDERED_CONTENT`.

## Initial Policies

Support:

- `INPUT_VALIDATION`;
- `RESOURCE_LEVEL_AUTHORIZATION`;
- `FILE_SIZE_LIMIT`;
- `FILE_CONTENT_VERIFICATION`;
- `SERVER_GENERATED_STORAGE_KEY`;
- `SAFE_IMAGE_DELIVERY`;
- `ATOMIC_RESOURCE_REPLACEMENT`;
- `REPLACED_RESOURCE_LIFECYCLE`;
- `SAFE_LOGGING`.

Policy statuses must support:

- mandatory;
- conditional;
- prohibited;
- blocked because of unresolved requirements.

## Laravel Reference Adapter

Implement Laravel only as the first reference adapter.

Map the initial policies to Laravel-oriented implementation guidance:

- Form Request;
- Policy;
- database transaction;
- Laravel Storage abstraction;
- queued cleanup after commit;
- PHPUnit feature and integration tests.

Adapters must not decide whether a policy applies.

They only translate already-resolved policies.

The Laravel reference adapter must be removable without breaking:

- requirement validation;
- capability and trait resolution;
- policy resolution;
- Policy Manifest generation;
- core contract tests.

If a Policy Manifest references an obligation unsupported by the Laravel adapter, compilation must fail with an explicit adapter-gap error.

## CLI Commands

Implement:

```bash
ces validate-requirement <path>
ces validate-project <path>

ces resolve-policy \
  --requirement <path> \
  --project-assurance <path> \
  --output <directory>

ces compile-adapter \
  --policy-manifest <path> \
  --project-technical <path> \
  --adapter <adapter-id> \
  --output <directory>

ces compile \
  --requirement <path> \
  --project <path> \
  --output <directory>

ces verify --manifest <path> --project-root <path>
```

`ces compile` is a convenience orchestration command. Internally it must execute the two separate stages:

```text
resolve-policy
→ compile-adapter
```

## Example Requirement

Create an example requirement for:

> Authenticated users can replace their own profile pictures. JPEG and PNG images up to 5 MB are accepted.

Create an example Laravel project context.

The commands must generate:

```text
generated/
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

`generated/core/policy-manifest.json` must remain unchanged regardless of whether the next selected adapter is Laravel, Spring, .NET, NestJS, or Go.

## Determinism

The same:

- registry versions;
- project context;
- requirement input;

must produce byte-for-byte identical deterministic artifacts after input normalization.

Require stable object-key and array ordering, UTF-8, LF newlines, deterministic whitespace and Markdown section order, and content-derived identifiers. Deterministic artifacts must not contain timestamps, random UUIDs, absolute machine paths, or environment-dependent ordering. Operational metadata such as timestamps and execution duration belongs in a separate `run-report.json` and must not affect compilation artifacts.

Compilation identifiers must hash normalized input content, normalized registry content, and their declared versions. Hashing both content and versions detects a registry that was modified without a version increment.

Do not use an LLM in the MVP policy-resolution path.

Resolving the same requirement and assurance context must produce the same Policy Manifest even when:

- no adapter is installed;
- the Laravel adapter is installed;
- a test-fixture adapter is selected;
- another future adapter is selected.

Adapter selection may change implementation and verification outputs, but it must not change the stack-agnostic Policy Manifest.

## Initial Verification

Support:

- schema validation;
- required generated-file checks;
- required test-obligation checks;
- prohibited-pattern checks through adapter-provided rules;
- a human-review-required status for semantic checks that cannot be proven automatically.

## Quality Requirements

Add:

- unit tests for policy resolution;
- contract tests for schemas;
- dependency-boundary tests proving core packages do not import adapters;
- adapter SDK contract tests;
- test-fixture adapter tests;
- Laravel reference-adapter tests;
- end-to-end tests for both compilation stages;
- a test proving the same Policy Manifest can be consumed by more than one adapter fixture;
- meaningful errors for:
  - unknown capabilities;
  - unsupported policies;
  - adapter gaps;
  - schema-version mismatches;
  - blocked obligations.

Document:

- the mandatory stack-agnostic core boundary;
- dependency-direction rules;
- core and adapter input/output contracts;
- how to add a capability;
- how to add a trait;
- how to add a policy;
- how to create another adapter without changing the core;
- how adapter gaps are reported;
- limitations of the MVP.

---

# 18. Confirmed MVP Implementation Decisions

## Any-Stack Acceptance Rule

Every CES core decision must remain valid for any current or future technology stack. The core is a universal, stack-agnostic policy compiler; it is not a universal implementation generator and must not use Laravel as its internal model.

The same Policy Manifest must be consumable by Laravel, Spring Boot, .NET, NestJS, Go, the framework-neutral test-fixture adapter, and future adapters without changing core schemas or policy-resolution code.

## Universal Consumer Compatibility

CES outputs must not be coupled to a particular coding agent. `implementation-task.md` is the canonical human-readable task and must be understandable without Codex-, Claude Code-, IDE-, or vendor-specific commands. Its structured sources remain `implementation-plan.json`, `test-manifest.json`, and `verification-manifest.json`.

The same Implementation Package must be consumable by:

- a human developer;
- Codex;
- Claude Code;
- another coding agent;
- CI and internal engineering tools.

Agent-specific prompt renderers or repository instructions may be added as optional integrations. They must be derived from the same Implementation Package and must not change requirement facts, the Policy Manifest, adapter mappings, test obligations, or verification requirements. Selecting a coding agent is a presentation concern, not policy resolution or stack adaptation.

## Toolchain and Monorepo

Implement CES with:

- TypeScript and Node.js;
- ES modules;
- pnpm workspaces with an isolated linker;
- Zod for runtime schema validation;
- YAML and JSON input support;
- Vitest for automated tests.

Pin exact Node.js and pnpm versions in the repository, Dockerfile, and package metadata. These versions build CES itself and impose no runtime or toolchain requirement on client projects. Use `workspace:*` for internal dependencies, prohibit phantom dependencies and workspace cycles, and add deterministic dependency-boundary tests in addition to pnpm isolation.

Phase 1 must provide a working local CLI, build, tests, type checking, and Dockerfile. Publishing a container image and providing a reusable GitHub workflow belong to Phase 2.

## One Project File, Two Domain Contexts

Use one physical `.ces/project.yaml`. Parse it into separate `ProjectAssuranceContext` and `ProjectTechnicalContext` domain objects.

- Core policy resolution may receive only assurance context.
- Adapter compilation may receive only technical context.
- The CLI is the orchestration boundary permitted to read the combined file and invoke both stages.

## Deterministic Fact Resolution

Structured requirements declare business and operational facts, not engineering policies, capabilities, or traits. Deterministic declarative resolver rules derive capabilities and traits. Every derived item must record its resolver rule ID, source evidence, reason, and registry version.

Optional asserted capabilities may be supported, but they must remain distinguishable from resolved capabilities, be supported by requirement facts, and never bypass normal policy resolution.

## Policy Status Model

Policy requirement and resolution are separate dimensions:

```text
requirement_level: mandatory | conditional | prohibited
resolution_state: resolved | blocked | conflict
```

Applicable conditional and mandatory rules resolve to mandatory when parameters are compatible. Compatible duplicate rules merge their sources and evidence. Conflicting parameters fail resolution. A mandatory/prohibited combination is a conflict rather than a precedence decision.

Blocked obligations indicate missing information; they are not a stronger policy level. Any blocked or conflicting obligation prevents adapter compilation.

## CLI Exit and Diagnostic Behavior

Use these initial exit codes:

```text
0  success
2  input or schema error
3  blocked obligation
4  registry or policy conflict
5  adapter gap
6  verification failure
```

`resolve-policy` must write a diagnostic Policy Manifest before returning a blocked or conflict exit code. It must never pass such a manifest to an adapter.

When adapter compilation encounters an unsupported mandatory policy, it must write a stack-neutral `adapter-report.json` describing all discovered gaps and then exit with code 5. It must not emit incomplete implementation artifacts as if compilation succeeded.

## Evidence and Verification Boundary

Evidence collection is adapter-specific. The core Policy Manifest must not prescribe PHP attributes, Java annotations, decorators, test frameworks, or another stack's evidence mechanism.

For the Laravel reference adapter, the MVP may use dependency-free structured comments such as:

```php
// CES-EVIDENCE: CES-AUTH-RESOURCE-OWNER
```

An adapter may alternatively support a structured evidence manifest. Other adapters may use native annotations, attributes, test metadata, comments, or manifests as appropriate. Evidence declarations must be checked against actual files and cannot be accepted solely because they were declared.

The MVP supports manifest checks, limited deterministic source and test inspection, configured test execution, prohibited-pattern checks, and explicit `human_review_required` results. It must not claim semantic proof where static inspection is insufficient.

`human_review_required` is reported but does not fail `ces verify` by default. Assurance policy may configure stricter gating. Deterministic failures, adapter gaps, blocked obligations, and policy conflicts fail verification or compilation.

## Canonical Policy and Lifecycle Example

`FILE_CONTENT_VERIFICATION` is the canonical initial policy ID. `CONTENT_VERIFICATION` must not be used as an alias in registries, manifests, adapters, verification rules, tests, documentation, or generated tasks.

The successful profile-picture example explicitly requires retry-safe deletion of the replaced image after the replacement commits. This keeps `REPLACED_RESOURCE_LIFECYCLE` resolved. Separate negative tests must cover the same requirement with that lifecycle fact omitted and prove that policy resolution writes a blocked diagnostic manifest and prevents adapter compilation.

---

# 19. First Success Criteria

The MVP is successful only when both boundaries work independently.

## Core Success Criterion

```text
One structured profile-picture requirement
+ one project assurance context
+ versioned capability, trait, and policy registries
→ one reproducible, stack-agnostic Policy Manifest
```

This must succeed without loading Laravel or any framework adapter.

## Reference Adapter Success Criterion

```text
The same Policy Manifest
+ one Laravel technical context
+ Laravel reference adapter
→ one concise, agent-neutral implementation task
→ one implementation plan
→ one test manifest
→ one verification manifest
```

## Extensibility Proof

The MVP must also prove:

```text
The same Policy Manifest
+ test-fixture adapter
→ a different implementation package
```

without modifying core schemas or policy-resolution code.

Only after the **stack-agnostic requirement-to-policy pipeline** and the **first reference-adapter integration** are deterministic and reliable should the platform add:

- PRD/PDF extraction;
- additional production framework adapters;
- semantic verification;
- centralized policy dashboards;
- advanced impact analysis;
- company-wide policy upgrades.


---

# 20. Intentionally Deferred from the MVP

The MVP should not yet attempt:

- natural-language or PDF extraction;
- LLM-driven policy resolution;
- multiple production framework adapters;
- sophisticated semantic verification;
- dashboards and policy approval systems;
- full organizational policy-upgrade automation.
- project policy overrides and approved exceptions;
- exception approval metadata, expiration, precedence, and review workflows;
- adapter component composition and compatibility solving;
- production generic-guidance fallback and adapter support levels;
- adapter marketplace, approval, and publication workflows.

These capabilities come only after:

1. the structured-requirement-to-stack-agnostic-Policy-Manifest pipeline is reliable; and
2. the adapter contract has been validated through the Laravel reference adapter and a framework-neutral test adapter.

The deferred milestone must never be described as a “structured-requirement-to-Laravel pipeline.” Laravel is only the first adapter after the stack-agnostic core boundary.

---

# 21. Five-Phase Roadmap

```text
Phase 1 — Prove the deterministic compiler and adapter boundary

Phase 2 — Integrate verification, Docker publication, and pull-request enforcement

Phase 3 — Convert PRDs and business documents into evidence-backed structured requirements

Phase 4 — Establish the production adapter ecosystem and incrementally support real stacks

Phase 5 — Add organizational governance, exceptions, upgrades, and impact analysis
```

Phase 4 does not mean manually completing every possible stack. It establishes a scalable component and composition model, generic fallback, compatibility rules, approval workflow, and incremental approved support driven by real projects.
