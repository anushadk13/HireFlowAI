# HireFlow AI

## Folder Structure

```text
HireFlow AI
├── frontend
│   ├── index.html
│   ├── src
│   ├── styles.css
│   └── vite.config.js
├── backend
├── .github
│   └── workflows
├── Dockerfile
├── requirements.txt
└── README.md
```

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

## Notes

- `frontend/` is now a Vite React app.
- `backend/` contains the FastAPI app.
- `Dockerfile` builds the backend container.
