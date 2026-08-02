import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "{apps,packages,adapters}/*/{src,lib}/**/*.test.ts"],
    passWithNoTests: false,
    reporters: ["default"],
  },
});
