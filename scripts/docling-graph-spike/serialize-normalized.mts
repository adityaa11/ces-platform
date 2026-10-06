import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

type Unit = { source_unit_id: string; page_number: number; locator_type: "text_block" | "table" | "visual_region"; locator_id: string; text: string };
const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("Usage: serialize-normalized.mts <normalized-document.json> <output.json>");
const normalized = JSON.parse(await readFile(resolve(input), "utf8"));
const units: Unit[] = [];
for (const page of normalized.pages ?? []) {
  for (const block of page.textBlocks ?? []) {
    if (typeof block.text === "string" && block.text.trim()) units.push({ source_unit_id: `p${page.number}:text_block:${block.id}`, page_number: page.number, locator_type: "text_block", locator_id: block.id, text: block.text });
  }
  for (const table of page.tables ?? []) {
    const text = typeof table.text === "string" ? table.text : JSON.stringify(table.data ?? table);
    if (text.trim()) units.push({ source_unit_id: `p${page.number}:table:${table.id}`, page_number: page.number, locator_type: "table", locator_id: table.id, text });
  }
  for (const region of page.visualRegions ?? []) {
    if (typeof region.text === "string" && region.text.trim()) units.push({ source_unit_id: `p${page.number}:visual_region:${region.id}`, page_number: page.number, locator_type: "visual_region", locator_id: region.id, text: region.text });
  }
}
const source = units.map((unit) => `# Page ${unit.page_number}\n\n[ATLAS_SOURCE_UNIT id=${unit.source_unit_id} locator_id=${unit.locator_id} type=${unit.locator_type}]\n${unit.text}\n`).join("\n");
const result = { artifactId: normalized.artifactId, source_unit_count: units.length, source_sha256: createHash("sha256").update(source).digest("hex"), source, units };
await mkdir(dirname(resolve(output)), { recursive: true });
await writeFile(resolve(output), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ source_unit_count: units.length, source_sha256: result.source_sha256 }));
