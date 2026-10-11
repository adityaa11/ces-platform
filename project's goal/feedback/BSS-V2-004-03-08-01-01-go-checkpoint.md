# BSS-V2-004-03-08-01-01 GO checkpoint — legacy baseline and contract-impact ledger

- **Ticket:** `BSS-V2-004-03-08-01-01` — Legacy baseline and contract-impact ledger
- **Ticket authority:** `project's goal/Backend_Phase/tickets/Stack_Setup_V2/BSS-V2-004-03-08-01-01-legacy-baseline-and-contract-impact-ledger.md`
- **State:** `awaiting_review`
- **Scope owner:** baseline evidence only; no runtime or production-contract owner changed
- **Parent baseline SHA:** `d2bc98d348eb02735002d2c6c72a39dcfbd3f18b`
- **Review target:** the checkpoint-introducing commit (the current `HEAD` when CK is invoked); this is distinct from the parent baseline SHA above.
- **Branch:** `codex/new-atlas-backend`
- **Runtime:** Node `v24.19.0`; pnpm `11.19.0`
- **Predecessor CK PASS records:** `BSS-V2-BATCH-04.03-01-472fd2c-supplemental-verification.md`, `BSS-V2-BATCH-04.03-02-18bd83e-verification.md`, and `BSS-V2-BATCH-04.03-03-66a9c0f-verification.md`
- **Permitted changed paths:** this checkpoint only. No runtime, gold, schema, prompt, provider configuration, or historical CK artifact was changed.

## Immutable parent-HEAD manifest

All hashes below are SHA-256 of the named file or rendered in-memory artifact at the parent SHA. They are comparison values, not refreshed gold.

| Contract/fixture | Owner and behavior captured | SHA-256 |
| --- | --- | --- |
| Canonical Semantic V1 | `packages/atlas-contracts/src/semantic-v1.ts`; canonical Zod, parser, generated-schema authority | `b481d1f6b2b178fdb572e7a8a7e565814456489183fbcc7a9f2560da5c9bf825` |
| Legacy prompt compiler | `packages/atlas-skills/src/semantic-prompt.ts`; profile `atlas.semantic.extract.prompt-003/v1`, canonical authority id `472fd2ca2c002db2b47bdf16dc085a4f43629f20` | `be9817c4aa9c09d7748847abd621bb14cb0c8d2425f79b56d90a84cd30fac902` |
| Text-only source packet | `packages/atlas-skills/src/semantic-source-packet.ts`; deterministic page/type/id order and temporary slots | `0b0fbf9f65f108c477f72980fb06c46e66c1a3611be05d6cd57198c0bcd8305d` |
| Provider-neutral capability boundary | `apps/agents-bridge/src/provider-capabilities.ts`; neutral bounded messages/structured boundary | `954777a7371078d259d0c223063a38f6255bf59081c357b386d07b2e665691df` |
| Semantic V1 regression fixture/test | `packages/atlas-contracts/tests/semantic.test.ts` | `0821fbb8d4d906dcc49cd748fe2d8fc9fcffdd20616dcd110ea5ac02671f1052` |
| Prompt/source-packet fixture and focused tests | `packages/atlas-skills/tests/semantic-skills.test.ts` | `5ebf308c7a32cc646f548b5bcc22397dc0a50162a3b17fb0c7716fe2c5850800` |
| Provider-boundary focused test | `apps/agents-bridge/tests/provider-capabilities-boundary.test.ts` | `44f36bb43be0b37c7a153f5c8a71ceced8290ea5b7bef92f01b0d5d6a730b8be` |

`compileExtractionPrompt()` at the parent SHA rendered `22,440` UTF-8 bytes. Its provenance is bound by `promptSha256` `a79ac1174807a635f6a8820ea6cc8073457fba7534a61b55014cde76fa287458`, `providerSchemaSha256` `20e53795dcf9edddf998dc7b621a1230a7abb33c6d370bfefd62e0e4a1ee62f3`, frozen cross-field-policy SHA `2f2e13a0cce0d0ad578718bb52e69d69abfbd9bb0d6dfb593ab6b010d930cb10`, and complete artifact SHA `07d9e5eae40590b3898c673044ef02e6128e14a83341e97cf4ed8304b706a7ed`.

### Ordered prompt sections

The current `prompt-003/v1` compiler emitted these sections in order. Each value is the rendered-section SHA-256, so CK can reproduce the baseline without storing source content in this record.

| # | Section | Owner | SHA-256 |
| ---: | --- | --- | --- |
| 1 | `PROVIDER PROPOSAL` | ZOD | `d82dc37f623eb1783f47f0a54aa05ba682087c4d424c74c4b74a5d1d5ab9fd78` |
| 2 | `SYSTEM ROLE` | STATIC_POLICY | `31ad149eb94270f2fe55ede50aa7a4dcd9f7fa98c28f21bb4ecf149d9d4214dc` |
| 3 | `TASK INSTRUCTION` | STATIC_POLICY | `4304f57691f06545d14c8d87bede9dfcb291b0941209b682f0e655e551e70913` |
| 4 | `OUTPUT SHAPE` | ZOD | `20e53795dcf9edddf998dc7b621a1230a7abb33c6d370bfefd62e0e4a1ee62f3` |
| 5 | `SOURCE RESULT AND ACCOUNTING FIELDS` | ZOD | `238749657aec57fc8ef4c237da7ac6899852a1200559c93ea85f77569d1a3eb1` |
| 6 | `CANDIDATE FIELDS` | ZOD | `4232d0fc52e0f670bda7a097e60691c48b218b63fecb6b7166db9c5375605537` |
| 7 | `CANDIDATE KIND MEANINGS` | ZOD | `480f6892fd9c0b35668d63483d9676b40f009c04d885374c3ab4d1f2e9bdbbb4` |
| 8 | `CLARIFICATION QUESTIONS` | ZOD | `297f60836a4924dedc987e1857ad258154158c0f2a44244d61ba1ceef3b24379` |
| 9 | `CROSS-FIELD SEMANTIC COMPOSITION` | STATIC_POLICY | `2f2e13a0cce0d0ad578718bb52e69d69abfbd9bb0d6dfb593ab6b010d930cb10` |
| 10 | `SOURCE CLASSIFICATION` | ZOD | `009e1a5a242abd962bea948ba837fcd4b05f70ba9a24db85787dfd69cd80e824` |
| 11 | `REFERENCE HANDLING` | STATIC_POLICY | `b0db83af04bc65c72a572e94d451fe8858e3490cda3ebb470240c963af6bbe96` |
| 12 | `MULTIPLE-CANDIDATE HANDLING` | STATIC_POLICY | `99c4d0326e645d358c72c1abbba5f82b6ed0022dc57b36498a66e84afddc6796` |
| 13 | `CONFLICT HANDLING` | STATIC_POLICY | `0d71b981bc52e9cf7331d02e406ba2496e90dbd234a21276ae1cb80690564fb9` |
| 14 | `SOURCE ACCOUNTING` | STATIC_POLICY | `dbb42b35c4360acb6016e280f43e16c44f46029aa6d994b7367aa504227e7be2` |
| 15 | `OUTPUT RULES` | STATIC_POLICY | `cf03bdf688ef6259b7946b0931aa8ee59f3a6e5fd619d7afa0c7f1510b6bfe41` |

## Legacy behavior and negative baseline

The existing focused fixture proves that source packets order pages numerically, then text blocks, tables, and visual regions by id; produce `slot-000001`-style packet-local slots; preserve eligible source text exactly; and reject empty text and unlabeled/whitespace-only visual regions. It separately rejects duplicate locators, more than `10,000` source units, and a user prompt above `1,000,000` UTF-8 bytes. Its static boundary assertion rejects provider SDKs, classification, finalization, persistence, `DocumentStore`, and fetch from the packet builder.

The prompt/compiler fixture proves two identical builds are byte-identical; Zod-owned sections have source provenance; the frozen static policy byte hash above is preserved; portable proposal-schema validation is weaker than the authoritative local Zod cross-field validation; and the compiler has no provider input, `DocumentStore`, or spike import. The bridge capability fixture proves generic execution paths use neutral capabilities rather than concrete provider classes. The semantic-worker fixture uses deterministic test doubles and proves replay after staging does not initiate a second provider call.

## Proposed changed-file → contract → regression ledger

| Approved owner/boundary | Future mutable path(s) that may affect it | Required differential/regression before a shared edit | This leaf disposition |
| --- | --- | --- | --- |
| `BSS-V2-004-03-01` canonical Semantic V1 | `packages/atlas-contracts/src/semantic-v1.ts` and derived exports | contracts typecheck + 10 Semantic V1 tests; regenerate the manifest hashes and compare canonical/projection identity | immutable baseline only |
| `BSS-V2-004-03-02` prompt/schema compiler | `packages/atlas-skills/src/semantic-prompt.ts` | skills typecheck + 9 focused prompt/source-packet tests; compare prompt, schema, policy, section and artifact hashes | immutable baseline only |
| `BSS-V2-004-03-03` text-only source packet | `packages/atlas-skills/src/semantic-source-packet.ts` | skills typecheck + complete source packet positives and duplicate/overflow/byte negatives | immutable baseline only |
| Existing neutral provider boundary | `apps/agents-bridge/src/provider-capabilities.ts` and concrete adapters only in their owning tickets | bridge typecheck plus capability-boundary and semantic-worker regression tests; retain no concrete-provider coupling | immutable baseline only |

## Validation evidence

All commands ran locally at the parent SHA with repository test doubles; no command invoked a live provider, read images, enqueued a semantic/perception job, or reserved admission capacity.

| Exact command | Outcome |
| --- | --- |
| `corepack pnpm --filter @atlas/contracts typecheck` | PASS |
| `corepack pnpm --filter @atlas/contracts test` | PASS: 14 tests (2 execution, 2 perception, 10 semantic) |
| `corepack pnpm --filter @atlas/skills typecheck` | PASS |
| `corepack pnpm --filter @atlas/skills test` | PASS: 9 focused prompt/source-packet tests |
| `corepack pnpm --filter @atlas/agents-bridge typecheck` | PASS |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/provider-capabilities-boundary.test.ts` | PASS: 2 tests |
| `corepack pnpm --filter @atlas/agents-bridge exec jiti tests/semantic-worker.test.ts` | PASS: 5 tests |

No pre-existing test failure was observed in this baseline command set. `external_provider_attempt_count: 0`; `semantic_job_count: 0`; `unintended_perception_job_count: 0`; `admission_reservation_count: 0`.

## Review Contract Closure

| Row | Ticket authority and required proof | Evidence/test locator and exact outcome | Status |
| --- | --- | --- | --- |
| `RC-01` | Untouched parent SHA must capture canonical/proposal schema, `prompt-003/v1` bytes/sections/hashes, default APIs, source-slot ordering/failures, commands and versions. | Parent SHA/runtime, file and rendered-artifact hashes, ordered section table, source-packet behavior, and commands are recorded above. Contracts 10-semantic, skills 9, and bridge boundary/worker 7 focused tests passed. | `PROVEN` |
| `RC-02` | Record approved-contract owners and proposed changed-file → contract → regression matrix; distinguish pre-existing failures without refreshing snapshots. | Four-owner impact ledger above; all focused baseline commands passed and no baseline failure was observed. No snapshots changed. | `PROVEN` |
| `RC-03` | Manifest is checkable from the same SHA, reproducible offline, and has zero provider calls/image reads/jobs/runtime changes. | SHA-bound manifest plus deterministic commands; source-boundary/worker tests and bounded diff establish the offline conditions. This checkpoint is the only scoped mutation. | `PROVEN` |

**Known blocks:** none. **CK finding IDs:** not applicable. **Next allowed action:** independent CK of this checkpoint only; no successor GO is implied.

Internal readiness: READY_FOR_CK
