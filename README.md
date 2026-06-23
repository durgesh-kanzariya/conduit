# Frontline AI Triage

A decoupled full-stack application designed for real-time triage and sanitization of chaotic unstructured payloads. Built using FastAPI, React + Vite + Tailwind CSS v4, and Groq's Llama 3.3 70B Versatile model.

## Directory Structure

```
frontline-ai-triage/
├── backend/            # FastAPI python application
│   ├── app/            # Source code
│   │   ├── engine/     # AI routing and evaluations
│   │   └── utils/      # Parsing and sanitization routines
│   └── data/           # Test suites and expected targets
└── frontend/           # React dashboard application
```

## Quick Start

### Backend
1. Initialize a Python virtual environment in `backend/` and activate it.
2. Install dependencies: `pip install -r requirements.txt`
3. Copy `backend/.env.example` to `backend/.env` and set your `GROQ_API_KEY`.
4. Run the development server: `uvicorn app.main:app --reload --port 8000`

### Frontend
1. Navigate to `frontend/` and run `npm install`.
2. Start the development server: `npm run dev` (running at `http://localhost:5173`)
