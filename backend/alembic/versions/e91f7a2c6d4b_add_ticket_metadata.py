"""Add ticket priority, progress, due date, and approval state."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "e91f7a2c6d4b"
down_revision: Union[str, Sequence[str], None] = "d8f1c3a5b720"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("tickets", sa.Column("priority", sa.String(length=30), nullable=False, server_default="normal"))
    op.add_column("tickets", sa.Column("progress_percent", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("tickets", sa.Column("due_date", sa.Date(), nullable=True))
    op.add_column("tickets", sa.Column("approval_status", sa.String(length=20), nullable=False, server_default="not_requested"))
    op.create_check_constraint(
        "ck_ticket_progress_percent",
        "tickets",
        "progress_percent >= 0 AND progress_percent <= 100",
    )


def downgrade() -> None:
    op.drop_constraint("ck_ticket_progress_percent", "tickets", type_="check")
    op.drop_column("tickets", "approval_status")
    op.drop_column("tickets", "due_date")
    op.drop_column("tickets", "progress_percent")
    op.drop_column("tickets", "priority")
