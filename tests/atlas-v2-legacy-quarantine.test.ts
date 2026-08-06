import { access, readFile, readdir } from "node:fs/promises";
import { join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

type Ledger = {
  schema_version: "1.0.0";
  components: Array<{
    id: string;
    paths: string[];
    disposition: "rewrite" | "delete";
    owner_tickets: string[];
  }>;
  denylist_rules: Array<{
    id: string;
    needle: string;
    allowed_roots: string[];
  }>;
};

const workspace = resolve(import.meta.dirname, "..");
const ledgerPath = join(workspace, "tests", "fixtures", "atlas-v2",
  "legacy-runtime-ledger.json");
const excluded = new Set([
  "tests/atlas-v2-legacy-quarantine.test.ts",
  "tests/fixtures/atlas-v2/legacy-runtime-ledger.json",
]);
const extensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md"]);

const portable = (value: string): string => value.split(sep).join("/");
const within = (path: string, root: string): boolean => path === root
  || path.startsWith(`${root}/`);

async function filesBelow(directory: string): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if ([".git", ".next", "dist", "node_modules"].includes(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesBelow(path));
    else if ([...extensions].some((extension) => entry.name.endsWith(extension))) {
      result.push(path);
    }
  }
  return result;
}

describe("ATLAS-V2-000 legacy runtime quarantine", () => {
  it("assigns every inventoried legacy component to a v2 removal owner", async () => {
    const ledger = JSON.parse(await readFile(ledgerPath, "utf8")) as Ledger;
    expect(ledger.schema_version).toBe("1.0.0");
    expect(new Set(ledger.components.map(({ id }) => id)).size)
      .toBe(ledger.components.length);
    for (const component of ledger.components) {
      expect(component.owner_tickets.length).toBeGreaterThan(0);
      expect(component.owner_tickets.every((ticket) =>
        /^ATLAS-V2-00[1-9]$/u.test(ticket))).toBe(true);
      for (const path of component.paths) await expect(access(join(workspace, path)))
        .resolves.toBeUndefined();
    }
  });

  it("rejects legacy dependencies outside their quarantined roots", async () => {
    const ledger = JSON.parse(await readFile(ledgerPath, "utf8")) as Ledger;
    const files = (await Promise.all(["apps", "packages"].map((root) =>
      filesBelow(join(workspace, root))))).flat();
    const violations: string[] = [];
    for (const absolute of files) {
      const path = portable(relative(workspace, absolute));
      if (excluded.has(path)) continue;
      const source = await readFile(absolute, "utf8");
      for (const rule of ledger.denylist_rules) {
        if (source.includes(rule.needle)
          && !rule.allowed_roots.some((root) => within(path, root))) {
          violations.push(`${rule.id}: ${path}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
