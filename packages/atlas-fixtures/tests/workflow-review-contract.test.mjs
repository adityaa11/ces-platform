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
  assert.match(go, /MUST NOT hand off with a known `UNRESOLVED`,\s*`IMPLEMENTED_UNPROVEN`, or `BLOCKED_AUTHORITY` row/);
  assert.match(go, /Internal readiness: READY_FOR_CK/);

  assert.match(ck, /first review MUST traverse every applicable row/i);
  assert.match(ck, /Frozen Finding Closure Matrix/);
  assert.match(ck, /record `REVIEW_CONTRACT_GAP`, not `CHANGES_REQUIRED` against CFC/);
  assert.match(ck, /Do not restart broad review/i);

  assert.match(cfc, /Finding Closure Matrix/);
  assert.match(cfc, /Complete the whole authorized closure matrix/);
  assert.match(cfc, /CFC_NOT_READY_FOR_CK/);
  assert.match(cfc, /CONTINUE_CURRENT_CFC/);

  assert.match(hmn, /consume the active Review Contract and the\s*frozen CK closure matrix/i);
  assert.match(hmn, /Already proven rows MUST be protected from reopening/);
  assert.match(hmn, /classify `REVIEW_CONTRACT_GAP` before authorization/);
  assert.match(hmn, /fresh explicit user `hmn` invocation/);
});
