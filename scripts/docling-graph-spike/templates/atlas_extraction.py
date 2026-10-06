from typing import Literal

from pydantic import BaseModel, Field


class CandidateProposal(BaseModel):
    local_candidate_id: str = Field(description="Result-local identifier only")
    semantic_key: str
    kind: Literal["actor", "business_object", "business_property", "responsibility", "rule", "constraint", "condition", "decision", "workflow_step", "state_transition", "relationship", "input", "output", "acceptance_expectation", "exception", "unresolved"]
    normalized_meaning: str
    source_wording: str | None = None
    needs_resolution: bool = False
    source_unit_ids: list[str]
    payload: dict = Field(default_factory=dict)


class SourceDisposition(BaseModel):
    source_unit_id: str
    classification: Literal["candidate", "non_fact"]
    destination_local_candidate_ids: list[str] = Field(default_factory=list)
    non_fact_reason: str | None = None


class QuestionProposal(BaseModel):
    question: str
    reason: str
    source_unit_ids: list[str] = Field(default_factory=list)


class AtlasExtractionProposal(BaseModel):
    candidates: list[CandidateProposal] = Field(default_factory=list)
    source_dispositions: list[SourceDisposition] = Field(default_factory=list)
    questions: list[QuestionProposal] = Field(default_factory=list)
