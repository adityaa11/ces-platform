import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const skillsRoot = path.resolve(import.meta.dirname, "../../../.agents/skills");
const readSkill = (name) => readFile(path.join(skillsRoot, name, "SKILL.md"), "utf8");
const protocol = await readFile(path.join(skillsRoot, "_shared", "atlas-ticket-review-contract.md"), "utf8");
const [go, ck, cfc, hmn] = await Promise.all(["go", "ck", "cfc", "hmn"].map(readSkill));

test("GO, CK, CFC, and HMN use one canonical Review Contract protocol", () => {
  assert.match(protocol, /## 1\. Resolve the active ticket/);
  assert.match(protocol, /## 2\. Derive the Review Contract/);
  assert.match(protocol, /IMPLEMENTED_UNPROVEN/);
  assert.match(protocol, /READY_FOR_CK/);
  assert.match(protocol, /REVIEW_CONTRACT_GAP/);
  assert.match(protocol, /CONTINUE_CURRENT_CFC/);
  assert.match(protocol, /Frozen Finding Closure Matrix/);
  assert.match(protocol, /generic best practice/i);

  for (const skill of [go, ck, cfc, hmn]) {
    assert.match(skill, /Shared interpretation rule/);
    assert.match(skill, /shared Atlas Review Contract/);
    assert.match(skill, /MUST NOT substitute (?:its own )?broader or narrower interpretation/);
  }
});

test("workflow skills enforce the review-contract handoff boundaries", () => {
  assert.match(go, /shadow-CK readiness check/i);
  assert.match(go, /MUST NOT hand off with a known `UNRESOLVED`,\s*`IMPLEMENTED_UNPROVEN`,\s*`BLOCKED_AUTHORITY`, or `BLOCKED_ENVIRONMENT` row/);
  assert.match(go, /Internal readiness:\s*READY_FOR_CK/);

  assert.match(ck, /first review MUST traverse every applicable row/i);
  assert.match(ck, /Frozen Finding Closure Matrix/);
  assert.match(ck, /record `REVIEW_CONTRACT_GAP`, not `CHANGES_REQUIRED` against CFC/);
  assert.match(ck, /Do not restart broad review/i);

  assert.match(cfc, /frozen CK closure matrix/i);
  assert.match(cfc, /Complete the whole authorized closure matrix/);
  assert.match(cfc, /CFC_NOT_READY_FOR_CK/);
  assert.match(cfc, /CONTINUE_CURRENT_CFC/);

  assert.match(hmn, /consume the active Review Contract and the\s*frozen CK closure matrix/i);
  assert.match(hmn, /Already proven rows MUST be protected from reopening/);
  assert.match(hmn, /classify `REVIEW_CONTRACT_GAP` before authorization/);
  assert.match(hmn, /fresh explicit user `hmn` invocation/);
});

test("the bounded pre-CFC authority-conflict route cannot bypass replacement review", () => {
  assert.match(protocol, /Route A — post-CFC conflict \(existing route\)/);
  assert.match(protocol, /Route B — pre-CFC non-remediable authority conflict/);
  assert.match(protocol, /`CFC_NOT_READY_FOR_CK`, with no\s+remediation commit and no CK handoff/);
  assert.match(protocol, /environment unavailability alone, or CFC failure alone never\s+establishes eligibility/);
  assert.match(protocol, /CK independently validates every preceding fact and the amendment before\s+freezing any replacement clause/);
  assert.match(protocol, /does not create a lifecycle state, approve implementation, or weaken the\s+independent CK replacement-freeze review/);

  assert.match(ck, /Route B is the\s+bounded pre-CFC non-remediable authority-conflict route/);
  assert.match(ck, /does not authorize CFC/);
  assert.match(cfc, /Route B's prior `CFC_NOT_READY_FOR_CK` record\s+does not itself authorize CFC/);
  assert.match(hmn, /`HUMAN_DECISION_REQUIRED`; HMN must not\s+authorize CFC for that original clause/);
  assert.match(hmn, /fresh explicit user `hmn` invocation after that replacement freeze/);
});

test("replacement routes preserve historical clauses and reject unsafe substitutions", () => {
  assert.match(protocol, /never reuse or renumber\s+historical clause IDs/i);
  assert.match(protocol, /missing fresh HMN authorization rejects this path/);
  assert.match(protocol, /An incomplete but achievable\s+original oracle remains binding/);
  assert.match(ck, /Unrelated obligations must remain binding/);
  assert.match(cfc, /Do not reuse historical clause IDs/);
  assert.match(hmn, /The historical clause ID is not an authorization target/);
});
