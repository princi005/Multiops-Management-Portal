"""add database function for purging expired projects

Revision ID: 6a1d9c4e2b71
Revises: 6a1d9c4e2b70
"""

from typing import Sequence, Union

from alembic import op


revision: str = "6a1d9c4e2b71"
down_revision: Union[str, Sequence[str], None] = "6a1d9c4e2b70"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE OR REPLACE FUNCTION public.purge_expired_projects()
        RETURNS bigint
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $function$
        DECLARE
            purged_count bigint;
        BEGIN
            DELETE FROM public.projects
            WHERE deleted_at IS NOT NULL
              AND deleted_at < now() - interval '30 days';

            GET DIAGNOSTICS purged_count = ROW_COUNT;
            RETURN purged_count;
        END;
        $function$;
        """
    )
    op.execute(
        "REVOKE ALL ON FUNCTION public.purge_expired_projects() FROM PUBLIC"
    )


def downgrade() -> None:
    op.execute("DROP FUNCTION IF EXISTS public.purge_expired_projects()")
