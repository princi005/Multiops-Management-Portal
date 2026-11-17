"""add profile change requests

Revision ID: a41c8e2b9d35
Revises: 7d2f4a9c1b60
Create Date: 2026-11-05 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a41c8e2b9d35'
down_revision: Union[str, Sequence[str], None] = '7d2f4a9c1b60'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('profile_change_requests',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('employee_id', sa.UUID(), nullable=False),
    sa.Column('field', sa.String(length=30), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('old_value', sa.Text(), nullable=True),
    sa.Column('new_value', sa.Text(), nullable=False),
    sa.Column('reason', sa.Text(), nullable=True),
    sa.Column('decided_by_id', sa.UUID(), nullable=True),
    sa.Column('decision_note', sa.Text(), nullable=True),
    sa.Column('decided_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("status IN ('pending', 'approved', 'rejected', 'cancelled')", name='ck_profile_change_status'),
    sa.CheckConstraint("field IN ('full_name', 'phone')", name='ck_profile_change_field'),
    sa.ForeignKeyConstraint(['decided_by_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_profile_change_requests_employee_id'), 'profile_change_requests', ['employee_id'], unique=False)
    op.create_index(
        'uq_profile_change_one_pending',
        'profile_change_requests',
        ['employee_id', 'field'],
        unique=True,
        postgresql_where=sa.text("status = 'pending'"),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('profile_change_requests')