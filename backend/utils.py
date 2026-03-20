import os
import fitz  # PyMuPDF
import docx
import requests
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS

import io

def extract_text_from_bytes(file_bytes: bytes, filename: str) -> str:
    """Extract text from a PDF or DOCX file byte stream."""
    ext = filename.split('.')[-1].lower()
    text = ""
    try:
        if ext == 'pdf':
            doc = fitz.open(stream=file_bytes, filetype="pdf")
            for page in doc:
                text += page.get_text()
            doc.close()
        elif ext in ['docx', 'doc']:
            doc = docx.Document(io.BytesIO(file_bytes))
            for para in doc.paragraphs:
                text += para.text + "\n"
        else:
            text = file_bytes.decode('utf-8', errors='ignore')
    except Exception as e:
        print(f"Error extracting text: {e}")
        text = "Error extracting text."
    return text

def search_github(name: str, email: str = "", github_handle: str = "") -> dict:
    """Search GitHub for user repos by name, email, or exact username."""
    results = {"users_found": []}
    
    token = os.getenv("GITHUB_TOKEN")
    
    if not token or (not name and not email and not github_handle):
        # Fallback immediately if no token
        try:
            with DDGS() as ddgs:
                query = github_handle or email or name
                ddg_results = [r for r in ddgs.text(f"{query} github profile", max_results=3)]
                results["fallback_search"] = ddg_results
        except Exception as e:
            results["fallback_search_error"] = str(e)
        return results
    
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }

    users = []
    
    # Highest Priority: Exact GitHub Handle
    if github_handle:
        resp = requests.get(f"https://api.github.com/users/{github_handle}", headers=headers)
        if resp.status_code == 200:
            users = [resp.json()]
            
    # Second Priority: Exact Email search
    if not users and email:
        resp = requests.get(f"https://api.github.com/search/users?q={email} in:email", headers=headers)
        if resp.status_code == 200:
            users = resp.json().get("items", [])

    # Third Priority: Exact fullname search
    if not users and name:
        resp = requests.get(f'https://api.github.com/search/users?q="{name}" in:fullname', headers=headers)
        if resp.status_code == 200:
            users = resp.json().get("items", [])

    for user in users[:1]:  # Just use the single best user match
        user_data = {
            "login": user["login"],
            "url": user.get("html_url", ""),
            "repos": []
        }
        
        # Fetch repos for the user to determine true language footprint
        repos_url = user.get("repos_url", "")
        if repos_url:
            repo_resp = requests.get(repos_url + "?per_page=10&sort=updated", headers=headers)
            if repo_resp.status_code == 200:
                repos = repo_resp.json()
                for repo in repos:
                    user_data["repos"].append({
                        "name": repo.get("name", ""),
                        "html_url": repo.get("html_url", ""),
                        "description": repo.get("description", ""),
                        "language": repo.get("language", ""),
                        "created_at": repo.get("created_at", ""),
                        "updated_at": repo.get("updated_at", "")
                    })
        results["users_found"].append(user_data)
        
    # Fallback to DDG if absolutely nothing found
    if not results["users_found"]:
        with DDGS() as ddgs:
            query = github_handle or email or name
            ddg_results = [r for r in ddgs.text(f"{query} github profile", max_results=3)]
            results["fallback_search"] = ddg_results
            
    return results

def fallback_search(query: str) -> list:
    """Fallback search using DDG."""
    try:
        with DDGS() as ddgs:
            results = [r for r in ddgs.text(query, max_results=3)]
            return results
    except Exception as e:
        return [{"error": str(e)}]
