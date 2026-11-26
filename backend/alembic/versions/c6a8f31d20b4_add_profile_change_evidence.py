"""Store evidence files attached to legal-name profile requests."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "c6a8f31d20b4"
down_revision: Union[str, Sequence[str], None] = "c5f82d70a416"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "profile_change_evidence",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "request_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("profile_change_requests.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "employee_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("employees.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "uploaded_by_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("content_type", sa.String(100), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("storage_key", sa.String(500), nullable=False),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index(
        "ix_profile_change_evidence_organization_id",
        "profile_change_evidence",
        ["organization_id"],
    )
    op.create_index(
        "ix_profile_change_evidence_request_id",
        "profile_change_evidence",
        ["request_id"],
    )
    op.create_index(
        "ix_profile_change_evidence_employee_id",
        "profile_change_evidence",
        ["employee_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_profile_change_evidence_employee_id", table_name="profile_change_evidence")
    op.drop_index("ix_profile_change_evidence_request_id", table_name="profile_change_evidence")
    op.drop_index("ix_profile_change_evidence_organization_id", table_name="profile_change_evidence")
    op.drop_table("profile_change_evidence")