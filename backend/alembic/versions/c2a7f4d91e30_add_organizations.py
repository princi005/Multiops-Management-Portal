"""Add organization, membership, platform admin, and organization settings."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "c2a7f4d91e30"
down_revision: Union[str, Sequence[str], None] = "b1d4e8a6c903"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("slug", sa.String(80), nullable=False, unique=True),
        sa.Column("domain", sa.String(255), nullable=True, unique=True),
        sa.Column("company_prefix", sa.String(12), nullable=False, server_default="MTO"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_organizations_slug", "organizations", ["slug"])
    op.create_table(
        "organization_members",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", sa.String(40), nullable=False, server_default="employee"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("organization_id", "user_id", name="uq_org_member_user"),
    )
    op.create_index("ix_organization_members_org", "organization_members", ["organization_id"])
    op.create_index("ix_organization_members_user", "organization_members", ["user_id"])
    op.create_table(
        "platform_admins",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_table(
        "organization_settings",
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("config", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("organization_settings")
    op.drop_table("platform_admins")
    op.drop_index("ix_organization_members_user", table_name="organization_members")
    op.drop_index("ix_organization_members_org", table_name="organization_members")
    op.drop_table("organization_members")
    op.drop_index("ix_organizations_slug", table_name="organizations")
    op.drop_table("organizations")
