# HMN Oracle-Materialization Record: SEMCTX-SPIKE-001 v0.3

Ticket: `SEMCTX-SPIKE-001 v0.3`
Batch: `SEMCTX-SPIKE-001`
HMN authorization ID: `HMN-SEMCTX-SPIKE-001-003`
Invocation: explicit user `HMN — SEMCTX-SPIKE-001 v0.3 Oracle Freeze` delegation
Current workflow state: `ORACLE_MATERIALIZATION_AWAITING_CK`

Frozen planning reference: `project's goal/Backend_Phase/SEMCTX-SPIKE-001-v0.3-planning-proposal.md`
Prior HMN authorization: `HMN-SEMCTX-SPIKE-001-002`
Current HEAD before checkpoint: `e3b61cc7481fd6a67d31951cfae2c768b6a6f8a5`

## Diagnosis

The accepted v0.3 proposal and `ORACLE_READY` review define a materializable F1–F3 oracle. The user authorizes the oracle bundle only and requires a committed, independently reviewed checkpoint before any future GO decision.

## Decision

`AUTHORIZE_ORACLE_MATERIALIZATION_ONLY`.

## Authorized scope

Create immutable v0.3 fixture, profile, expected-output, negative-case, canonical-serialization, assertion-matrix, and manifest artifacts under `scripts/semctx-spike-001-v0.3/`; commit them with this HMN record. The multihop F3-H → F3-I → F3-J case is within this scope.

## Required validation

Record exact canonical serialization, F3-D and F3-C+D bytes/hashes, all F1–F3 dispositions, negative-case results, and manifest hashes. CK must review the resulting committed bundle without consulting future planner output.

## Forbidden work

No planner or simulator implementation or execution; no modification to v0.2 artifacts; no production/schema/provider/DB/queue/acceptance/reconciliation work; no `SCHEMA_FIT_BLOCKED` change.

## Handoff

After the oracle-only commit, hand off directly to CK for independent review. GO remains unauthorized.
