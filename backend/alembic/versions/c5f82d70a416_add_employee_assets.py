"""Add organization-scoped employee assets and IT requests."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "c5f82d70a416"
down_revision: Union[str, Sequence[str], None] = "f4a7c2d91e60"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "employee_assets",
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
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("device_id", sa.String(80), nullable=False),
        sa.Column("status", sa.String(30), server_default="in_use", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "status IN ('in_use', 'needs_attention', 'under_repair')",
            name="ck_employee_assets_status",
        ),
        sa.UniqueConstraint(
            "organization_id", "device_id", name="uq_employee_assets_org_device_id"
        ),
    )
    op.create_index("ix_employee_assets_organization_id", "employee_assets", ["organization_id"])
    op.create_index("ix_employee_assets_employee_id", "employee_assets", ["employee_id"])

    op.create_table(
        "employee_asset_requests",
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
        sa.Column(
            "asset_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("employee_assets.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("request_type", sa.String(20), nullable=False),
        sa.Column("support_team", sa.String(40), server_default="IT", nullable=False),
        sa.Column("details", sa.Text(), nullable=False),
        sa.Column("status", sa.String(20), server_default="open", nullable=False),
        sa.Column("response", sa.Text(), nullable=True),
        sa.Column(
            "handled_by_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "request_type IN ('repair', 'replacement', 'other_issue')",
            name="ck_employee_asset_requests_type",
        ),
        sa.CheckConstraint(
            "status IN ('open', 'in_progress', 'resolved', 'withdrawn')",
            name="ck_employee_asset_requests_status",
        ),
    )
    op.create_index(
        "ix_employee_asset_requests_organization_id",
        "employee_asset_requests",
        ["organization_id"],
    )
    op.create_index(
        "ix_employee_asset_requests_employee_id",
        "employee_asset_requests",
        ["employee_id"],
    )
    op.create_index(
        "ix_employee_asset_requests_asset_id",
        "employee_asset_requests",
        ["asset_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_employee_asset_requests_asset_id", table_name="employee_asset_requests")
    op.drop_index("ix_employee_asset_requests_employee_id", table_name="employee_asset_requests")
    op.drop_index("ix_employee_asset_requests_organization_id", table_name="employee_asset_requests")
    op.drop_table("employee_asset_requests")

    op.drop_index("ix_employee_assets_employee_id", table_name="employee_assets")
    op.drop_index("ix_employee_assets_organization_id", table_name="employee_assets")
    op.drop_table("employee_assets")