\# Setup Guide



\## Prerequisites



\- Git, Python 3.11+, Node.js 20+ LTS (see repo root README quick-check

&#x20; commands: `git --version`, `python --version`, `node --version`)

\- A Supabase project (Session Pooler connection string — see architecture

&#x20; note on why not the direct/IPv6-only connection)



\## Backend



```powershell

cd backend

python -m venv venv

.\\venv\\Scripts\\Activate.ps1

pip install -r requirements.txt

```



Create `backend/.env` (see `.env.example` for the full variable list):

DATABASE\_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres

SUPABASE\_URL=https://<ref>.supabase.co

SUPABASE\_PROJECT\_REF=<ref>

SUPABASE\_ANON\_KEY=<anon key>

SUPABASE\_SERVICE\_ROLE\_KEY=<service role key>





Apply migrations and seed test accounts:

```powershell

alembic upgrade head

python -m scripts.seed\_data

```



Run:

```powershell

uvicorn app.main:app --reload

```

Verify: http://127.0.0.1:8000/health should return

`{"status":"healthy","database":"connected"}`.



\## Frontend



```powershell

cd frontend

npm install

```



Create `frontend/.env`:

VITE\_SUPABASE\_URL=https://<ref>.supabase.co

VITE\_SUPABASE\_ANON\_KEY=<anon key>

VITE\_API\_BASE\_URL=http://127.0.0.1:8000



Run:

```powershell

npm run dev

```

Open the printed local URL (typically http://localhost:5173).



\## Test Accounts (from seed\_data.py)



| Role | Email | Password |

|---|---|---|

| CEO | ceo.test@example.com | CeoTest123! |

| HR | hr.test@example.com | HrTest123! |



\## Running Tests



```powershell

cd backend

pytest -v

```

Note: tests run against the real Supabase dev database (no separate

test DB in Phase 1) — see test suite docstrings for the trade-offs.



## PowerShell migration command (Windows)

Run from the backend directory with its virtual environment installed:

```powershell
.\venv\Scripts\python.exe -m alembic current
.\venv\Scripts\python.exe -m alembic heads
.\venv\Scripts\python.exe -m alembic upgrade head
.\venv\Scripts\python.exe -m alembic current
```

The first and final current commands show the database revision. Compare it with heads. Running alembic without activating the backend environment may fail because the executable is not on PATH.
