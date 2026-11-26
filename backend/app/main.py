from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (
    auth, dashboard, departments, directory, employee_requests, employees,
    financial_periods, gl_accounts, health, issues, journal_entries, me,
    notifications, organizations, parties, payroll, platform, profile_changes,
    projects, reports, skills, tickets,
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

for route_module in (
    health, auth, departments, directory, employees, employee_requests, dashboard,
    gl_accounts, financial_periods, journal_entries, parties, reports, payroll,
    skills, projects, tickets, notifications, issues, me, profile_changes,
    organizations, platform,
):
    app.include_router(route_module.router)
