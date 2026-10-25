import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("the compact Admin menu owns open state, every dismissal path, focus restoration, and body-lock cleanup", async () => {
  const shell = await read("components/admin/AdminShell.tsx");

  assert.match(shell, /^"use client";/);
  assert.match(shell, /useState\(false\)/);
  assert.match(shell, /window\.matchMedia\("\(max-width: 820px\)"\)/);
  assert.match(shell, /aria-controls="admin-sidebar" aria-expanded=\{compact && drawerOpen\}/);
  assert.match(shell, /onClick=\{\(\) => drawerOpen \? closeDrawer\(false\) : setDrawerOpen\(true\)\}/);
  assert.match(shell, /className="admin-drawer-backdrop" onClick=\{\(\) => closeDrawer\(\)\}/);
  assert.match(shell, /event\.key === "Escape"\) closeDrawer\(\)/);
  assert.match(shell, /href="\/admin\/dashboard" onClick=\{\(\) => \{ if \(compact\) closeDrawer\(\); \}\}/);
  assert.match(shell, /document\.body\.classList\.add\("admin-navigation-locked"\)/);
  assert.match(shell, /document\.body\.classList\.remove\("admin-navigation-locked"\)/);
  assert.match(shell, /menuRef\.current\?\.focus\(\{ preventScroll: true \}\)/);
  assert.match(shell, /dashboardLinkRef\.current\?\.focus\(\)/);
  assert.match(shell, /const trapFocus = \(event: KeyboardEvent\)/);
});

test("compact drawer CSS replaces the desktop rail at 820px without adding a parallel theme system", async () => {
  const css = await read("app/globals.css");
  const adminCss = css.slice(css.indexOf("/* AAD-002 establishes"));

  assert.match(adminCss, /@media \(max-width: 820px\)/);
  assert.match(adminCss, /\.admin-sidebar \{[^}]*position: fixed[^}]*transform: translateX\(-105%\)[^}]*visibility: hidden[^}]*width: min\(17\.5rem, calc\(100vw - 3\.375rem\)\)/s);
  assert.match(adminCss, /\.admin-sidebar-open \{[^}]*transform: translateX\(0\)[^}]*visibility: visible/s);
  assert.match(adminCss, /\.admin-drawer-backdrop \{[^}]*background: color-mix\(in srgb, var\(--ink\) 48%, transparent\)/s);
  assert.match(adminCss, /body\.admin-navigation-locked \{ overflow: hidden; \}/);
  assert.match(adminCss, /@media \(prefers-reduced-motion: reduce\) \{ \.admin-sidebar, \.admin-sidebar-open \{ transition: none; \} \}/);
  assert.doesNotMatch(adminCss, /localStorage|atlas-theme|#[0-9a-f]{3,8}/i);
});
