# HMN Planning Record: SEMCTX-SPIKE-001 v0.3

Ticket: `SEMCTX-SPIKE-001 v0.3` (planning proposal only)
Batch: `SEMCTX-SPIKE-001`
HMN authorization ID: `HMN-SEMCTX-SPIKE-001-002`
Invocation: explicit user `HMN — SEMCTX-SPIKE-001 v0.3 Re-specification` delegation
Current workflow state: `PLANNING_READY_FOR_REVIEW`

Frozen predecessor reference: `project's goal/Backend_Phase/SEMCTX-SPIKE-001-source-dependency-oversized-batching-feasibility-charter.md` v0.2 (diagnostic evidence only)
v0.3 proposal: `project's goal/Backend_Phase/SEMCTX-SPIKE-001-v0.3-planning-proposal.md`
Current HEAD: `e3b61cc7481fd6a67d31951cfae2c768b6a6f8a5`
Relevant GO/CK/CFC commit: none
Prior HMN authorization: `HMN-SEMCTX-SPIKE-001-001`
Worktree state: inherited unrelated untracked paths are preserved; v0.2 experiment paths remain untouched.

## Diagnosis

v0.2's F3 oracle deferred F3-D despite a fitting independent request. No accepted policy made F3-D context-only; v0.2 therefore could not independently demonstrate the requested ownership, closure, and partial-coverage hypotheses. The user has stopped v0.2 correction work and explicitly directed a narrower planning re-specification.

## Ticket-authority trace

The user expressly fixes the v0.3 objective to deterministic source ownership, essential-versus-optional dependencies, resource-bounded planning, graceful deferral, and document-level coverage. The user expressly excludes F4 mock correction and reconciliation from the batching experiment, forbids implementation and all production/external changes, and requires an independent oracle-readiness review before implementation.

## Decision

`PLANNING_READY_FOR_REVIEW`.

This is a planning disposition authorized directly by the user, not CK `PASS`, GO authorization, a CFC authorization, or canonical acceptance. The proposal resolves the F3-D policy as independently eligible and defines a mechanically testable oracle strategy. No essential behavior remains undefined within the planning scope.

## Authorized scope

Planning artifacts only: the v0.3 proposal and this record. The next bounded activity is a read-only independent oracle-readiness review. It must not write fixtures, oracle, simulator, runner, or execution evidence.

## Required validation

Before any separate request for GO, the oracle-readiness review must return `ORACLE_READY` against every v0.3 promise: immutable fixture/oracle hashes; F1–F3 outcomes; F3-D independent completion; F2-V asset accounting; negative matrix; deterministic replay; and isolation. A missing binary assertion returns `ORACLE_NOT_READY`.

## Forbidden work

Do not modify the v0.2 fixture inputs, gold, simulator, runner, or execution evidence. Do not implement v0.3; modify production code, Semantic V1, databases, schemas, queues/admission, relationship authority, reconciliation, or acceptance; call providers; clear `SCHEMA_FIT_BLOCKED`; or authorize downstream work.

## Handoff

Expected next command: an independent oracle-readiness review only. GO is not authorized.
