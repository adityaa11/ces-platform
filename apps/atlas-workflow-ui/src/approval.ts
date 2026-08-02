import type {
  AtlasWorkspacePayload,
  DecisionAction,
  DecisionReceipt,
  ReviewSubject,
} from "./contracts.js";

const escapeHtml = (value: string): string => value.replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#039;");

export function renderApprovalPanel(subjects: readonly ReviewSubject[]): string {
  if (subjects.length === 0) return "<p>No review subjects in this projection.</p>";
  return `<section class="approval-panel"><h3>Review and approval</h3>${subjects.map((subject) => {
    const blockers = subject.blockers.map((blocker) =>
      `<li>${escapeHtml(blocker)}</li>`).join("");
    const relationship = subject.relationship
      ? `<dl class="relationship-review"><div><dt>From</dt><dd>${escapeHtml(subject.relationship.from_id)}</dd></div><div><dt>To</dt><dd>${escapeHtml(subject.relationship.to_id)}</dd></div><div><dt>Kind</dt><dd>${escapeHtml(subject.relationship.relationship_kind)}</dd></div><div><dt>Condition</dt><dd>${escapeHtml(subject.relationship.condition ?? "Not supplied")}</dd></div><div><dt>Origin</dt><dd>${subject.relationship.origin}</dd></div><div><dt>Confidence</dt><dd>${subject.relationship.confidence}</dd></div><div><dt>Rationale</dt><dd>${escapeHtml(subject.relationship.rationale)}</dd></div><div><dt>Status</dt><dd>${subject.relationship.status}</dd></div></dl>` : "";
    const controls = subject.allowed_actions.map((action) => {
      const blockedApprove = action === "approve" && !subject.eligible;
      return `<button type="button" data-review-subject="${escapeHtml(subject.subject_id)}" data-decision-action="${action}"${blockedApprove ? " disabled" : ""}>${escapeHtml(action.replaceAll("_", " "))}</button>`;
    }).join("");
    return `<article class="review-subject" data-eligible="${subject.eligible}" data-bulk-eligible="${subject.bulk_approval_eligible}"><h4>${escapeHtml(subject.label)}</h4><p>${subject.eligible ? "Eligible" : "Not eligible"} · Bulk ${subject.bulk_approval_eligible ? "eligible" : "blocked"}</p>${blockers ? `<ul class="blockers">${blockers}</ul>` : ""}${relationship}<div class="decision-controls">${controls}</div></article>`;
  }).join("")}</section>`;
}

export function backendBulkEligibleSubjects(subjects: readonly ReviewSubject[]): readonly string[] {
  return subjects.filter(({ bulk_approval_eligible }) => bulk_approval_eligible)
    .map(({ subject_id }) => subject_id);
}

export async function submitDecision(input: {
  readonly payload: AtlasWorkspacePayload;
  readonly subject: ReviewSubject;
  readonly action: DecisionAction;
  readonly note: string;
  readonly idempotencyKey: string;
  readonly confirmed?: boolean;
  readonly fetcher?: typeof fetch;
}): Promise<DecisionReceipt> {
  if (!input.subject.allowed_actions.includes(input.action)) {
    throw new Error("Decision action is not allowed by the backend projection");
  }
  if (input.action === "approve" && !input.subject.eligible) {
    throw new Error("Approval is blocked by backend eligibility");
  }
  if (input.subject.requires_explicit_confirmation && !input.confirmed) {
    throw new Error("Explicit confirmation is required");
  }
  const response = await (input.fetcher ?? fetch)(input.subject.command_href, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      "X-CES-Project-Id": input.payload.project.id,
      "If-Match": String(input.payload.revision),
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      subject_id: input.subject.subject_id,
      action: input.action,
      note: input.note,
    }),
  });
  if (response.status === 409) throw new Error("Decision conflict: refresh the stale proposal");
  if (!response.ok) throw new Error(`Decision failed (${response.status})`);
  const receipt = await response.json() as DecisionReceipt;
  if (receipt.schema_version !== "1.0.0"
    || receipt.project_id !== input.payload.project.id
    || receipt.proposal_revision !== input.payload.revision
    || receipt.reviewer?.kind !== "human"
    || typeof receipt.reviewer?.display_name !== "string"
    || typeof receipt.decision_id !== "string"
    || typeof receipt.audit_event_id !== "string"
    || typeof receipt.materialized_workspace_href !== "string") {
    throw new Error("Decision receipt scope or revision mismatch");
  }
  return receipt;
}
