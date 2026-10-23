import { projectionRegistry } from "./routes/projection/index.js";
import { reconciliationRegistry } from "./routes/reconciliation/index.js";
import { semanticRegistry } from "./routes/semantic/index.js";

/** The main index composes domain registries only; it does not contain routes. */
export const mainRouteIndex = Object.freeze({
  semantic: semanticRegistry,
  reconciliation: reconciliationRegistry,
  projection: projectionRegistry,
});

/** Resolves a main registry by its exact trusted header main pin. */
export function resolveMainRouteBinding(selector: Parameters<typeof semanticRegistry.resolve>[0] & Readonly<{ main: keyof typeof mainRouteIndex }>) {
  const registry = mainRouteIndex[selector.main];
  if (!registry) throw new Error("No registered main route matches the pinned handoff selector.");
  return registry.resolve(selector);
}
