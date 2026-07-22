# CLI exit and diagnostic matrix

| Exit | Scenario | Persisted diagnostic |
|---:|---|---|
| 0 | Successful validation, resolution, compilation, and default verification | `CES-010-pass/verification-report.json` |
| 2 | Invalid input/schema or missing CLI argument | stderr identifies input file and failing field; no stack trace |
| 3 | Missing lifecycle fact | `CES-009-blocked/policy-manifest.json`; no adapter artifacts |
| 4 | Conflicting file-size parameters | `CES-004-diagnostics.json` and written conflict Policy Manifest in CLI integration tests |
| 5 | Unsupported mandatory adapter mapping | `CES-009-gap/adapter-report.json`; no partial adapter artifacts |
| 6 | Missing evidence, prohibited pattern, or failed tests | `CES-010-fail/verification-report.json` |

The CLI integration suite exercises every exit code and asserts output existence or absence before accepting the result.
