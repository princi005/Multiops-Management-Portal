"""Allow general profile-change requests and match pending-request behavior."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e7c4a2d91b60"
down_revision: Union[str, Sequence[str], None] = "d2a9b7c4e610"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_constraint(
        "ck_profile_change_field",
        "profile_change_requests",
        type_="check",
    )
    op.create_check_constraint(
        "ck_profile_change_field",
        "profile_change_requests",
        "field IN ('full_name', 'phone', 'general')",
    )

    op.drop_index(
        "uq_profile_change_one_pending",
        table_name="profile_change_requests",
    )
    op.create_index(
        "uq_profile_change_one_pending",
        "profile_change_requests",
        ["employee_id", "field"],
        unique=True,
        postgresql_where=sa.text("status = 'pending' AND field <> 'general'"),
    )


def downgrade() -> None:
    bind = op.get_bind()
    general_count = bind.execute(
        sa.text(
            "SELECT count(*) FROM profile_change_requests WHERE field = 'general'"
        )
    ).scalar_one()

    if general_count:
        raise RuntimeError(
            "Cannot downgrade while general profile-change requests exist."
        )

    op.drop_index(
        "uq_profile_change_one_pending",
        table_name="profile_change_requests",
    )
    op.create_index(
        "uq_profile_change_one_pending",
        "profile_change_requests",
        ["employee_id", "field"],
        unique=True,
        postgresql_where=sa.text("status = 'pending'"),
    )

    op.drop_constraint(
        "ck_profile_change_field",
        "profile_change_requests",
        type_="check",
    )
    op.create_check_constraint(
        "ck_profile_change_field",
        "profile_change_requests",
        "field IN ('full_name', 'phone')",
    )