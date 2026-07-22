import { describe, expect, it } from "vitest";
import {
  CriticalitySchema,
  DataClassSchema,
  DeliverySemanticsSchema,
  ExposureSchema,
  TenancySchema,
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

  it("accepts every controlled assurance vocabulary member", () => {
    for (const schema of [
      ExposureSchema,
      CriticalitySchema,
      TenancySchema,
      DataClassSchema,
      DeliverySemanticsSchema,
    ]) {
      for (const value of schema.options) expect(schema.parse(value)).toBe(value);
    }
  });

  it("rejects ambiguous exposure vocabulary", () => {
    expect(() => parseProjectText(projectYaml.replace("public_internet", "public"), "yaml"))
      .toThrow();
  });
});
