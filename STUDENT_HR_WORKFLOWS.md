# Student And HR Workflows

## Student Flow

1. Open the app and click `Login`.
2. Select `Login as Student`.
3. The Student portal opens.
4. The student can:
   - Paste a resume and job description.
   - Run resume analysis.
   - Generate a cover letter.
   - Generate interview prep questions.
   - Ask the career advisor for guidance.
5. The portal sends requests to the backend endpoints under `/api/resume/*` and `/api/career-advisor`.

### Student Backend Endpoints

- `POST /api/resume/analyze`
- `POST /api/resume/match`
- `POST /api/resume/improve`
- `POST /api/resume/cover-letter`
- `POST /api/resume/interview-prep`
- `POST /api/career-advisor`
- `GET /api/resume/versions`

## HR Flow

1. Open the app and click `Login`.
2. Select `Login as HR / Recruiter`.
3. The HR portal opens.
4. The HR user can:
   - Paste a job description and extract structured requirements.
   - Load or paste a candidate resume and screen it.
   - Paste a JSON list of candidates and rank them.
   - View dashboard-style summary data.
5. The portal sends requests to the backend endpoints under `/api/hr/*` and `/api/analytics`.

### HR Backend Endpoints

- `POST /api/hr/parse-jd`
- `POST /api/hr/screen`
- `POST /api/hr/rank`
- `POST /api/hr/assessment`
- `POST /api/hr/evaluate-assessment`
- `POST /api/hr/schedule-interview`
- `POST /api/hr/chat`
- `GET /api/hr/dashboard`
- `GET /api/analytics`

## Shared Design

- The frontend is a Vite React app.
- The backend is a FastAPI app.
- The frontend talks to the backend on `http://127.0.0.1:8000`.
- The landing page is separate from the login screen.
- The login screen is only a role selector, not the actual portal.

## File Map

- `frontend/src/App.jsx` controls routing between home, login, Student, and HR views.
- `frontend/src/portals/StudentPortal.jsx` handles Student interactions.
- `frontend/src/portals/HRPortal.jsx` handles HR interactions.
- `backend/routers/resume.py` handles Student-related API routes.
- `backend/routers/hr.py` handles HR-related API routes.
