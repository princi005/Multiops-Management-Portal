"""add employee resumes

Revision ID: 7d2f4a9c1b60
Revises: ef59b4a87ae3
Create Date: 2026-11-04 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7d2f4a9c1b60'
down_revision: Union[str, Sequence[str], None] = 'ef59b4a87ae3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('employee_resumes',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('employee_id', sa.UUID(), nullable=False),
    sa.Column('original_filename', sa.String(length=255), nullable=False),
    sa.Column('content_type', sa.String(length=100), nullable=False),
    sa.Column('size_bytes', sa.Integer(), nullable=False),
    sa.Column('storage_key', sa.String(length=255), nullable=False),
    sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('employee_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('employee_resumes')