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

test("ThemeSelector restores and persists the selected theme across public and workspace pages", async () => {
  const [selector, provider, publicHeader, profileMenu] = await Promise.all([
    readFile(new URL("../components/ThemeSelector.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/ThemeProvider.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/PublicHeader.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/ProfileMenu.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(selector, /useTheme/);
  assert.match(provider, /localStorage\.getItem\("atlas-theme"\)/);
  assert.match(provider, /localStorage\.setItem\("atlas-theme", theme\)/);
  assert.match(provider, /document\.documentElement\.dataset\.theme = theme/);
  assert.match(provider, /document\.cookie = `atlas-theme=\$\{theme\}/);
  assert.match(publicHeader, /ThemeSelector/);
  assert.match(profileMenu, /ThemeSelector/);
});
