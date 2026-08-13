import { createHash } from "node:crypto";
import { z } from "zod";
import { PolicyContractRegistrySchema, validatePolicyContractRegistry } from "./index.js";
import { CES_POLICY_CONTRACT_REPRESENTATIVE_REGISTRY_V1 } from "./representative-registry.js";

const REVIEWED_COMMIT = "93e6c8c5fcebb41cc0f7765635bc150905f732b4";
const REVIEW_PATH = "project's goal/feedback/CES_POL_009_CLOSURE_REVIEW_93e6c8c.md";
const REVIEW_HASH = "63febea55200b07e1fdad7df089ad27728392118e431cb5891b06ccd0f56613a";

export const FinalPolicyContractPublicationSchema = z.object({
  schema_version: z.literal("1.0.0"),
  publication_id: z.literal("ces-policy-contract.final-pol-009.accepted-v1"),
  publication_status: z.literal("accepted"),
  artifact: PolicyContractRegistrySchema,
  authority: z.object({
    terminal_outcome: z.literal("ACCEPTED"),
    review_class: z.literal("REVIEW_GATE"),
    reviewed_candidate_commit: z.literal(REVIEWED_COMMIT),
    reviewer_evidence_id: z.literal("CES-GF-POL-009-H01"),
    reviewer_evidence_path: z.literal(REVIEW_PATH),
    reviewer_evidence_sha256: z.literal(REVIEW_HASH),
    final_pol_009_approval: z.literal(true),
    pol_010_authorized: z.literal(true),
  }).strict(),
  publication_hash: z.string().regex(/^[0-9a-f]{64}$/u),
}).strict().superRefine((value, context) => {
  const { publication_hash: publicationHash, ...body } = value;
  if (hash(body) !== publicationHash) context.addIssue({ code: "custom",
    message: "Final POL-009 publication hash does not match contents" });
  if (JSON.stringify(value.artifact) !== JSON.stringify(CES_POLICY_CONTRACT_REPRESENTATIVE_REGISTRY_V1))
    context.addIssue({ code: "custom",
      message: "Final POL-009 publication must preserve the reviewed candidate registry exactly" });
});

export function publishFinalPolicyContract(value: unknown = buildPublication()) {
  const publication = FinalPolicyContractPublicationSchema.parse(value);
  validatePolicyContractRegistry(publication.artifact);
  return publication;
}

function buildPublication() {
  const body = {
    schema_version: "1.0.0",
    publication_id: "ces-policy-contract.final-pol-009.accepted-v1",
    publication_status: "accepted",
    artifact: CES_POLICY_CONTRACT_REPRESENTATIVE_REGISTRY_V1,
    authority: {
      terminal_outcome: "ACCEPTED",
      review_class: "REVIEW_GATE",
      reviewed_candidate_commit: REVIEWED_COMMIT,
      reviewer_evidence_id: "CES-GF-POL-009-H01",
      reviewer_evidence_path: REVIEW_PATH,
      reviewer_evidence_sha256: REVIEW_HASH,
      final_pol_009_approval: true,
      pol_010_authorized: true,
    },
  } as const;
  return { ...body, publication_hash: hash(body) };
}

function hash(value: unknown) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export const CES_POLICY_APPROVED_CONTRACT_V1 = publishFinalPolicyContract();
