import { FIXED_SECTIONS } from "./prompt-fixed-sections.mts";
import { createProviderSchema } from "./provider-schema.mts";
import { z } from "zod";
import { atlasSemanticKindV1Schema } from "./atlas-semantic-v1-zod-reference.ts";

type Schema = Record<string, any>;

function asSchema(value: unknown, message: string): Schema {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(message);
  return value as Schema;
}

export function resolveLocalRef(schema: Schema, root: Schema, trail: string[] = []): Schema {
  const ref = schema.$ref;
  if (typeof ref !== "string") return schema;
  if (!ref.startsWith("#/")) throw new Error(`Unsupported JSON Schema reference: ${ref}`);
  if (trail.includes(ref)) throw new Error(`Cyclic JSON Schema reference: ${[...trail, ref].join(" -> ")}`);
  let current: unknown = root;
  for (const rawSegment of ref.slice(2).split("/")) {
    const segment = rawSegment.replaceAll("~1", "/").replaceAll("~0", "~");
    if (!current || typeof current !== "object" || !(segment in current)) throw new Error(`Broken local JSON Schema reference: ${ref}`);
    current = (current as Record<string, unknown>)[segment];
  }
  if (!current || typeof current !== "object" || Array.isArray(current)) throw new Error(`Invalid local JSON Schema reference: ${ref}`);
  return resolveLocalRef(current as Schema, root, [...trail, ref]);
}

function properties(schema: Schema, root: Schema, label: string): Record<string, Schema> {
  const resolved = resolveLocalRef(schema, root);
  if (resolved.type !== "object" || !resolved.properties || typeof resolved.properties !== "object") {
    throw new Error(`Unsupported JSON Schema form at ${label}: expected object properties`);
  }
  return resolved.properties as Record<string, Schema>;
}

function described(schema: Schema, root: Schema, label: string): { schema: Schema; description: string } {
  const resolved = resolveLocalRef(schema, root);
  if (typeof resolved.description !== "string" || !resolved.description.trim()) {
    throw new Error(`Missing JSON Schema description at ${label}`);
  }
  return { schema: resolved, description: resolved.description };
}

function typeLabel(schema: Schema): string {
  if (Array.isArray(schema.anyOf)) return schema.anyOf.map(typeLabel).join(" | ");
  if (Array.isArray(schema.oneOf)) return schema.oneOf.map(typeLabel).join(" | ");
  if (Array.isArray(schema.enum)) return schema.enum.join(" | ");
  if (typeof schema.const === "string") return JSON.stringify(schema.const);
  if (schema.type === "array") return "array";
  if (schema.type === "object") return "object";
  if (["string", "number", "integer", "boolean", "null"].includes(schema.type)) return schema.type;
  throw new Error(`Unsupported JSON Schema form: ${JSON.stringify(schema)}`);
}

function renderShape(schema: Schema, root: Schema, path: string): string[] {
  const { schema: resolved, description } = described(schema, root, path);
  const lines = [`${path} (${typeLabel(resolved)}) — ${description}`];
  if (resolved.type === "array") {
    const item = asSchema(resolved.items, `Missing array item schema at ${path}`);
    const itemResolved = resolveLocalRef(item, root);
    if (itemResolved.type === "object") {
      lines.push(`${path}[] (${typeLabel(itemResolved)}) — ${described(item, root, `${path}[]`).description}`);
      lines.push(...renderProperties(itemResolved, root, `${path}[]`));
    }
    else described(item, root, `${path}[]`);
  } else if (resolved.type === "object" && resolved.properties) {
    lines.push(...renderProperties(resolved, root, path));
  }
  return lines;
}

function renderProperties(schema: Schema, root: Schema, parentPath: string): string[] {
  const props = properties(schema, root, parentPath);
  return Object.keys(props).sort().flatMap((key) => {
    const child = props[key];
    const path = `${parentPath}.${key}`;
    const { schema: resolved, description } = described(child, root, path);
    const lines = [`${path} (${typeLabel(resolved)}) — ${description}`];
    // Render candidate objects and their fields; payload is intentionally kept
    // at its declared object boundary to avoid expanding its recursive JSON value.
    if (resolved.type === "array") {
      const item = asSchema(resolved.items, `Missing array item schema at ${path}`);
      const itemResolved = resolveLocalRef(item, root);
      const itemDescription = described(item, root, `${path}[]`).description;
      lines.push(`${path}[] (${typeLabel(itemResolved)}) — ${itemDescription}`);
      if (itemResolved.type === "object" && itemResolved.properties) lines.push(...renderProperties(itemResolved, root, `${path}[]`));
    } else if (resolved.type === "object" && resolved.properties) {
      lines.push(...renderProperties(resolved, root, path));
    } else if (Array.isArray(resolved.anyOf)) {
      for (const [index, branch] of resolved.anyOf.entries()) {
        const branchResolved = resolveLocalRef(asSchema(branch, `Invalid alternative at ${path}`), root);
        if (typeof branchResolved.description === "string" && branchResolved.const !== undefined) {
          lines.push(`${path} value ${index + 1} (${JSON.stringify(branchResolved.const)}) — ${branchResolved.description}`);
        }
      }
    }
    return lines;
  });
}

function provenanceSources(schema: Schema, root: Schema, path: string, seen = new Set<string>(), deep = true): { sourceSchemaProperty: string; sourceDescription: string }[] {
  const ref = schema.$ref;
  if (typeof ref === "string" && seen.has(ref)) return [];
  const nextSeen = new Set(seen);
  if (typeof ref === "string") nextSeen.add(ref);
  const resolved = resolveLocalRef(schema, root);
  const entries: { sourceSchemaProperty: string; sourceDescription: string }[] = [];
  if (typeof resolved.description === "string" && resolved.description.trim()) {
    entries.push({ sourceSchemaProperty: path, sourceDescription: resolved.description });
  }
  if (deep && resolved.properties && typeof resolved.properties === "object") {
    for (const key of Object.keys(resolved.properties).sort()) entries.push(...provenanceSources(resolved.properties[key], root, `${path}.${key}`, nextSeen));
  }
  if (deep && resolved.items) entries.push(...provenanceSources(asSchema(resolved.items, `Missing item schema at ${path}`), root, `${path}[]`, nextSeen));
  for (const branchName of deep ? ["anyOf", "oneOf"] : []) {
    if (Array.isArray(resolved[branchName])) {
      for (const [index, branch] of resolved[branchName].entries()) entries.push(...provenanceSources(asSchema(branch, `Invalid ${branchName} branch at ${path}`), root, `${path}.${branchName}[${index}]`, nextSeen));
    }
  }
  return entries;
}

function semanticSections(schema: Schema): { sections: { id: string; title: string; sourceProperty: string; sourceDescription: string; ownership: string; content: string; sourceNode: Schema }[]; outputShape: string } {
  const root = schema;
  const rootDescription = described(root, root, "$").description;
  const rootProps = properties(root, root, "$");
  const sourceResults = asSchema(rootProps.source_results, "Missing source_results");
  const sourceNode = resolveLocalRef(asSchema(sourceResults.items, "Missing source_results items"), root);
  const sourceProps = properties(sourceNode, root, "$.source_results[]");
  const candidates = asSchema(sourceProps.candidates, "Missing candidates");
  const candidateNode = resolveLocalRef(asSchema(candidates.items, "Missing candidates items"), root);
  const candidateProps = properties(candidateNode, root, "$.source_results[].candidates[]");
  const kind = resolveLocalRef(asSchema(candidateProps.kind, "Missing kind"), root);
  const kindOptions = kind.anyOf ?? kind.oneOf;
  if (!Array.isArray(kindOptions) || kindOptions.length === 0) throw new Error("Unsupported kind schema: expected described anyOf/oneOf alternatives");
  const frozenKindSchema = z.toJSONSchema(atlasSemanticKindV1Schema) as Schema;
  const frozenKindOptions = frozenKindSchema.anyOf ?? frozenKindSchema.oneOf;
  if (!Array.isArray(frozenKindOptions)) throw new Error("Unsupported frozen kind schema: expected alternatives");
  const frozenValues = frozenKindOptions.map((option: unknown) => asSchema(option, "Invalid frozen kind alternative").const).sort();
  const projectedValues = kindOptions.map((option: unknown) => resolveLocalRef(asSchema(option, "Invalid kind alternative"), root).const).sort();
  if (JSON.stringify(projectedValues) !== JSON.stringify(frozenValues)) throw new Error("Provider schema candidate kinds do not exactly match the frozen Zod extraction vocabulary");
  const kindValues = kindOptions.map((option: unknown, index: number) => {
    const item = described(asSchema(option, `Invalid kind alternative ${index}`), root, `kind alternative ${index}`);
    if (typeof item.schema.const !== "string") throw new Error(`Unsupported kind alternative ${index}: expected string const`);
    return `${item.schema.const}\n${item.description}`;
  });

  const outputShapeLines = [
    `version (${typeLabel(resolveLocalRef(asSchema(rootProps.version, "Missing version"), root))})`,
    "source_results[] {",
    ...Object.keys(sourceProps).sort().map((key) => `  ${key}: ${typeLabel(resolveLocalRef(sourceProps[key], root))}`),
    "  candidates[] {",
    ...Object.keys(candidateProps).sort().map((key) => `    ${key}: ${typeLabel(resolveLocalRef(candidateProps[key], root))}`),
    "  }",
    "}",
  ];
  const shapeContent = renderShape(sourceResults, root, "source_results[]").join("\n");
  const candidateShape = renderProperties(candidateNode, root, "source_results[].candidates[]").join("\n");
  const classificationShape = renderShape(sourceProps.classification, root, "source_results[].classification").join("\n");
  const questionShape = renderShape(sourceProps.questions, root, "source_results[].questions[]").join("\n");
  const sections = [
    { id: "provider-root", title: "Provider proposal", sourceProperty: "$", sourceDescription: rootDescription, ownership: "ZOD_DESCRIPTION + ZOD_STRUCTURE", content: `${rootDescription}\n\n${outputShapeLines.join("\n")}`, sourceNode: schema, sourceDeep: false },
    { id: "source-result", title: "Source result and accounting fields", sourceProperty: "source_results", sourceDescription: described(sourceResults, root, "source_results").description, ownership: "ZOD_DESCRIPTION + ZOD_STRUCTURE", content: `${shapeContent}\n${classificationShape}`, sourceNode: sourceResults },
    { id: "candidate-fields", title: "Candidate fields", sourceProperty: "source_results[].candidates[]", sourceDescription: described(candidateNode, root, "candidate").description, ownership: "ZOD_DESCRIPTION + ZOD_STRUCTURE", content: `${described(candidateNode, root, "candidate").description}\n${candidateShape}`, sourceNode: candidateNode },
    { id: "candidate-kinds", title: "Candidate kind meanings", sourceProperty: "source_results[].candidates[].kind", sourceDescription: described(candidateProps.kind, root, "kind").description, ownership: "ZOD_DESCRIPTION + ZOD_STRUCTURE", content: `${described(candidateProps.kind, root, "kind").description}\n${kindValues.join("\n\n")}`, sourceNode: candidateProps.kind },
    { id: "questions", title: "Clarification questions", sourceProperty: "source_results[].questions", sourceDescription: described(sourceProps.questions, root, "questions").description, ownership: "ZOD_DESCRIPTION + ZOD_STRUCTURE", content: questionShape, sourceNode: sourceProps.questions },
    { id: "source-result-classification", title: "Source classification", sourceProperty: "source_results[].classification", sourceDescription: described(sourceProps.classification, root, "classification").description, ownership: "ZOD_DESCRIPTION + ZOD_STRUCTURE", content: classificationShape, sourceNode: sourceProps.classification, sourceDeep: false },
  ];
  return { sections, outputShape: outputShapeLines.join("\n") };
}

export function compileExtractionPrompt(schema: Schema = createProviderSchema()) {
  const { sections, outputShape } = semanticSections(schema);
  const staticSections = Object.entries(FIXED_SECTIONS).map(([title, content]) => ({ id: `fixed-${title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`, title, sourceProperty: "(fixed policy)", sourceDescription: content, ownership: "STATIC_POLICY", content }));
  const promptSections = [
    sections[0],
    staticSections[0], staticSections[1],
    { id: "dynamic-output-shape", title: "Output shape", sourceProperty: "provider proposal JSON Schema", sourceDescription: "Structure rendered from public z.toJSONSchema output.", ownership: "ZOD_STRUCTURE", content: outputShape },
    sections[1], sections[2], sections[3], sections[4], sections[5],
    ...staticSections.slice(2),
  ];
  const prompt = promptSections.map(({ title, content }) => `${title.toUpperCase()}\n\n${content}`).join("\n\n");
  const provenance = {
    formatVersion: 1,
    sections: promptSections.map(({ id, title, sourceProperty, sourceDescription, ownership, content, sourceNode, sourceDeep }) => ({
      id,
      generatedSection: title,
      sourceSchemaProperty: sourceProperty,
      sourceDescription,
      sourceDescriptions: sourceNode ? provenanceSources(sourceNode, schema, sourceProperty, new Set(), sourceDeep !== false) : [],
      ownership,
      generatedText: content,
    })),
  };
  return { prompt, provenance };
}
