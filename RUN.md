# How to Run Smart Study Scheduler

## Prerequisites

- **Node.js** 18+ (for frontend)
- **Python** 3.11+ (for backend)
- **MongoDB** (local: `mongodb://localhost:27017` or MongoDB Atlas)
- **PowerShell** or **Command Prompt** (Windows)

---

## 1. MongoDB

The backend uses MongoDB. Start it so it’s reachable at `mongodb://localhost:27017`.

**Local MongoDB (Windows):**

- If installed as a service: it may already be running.
- Or from a terminal: `mongod` (default data dir and port 27017).

**MongoDB Atlas:**

- Create a cluster and get a connection string.
- In `backend/.env`, set `MONGO_URI=` to that string.

---

## 2. Backend (Flask)

```powershell
cd "c:\Users\jay likhar\OneDrive\Desktop\Smart Study Scheduler\backend"
```

**First time only:**

```powershell
# Create virtual environment
python -m venv .venv

# Activate (PowerShell)
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy env and edit if needed (Atlas, ports, etc.)
copy .env.example .env
```

**Start the server:**

```powershell
.\.venv\Scripts\Activate.ps1
python app.py
```

- API: **http://localhost:5000**
- Health: http://localhost:5000/api/health → `{"ok":true,"service":"smart-study-scheduler-api"}`

Leave this terminal open.

---

## 3. Frontend (React + Vite)

Open a **new** terminal:

```powershell
cd "c:\Users\jay likhar\OneDrive\Desktop\Smart Study Scheduler\frontend"
```

**First time only:**

```powershell
npm install

# Create .env if it doesn’t exist
copy .env.example .env
```

**Start the dev server:**

```powershell
npm run dev
```

- App: **http://localhost:5173** (or 5174 if 5173 is in use)
- If the URL changes, set `CLIENT_ORIGIN` in `backend/.env` to match (e.g. `http://localhost:5174`).

---

## 4. Env quick reference

| File | Variable | Example |
|------|----------|---------|
| `backend/.env` | `MONGO_URI` | `mongodb://localhost:27017/smart_study_scheduler` |
| `backend/.env` | `CLIENT_ORIGIN` | `http://localhost:5173` (or 5174) |
| `backend/.env` | `JWT_SECRET` | Any long random string (change in production) |
| `frontend/.env` | `VITE_API_BASE_URL` | `http://localhost:5000` |

---

## 5. One‑off “first run” (PowerShell)

From the project root:

```powershell
# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
python app.py
# (keep running; use a new terminal for frontend)

# Frontend (new terminal)
cd frontend
npm install
copy .env.example .env
npm run dev
```

Then open **http://localhost:5173**, register, and use the app.

---

## 6. Build for production

**Frontend:**

```powershell
cd frontend
npm run build
```

Output: `frontend/dist/`. Serve with any static host (Nginx, Vercel, Netlify, etc.).

**Backend:**

Use a production WSGI server, e.g. **Gunicorn** (Linux/Mac) or **waitress** (Windows):

```powershell
pip install waitress
waitress-serve --host=0.0.0.0 --port=5000 app:app
```

Set `FLASK_DEBUG=0` and a strong `JWT_SECRET` in production. Set `CLIENT_ORIGIN` to your deployed frontend URL (e.g. `https://your-app.vercel.app`) so CORS allows requests.
