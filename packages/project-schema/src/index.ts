import { parse as parseYaml } from "yaml";
import { z } from "zod";

export const PROJECT_SCHEMA_VERSION = "1.0.0" as const;
export const PROJECT_ASSURANCE_VOCABULARY_VERSION = "1.0.0" as const;

export const ExposureSchema = z.enum(["public_internet", "private_network"]);
export const CriticalitySchema = z.enum(["business_critical", "standard"]);
export const TenancySchema = z.enum(["single_tenant", "multi_tenant"]);
export const DataClassSchema = z.enum(["public", "internal", "personal", "sensitive"]);
export const DeliverySemanticsSchema = z.enum(["synchronous", "asynchronous"]);

const NonEmptyString = z.string().trim().min(1);

export const ProjectAssuranceContextSchema = z
  .object({
    exposure: ExposureSchema,
    criticality: CriticalitySchema,
    tenancy: TenancySchema.optional(),
    data_classes: z.array(DataClassSchema).default([]),
    delivery_semantics: DeliverySemanticsSchema.optional(),
  })
  .strict();

export const ProjectTechnicalContextSchema = z
  .object({
    language: NonEmptyString,
    framework: NonEmptyString,
    framework_version: NonEmptyString.optional(),
    database: NonEmptyString.optional(),
    queue: NonEmptyString.optional(),
    storage: NonEmptyString.optional(),
    test_framework: NonEmptyString.optional(),
  })
  .strict();

export const ProjectContextSchema = z
  .object({
    schema_version: z.literal(PROJECT_SCHEMA_VERSION),
    project: z
      .object({
        id: NonEmptyString,
        name: NonEmptyString,
      })
      .strict(),
    assurance: ProjectAssuranceContextSchema,
    technical: ProjectTechnicalContextSchema,
    ces: z
      .object({
        baseline_version: NonEmptyString,
        adapter: z
          .object({
            id: NonEmptyString,
            version: NonEmptyString,
          })
          .strict(),
      })
      .strict(),
  })
  .strict();

export type ProjectAssuranceContext = z.infer<
  typeof ProjectAssuranceContextSchema
>;
export type ProjectTechnicalContext = z.infer<
  typeof ProjectTechnicalContextSchema
>;
export type ProjectContext = z.infer<typeof ProjectContextSchema>;

export interface ParsedProjectContexts {
  readonly project: ProjectContext["project"];
  readonly assurance: ProjectAssuranceContext;
  readonly technical: ProjectTechnicalContext;
  readonly ces: ProjectContext["ces"];
}

export function parseProjectContext(value: unknown): ProjectContext {
  return ProjectContextSchema.parse(value);
}

export function splitProjectContext(
  context: ProjectContext,
): ParsedProjectContexts {
  return {
    project: context.project,
    assurance: context.assurance,
    technical: context.technical,
    ces: context.ces,
  };
}

export function parseProjectText(
  text: string,
  format: "json" | "yaml",
): ProjectContext {
  const parsed: unknown = format === "json" ? JSON.parse(text) : parseYaml(text);
  return parseProjectContext(parsed);
}
