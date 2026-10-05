export type JsonSchema = Record<string, unknown>;

export function resolveLocalRef(schema: JsonSchema, root: JsonSchema, trail: string[] = []): JsonSchema {
  const ref = schema.$ref;
  if (typeof ref !== "string") return schema;
  if (!ref.startsWith("#/")) throw new Error(`Unsupported non-local JSON Schema reference: ${ref}`);
  if (trail.includes(ref)) throw new Error(`Cyclic JSON Schema reference: ${[...trail, ref].join(" -> ")}`);
  let current: unknown = root;
  for (const segment of ref.slice(2).split("/")) {
    if (!current || typeof current !== "object" || !(segment in current)) throw new Error(`Broken local JSON Schema reference: ${ref}`);
    current = (current as Record<string, unknown>)[segment];
  }
  if (!current || typeof current !== "object" || Array.isArray(current)) throw new Error(`Invalid local JSON Schema reference: ${ref}`);
  return resolveLocalRef(current as JsonSchema, root, [...trail, ref]);
}

export function schemaType(schema: JsonSchema, root: JsonSchema): string {
  const resolved = resolveLocalRef(schema, root);
  if (Array.isArray(resolved.enum)) return resolved.enum.map(String).join(" | ");
  if (typeof resolved.const !== "undefined") return String(resolved.const);
  if (Array.isArray(resolved.anyOf) || Array.isArray(resolved.oneOf)) {
    const alternatives = (resolved.anyOf ?? resolved.oneOf) as unknown[];
    return alternatives.map((candidate) => schemaType(candidate as JsonSchema, root)).join(" or ");
  }
  if (resolved.type === "array") return `zero or more ${schemaType((resolved.items ?? {}) as JsonSchema, root)}`;
  if (resolved.type === "object") return "object";
  return typeof resolved.type === "string" ? resolved.type : "value";
}
