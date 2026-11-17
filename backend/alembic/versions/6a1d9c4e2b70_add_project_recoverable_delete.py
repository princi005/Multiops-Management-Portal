"""add recoverable soft delete to projects

Revision ID: 6a1d9c4e2b70
Revises: d5f8a2c61b73
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "6a1d9c4e2b70"
down_revision: Union[str, Sequence[str], None] = "d5f8a2c61b73"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("projects", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("projects", sa.Column("deleted_by_id", sa.UUID(), nullable=True))
    op.create_foreign_key(
        "fk_projects_deleted_by_id_users",
        "projects",
        "users",
        ["deleted_by_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_projects_deleted_at", "projects", ["deleted_at"])


def downgrade() -> None:
    op.drop_index("ix_projects_deleted_at", table_name="projects")
    op.drop_constraint("fk_projects_deleted_by_id_users", "projects", type_="foreignkey")
    op.drop_column("projects", "deleted_by_id")
    op.drop_column("projects", "deleted_at")