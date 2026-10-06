# BSS-V2-004-03-02 CFC progress

- **Ticket:** BSS-V2-004-03-02
- **Frozen CK artifact:** `BSS-V2-BATCH-04.03-02-d78e05a-review.md`
- **Latest CK verification:** `BSS-V2-BATCH-04.03-02-f23b5ea-verification.md` (`CHANGES_REQUIRED`)
- **Active HMN authorization:** `HMN-BSSV2-004-03-02-002`
- **Scope:** `CK-001.a`, `CK-001.b` only

| Clause | Current status | Existing evidence gap | Planned evidence location |
| --- | --- | --- | --- |
| `CK-001.a` | UNRESOLVED | The qualified artifact's actual ordered headings and the `GENERAL RULES` authority mapping are not directly asserted. | `packages/atlas-skills/tests/semantic-skills.test.ts` |
| `CK-001.b` | UNRESOLVED | Provenance paths and hashes are shape-checked but not resolved against the supplied schema or matched to emitted text. | `packages/atlas-skills/tests/semantic-skills.test.ts` |

`CK-002.a`, `CK-002.b`, and `CK-002.c` remain resolved and are regression-only boundaries. The production compiler, canonical schemas, and qualified artifact are not remediation targets.
