# HireFlow AI

HireFlow AI is a runnable MVP for the portfolio concept described in `read.md`.

It includes:

- Student portal flows for resume analysis, job matching, resume improvement, cover letters, interview prep, career advice, and role-specific resume versions.
- HR portal flows for JD parsing, candidate screening, candidate ranking, assessment generation, assessment evaluation, interview scheduling, HR chat, and analytics.
- A FastAPI backend with deterministic AI-style heuristics so the app works without external model keys.

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

Then open `http://127.0.0.1:8000`.

## Notes

- The UI is served directly by FastAPI.
- The scoring and generation logic is heuristic-based, but the API shape is structured so a real LLM or vector store can be added later without changing the frontend contract.
