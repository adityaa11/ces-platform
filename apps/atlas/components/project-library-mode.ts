export type ProjectLibraryMode = "fixture" | "production";

export const shouldHydrateFixtureRegistry = (mode: ProjectLibraryMode, scenario?: string) => mode === "fixture" && (!scenario || scenario === "owner-ready");
