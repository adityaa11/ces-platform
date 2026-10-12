# PERC-RESET batch CK review — 715217b

- **Ticket:** `PERC-RESET-006` — Professional Safara PDF multimodal perception E2E
- **Batch:** `PERC-RESET`
- **Review type:** first independent CK review
- **Reviewed target:** commit `715217b7e6cd5d2330d5783a3992150fce157bca` (`chore: record PERC-RESET-006 GO evidence`)
- **Ticket / GO checkpoint:** frozen PERC-RESET-006 ticket and `PERC-RESET-006-go-ready-for-ck.md`; ticket state `awaiting_review`
- **Result:** `PASS`

## Review basis and target preconditions

The frozen ticket requires real Project A execution through the pinned RUN-003
perception route, truthful source/page/table/visual inventory, durable
Atlas-owned derived assets with exact manifest bindings and readback, terminal
`perceived` state with empty Master and zero semantic activity, honest reporting
of visual-meaning limits, and focused negative regression proof.

The reviewed commit contains the GO checkpoint and records the ticket state as
`awaiting_review`. The worktree has unrelated semantic-relationship edits and
untracked future-ticket/workflow material; none changes the reviewed GO
artifact or the PERC-RESET-006 Project A evidence, so the committed review
target remains unambiguous. Those changes were excluded from this review.

## Review Contract

| Row | Ticket authority | Required proof | Evidence / validation | Status |
| --- | --- | --- | --- | --- |
| RC-PERC-RESET-006-01 | Real execution proof 1 | One authorized grant and one intended RUN-003 execution with image capture, table structure, no OCR, and normalized v1 | Project A state query; execution `39cc9cad-9d74-4cfa-8eb6-9c435d03022e`; capability `docling-digital-pdf:atlas-digital-pdf-run-003-capture-v1`; normalized cache | PROVEN |
| RC-PERC-RESET-006-02 | Real execution proof 2 | Truthful source and normalized page/locator/table inventory with row/column/header/span structure | Source hash/header check; normalized query returned 12 pages, 254 text blocks, 4 tables on pages 1/4/6/9, and 5 visual regions on pages 3/5/7/8/10; grid query confirmed the four table dimensions and all spans `1x1` | PROVEN |
| RC-PERC-RESET-006-03 | Real execution proof 3 | Every captured visual has a trusted derived asset and exact manifest/readback binding; no stored media binary | Restart readback passed for all five manifests; accepted DB query returned 5 PNG manifests with the recorded profile/source bindings; normalized cache contained no `base64` or `data:image` marker | PROVEN |
| RC-PERC-RESET-006-04 | Real execution proof 4 | Completed execution, perceived member, fresh RUN-003 identity, empty Master, and zero semantic activity | Project A query returned one source grant, one completed perception execution, member `perceived`, zero semantic executions/candidates/evidence, and empty Master; pg-boss contained only the completed perception job | PROVEN |
| RC-PERC-RESET-006-05 | Real execution proof 5; binary oracle | Coverage is truthful and makes no diagram-understanding or fabricated visual-result claim | GO record limits the claim to structural figure evidence; source inventory and five matching visual locators were independently confirmed | PROVEN |
| RC-PERC-RESET-006-06 | Negative regression | Forged, foreign, missing, corrupt, or misbound evidence cannot create an accepted dangling asset or mutate Project A | Worker suite passed 12/12; exact `@atlas/db test:derived-assets` passed 1/1 after removing only stale synthetic `derived-*` fixture rows; final synthetic-fixture counts were zero and Project A state remained unchanged | PROVEN |

## Validation and evidence performed

- `docker exec atlas-canonical-perception-atlas-1 node apps/atlas/scripts/derived-asset-cfc-qualification.mjs restart-readback safara-professional-perception` — passed; all five owner-authorized readbacks matched manifest byte sizes and SHA-256 values; member remained `perceived`.
- `pnpm --filter @atlas/agents-bridge exec jiti tests/document-perception-worker.test.ts` — passed 12/12.
- `docker exec atlas-canonical-perception-atlas-1 sh -lc 'pnpm --filter @atlas/db test:derived-assets'` — passed 1/1 on the clean synthetic-fixture rerun.
- `docs/example/Safara_Buyer_Business_PRD_Professional.pdf` — 314,167 bytes, `%PDF-` header, SHA-256 `2f537e8bb7ea4f69fb906af03d0265e2a986a0f15c2dbedbbace5328cd40e7df`.
- Final live-state checks found one Project A grant, one completed perception execution, five accepted manifests, zero semantic executions/candidates/evidence, zero non-perception pg-boss jobs, empty Master, and no persisted binary-media marker.

The first local rerun of the derived-assets command encountered pre-existing
synthetic fixture residue: an invalidated cache row with the test's fixed
source hash. That residue was diagnosed, removed only for the explicitly
identified `derived-*` fixtures, and the exact named validation then passed.
The final check confirmed no synthetic fixture rows remained.

## Findings

No ticket-bound implementation or evidence deficiency was identified. No CK
finding or remediation cycle is required.

## Frozen Finding Closure Matrix

No blocking findings were created; therefore there are no closure clauses to
freeze. The six Review Contract rows above are all `PROVEN`.

## Scope-change observations

None. The review does not require source edits, semantic execution,
semantic-provider invocation, Master publication, deployment/provider changes,
or successor-ticket work.

## Decision

`PASS`. PERC-RESET-006 satisfies its frozen ticket contract at the reviewed
commit. This result applies only to PERC-RESET-006 and does not authorize
automatic execution of PERC-RESET-007.
