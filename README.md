# React + FastAPI Project

This project features a React frontend and a FastAPI backend.

## Project Structure
- `testingarea/` (Root)
  - `src/` - React frontend source
  - `backend/` - FastAPI backend source

## Getting Started

### 1. Backend (FastAPI)
Navigate to the `backend` directory and set up your environment:

```bash
cd backend
python -m venv venv
# On Windows
.\venv\Scripts\activate
# On Mac/Linux
source venv/bin/activate

pip install -r requirements.txt
python main.py
```
The backend will run at `http://localhost:8000`.

### 2. Frontend (React)
In the root directory:

```bash
npm install
npm start
```
The frontend will run at `http://localhost:3000`.
