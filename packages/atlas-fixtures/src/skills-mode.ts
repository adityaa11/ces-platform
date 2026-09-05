/**
 * The repository-wide default used when authoring a new fixture revision.
 * Revision provenance is recorded with the revision itself; this setting must
 * never be used to reinterpret an existing branch HEAD.
 */
export type SkillsMode = "codex" | "agents_bridge";

export type AgentsBridgeExecutor = {
  readonly kind: "agents_bridge";
};

const supportedModes = new Set<SkillsMode>(["codex", "agents_bridge"]);

export function resolveSkillsMode(environment: Record<string, string | undefined> = {}): SkillsMode {
  const configuredMode = environment.SKILLS_MODE;

  if (configuredMode === undefined) return "codex";
  if (!supportedModes.has(configuredMode as SkillsMode)) {
    throw new Error(
      `Invalid SKILLS_MODE ${JSON.stringify(configuredMode)}. Expected "codex" or "agents_bridge".`,
    );
  }

  return configuredMode;
}

/**
 * Resolve the authoring executor without granting validation, approval, or
 * commit authority. Those are deterministic repository concerns.
 */
export function resolveFixtureAuthoringExecutor(
  environment: Record<string, string | undefined> = {},
  agentsBridge?: AgentsBridgeExecutor,
): SkillsMode {
  const mode = resolveSkillsMode(environment);
  if (mode === "agents_bridge" && agentsBridge === undefined) {
    throw new Error("SKILLS_MODE=agents_bridge requires a configured Agents Bridge executor.");
  }

  return mode;
}
