# Unified Candidate Reasoning (UCR) Multi-Agent ATS

A state-of-the-art Applicant Tracking System (ATS) powered by a decentralized Multi-Agent architecture. This system moves beyond static keyword matching by autonomously verifying candidate claims against external data footprints (GitHub, Professional Web Verification) and auditing for cognitive biases.

---

## 🚀 Key Features

### 🧠 Multi-Agent Pipeline (LangGraph)
- **Ingest Agent**: Extracts identity handles (GitHub/LinkedIn) directly from resumes and fetches deep repository footprints.
- **Agent Lex (Web Researcher)**: Uses Tavily API to autonomously cross-verify professional claims (University/Employer) across the web.
- **Success Velocity Agent**: Analyzes GitHub commit/repo timelines to calculate the speed of skill acquisition.
- **Trajectory Agent**: Performs non-linear career progression analysis against dynamic Hiring Manager criteria.
- **Adversarial Auditor**: Red-teams the entire report to identify hallucinations, evidence gaps, and institutional brand bias.
- **Auto-Reflection Loop**: If the Auditor flags an anomaly, the graph automatically loops back for self-correction.
- **Agent Vox**: Generates targeted, deep-dive technical interview questions based on discovered gaps and "Ghost Skills."

### 🎨 Modern UI/UX (React + Vite + Tailwind)
- **Dynamic Dashboard**: Interactive split-screen view with a Unified Reasoning Report and a Raw State Graph viewer.
- **Cross-Verified Skills Inventory**: A matrix view comparing Job Descriptions, Resume Claims, and verified GitHub/Web evidence.
- **Premium Dark Mode**: Pixels-perfect transition between light and dark themes across all portals.
- **Recruiter & Candidate Flows**: Dedicated portals for job publishing and application verification.

---

## 🛠️ Technical Stack
- **Backend**: Python, FastAPI, LangChain, LangGraph, Groq (Llama-3.1-70B)
- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons, Axios
- **External APIs**: GitHub REST API, Tavily Search API
- **Database**: SQLite (for persistent LangGraph checkpointing)

---

## 🚦 Getting Started

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- [Groq API Key](https://console.groq.com/)
- [Tavily API Key](https://tavily.com/)
- [GitHub Personal Access Token](https://github.com/settings/tokens)

### 2. Setup `.env`
Create a `.env` file in the project root:
```env
GROQ_API_KEY=your_key_here
TAVILY_API_KEY=your_key_here
GITHUB_TOKEN=your_token_here
```

### 3. Run Backend
```bash
cd backend
source venv/bin/activate  # Or create one: python -m venv venv
pip install -r requirements.txt
cd ..
export PYTHONPATH=$(pwd)
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

### 4. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🛡️ Identity & Verification Guardrails
The system implements a **Strict Identity Policy** to prevent false-positive matches for common names. Verification only triggers for handles found explicitly on the document, while professional verification (University/Employer) utilizes name-plus-entity targeting to ensure 100% accuracy.

---

## 📄 License
MIT License - Created for Advanced Agentic Coding.
