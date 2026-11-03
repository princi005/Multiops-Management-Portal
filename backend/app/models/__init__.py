"""
Importing every model here ensures Base.metadata is fully populated
before Alembic (or anything else) inspects it.
"""

from app.models.audit_log import AuditLog  # noqa: F401
from app.models.department import Department  # noqa: F401
from app.models.employee import AvailabilityStatus, Employee, EmploymentStatus  # noqa: F401
from app.models.employee_request import EmployeeRequest, RequestStatus, RequestType  # noqa: F401
from app.models.employee_skill import EmployeeSkill  # noqa: F401
from app.models.financial_period import FinancialPeriod, PeriodStatus  # noqa: F401
from app.models.gl_account import AccountType, GLAccount  # noqa: F401
from app.models.journal_entry import JournalEntry, JournalEntryStatus  # noqa: F401
from app.models.journal_entry_line import JournalEntryLine  # noqa: F401
from app.models.party import Party, PartyType  # noqa: F401
from app.models.payroll_profile import PayFrequency, PayrollProfile, PayrollProfileStatus  # noqa: F401
from app.models.permission import Permission  # noqa: F401
from app.models.project import Project, ProjectStatus  # noqa: F401
from app.models.project_member import ProjectMember  # noqa: F401
from app.models.role import Role  # noqa: F401
from app.models.role_permission import RolePermission  # noqa: F401
from app.models.salary_history import SalaryHistory  # noqa: F401
from app.models.skill import Skill  # noqa: F401
from app.models.ticket import Ticket, TicketStatus  # noqa: F401
from app.models.ticket_log import TicketLog  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.user_role import UserRole  # noqa: F401