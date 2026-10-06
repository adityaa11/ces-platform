from typing import Literal

from pydantic import BaseModel, Field


class RelationshipProposal(BaseModel):
    source_candidate_id: str
    target_candidate_id: str | None = None
    relationship_type: Literal["new", "supports", "duplicates", "refines", "extends", "contradicts", "supersedes", "partially_supersedes", "ambiguous", "requires_resolution"]
    requires_resolution: bool = False
    rationale: str
    source_unit_ids: list[str]
    payload: dict = Field(default_factory=dict)


class ReconciliationQuestionProposal(BaseModel):
    question: str
    reason: str
    source_unit_ids: list[str] = Field(default_factory=list)


class AtlasReconciliationProposal(BaseModel):
    relationships: list[RelationshipProposal] = Field(default_factory=list)
    questions: list[ReconciliationQuestionProposal] = Field(default_factory=list)
