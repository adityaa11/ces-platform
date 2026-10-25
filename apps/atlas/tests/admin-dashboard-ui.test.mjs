import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("the Admin dashboard composes the authorized identity into reusable shell and welcome boundaries", async () => {
  const [page, shell, welcome] = await Promise.all([
    read("app/admin/dashboard/page.tsx"),
    read("components/admin/AdminShell.tsx"),
    read("components/admin/DashboardWelcome.tsx"),
  ]);

  assert.match(page, /<AdminShell name=\{identity\.name\}>/);
  assert.match(page, /<DashboardWelcome name=\{identity\.name\} \/>/);
  assert.match(shell, /<header className="admin-topbar">/);
  assert.match(shell, /aria-label="Admin Console navigation" className=\{`admin-sidebar\$\{drawerOpen \? " admin-sidebar-open" : ""\}`\}/);
  assert.match(shell, /<main className="admin-main">\{children\}<\/main>/);
  assert.match(shell, /aria-current="page"/);
  assert.match(shell, /href="\/admin\/dashboard"/);
  assert.match(shell, /Provider Profiles/);
  assert.match(shell, /Coming soon/);
  assert.match(shell, /aria-disabled="true"/);
  assert.match(shell, /<button className="admin-nav-item admin-nav-item-unavailable" disabled type="button">Projects<\/button>/);
  assert.match(shell, /Platform Administrator/);
  assert.match(shell, /<Avatar name=\{name\} size="small" \/>/);
  assert.match(welcome, /Welcome, \{name\}\./);
});

test("Admin presentation uses the shared theme provider and scoped semantic-token CSS", async () => {
  const [themeControls, css] = await Promise.all([
    read("components/admin/AdminThemeControls.tsx"),
    read("app/globals.css"),
  ]);
  const adminCss = css.slice(css.indexOf("/* AAD-002 establishes"));

  assert.match(themeControls, /import \{ useTheme \} from "\.\.\/ThemeProvider"/);
  assert.match(themeControls, /setTheme\("light"\)/);
  assert.match(themeControls, /setTheme\("dark"\)/);
  assert.match(adminCss, /\.admin-shell \{[^}]*grid-template-columns: 14rem minmax\(0, 1fr\)[^}]*grid-template-rows: 4rem/s);
  assert.match(adminCss, /\.admin-sidebar \{[^}]*height: calc\(100dvh - 4rem\)/s);
  assert.match(adminCss, /\.admin-main \{[^}]*max-width: 102\.5rem/s);
  assert.match(adminCss, /\.admin-welcome-card h2 \{[^}]*overflow-wrap: anywhere/s);
  assert.match(adminCss, /\.admin-theme-controls button\[aria-pressed="true"\]/);
  assert.match(adminCss, /\.admin-nav-item-active \{[^}]*border-left-color: var\(--forest\)/s);
  assert.match(adminCss, /\.admin-nav-item-unavailable:disabled/);
  assert.doesNotMatch(adminCss, /#[0-9a-f]{3,8}/i);
});
