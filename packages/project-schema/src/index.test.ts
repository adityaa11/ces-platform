import { describe, expect, it } from "vitest";
import {
  parseProjectText,
  splitProjectContext,
} from "./index.js";

const projectYaml = `
schema_version: 1.0.0
project:
  id: client-pos
  name: Client POS
assurance:
  exposure: public_internet
  criticality: business_critical
  data_classes: [personal]
technical:
  language: example_language
  framework: example_framework
  framework_version: "1"
ces:
  baseline_version: 0.1.0
  adapter:
    id: example_adapter
    version: 0.1.0
`;

describe("ProjectContextSchema", () => {
  it("parses one file into separate assurance and technical objects", () => {
    const parsed = splitProjectContext(parseProjectText(projectYaml, "yaml"));

    expect(parsed.assurance).toEqual({
      exposure: "public_internet",
      criticality: "business_critical",
      data_classes: ["personal"],
    });
    expect(parsed.technical).toEqual({
      language: "example_language",
      framework: "example_framework",
      framework_version: "1",
    });
  });

  it("rejects schema-version mismatches", () => {
    expect(() =>
      parseProjectText(projectYaml.replace("1.0.0", "2.0.0"), "yaml"),
    ).toThrow();
  });
});
