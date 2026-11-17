"""add employee issues

Revision ID: c7e3b1f94a26
Revises: a41c8e2b9d35
Create Date: 2026-11-06 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c7e3b1f94a26'
down_revision: Union[str, Sequence[str], None] = 'a41c8e2b9d35'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('employee_issues',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('employee_id', sa.UUID(), nullable=False),
    sa.Column('category', sa.String(length=20), nullable=False),
    sa.Column('status', sa.String(length=20), nullable=False),
    sa.Column('subject', sa.String(length=150), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('response', sa.Text(), nullable=True),
    sa.Column('handled_by_id', sa.UUID(), nullable=True),
    sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.CheckConstraint("category IN ('salary', 'payslip', 'attendance', 'other')", name='ck_employee_issue_category'),
    sa.CheckConstraint("status IN ('open', 'in_progress', 'resolved', 'withdrawn')", name='ck_employee_issue_status'),
    sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['handled_by_id'], ['users.id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_employee_issues_employee_id'), 'employee_issues', ['employee_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('employee_issues')