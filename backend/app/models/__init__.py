"""
Importing every model here ensures Base.metadata is fully populated
before Alembic (or anything else) inspects it — required for
--autogenerate to detect all tables.
"""

from app.models.department import Department  # noqa: F401
from app.models.employee import Employee, EmploymentStatus  # noqa: F401
from app.models.permission import Permission  # noqa: F401
from app.models.role import Role  # noqa: F401
from app.models.role_permission import RolePermission  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.user_role import UserRole  # noqa: F401