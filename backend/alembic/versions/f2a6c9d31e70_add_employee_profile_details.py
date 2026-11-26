"""Add organization-scoped employee profile details."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "f2a6c9d31e70"
down_revision: Union[str, Sequence[str], None] = "e91f7a2c6d4b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "employee_profile_details",
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
        sa.Column("personal_email", sa.String(255), nullable=True),
        sa.Column("date_of_birth", sa.Date(), nullable=True),
        sa.Column("linkedin_url", sa.String(500), nullable=True),
        sa.Column("about", sa.Text(), nullable=True),
        sa.Column("hobbies", sa.Text(), nullable=True),
        sa.Column("current_address", sa.Text(), nullable=True),
        sa.Column("permanent_address", sa.Text(), nullable=True),
        sa.Column("emergency_contact_name", sa.String(200), nullable=True),
        sa.Column("emergency_contact_relationship", sa.String(100), nullable=True),
        sa.Column("emergency_contact_phone", sa.String(30), nullable=True),
        sa.Column("married", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("spouse_name", sa.String(200), nullable=True),
        sa.Column("spouse_profession", sa.String(200), nullable=True),
        sa.Column("children", sa.Text(), nullable=True),
        sa.Column("parents_or_guardians", sa.Text(), nullable=True),
        sa.Column("blood_group", sa.String(3), nullable=True),
        sa.Column("allergies", sa.Text(), nullable=True),
        sa.Column("health_conditions", sa.Text(), nullable=True),
        sa.Column("medications", sa.Text(), nullable=True),
        sa.Column("birthday_visible", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("work_anniversary_visible", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("organization_id", "employee_id", name="uq_employee_profile_org_employee"),
    )
    op.create_index(
        "ix_employee_profile_details_org",
        "employee_profile_details",
        ["organization_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_employee_profile_details_org", table_name="employee_profile_details")
    op.drop_table("employee_profile_details")