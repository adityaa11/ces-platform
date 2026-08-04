import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { materializeExpandedApprovedProjectModel, publishExpandedApproval } from "@company/ces-approved-project-model";
import { createFocusedAtlasProjections } from "@company/ces-atlas-intent-graph";
import { DecisionCommandSchema, DecisionReceiptSchema } from "@company/ces-atlas-model-review-contracts";
import { createExpandedApprovalLedger, ExpandedApprovalDecisionInputSchema } from "@company/ces-atlas-review";
import { ExpandedApprovalEligibilitySchema, ProposedProjectModelSchema } from "@company/ces-proposed-project-model";

const digest = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 20);

export async function executeDecision(input: {
  root: string;
  command: unknown;
  artifactProjectId?: string;
  reviewerIdentity: string;
  reviewerDisplayName: string;
  decidedAt: string;
}): Promise<ReturnType<typeof DecisionReceiptSchema.parse>> {
  const command = DecisionCommandSchema.parse(input.command);
  if (command.action !== "approve" && command.action !== "reject") {
    throw new Error("This decision action requires a corrected proposal payload");
  }
  const projectDirectory = resolve(input.root, input.artifactProjectId ?? command.project_id);
  const receiptDirectory = resolve(projectDirectory, "review-receipts");
  const receiptPath = resolve(receiptDirectory, `${digest(command.idempotency_key)}.json`);
  try {
    return DecisionReceiptSchema.parse(JSON.parse(await readFile(receiptPath, "utf8")));
  } catch { /* A missing or invalid cache never bypasses validation. */ }

  const [proposal, eligibility] = await Promise.all([
    readFile(resolve(projectDirectory, "proposed-project-model.json"), "utf8")
      .then((value) => ProposedProjectModelSchema.parse(JSON.parse(value))),
    readFile(resolve(projectDirectory, "approval-eligibility.json"), "utf8")
      .then((value) => ExpandedApprovalEligibilitySchema.parse(JSON.parse(value))),
  ]);
  if (proposal.project_id !== command.project_id) throw new Error("Project identity mismatch");
  if (proposal.proposal_revision !== command.proposal_revision
    || eligibility.proposal_revision !== command.proposal_revision) {
    throw new Error("STALE_REVISION");
  }
  const entityTypes = new Set(eligibility.entities.filter(({ entity_id }) =>
    command.subject_ids.includes(entity_id)).map(({ entity_type }) => entity_type));
  if (entityTypes.size !== 1 || command.subject_ids.some((id) =>
    !eligibility.entities.some(({ entity_id }) => entity_id === id))) {
    throw new Error("Decision subjects are not one governed entity type");
  }
  const priorPath = resolve(projectDirectory, "ui-approval-decisions.json");
  let prior: ReturnType<typeof ExpandedApprovalDecisionInputSchema.parse>[] = [];
  try {
    prior = (JSON.parse(await readFile(priorPath, "utf8")) as unknown[])
      .map((value) => ExpandedApprovalDecisionInputSchema.parse(value));
  } catch { /* First governed decision. */ }
  const next = ExpandedApprovalDecisionInputSchema.parse({
    sequence: prior.length + 1,
    action: command.action,
    entity_type: [...entityTypes][0],
    entity_ids: command.subject_ids,
    bulk: command.subject_ids.length > 1,
    reviewer: { kind: "human", identity: input.reviewerIdentity },
    decided_at: input.decidedAt,
    note: command.note,
  });
  const decisions = [...prior, next];
  const ledger = createExpandedApprovalLedger({ eligibility, decisions });
  const publication = materializeExpandedApprovedProjectModel({ proposal, eligibility, ledger,
    focused_projections: createFocusedAtlasProjections({ model: proposal }) });
  const published = await publishExpandedApproval(input.root, publication);
  const receipt = DecisionReceiptSchema.parse({
    contract_name: "atlas.model-review.decision-receipt", contract_version: "1.0.0",
    project_id: command.project_id, proposal_revision: command.proposal_revision,
    decision_id: ledger.decisions.at(-1)?.decision_id,
    audit_event_id: `atlas.audit.${digest(`${ledger.content_hash}:${command.idempotency_key}`)}`,
    reviewer: { kind: "human", display_name: input.reviewerDisplayName },
    materialized_workspace_path: `/?project=${encodeURIComponent(publication.model.id)}&lifecycle=approved`,
  });
  await mkdir(receiptDirectory, { recursive: true });
  const nonce = digest(`${command.idempotency_key}:${input.decidedAt}`);
  const decisionTemp = `${priorPath}.${nonce}.tmp`;
  const receiptTemp = `${receiptPath}.${nonce}.tmp`;
  await writeFile(decisionTemp, `${JSON.stringify(decisions, null, 2)}\n`, "utf8");
  await writeFile(receiptTemp, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  await rename(decisionTemp, priorPath);
  await rename(receiptTemp, receiptPath);
  void published;
  return receipt;
}
