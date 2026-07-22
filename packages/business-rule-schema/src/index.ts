import { z } from "zod";

export const BUSINESS_RULE_SCHEMA_VERSION = "1.0.0" as const;

export const BusinessRuleTypeSchema = z.enum([
  "authorization",
  "validation",
  "lifecycle",
  "consistency",
  "financial",
  "audit",
  "other",
]);

export const BusinessRuleSchema = z
  .object({
    id: z.string().trim().min(1),
    type: BusinessRuleTypeSchema,
    statement: z.string().trim().min(1),
  })
  .strict();

export type BusinessRule = z.infer<typeof BusinessRuleSchema>;
export type BusinessRuleType = z.infer<typeof BusinessRuleTypeSchema>;
