"""Scope profile-change requests to an organization."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "f4a7c2d91e60"
down_revision: Union[str, Sequence[str], None] = "e7c4a2d91b60"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "profile_change_requests",
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_profile_change_requests_organization_id",
        "profile_change_requests",
        "organizations",
        ["organization_id"],
        ["id"],
        ondelete="CASCADE",
    )

    op.execute(
        """
        UPDATE profile_change_requests AS request
        SET organization_id = scoped.organization_id
        FROM (
            SELECT
                employee.id AS employee_id,
                MIN(member.organization_id::text)::uuid AS organization_id
            FROM employees AS employee
            JOIN organization_members AS member
              ON member.user_id = employee.user_id
             AND member.is_active IS TRUE
            GROUP BY employee.id
            HAVING COUNT(member.organization_id) = 1
        ) AS scoped
        WHERE request.employee_id = scoped.employee_id
        """
    )

    op.create_index(
        "ix_profile_change_requests_organization_id",
        "profile_change_requests",
        ["organization_id"],
    )
    op.drop_index(
        "uq_profile_change_one_pending",
        table_name="profile_change_requests",
    )
    op.create_index(
        "uq_profile_change_one_pending",
        "profile_change_requests",
        ["organization_id", "employee_id", "field"],
        unique=True,
        postgresql_where=sa.text(
            "status = 'pending' AND field <> 'general'"
        ),
    )


def downgrade() -> None:
    op.drop_index(
        "uq_profile_change_one_pending",
        table_name="profile_change_requests",
    )
    op.create_index(
        "uq_profile_change_one_pending",
        "profile_change_requests",
        ["employee_id", "field"],
        unique=True,
        postgresql_where=sa.text(
            "status = 'pending' AND field <> 'general'"
        ),
    )
    op.drop_index(
        "ix_profile_change_requests_organization_id",
        table_name="profile_change_requests",
    )
    op.drop_constraint(
        "fk_profile_change_requests_organization_id",
        "profile_change_requests",
        type_="foreignkey",
    )
    op.drop_column("profile_change_requests", "organization_id")