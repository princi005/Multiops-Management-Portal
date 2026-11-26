"""Scope HR departments and employee requests to organizations."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "e2f4a91c7b60"
down_revision: Union[str, Sequence[str], None] = "d7b1c9a4e630"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "departments",
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_departments_organization_id",
        "departments",
        "organizations",
        ["organization_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index("ix_departments_organization_id", "departments", ["organization_id"])

    op.add_column(
        "employee_requests",
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_employee_requests_organization_id",
        "employee_requests",
        "organizations",
        ["organization_id"],
        ["id"],
        ondelete="CASCADE",
    )
    op.create_index(
        "ix_employee_requests_organization_id",
        "employee_requests",
        ["organization_id"],
    )

    op.execute(
        """
        UPDATE departments AS department
        SET organization_id = scoped.organization_id
        FROM (
            SELECT
                employee.department_id,
                MIN(member.organization_id::text)::uuid AS organization_id
            FROM employees AS employee
            JOIN organization_members AS member
              ON member.user_id = employee.user_id
             AND member.is_active IS TRUE
            WHERE employee.department_id IS NOT NULL
            GROUP BY employee.department_id
            HAVING COUNT(DISTINCT member.organization_id) = 1
        ) AS scoped
        WHERE department.id = scoped.department_id
        """
    )

    op.execute(
        """
        UPDATE employee_requests AS request
        SET organization_id = scoped.organization_id
        FROM (
            SELECT
                member.user_id,
                MIN(member.organization_id::text)::uuid AS organization_id
            FROM organization_members AS member
            WHERE member.is_active IS TRUE
            GROUP BY member.user_id
            HAVING COUNT(DISTINCT member.organization_id) = 1
        ) AS scoped
        WHERE request.requested_by_id = scoped.user_id
        """
    )


def downgrade() -> None:
    op.drop_index("ix_employee_requests_organization_id", table_name="employee_requests")
    op.drop_constraint(
        "fk_employee_requests_organization_id",
        "employee_requests",
        type_="foreignkey",
    )
    op.drop_column("employee_requests", "organization_id")

    op.drop_index("ix_departments_organization_id", table_name="departments")
    op.drop_constraint(
        "fk_departments_organization_id",
        "departments",
        type_="foreignkey",
    )
    op.drop_column("departments", "organization_id")