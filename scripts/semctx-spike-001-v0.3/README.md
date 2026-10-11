# SEMCTX-SPIKE-001 v0.3 offline simulator

This is an isolated, deterministic Node.js simulator for structural batching and honest partial coverage. It is not production code and does not import Atlas runtime packages or perform provider, image, database, queue, job, admission, acceptance, reconciliation, or publication operations.

Run from the repository root:

```powershell
node scripts/semctx-spike-001-v0.3/run.mjs
```

The runner verifies every frozen raw/canonical manifest hash and the manifest self-hash before dynamically importing the planner. It then compares the planner's complete canonical F1–F3 outputs to the frozen expected-output bundle, executes A-01 through A-10 and N-01 through N-09, and checks ten deterministic replays plus source-order perturbation. The fixtures and all `gold/` files are read-only oracle material.

`planner.mjs` is a pure function module. Its `processing_ledger` records per-source transitions separately from the frozen terminal outcome; only `completed` sources contribute to coverage. All assertions remain untrusted provisional records, with `accepted=false` and `semantic_ready=false`.
