// Offline Groq strict-schema checks. This deliberately validates the emitted
// provider schema rather than assuming a Zod shape has provider-compatible
// JSON Schema semantics.
const schemaKeywordsToRecord = new Set(['minLength', 'minItems', 'maxItems', 'maxLength', 'minimum', 'maximum', 'default', 'pattern', 'format', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf']);
const structuralKeywordsToRecord = new Set(['$ref', 'anyOf', 'oneOf', 'allOf']);

const pointer = (root, reference) => {
  if (!reference.startsWith('#/')) return undefined;
  return reference.slice(2).split('/').reduce((value, part) => value?.[part.replaceAll('~1', '/').replaceAll('~0', '~')], root);
};

export function inspectGroqStrictSchema(schema) {
  const violations = [];
  const objects = [];
  const emittedKeywords = [];
  const structuralConstructs = [];
  const seen = new Set();
  const visit = (node, path) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    for (const keyword of schemaKeywordsToRecord) if (Object.hasOwn(node, keyword)) emittedKeywords.push({ path, keyword, value: node[keyword] });
    for (const keyword of structuralKeywordsToRecord) if (Object.hasOwn(node, keyword)) structuralConstructs.push({ path, keyword });
    if (typeof node.$ref === 'string') {
      const target = pointer(schema, node.$ref);
      if (!target) violations.push({ path, kind: 'unresolved-ref', reference: node.$ref });
      else visit(target, `${path} -> ${node.$ref}`);
      return;
    }
    if (Array.isArray(node.anyOf)) {
      node.anyOf.forEach((branch, index) => {
        if (Array.isArray(branch?.anyOf)) violations.push({ path: `${path}/anyOf/${index}`, kind: 'nested-anyof-wrapper' });
      });
    }
    if (node.properties && typeof node.properties === 'object' && !Array.isArray(node.properties)) {
      const propertyNames = Object.keys(node.properties);
      const required = Array.isArray(node.required) ? node.required : [];
      const missingRequired = propertyNames.filter((name) => !required.includes(name));
      const extraRequired = required.filter((name) => !propertyNames.includes(name));
      objects.push({ path, properties: propertyNames, required, additionalProperties: node.additionalProperties });
      if (missingRequired.length) violations.push({ path, kind: 'missing-required', properties: missingRequired });
      if (extraRequired.length) violations.push({ path, kind: 'required-without-property', properties: extraRequired });
      if (node.additionalProperties !== false) violations.push({ path, kind: 'open-object', additionalProperties: node.additionalProperties });
      for (const [key, value] of Object.entries(node.properties)) visit(value, `${path}/properties/${key}`);
    }
    if (node.items) visit(node.items, `${path}/items`);
    for (const combinator of ['anyOf', 'oneOf', 'allOf']) if (Array.isArray(node[combinator])) node[combinator].forEach((value, index) => visit(value, `${path}/${combinator}/${index}`));
    if (node.$defs && typeof node.$defs === 'object') for (const [key, value] of Object.entries(node.$defs)) visit(value, `${path}/$defs/${key}`);
    if (node.definitions && typeof node.definitions === 'object') for (const [key, value] of Object.entries(node.definitions)) visit(value, `${path}/definitions/${key}`);
  };
  visit(schema, '#');
  return { compatible: violations.length === 0, violations, objects, emittedKeywords, structuralConstructs };
}
