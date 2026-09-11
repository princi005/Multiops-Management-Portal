"""
Response shape for the CEO dashboard. Intentionally simple for Phase 1 —
counts and a status breakdown. Knowledge Health Score, project
intelligence, etc. are future-phase additions per the architecture doc.
"""

from pydantic import BaseModel


class DepartmentHeadcount(BaseModel):
    department_name: str
    employee_count: int


class EmploymentStatusBreakdown(BaseModel):
    status: str
    count: int


class CeoDashboardSummary(BaseModel):
    total_employees: int
    total_departments: int
    active_employees: int
    department_breakdown: list[DepartmentHeadcount]
    status_breakdown: list[EmploymentStatusBreakdown]