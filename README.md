# HireFlow AI

## Folder Structure

```text
HireFlow AI
├── frontend
│   ├── index.html
│   ├── src
│   │   └── portals
│   ├── styles.css
│   └── vite.config.js
├── backend
│   ├── main.py
│   ├── routers
│   ├── schemas.py
│   └── services
├── .github
│   └── workflows
├── Dockerfile
├── requirements.txt
├── STUDENT_HR_WORKFLOWS.md
└── README.md
```

## What The App Does

- The home page is a public landing page.
- Clicking `Login` opens a login chooser screen.
- The login chooser lets the user enter either the Student portal or the HR / Recruiter portal.
- The Student portal focuses on resume analysis and career guidance.
- The HR portal focuses on candidate screening, parsing job descriptions, ranking applicants, and dashboard-style summaries.

## Running Locally

Open two terminals.

Backend:

```bash
source .venv/bin/activate
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Then open `http://127.0.0.1:3000`.

## Frontend Structure

- `frontend/src/App.jsx` controls the page flow: home, login, Student portal, and HR portal.
- `frontend/src/portals/StudentPortal.jsx` contains the Student experience.
- `frontend/src/portals/HRPortal.jsx` contains the recruiter experience.
- `frontend/styles.css` controls the visual design for the landing page, login screen, and both portals.

## Backend Structure

- `backend/main.py` creates the FastAPI app and registers routers.
- `backend/routers/` contains thin route files.
- `backend/services/` contains the actual resume, HR, and text-processing logic.
- `backend/schemas.py` contains the request models shared by the routes.

## Notes

- `frontend/` is now a Vite React app.
- `backend/` contains the FastAPI app.
- `Dockerfile` builds the backend container.
