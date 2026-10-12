# BSS-V2-004-03-05-REL-02 GO checkpoint

- **Ticket:** `BSS-V2-004-03-05-REL-02` — provisional source-packet projection
- **Authorization:** explicit user `GO BSS-V2-004-03-05-REL-02`
- **State:** `awaiting_review`
- **Implementation commit:** `78573a3a10978a8ae60c78ae69d430fe23f124d1`
- **Candidate tree SHA:** `bf9879ed87e5dd0122e2d5a39aa2e9f062945d80`
- **Base:** `80a402ebd747746aa6b66522ce4a50fe0e68fad5`
- **Frozen ticket:** `project's goal/Backend_Phase/relationship-lifecycle-successor-plan/BSS-V2-004-03-05-REL-02-provisional-source-packet-projection.md`

REL-01 is approved by its CK `PASS` at `cf3fa8a3f0f22f5ed22c4bbd5d451c34c46321d4`; the REL-02 predecessor gate is therefore satisfied. The implementation adds only the REL-02 projector, request-body composition helper, public exports, focused test, and this ticket state. It does not alter legacy packet builders, source-input Zod, prompt/schema compiler, worker/finalizer, contracts, migrations, or fixture gold. The only repository interaction is `loadForSnapshot` with the exact project/workspace/bundle/document/source-SHA slice. It adds no provider call, job, reservation, review, publication, accepted evidence, candidate identity, asset byte, or source-text path.

## Validation results

The normal `pnpm --filter @atlas/skills typecheck` could not start because the workspace virtual-store link check failed before TypeScript with `EACCES` reading the Kysely manifest. The installed package payloads were present, so the required test files were run with the repository's bundled Node/Jiti runtime and explicit virtual-store aliases; this changes no repository source or dependency state.

```text
node -e "const path=require('node:path'); const createJiti=require('./node_modules/.pnpm/jiti@2.7.0/node_modules/jiti/lib/jiti.cjs'); const p=(x)=>path.resolve(x); const aliases={zod:p('node_modules/.pnpm/zod@4.4.3/node_modules/zod/index.cjs'),'@atlas/contracts':p('packages/atlas-contracts/src/index.ts'),'ajv/dist/ajv.js':p('node_modules/.pnpm/ajv@8.20.0/node_modules/ajv/dist/ajv.js'),'fast-deep-equal':p('node_modules/.pnpm/fast-deep-equal@3.1.3/node_modules/fast-deep-equal/index.js'),'fast-uri':p('node_modules/.pnpm/fast-uri@3.1.5/node_modules/fast-uri/index.js'),'json-schema-traverse':p('node_modules/.pnpm/json-schema-traverse@1.0.0/node_modules/json-schema-traverse/index.js'),'require-from-string':p('node_modules/.pnpm/require-from-string@2.0.2/node_modules/require-from-string/index.js')}; const jiti=createJiti(process.cwd(),{alias:aliases}); jiti('./packages/atlas-skills/tests/provisional-relationship-packet.test.ts'); jiti('./packages/atlas-skills/tests/relationship-extraction-envelope.test.ts'); jiti('./packages/atlas-skills/tests/semantic-skills.test.ts');"
exit 0; 24 passed, 0 failed

git diff --check 78573a3^ 78573a3
exit 0
```

The final suite includes the frozen legacy byte/deep-equality test, `legacy prompt-003/v1 remains byte-identical and isolated before, during, and after stepwise compilation`, which passed.

## Review Contract Closure

| Row | Ticket authority / required proof | Evidence and validation | Status |
| --- | --- | --- | --- |
| `RC-REL-02-01` | First extraction accepts zero valid revisions and emits a deterministic empty extension. | `REL-02 projects an empty first extraction and sorts attributable proposed revisions deterministically` asserts the exact empty v1 extension and deterministic replay. | PROVEN |
| `RC-REL-02-02` | Exact-scope stored proposed/unresolved revisions project repeatably; foreign scope/source SHA/execution/document, absent locator/asset, malformed/tampered hash, duplicate, unsupported disposition, and stale revisions reject. | The focused positive test validates sorted exact lineage/revision/slot/role/necessity/uncertainty output and both provisional dispositions. `REL-02 rejects foreign, stale, malformed, duplicate, unsupported, and authority-bearing revisions` exercises every named rejection class. `REL-02 loads only the exact stored snapshot slice…` records the exact `loadForSnapshot` arguments. | PROVEN |
| `RC-REL-02-03` | Projection remains visibly provisional and cannot add accepted authority, canonical evidence, candidate identity, source ownership, hydrated media, or visual assertion. | Extension schema contains only the ticket-listed descriptor fields. Focused authority test rejects accepted disposition/authority field and asserts no authorization, attestation, candidate, asset reference, proposed meaning, or source-language field appears in the projection. Request composition has only `source_slots` plus `provisional_relationships`. | PROVEN |
| `RC-REL-02-04` | `buildSemanticSourcePacket()`, `buildUnhydratedMultimodalSourcePacket()`, legacy prompt and schema bytes remain unchanged. | `semantic-skills.test.ts` passes, including the frozen legacy prompt byte-isolation test and both packet-builder regressions. Commit diff contains no legacy builder, prompt/compiler/schema, or source-input change. | PROVEN |

Internal readiness: READY_FOR_CK. This is not a self-issued CK `PASS`; control returns to CK for independent verification.
