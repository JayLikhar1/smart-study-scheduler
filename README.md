# Smart Study Scheduler (AI-Powered)

A full-stack web app for **engineering students** to create personalized, adaptive study plans. It combines rule-based scheduling, ML-based time prediction, and progress analytics.

---

## Tech Stack

| Layer    | Technology                         |
|----------|------------------------------------|
| Frontend | React, Vite, Tailwind CSS, React Router, Chart.js |
| Backend  | Python Flask (REST API)            |
| Database | MongoDB                            |
| Auth     | JWT (bcrypt for passwords)         |
| AI / ML  | scikit-learn (Linear Regression, K-Means) |

---

## Features

- **Auth** — Register, login, JWT-protected routes, session handling
- **Subjects & tasks** — Add subjects; create tasks with topic, difficulty, estimated time, deadline
- **Smart scheduling** — Rule-based engine: sort by deadline and difficulty, distribute into daily study minutes, persist schedules
- **Adaptive rescheduling** — Missed tasks are rescheduled; after 2 misses, daily workload is reduced; near-deadline tasks are prioritized
- **Progress & analytics** — Completion %, study streak, subject-wise time; Chart.js (doughnut, line, bar)
- **AI / ML** — Linear Regression to predict study time from history; K-Means for productivity-pattern clustering; explainable outputs
- **Notifications** — Study reminders (from today’s schedule), missed-task alerts, in-app dropdown
- **Responsive UI** — Mobile-friendly layout, collapsible sidebar, touch-friendly controls

---

## Project structure

```
Smart Study Scheduler/
├── frontend/          # React + Vite + Tailwind
│   ├── src/
│   │   ├── auth/      # AuthContext, RequireAuth
│   │   ├── layouts/   # AppLayout, AuthLayout
│   │   ├── lib/       # api, authToken
│   │   ├── pages/     # Dashboard, Tasks, CreateSchedule, Progress, Login, Register
│   │   └── ui/        # Button, Card, SidebarNav, TopBar, NotificationsDropdown, etc.
│   └── package.json
├── backend/           # Flask API
│   ├── src/
│   │   ├── db/        # MongoDB connection
│   │   ├── models/    # User, Subject, Task
│   │   ├── routes/    # auth, subjects, tasks, schedule, analytics, ml, notifications
│   │   └── services/  # auth_middleware, jwt, password, scheduler, analytics, ml
│   ├── app.py
│   └── requirements.txt
├── RUN.md             # How to run (dev and production)
└── README.md
```

---

## How to run

**Prerequisites:** Node.js 18+, Python 3.11+, MongoDB (local or Atlas).

1. **MongoDB** — Run locally or set `MONGO_URI` in `backend/.env`.
2. **Backend** — See [RUN.md](./RUN.md#2-backend-flask): `python -m venv .venv`, `pip install -r requirements.txt`, `copy .env.example .env`, `python app.py` → http://localhost:5000
3. **Frontend** — See [RUN.md](./RUN.md#3-frontend-react--vite): `npm install`, `copy .env.example .env`, `npm run dev` → http://localhost:5173

**Env (summary):**

- `backend/.env`: `MONGO_URI`, `CLIENT_ORIGIN` (frontend URL), `JWT_SECRET`
- `frontend/.env`: `VITE_API_BASE_URL=http://localhost:5000`

Full steps, production build, and WSGI: **[RUN.md](./RUN.md)**.

---

## Deployment

- **Frontend:** `npm run build` → serve `frontend/dist/` (e.g. Vercel, Netlify, Nginx).
- **Backend:** Use a WSGI server (e.g. **waitress** on Windows, **gunicorn** on Linux):  
  `waitress-serve --host=0.0.0.0 --port=5000 app:app`
- **Production:** Set `FLASK_DEBUG=0`, a strong `JWT_SECRET`, and `CLIENT_ORIGIN` to the deployed frontend URL (e.g. `https://your-app.vercel.app`). Use MongoDB Atlas or a production MongoDB instance.

---

## Resume-ready summary

**Smart Study Scheduler** is a full-stack, AI-augmented study planner for engineering students. I designed and built the **Flask REST API** (JWT auth, MongoDB, bcrypt), the **React + Tailwind** frontend with **Chart.js** for analytics, and a **rule-based + ML scheduling engine** (deadline/difficulty ordering, adaptive rescheduling, Linear Regression for time prediction, K-Means for productivity-pattern clustering). The app includes in-app **notifications** (study reminders, missed-task alerts), a **responsive** UI with a mobile sidebar, and end-to-end flows from registration through task creation, schedule generation, progress tracking, and explainable ML insights.

---

## License

MIT (or your choice).
