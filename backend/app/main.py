"""
FastAPI application entry point.
Run with: uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    auth,
    dashboard,
    departments,
    employee_requests,
    employees,
    financial_periods,
    gl_accounts,
    health,
    journal_entries,
    me,
    parties,
    payroll,
    projects,
    reports,
    skills,
    tickets,
)
from app.core.config import get_settings

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(departments.router)
app.include_router(employees.router)
app.include_router(employee_requests.router)
app.include_router(dashboard.router)
app.include_router(gl_accounts.router)
app.include_router(financial_periods.router)
app.include_router(journal_entries.router)
app.include_router(parties.router)
app.include_router(reports.router)
app.include_router(payroll.router)
app.include_router(skills.router)
app.include_router(projects.router)
app.include_router(tickets.router)
app.include_router(me.router)