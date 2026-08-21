import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Dialog defines modal focus entry, containment, and every required dismissal path", async () => {
  const source = await readFile(new URL("../components/Dialog.tsx", import.meta.url), "utf8");
  assert.match(source, /panelRef\.current\?\.focus\(\)/);
  assert.match(source, /returnFocusRef\.current\?\.focus\(\)/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /onPointerDown=/);
  assert.match(source, /event\.target === event\.currentTarget/);
  assert.match(source, /event\.key !== "Tab"/);
  assert.match(source, /last\.focus\(\)/);
  assert.match(source, /first\.focus\(\)/);
});
