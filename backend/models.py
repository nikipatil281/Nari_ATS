from typing import TypedDict, List, Dict, Any
from pydantic import BaseModel, Field

# Pydantic models for the HTTP API
class JobUploadResponse(BaseModel):
    job_id: str
    message: str

class JobModel(BaseModel):
    job_id: str
    description: str

class ResumeUploadResponse(BaseModel):
    task_id: str
    message: str

class ResultResponse(BaseModel):
    status: str
    result: Dict[str, Any] | None = None

class FinalJson(TypedDict):
    summary: str
    provenance_links: List[str]
    recommended_questions: List[str]
    matching_score: int

class GraphState(TypedDict):
    task_id: str
    job_description: str
    resume_text: str
    hiring_manager_notes: str
    candidate_name: str
    candidate_email: str
    candidate_linkedin: str
    career_trajectory: str
    learning_velocity: str
    external_data: Dict[str, Any]
    needs_web_research: bool
    web_search_queries: List[str]
    web_evidence: List[Dict[str, Any]]
    skills_report: List[Dict[str, Any]]
    audit_flags: List[Dict[str, Any]]
    revision_count: int
    final_json: FinalJson
