import os
import json
import sqlite3
from typing import Dict, Any

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from langgraph.checkpoint.sqlite import SqliteSaver
from langchain_community.tools.tavily_search import TavilySearchResults

from backend.models import GraphState
from backend.utils import search_github

# Initialize LLM
def get_llm():
    return ChatGroq(model="llama-3.3-70b-versatile", temperature=0)

def _clean_json_output(content: str) -> Any:
    try:
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        return json.loads(content)
    except Exception as e:
        print(f"Error parsing JSON: {e}")
        return None

def ingest_node(state: GraphState):
    print("Agent: Ingest")
    
    # Initialize state variables
    current_revisions = state.get("revision_count", 0)
    llm = get_llm()
    prompt = ChatPromptTemplate.from_template(
        "Extract the candidate's full name, email, exact GitHub URL/username, and exact LinkedIn URL from the following resume text.\\n"
        "CRITICAL IDENTITY EXTRACTION: You MUST scan the text explicitly for substrings containing 'github.com/' and 'linkedin.com/in/' and extract the exact strings written on the resume (e.g. 'nikipatil281'). DO NOT guess or auto-format the candidate's name into a handle. If it is not explicitly written, return an empty string for that field.\\n"
        "Also, review the resume for high-value projects, core technical skills, or prominent professional affiliations (University, Employer) that lack explicit verification links.\\n"
        "If you find strong professional claims, set 'needs_web_research' to true and generate 1-3 targeted search queries to verify them (e.g. '[Name] [University]', '[Name] [Employer] portfolio', '[Project Name] technical overview').\\n"
        "STRICT IDENTITY RULE: DO NOT generate queries to find the candidate's general social profiles (LinkedIn, GitHub, etc.) if they were not explicitly found on the resume. We only verify professional claims found ON the resume, not discover new social identities from scratch.\\n"
        "Resume: {resume}\\n"
        "Output ONLY a JSON object with keys 'name', 'email', 'github', 'linkedin', 'needs_web_research' (boolean), and 'web_search_queries' (list of strings)."
    )
    response = llm.invoke(prompt.format_messages(resume=state["resume_text"][:3000]))
    data = _clean_json_output(response.content) or {}
    name = data.get("name", "")
    email = data.get("email", "")
    github_handle = data.get("github", "")
    
    # Clean github handle to just the username
    if github_handle and "/" in github_handle:
        github_handle = github_handle.rstrip("/").split("/")[-1]
    
    # STRICT IDENTITY: Only search GitHub if a specific handle was provided
    external_data = search_github("", "", github_handle) if github_handle else {}
    return {
        "candidate_name": name, 
        "candidate_email": email, 
        "candidate_linkedin": data.get("linkedin", ""),
        "external_data": external_data,
        "needs_web_research": data.get("needs_web_research", False),
        "web_search_queries": data.get("web_search_queries", [])
    }

def web_research_node(state: GraphState):
    print("Agent: Web Verification Researcher (Tavily)")
    queries = state.get("web_search_queries", [])
    api_key = os.getenv("TAVILY_API_KEY")
    
    web_evidence = []
    if not api_key:
        print("TAVILY_API_KEY missing, skipping real web search.")
        return {"web_evidence": [{"content": "TAVILY_API_KEY missing. Could not perform web verification."}]}
        
    try:
        tool = TavilySearchResults(max_results=2)
        for q in queries[:3]: # Cap at 3 queries to save credits
            res = tool.invoke({"query": q})
            if isinstance(res, list):
                # Attach the query context to the results
                for r in res:
                    r["original_query"] = q
                web_evidence.extend(res)
    except Exception as e:
        print(f"Tavily search error: {e}")
        web_evidence.append({"content": f"Tavily API Error: {e}"})
        
    return {"web_evidence": web_evidence}

def trajectory_node(state: GraphState):
    print("Agent: Trajectory (Agent Lex)")
    llm = get_llm()
    prompt = ChatPromptTemplate.from_template(
        "Analyze the following resume for 'Experience Progression'. Look for career trajectory patterns, increasing responsibilities, and leadership or technical growth over time.\\n"
        "If Hiring Manager Notes are provided, explicitly map the trajectory against those dynamic criteria and weigh those skills/experiences higher.\\n"
        "Hiring Manager Notes: {notes}\\n"
        "Resume: {resume}\\n"
        "Output a 1-2 paragraph professional analysis regarding the candidate's career progression."
    )
    response = llm.invoke(prompt.format_messages(
        notes=state.get("hiring_manager_notes", "None provided"),
        resume=state["resume_text"][:4000]
    ))
    return {"career_trajectory": response.content}

def velocity_node(state: GraphState):
    print("Agent: Success Velocity")
    llm = get_llm()
    prompt = ChatPromptTemplate.from_template(
        "Analyze the candidate's 'Learning Velocity' and 'Success Velocity'.\\n"
        "Inspect the 'created_at' and 'updated_at' dates of their GitHub repositories compared to the complexity of the code and the resume timeline.\\n"
        "Did they master tough languages (like Rust, Go, or C++) quickly? Have they rapidly increased repository complexity over a short timeframe?\\n"
        "GitHub Data: {github}\\n"
        "Resume: {resume}\\n"
        "Output a 1-2 paragraph professional analysis of their learning speed and code velocity."
    )
    response = llm.invoke(prompt.format_messages(
        github=json.dumps(state["external_data"])[:4000],
        resume=state["resume_text"][:3000]
    ))
    return {"learning_velocity": response.content}

def reasoning_node(state: GraphState):
    print(f"Agent: Reasoning (Revision: {state.get('revision_count', 0)})")
    llm = get_llm()
    
    audit_feedback = ""
    if state.get("audit_flags") and len(state.get("audit_flags")) > 0:
        audit_feedback = f"\\nPREVIOUS AUDITOR FEEDBACK:\\n{json.dumps(state['audit_flags'])}\\nThe auditor rejected some of your previous findings. You MUST strictly fix these Evidence Gaps or Discrepancies by marking them as 'Unverified' or 'Skills Discrepancy' instead of Verified.\\n"
        
    prompt = ChatPromptTemplate.from_template(
        "Compare Resume skills against GitHub code footprints and the Job Description.\\n"
        "Identify 'Ghost Skills' (present heavily in GitHub repo languages/descriptions/READMEs but missing from Resume).\\n"
        "Identify 'Skills Discrepancy' (claimed on resume but GitHub shows massive evidence of opposite languages).\\n"
        "If GitHub Data is empty or contains no users, DO NOT hallucinate evidence. Mark skills as 'Unverified - No GitHub Data'.\\n"
        "If substantial evidence for a skill is found in the 'Web Evidence Findings' (via Tavily search), you MUST mark its status explicitly as 'Web Verified'.\\n"
        "CRITICAL: Be extremely strict about 'in_resume'. If the skill is not explicitly mentioned or clearly implied in the Resume text, you MUST set 'in_resume' to false.\\n"
        "DEEP GITHUB SCAN: Analyze the 'topics' and 'readme_snippet' for each repository. If you find technical keywords (like 'Deep Learning', 'PyTorch', etc.) in the README or topics even if not in the description, you MUST use that as concrete evidence.\\n"
        "Hiring Manager Notes: {notes}\\n"
        "{audit_feedback}"
        "Resume: {resume}\\nGitHub Data (Languages, Topics & README snippets): {github}\\nWeb Evidence Findings: {web_evidence}\\nJD: {jd}\\n\\n"
        "Output ONLY a JSON array of skill objects, each with:\\n"
        "- 'skill' (str)\\n"
        "- 'in_jd' (bool)\\n"
        "- 'in_resume' (bool)\\n"
        "- 'in_github' (bool)\\n"
        "- 'status' (Ghost Skill/Verified/Web Verified/Unverified/Skills Discrepancy)\\n"
        "- 'evidence' (short string)"
    )
    response = llm.invoke(prompt.format_messages(
        audit_feedback=audit_feedback,
        notes=state.get("hiring_manager_notes", "None provided"),
        resume=state["resume_text"][:3000],
        github=json.dumps(state.get("external_data", {}))[:3000],
        web_evidence=json.dumps(state.get("web_evidence", []))[:3000],
        jd=state["job_description"]
    ))
    skills = _clean_json_output(response.content)
    if not isinstance(skills, list):
        skills = []
    return {"skills_report": skills}

def auditor_node(state: GraphState):
    print("Agent: Auditor")
    llm = get_llm()
    prompt = ChatPromptTemplate.from_template(
        "Red-Team the candidate's skills report for professional verification. You are an expert at identifying 'Resume Hallucinations'—where an AI claims a skill is present on a resume when it is NOT actually in the text.\\n"
        "Check each skill in the report. If it is marked as 'in_resume': true, verify if it was really on the resume based on the original text. If it is high-confidence hallucination, flag it as 'Resume Hallucination'.\\n"
        "Otherwise, use these human-friendly flag types:\\n"
        "1. 'Institutional Brand Bias': If the candidate is being over-valued based on prestigious names rather than specific project evidence.\\n"
        "2. 'Unverified Technical Claim': If a skill lacks project or web evidence footprints.\\n"
        "3. 'Technical Footprint Mismatch': If their repo code significantly contradicts their profile claims.\\n"
        "Original Resume Text: {resume}\\n"
        "Skills Report: {skills}\\n"
        "Output ONLY a JSON array of audit objects, each with 'flag_type' and 'description'."
    )
    response = llm.invoke(prompt.format_messages(
        resume=state["resume_text"][:4000],
        skills=json.dumps(state["skills_report"])
    ))
    flags = _clean_json_output(response.content)
    if not isinstance(flags, list):
        flags = []
    
    new_revision = state.get("revision_count", 0) + 1
    return {"audit_flags": flags, "revision_count": new_revision}

def should_loop(state: GraphState):
    flags = state.get("audit_flags", [])
    loop_count = state.get("revision_count", 0)
    
    # Check if there are critical evidence gaps or discrepancies that need fixing
    has_gap = any(
        "Unverified Technical Claim" in f.get("flag_type", "") or 
        "Technical Footprint Mismatch" in f.get("flag_type", "") or
        "Resume Hallucination" in f.get("flag_type", "")
        for f in flags
    )
    
    # Loop back to reasoning a maximum of 1 time to prevent infinite loops
    print(f"Auditor routing check - Has critical gaps: {has_gap}, Loop count: {loop_count}")
    if has_gap and loop_count <= 1:
        print("-> Routing back to Reasoning node for self-correction!")
        return "reasoning"
    
    print("-> Routing to Reporting node for final synthesis.")
    return "reporting"

def reporting_node(state: GraphState):
    print("Agent: Reporting (with Agent Vox)")
    llm = get_llm()
    prompt = ChatPromptTemplate.from_template(
        "Synthesize the state into a final, comprehensive structured JSON.\\n"
        "Must include exactly these keys: 'summary' (str), 'matching_score' (int, 0-100), and 'recommended_questions' (list of strings).\\n"
        "MATCHING SCORE (0-100): Calculate a single integer score representing how well this candidate matches the Job Description. High scores (80+) mean they are a stellar technical and trajectory match. Mid scores (50-79) mean they have some gaps or need verification. Low scores (<50) indicate significant mismatches or evidence gaps.\\n"
        "AGENT VOX (Technical Interviewer): Based on the 'Ghost Skills', 'Skills Discrepancies', and 'Evidence Gaps' found by the Auditor, directly generate 3-5 highly-tailored, deep-dive technical interview questions to ask this exact candidate in the next round. These should test the exact boundaries of their verified skills or probe their gaps. Put these in 'recommended_questions'.\\n"
        "CRITICAL FOR SUMMARY: The 'summary' must be a highly candidate-specific Executive Overview of who they are, their core technical stack, and their highest-impact achievements. Seamlessly weave in the novelty of this ATS by explaining how you verified their 'Ghost Skills' via GitHub, utilized Autonomous Web Verification via Tavily, and audited them for 'Prestige Bias' and 'Evidence Gaps'. The focus MUST remain on the candidate's actual qualifications while gracefully demonstrating the rigors of our multi-agent verification. Break into 2-3 highly readable paragraphs.\\n"
        "STRICT JSON RULE: If you use line breaks in your summary string, you MUST escape them as \\\\n. The output must be perfectly valid JSON.\\n"
        "State Data: {state}\\n"
        "Output ONLY valid JSON."
    )
    # Safe dump
    safe_state = {
        "candidate": state.get("candidate_name"),
        "trajectory": state.get("career_trajectory"),
        "velocity": state.get("learning_velocity"),
        "skills": state.get("skills_report"),
        "audit": state.get("audit_flags"),
        "jd": state.get("job_description")
    }
    response = llm.invoke(prompt.format_messages(state=json.dumps(safe_state)[:5000]))
    final_json = _clean_json_output(response.content)
    if not isinstance(final_json, dict):
        final_json = {"summary": "Error generating report", "recommended_questions": [], "matching_score": 0}
        
    # Manually inject exact provenance links to guarantee zero hallucination
    provenance_links = []
    
    candidate_linkedin = state.get("candidate_linkedin", "")
    if candidate_linkedin and candidate_linkedin.strip():
        if not candidate_linkedin.startswith("http"):
            candidate_linkedin = "https://" + candidate_linkedin
        if candidate_linkedin not in provenance_links:
            provenance_links.append(candidate_linkedin)
            
    external_data = state.get("external_data", {})
    if isinstance(external_data, dict):
        users_found = external_data.get("users_found", [])
        if users_found:
            for repo in users_found[0].get("repos", []):
                link = repo.get("html_url", "")
                if link and link not in provenance_links:
                    provenance_links.append(link)
    
    for web_ev in state.get("web_evidence", []):
        link = web_ev.get("url", "")
        if link and link.startswith("http") and link not in provenance_links:
            provenance_links.append(link)
            
    final_json["provenance_links"] = provenance_links
    
    return {"final_json": final_json}

def route_after_ingest(state: GraphState):
    if state.get("needs_web_research") and len(state.get("web_search_queries", [])) > 0:
        return "web_research"
    return "trajectory"

def build_graph() -> StateGraph:
    workflow = StateGraph(GraphState)
    
    workflow.add_node("ingest", ingest_node)
    workflow.add_node("web_research", web_research_node)
    workflow.add_node("trajectory", trajectory_node)
    workflow.add_node("velocity", velocity_node)
    workflow.add_node("reasoning", reasoning_node)
    workflow.add_node("auditor", auditor_node)
    workflow.add_node("reporting", reporting_node)
    
    workflow.set_entry_point("ingest")
    workflow.add_conditional_edges("ingest", route_after_ingest, {"web_research": "web_research", "trajectory": "trajectory"})
    workflow.add_edge("web_research", "trajectory")
    workflow.add_edge("trajectory", "velocity")
    workflow.add_edge("velocity", "reasoning")
    workflow.add_edge("reasoning", "auditor")
    
    # Add Conditional Routing (Self-Correction Loop)
    workflow.add_conditional_edges("auditor", should_loop, {"reasoning": "reasoning", "reporting": "reporting"})
    
    workflow.add_edge("reporting", END)
    
    conn = sqlite3.connect("langgraph_checkpoints.db", check_same_thread=False)
    memory = SqliteSaver(conn)
    
    return workflow.compile(checkpointer=memory)

agent_graph = build_graph()
