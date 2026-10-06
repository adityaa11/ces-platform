import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("Usage: serialize-fixture.mts <fixture.json> <output.json>");
const fixture = JSON.parse(await readFile(resolve(input), "utf8"));
const units = fixture.source_units.map((item: { id: string; text: string }) => {
  const [, page, locatorType] = item.id.split(":");
  return { source_unit_id: item.id, page_number: Number(page.slice(1)), locator_type: locatorType === "table" ? "table" : "text_block", locator_id: item.id.replace(/:/g, "-"), text: item.text };
});
const source = units.map((unit: any) => `[ATLAS_SOURCE_UNIT id=${unit.source_unit_id} locator_id=${unit.locator_id} type=${unit.locator_type}]\n${unit.text}`).join("\n\n");
const result = { artifactId: "controlled-extraction", source_unit_count: units.length, source_sha256: createHash("sha256").update(source).digest("hex"), source, units };
await mkdir(dirname(resolve(output)), { recursive: true });
await writeFile(resolve(output), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ source_unit_count: units.length, source_sha256: result.source_sha256 }));
