# CES-008 — Phase 1: Build the Laravel Reference Adapter

**Phase:** 1 — Deterministic Core and Reference Adapter
**Parent:** [CES-000](CES-000-parent-mvp.md)
**Status:** Done

## Goal

Translate the initial stack-agnostic policies into Laravel-oriented guidance without influencing core resolution.

## Work

- Map input validation to Form Requests.
- Map resource authorization to Laravel Policies and target-resource authorization.
- Map atomic replacement to a database transaction.
- Map server-generated storage keys to Laravel Storage using trusted paths.
- Map replaced-resource lifecycle to retry-safe queued cleanup after commit.
- Map test guidance to PHPUnit feature and integration tests.
- Add deterministic source/test checks and dependency-free `CES-EVIDENCE` comment support.
- Report unsupported mandatory mappings as adapter gaps.

## Acceptance criteria

- [x] The adapter consumes the same manifest used by the fixture adapter.
- [x] Every initial mandatory policy has an explicit mapping or explicit gap.
- [x] Laravel terminology exists only in adapter-derived outputs and adapter source.
- [x] Removing the adapter does not break core build or tests.
- [x] Adapter tests cover mapping provenance, evidence rules, prohibited patterns, and gaps.

## Required evidence

- [x] Attach the Laravel mapping registry with source-policy and mapping-version provenance.
- [x] Attach the Laravel implementation package generated from the shared Policy Manifest.
- [x] Attach passing mapping, evidence-marker, prohibited-pattern, and adapter-gap tests.
- [x] Attach dependency-boundary output proving Laravel is not imported by core packages.
- [x] Demonstrate removal or exclusion of the Laravel workspace without breaking core tests.

Evidence: [CES-008 verification record](../../evidence/phase-1/CES-008.md)

