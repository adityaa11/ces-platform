import { describe, expect, it } from "vitest";
import {
  applyConceptReviews,
  createCandidateLexicon,
  proposalId,
} from "./index.js";

const proposal = (label: string, id = proposalId("entity", label)) => ({
  id,
  project_id: "safara",
  source_revision_id: "safara.rev.0123456789ab",
  kind: "entity" as const,
  label,
  aliases: [],
  source_unit_ids: ["safara.unit.00001.01234567"],
});

describe("DAPE-002 project domain concepts", () => {
  it("normalizes proposals and hashes lexicons deterministically", () => {
    const first = createCandidateLexicon({
      project_id: "safara",
      source_revision_id: "safara.rev.0123456789ab",
      proposals: [proposal("Jemaah"), proposal("Keberangkatan")],
    });
    const second = createCandidateLexicon({
      project_id: "safara",
      source_revision_id: "safara.rev.0123456789ab",
      proposals: [proposal("Keberangkatan"), proposal("Jemaah")],
    });
    expect(first).toEqual(second);
    expect(first.concepts).toHaveLength(2);
    expect(Object.isFrozen(first)).toBe(true);
  });

  it("requires explicit human decisions and applies confirmed revisions", () => {
    const candidate = createCandidateLexicon({
      project_id: "safara",
      source_revision_id: "safara.rev.0123456789ab",
      proposals: [proposal("Jemaah")],
    });
    expect(() => applyConceptReviews({ lexicon: candidate, decisions: [] }))
      .toThrow("Missing review decision");
    const reviewed = applyConceptReviews({
      lexicon: candidate,
      decisions: [{
        proposal_id: proposalId("entity", "Jemaah"),
        source_revision_id: candidate.source_revision_id,
        decision: "confirm",
        reviewer: "human-reviewer",
      }],
    });
    expect(reviewed.status).toBe("reviewed");
    expect(reviewed.concepts[0]?.status).toBe("confirmed");
    expect(reviewed.parent_revision_id).toBe(candidate.id);
  });

  it("fails closed on conflicts, stale review, and invalid merge targets", () => {
    expect(() => createCandidateLexicon({
      project_id: "safara",
      source_revision_id: "safara.rev.0123456789ab",
      proposals: [
        { ...proposal("Jemaah"), aliases: ["Pilgrim"] },
        { ...proposal("Pilgrim"), id: proposalId("entity", "Pilgrim") },
      ],
    })).toThrow("Conflicting concept label");
    const candidate = createCandidateLexicon({
      project_id: "safara",
      source_revision_id: "safara.rev.0123456789ab",
      proposals: [proposal("Jemaah")],
    });
    expect(() => applyConceptReviews({
      lexicon: candidate,
      decisions: [{
        proposal_id: proposalId("entity", "Jemaah"),
        source_revision_id: "safara.rev.stale",
        decision: "confirm",
        reviewer: "human-reviewer",
      }],
    })).toThrow("Stale");
    expect(() => applyConceptReviews({
      lexicon: candidate,
      decisions: [{
        proposal_id: proposalId("entity", "Jemaah"),
        source_revision_id: candidate.source_revision_id,
        decision: "merge",
        merge_into_concept_id: "safara.concept.entity.unknown.01234567",
        reviewer: "human-reviewer",
      }],
    })).toThrow("Unknown merge target");
  });
});
