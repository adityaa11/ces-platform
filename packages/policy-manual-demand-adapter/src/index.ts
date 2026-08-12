import { createHash } from "node:crypto";
import { z } from "zod";

export const MANUAL_DEMAND_ADAPTER_VERSION = "1.0.0" as const;
export const SAFARA_CYCLE_FIXTURE_ID = "safara-v1.1-cycle-01" as const;
export const SAFARA_PRD_SHA256 =
  "189dc08b084e5ee7edd4b947517ca659e93f22eec78954de6fd1c2df8359baee" as const;
export const SAFARA_MANUAL_INVENTORY_SHA256 =
  "b1cbfaf6d3ad78cafc1b85dd7dc92344ed03d42f0f693ef5543c0b31e60526d2" as const;

const NonEmpty = z.string().trim().min(1);
const FactId = z.string().regex(/^safara\.manual\.fact\.\d{4}$/u);

export const ManualFactCategorySchema = z.enum([
  "acceptance_criterion", "audit_rule", "authorization_rule", "business_rule",
  "calculation", "capability", "data", "data_protection", "deliverable", "goal",
  "history_rule", "identity_rule", "inspection_scenario", "integrity_rule", "output",
  "permission", "problem", "relationship", "reporting", "scope", "snapshot_rule",
  "state", "state_transition", "validation", "workflow",
]);

export const ManualSafaraFactSchema = z.object({
  fact_id: FactId,
  category: ManualFactCategorySchema,
  page: z.number().int().min(1).max(7),
  statement: NonEmpty,
  exact_text: NonEmpty,
  extraction_method: z.literal("human_reconciled"),
}).strict();

export const ManualSafaraInventorySchema = z.object({
  schema_version: z.literal("1.0.0"),
  fixture_id: z.literal(SAFARA_CYCLE_FIXTURE_ID),
  lifecycle: z.literal("proposed"),
  input_kind: z.literal("manual_prd_fact_inventory"),
  atlas_authority: z.literal(false),
  source_sha256: z.literal(SAFARA_PRD_SHA256),
  facts: z.array(ManualSafaraFactSchema).length(111),
}).strict().superRefine(({ facts }, context) => {
  const seen = new Set<string>();
  for (const [index, fact] of facts.entries()) {
    if (seen.has(fact.fact_id)) context.addIssue({ code: "custom", path: ["facts", index,
      "fact_id"], message: `Duplicate manual fact ID: ${fact.fact_id}` });
    seen.add(fact.fact_id);
  }
});

export const ManualSafaraSourceManifestSchema = z.object({
  schema_version: z.literal("1.0.0"),
  fixture_id: z.literal(SAFARA_CYCLE_FIXTURE_ID),
  purpose: z.literal("ces_policy_qualification"),
  authority: z.literal("human_reconciled_project_truth"),
  atlas_authority: z.literal(false),
  source: z.object({
    path: z.literal("docs/prd/Safara_Buyer_Business_PRD.pdf"),
    sha256: z.literal(SAFARA_PRD_SHA256),
    page_count: z.literal(7),
    document_date: z.literal("2026-07-27"),
  }).strict(),
  inventory: z.literal("manual-facts.json"),
  review_record: z.literal("human-review-record.json"),
}).strict();

export const ManualSafaraReviewRecordSchema = z.object({
  schema_version: z.literal("1.0.0"),
  fixture_id: z.literal(SAFARA_CYCLE_FIXTURE_ID),
  status: z.literal("accepted"),
  decision: z.enum(["ACCEPTED", "ACCEPTED WITH DEFERRED ITEMS"]),
  inventory_sha256: z.literal(SAFARA_MANUAL_INVENTORY_SHA256),
  reviewer: NonEmpty,
  reviewed_at: z.iso.date(),
  reviewed_commit: NonEmpty,
  note: NonEmpty,
}).strict();

export const QualificationPolicyDemandFactSchema = z.object({
  schema_version: z.literal(MANUAL_DEMAND_ADAPTER_VERSION),
  demand_fact_id: FactId,
  statement: NonEmpty,
  category: ManualFactCategorySchema,
  provenance: z.object({
    kind: z.literal("manual_golden_fixture"),
    fixture_id: z.literal(SAFARA_CYCLE_FIXTURE_ID),
    source_sha256: z.literal(SAFARA_PRD_SHA256),
    inventory_sha256: z.literal(SAFARA_MANUAL_INVENTORY_SHA256),
    page: z.number().int().min(1).max(7),
    exact_text: NonEmpty,
    extraction_method: z.literal("human_reconciled"),
  }).strict(),
  production_context_binding_eligible: z.literal(false),
}).strict();

export type QualificationPolicyDemandFact = z.infer<
  typeof QualificationPolicyDemandFactSchema>;

export interface ManualSafaraFixtureInput {
  readonly sourceManifest: unknown;
  readonly inventory: unknown;
  readonly inventoryBytes: Uint8Array;
  readonly reviewRecord: unknown;
  readonly sourcePdfBytes: Uint8Array;
}

export function loadManualSafaraDemandFacts(
  input: ManualSafaraFixtureInput,
): readonly QualificationPolicyDemandFact[] {
  const sourceManifest = ManualSafaraSourceManifestSchema.parse(input.sourceManifest);
  const inventory = ManualSafaraInventorySchema.parse(input.inventory);
  const reviewRecord = ManualSafaraReviewRecordSchema.parse(input.reviewRecord);
  const inventoryHash = sha256(input.inventoryBytes);
  const sourceHash = sha256(input.sourcePdfBytes);
  if (inventoryHash !== reviewRecord.inventory_sha256) {
    throw new Error(`Manual inventory hash mismatch: ${inventoryHash}`);
  }
  if (sourceHash !== sourceManifest.source.sha256 ||
      sourceHash !== inventory.source_sha256) {
    throw new Error(`Safara source PDF hash mismatch: ${sourceHash}`);
  }
  return inventory.facts.map((fact) => QualificationPolicyDemandFactSchema.parse({
    schema_version: MANUAL_DEMAND_ADAPTER_VERSION,
    demand_fact_id: fact.fact_id,
    statement: fact.statement,
    category: fact.category,
    provenance: {
      kind: "manual_golden_fixture",
      fixture_id: inventory.fixture_id,
      source_sha256: inventory.source_sha256,
      inventory_sha256: inventoryHash,
      page: fact.page,
      exact_text: fact.exact_text,
      extraction_method: fact.extraction_method,
    },
    production_context_binding_eligible: false,
  }));
}

export function assertProductionContextBindingEligible(
  fact: QualificationPolicyDemandFact,
): never {
  QualificationPolicyDemandFactSchema.parse(fact);
  throw new Error("Manual golden fixture facts cannot produce production Context Bindings");
}

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}
