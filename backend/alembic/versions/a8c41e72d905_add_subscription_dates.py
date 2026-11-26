"""Add subscription expiry and renewal timestamps."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a8c41e72d905"
down_revision: Union[str, Sequence[str], None] = "f2a6c9d31e70"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("organizations", sa.Column("subscription_expires_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("organizations", sa.Column("subscription_renews_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("organizations", "subscription_renews_at")
    op.drop_column("organizations", "subscription_expires_at")