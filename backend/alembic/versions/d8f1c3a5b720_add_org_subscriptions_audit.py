"""Add organization subscription metadata and admin audit log."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "d8f1c3a5b720"
down_revision: Union[str, Sequence[str], None] = "c2a7f4d91e30"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("organizations", sa.Column("subscription_plan", sa.String(40), nullable=False, server_default="trial"))
    op.add_column("organizations", sa.Column("subscription_status", sa.String(30), nullable=False, server_default="trial"))
    op.add_column("organizations", sa.Column("subscription_reference", sa.String(120), nullable=True))
    op.create_table(
        "organization_admin_logs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("actor_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(80), nullable=False),
        sa.Column("details", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_org_admin_logs_org", "organization_admin_logs", ["organization_id"])


def downgrade() -> None:
    op.drop_index("ix_org_admin_logs_org", table_name="organization_admin_logs")
    op.drop_table("organization_admin_logs")
    op.drop_column("organizations", "subscription_reference")
    op.drop_column("organizations", "subscription_status")
    op.drop_column("organizations", "subscription_plan")
