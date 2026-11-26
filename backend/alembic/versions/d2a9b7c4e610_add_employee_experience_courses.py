"""Add organization-scoped employee experience and course entries."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "d2a9b7c4e610"
down_revision: Union[str, Sequence[str], None] = "b8e4d2c19a63"
branch_labels = None
depends_on = None


def upgrade() -> None:
    for table_name in ("employee_experiences", "employee_courses"):
        op.create_table(
            table_name,
            sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
            sa.Column(
                "organization_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("organizations.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column(
                "employee_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("employees.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        op.create_index(f"ix_{table_name}_organization_id", table_name, ["organization_id"])
        op.create_index(f"ix_{table_name}_employee_id", table_name, ["employee_id"])

    op.add_column("employee_experiences", sa.Column("company", sa.String(160), nullable=False))
    op.add_column("employee_experiences", sa.Column("role", sa.String(120), nullable=False))
    op.add_column("employee_experiences", sa.Column("duration", sa.String(80), nullable=False))
    op.add_column("employee_experiences", sa.Column("description", sa.Text(), nullable=True))
    op.add_column("employee_courses", sa.Column("name", sa.String(200), nullable=False))


def downgrade() -> None:
    for table_name in ("employee_courses", "employee_experiences"):
        op.drop_index(f"ix_{table_name}_employee_id", table_name=table_name)
        op.drop_index(f"ix_{table_name}_organization_id", table_name=table_name)
        op.drop_table(table_name)