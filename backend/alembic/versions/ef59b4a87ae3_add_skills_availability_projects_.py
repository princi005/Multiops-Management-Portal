"""add skills, availability, projects, project members, tickets, ticket logs

Revision ID: ef59b4a87ae3
Revises: 6cb99bb7c9e7
Create Date: 2026-10-07 11:43:02.123860

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'ef59b4a87ae3'
down_revision: Union[str, Sequence[str], None] = '6cb99bb7c9e7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Enum types used by op.add_column are NOT auto-created by Alembic (only
    # enums inside op.create_table are), so create this one explicitly first.
    availability_status_enum = postgresql.ENUM(
        'AVAILABLE', 'PARTIALLY_AVAILABLE', 'UNAVAILABLE', name='availability_status_enum'
    )
    availability_status_enum.create(op.get_bind(), checkfirst=True)

    op.create_table('skills',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('name')
    )
    op.create_table('employee_skills',
    sa.Column('employee_id', sa.UUID(), nullable=False),
    sa.Column('skill_id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['skill_id'], ['skills.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('employee_id', 'skill_id')
    )
    op.create_table('projects',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('version', sa.String(length=20), nullable=True),
    sa.Column('technology', sa.String(length=300), nullable=True),
    sa.Column('requirements_text', sa.Text(), nullable=True),
    sa.Column('start_date', sa.Date(), nullable=True),
    sa.Column('end_date', sa.Date(), nullable=True),
    sa.Column('status', sa.Enum('ACTIVE', 'COMPLETED', 'ON_HOLD', 'ARCHIVED', name='project_status_enum'), nullable=False),
    sa.Column('manager_id', sa.UUID(), nullable=False),
    sa.Column('created_by_id', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['manager_id'], ['employees.id'], ondelete='RESTRICT'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('project_members',
    sa.Column('project_id', sa.UUID(), nullable=False),
    sa.Column('employee_id', sa.UUID(), nullable=False),
    sa.Column('added_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('added_by_id', sa.UUID(), nullable=True),
    sa.ForeignKeyConstraint(['added_by_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['employee_id'], ['employees.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('project_id', 'employee_id')
    )
    op.create_table('tickets',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('project_id', sa.UUID(), nullable=False),
    sa.Column('parent_ticket_id', sa.UUID(), nullable=True),
    sa.Column('title', sa.String(length=200), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('status', sa.Enum('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FOR_REVIEW', 'CANCELLED', 'DROPPED', name='ticket_status_enum'), nullable=False),
    sa.Column('assigned_to_id', sa.UUID(), nullable=True),
    sa.Column('created_by_id', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['assigned_to_id'], ['employees.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['created_by_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['parent_ticket_id'], ['tickets.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('ticket_logs',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('ticket_id', sa.UUID(), nullable=False),
    sa.Column('note', sa.Text(), nullable=False),
    sa.Column('status_from', sa.Text(), nullable=True),
    sa.Column('status_to', sa.Text(), nullable=True),
    sa.Column('logged_by_id', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['logged_by_id'], ['users.id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['ticket_id'], ['tickets.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    op.add_column(
        'employees',
        sa.Column(
            'availability_status',
            postgresql.ENUM(
                'AVAILABLE', 'PARTIALLY_AVAILABLE', 'UNAVAILABLE',
                name='availability_status_enum', create_type=False,
            ),
            nullable=False,
            server_default='AVAILABLE',
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('employees', 'availability_status')
    op.drop_table('ticket_logs')
    op.drop_table('tickets')
    op.drop_table('project_members')
    op.drop_table('projects')
    op.drop_table('employee_skills')
    op.drop_table('skills')
    postgresql.ENUM(name='availability_status_enum').drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name='ticket_status_enum').drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name='project_status_enum').drop(op.get_bind(), checkfirst=True)