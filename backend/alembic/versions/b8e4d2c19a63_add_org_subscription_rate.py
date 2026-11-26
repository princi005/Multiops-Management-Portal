"""Add manually entered organization subscription rate."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b8e4d2c19a63"
down_revision: Union[str, Sequence[str], None] = "a8c41e72d905"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("organizations", sa.Column("subscription_rate_amount", sa.Numeric(12, 2), nullable=True))
    op.add_column("organizations", sa.Column("subscription_rate_currency", sa.String(3), nullable=True))
    op.add_column("organizations", sa.Column("subscription_rate_period", sa.String(40), nullable=True))


def downgrade() -> None:
    op.drop_column("organizations", "subscription_rate_period")
    op.drop_column("organizations", "subscription_rate_currency")
    op.drop_column("organizations", "subscription_rate_amount")