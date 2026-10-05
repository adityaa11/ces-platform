export function normalizeProviderOutput(raw: string): { readonly text: string; readonly removedFence: boolean } {
  const trimmed = raw.trim();
  const match = trimmed.match(/^```(?:json)?\s*\r?\n([\s\S]*?)\r?\n```$/i);
  if (match) return { text: match[1], removedFence: true };
  if (trimmed.startsWith("```") || trimmed.endsWith("```")) throw new Error("Provider output has a non-matching or partial outer fence");
  return { text: raw, removedFence: false };
}

export function parseNormalizedProviderOutput(raw: string): { readonly value: unknown; readonly removedFence: boolean } {
  const normalized = normalizeProviderOutput(raw);
  return { value: JSON.parse(normalized.text), removedFence: normalized.removedFence };
}
