"""allow general change requests

Revision ID: d5f8a2c61b73
Revises: c7e3b1f94a26
Create Date: 2026-11-10 12:00:00.000000

Adds the free-text "general" kind of profile change request. Two things change:
the check constraint on `field` also accepts 'general', and the "one pending
request per employee per field" index no longer applies to 'general' (a person
may have several different free-text requests waiting).

Raw SQL is used on purpose so the constraint is found by what it checks, not
by a name that a naming convention may have rewritten.
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'd5f8a2c61b73'
down_revision: Union[str, Sequence[str], None] = 'c7e3b1f94a26'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_DROP_FIELD_CHECK = """
DO $$
DECLARE constraint_name text;
BEGIN
    FOR constraint_name IN
        SELECT conname FROM pg_constraint
        WHERE conrelid = 'profile_change_requests'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) LIKE '%full_name%'
    LOOP
        EXECUTE format('ALTER TABLE profile_change_requests DROP CONSTRAINT %I', constraint_name);
    END LOOP;
END $$;
"""


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(_DROP_FIELD_CHECK)
    op.execute(
        "ALTER TABLE profile_change_requests ADD CONSTRAINT ck_profile_change_field "
        "CHECK (field IN ('full_name', 'phone', 'general'))"
    )
    op.execute("DROP INDEX IF EXISTS uq_profile_change_one_pending")
    op.execute(
        "CREATE UNIQUE INDEX uq_profile_change_one_pending ON profile_change_requests (employee_id, field) "
        "WHERE status = 'pending' AND field <> 'general'"
    )


def downgrade() -> None:
    """Downgrade schema. Free-text requests cannot exist under the old rules, so they are removed."""
    op.execute("DELETE FROM profile_change_requests WHERE field = 'general'")
    op.execute(_DROP_FIELD_CHECK)
    op.execute(
        "ALTER TABLE profile_change_requests ADD CONSTRAINT ck_profile_change_field "
        "CHECK (field IN ('full_name', 'phone'))"
    )
    op.execute("DROP INDEX IF EXISTS uq_profile_change_one_pending")
    op.execute(
        "CREATE UNIQUE INDEX uq_profile_change_one_pending ON profile_change_requests (employee_id, field) "
        "WHERE status = 'pending'"
    )