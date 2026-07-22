# CES-011 — Prove Boundaries, Determinism, and Failure Contracts

## Goal

Turn the architectural promises into automated checks that fail the build when violated.

## Work

- Add dependency-boundary tests for core, SDK, adapters, and CLI orchestration.
- Detect forbidden declared dependencies, undeclared imports, cycles, and core-to-adapter imports.
- Scan core contracts and artifacts for framework-specific terminology.
- Run compilation twice in separate directories and compare deterministic files byte-for-byte.
- Test normalized YAML/JSON equivalence, stable hashing, LF, UTF-8, and absence of timestamps and machine paths.
- Test every CLI exit code and diagnostic-output contract.
- Prove the same Policy Manifest is consumed unchanged by both adapters.

## Acceptance criteria

- [ ] An intentional forbidden dependency makes the architecture test fail.
- [ ] Removing Laravel leaves core tests green.
- [ ] Determinism tests compare every deterministic JSON and Markdown artifact.
- [ ] Registry content changes alter content-derived IDs even without a version change.
- [ ] Blocked, conflict, adapter-gap, and verification failures produce the specified diagnostics and exit codes.

## Required evidence

- [ ] Attach the full architecture-test report, including an intentional forbidden-dependency fixture.
- [ ] Attach before/after output showing core tests pass with Laravel excluded.
- [ ] Attach byte hashes and comparison output for two complete compilation directories.
- [ ] Attach a registry-content mutation test showing the compilation ID changes.
- [ ] Attach the CLI exit-code test matrix and paths to every diagnostic artifact.

