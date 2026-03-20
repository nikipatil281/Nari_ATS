from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid
from dotenv import load_dotenv

load_dotenv()

from backend.models import JobUploadResponse, JobModel, ResumeUploadResponse, ResultResponse
from backend.utils import extract_text_from_bytes
from backend.agent import agent_graph

app = FastAPI(title="UCR Multi-Agent ATS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store for jobs
JOBS = {}

@app.post("/api/jobs", response_model=JobUploadResponse)
async def upload_job(
    title: str = Form(...), 
    description: str = Form(default=""),
    hiring_notes: str = Form(default=""),
    file: UploadFile | None = File(default=None)
):
    job_id = str(uuid.uuid4())
    
    final_description = description
    if file and file.filename:
        file_bytes = await file.read()
        extracted_text = extract_text_from_bytes(file_bytes, file.filename)
        final_description = f"{extracted_text}\n\n{description}".strip()
        
    if not final_description:
        raise HTTPException(status_code=400, detail="Must provide either text description or file upload.")
        
    JOBS[job_id] = {
        "job_id": job_id,
        "title": title,
        "description": final_description,
        "hiring_notes": hiring_notes
    }
    return JobUploadResponse(job_id=job_id, message="Job created successfully.")

@app.get("/api/jobs")
async def get_jobs():
    return {"jobs": list(JOBS.values())}

@app.post("/api/upload-resume/{job_id}", response_model=ResumeUploadResponse)
async def upload_resume(job_id: str, file: UploadFile = File(...)):
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found.")
        
    job_desc = JOBS[job_id]["description"]
    file_bytes = await file.read()
    resume_text = extract_text_from_bytes(file_bytes, file.filename)
    
    task_id = str(uuid.uuid4())
    
    initial_state = {
        "task_id": task_id,
        "resume_text": resume_text,
        "job_description": job_desc,
        "hiring_manager_notes": JOBS[job_id].get("hiring_notes", ""),
        "candidate_name": "",
        "candidate_email": "",
        "candidate_linkedin": "",
        "career_trajectory": "",
        "learning_velocity": "",
        "external_data": {},
        "needs_web_research": False,
        "web_search_queries": [],
        "web_evidence": [],
        "skills_report": [],
        "audit_flags": [],
        "revision_count": 0,
        "final_json": {"summary": "", "provenance_links": []}
    }
    
    # We use asyncio config to run it asynchronously or simply invoke
    config = {"configurable": {"thread_id": task_id}}
    # Trigger the agent asynchronously
    import asyncio
    
    # Here we just run it synchronously if invoke is used, but graph.ainvoke is better.
    # To not block the API wrapper completely during the background execution:
    async def run_graph():
        agent_graph.invoke(initial_state, config)
    
    asyncio.create_task(run_graph())
    
    return ResumeUploadResponse(task_id=task_id, message="Resume uploaded, processing started.")

@app.get("/api/results/{task_id}", response_model=ResultResponse)
async def get_results(task_id: str):
    config = {"configurable": {"thread_id": task_id}}
    state_snapshot = agent_graph.get_state(config)
    
    if not state_snapshot or not state_snapshot.values:
        return ResultResponse(status="PROCESSING", result=None)
        
    # Check if we reached the END node by looking at the values or next nodes
    # If there are still 'next' nodes to execute, it's processing
    if state_snapshot.next:
        return ResultResponse(status="PROCESSING", result=state_snapshot.values)
        
    # If final json is there but empty it might still be running
    if "final_json" in state_snapshot.values and state_snapshot.values["final_json"]:
        return ResultResponse(status="DONE", result=state_snapshot.values)
        
    return ResultResponse(status="PROCESSING", result=state_snapshot.values)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
