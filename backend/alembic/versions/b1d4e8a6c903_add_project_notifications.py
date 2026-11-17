"""add project and ticket notifications

Revision ID: b1d4e8a6c903
Revises: 6a1d9c4e2b71
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b1d4e8a6c903"
down_revision: Union[str, Sequence[str], None] = "6a1d9c4e2b71"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notifications",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("recipient_user_id", sa.UUID(), nullable=False),
        sa.Column("kind", sa.String(length=40), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("related_project_id", sa.UUID(), nullable=True),
        sa.Column("related_ticket_id", sa.UUID(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["recipient_user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["related_project_id"], ["projects.id"], ondelete="SET NULL"
        ),
        sa.ForeignKeyConstraint(
            ["related_ticket_id"], ["tickets.id"], ondelete="SET NULL"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_notifications_recipient_created",
        "notifications",
        ["recipient_user_id", "created_at"],
    )

    op.execute(
        """
        CREATE FUNCTION public.notify_project_member_added()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $function$
        DECLARE
            target_user_id uuid;
            target_project_name text;
        BEGIN
            SELECT e.user_id INTO target_user_id
            FROM employees AS e
            WHERE e.id = NEW.employee_id;

            SELECT p.name INTO target_project_name
            FROM projects AS p
            WHERE p.id = NEW.project_id;

            IF target_user_id IS NOT NULL THEN
                INSERT INTO notifications (
                    id,
                    recipient_user_id,
                    kind,
                    title,
                    message,
                    related_project_id
                )
                VALUES (
                    gen_random_uuid(),
                    target_user_id,
                    'project_added',
                    'Added to a project',
                    'You have been added to project "' ||
                        COALESCE(target_project_name, 'a project') || '".',
                    NEW.project_id
                );
            END IF;

            RETURN NEW;
        END;
        $function$;
        """
    )

    op.execute(
        """
        CREATE TRIGGER trg_notify_project_member_added
        AFTER INSERT ON project_members
        FOR EACH ROW
        EXECUTE FUNCTION public.notify_project_member_added();
        """
    )

    op.execute(
        """
        CREATE FUNCTION public.notify_ticket_changes()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $function$
        DECLARE
            target_user_id uuid;
            target_project_name text;
            target_manager_user_id uuid;
        BEGIN
            SELECT p.name, manager.user_id
            INTO target_project_name, target_manager_user_id
            FROM projects AS p
            JOIN employees AS manager ON manager.id = p.manager_id
            WHERE p.id = NEW.project_id;

            IF NEW.assigned_to_id IS NOT NULL
               AND (
                    TG_OP = 'INSERT'
                    OR NEW.assigned_to_id IS DISTINCT FROM OLD.assigned_to_id
               )
            THEN
                SELECT e.user_id INTO target_user_id
                FROM employees AS e
                WHERE e.id = NEW.assigned_to_id;

                IF target_user_id IS NOT NULL THEN
                    INSERT INTO notifications (
                        id,
                        recipient_user_id,
                        kind,
                        title,
                        message,
                        related_project_id,
                        related_ticket_id
                    )
                    VALUES (
                        gen_random_uuid(),
                        target_user_id,
                        'ticket_assigned',
                        'Ticket assigned to you',
                        'You were assigned "' || NEW.title ||
                            '" in project "' ||
                            COALESCE(target_project_name, 'a project') || '".',
                        NEW.project_id,
                        NEW.id
                    );
                END IF;
            END IF;

            IF TG_OP = 'UPDATE'
               AND NEW.status IS DISTINCT FROM OLD.status
               AND target_manager_user_id IS NOT NULL
            THEN
                INSERT INTO notifications (
                    id,
                    recipient_user_id,
                    kind,
                    title,
                    message,
                    related_project_id,
                    related_ticket_id
                )
                VALUES (
                    gen_random_uuid(),
                    target_manager_user_id,
                    'ticket_status_changed',
                    'Ticket status changed',
                    '"' || NEW.title || '" changed from ' ||
                        OLD.status::text || ' to ' || NEW.status::text || '.',
                    NEW.project_id,
                    NEW.id
                );
            END IF;

            RETURN NEW;
        END;
        $function$;
        """
    )

    op.execute(
        """
        CREATE TRIGGER trg_notify_ticket_changes
        AFTER INSERT OR UPDATE OF assigned_to_id, status ON tickets
        FOR EACH ROW
        EXECUTE FUNCTION public.notify_ticket_changes();
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_notify_ticket_changes ON tickets")
    op.execute("DROP FUNCTION IF EXISTS public.notify_ticket_changes()")
    op.execute(
        "DROP TRIGGER IF EXISTS trg_notify_project_member_added ON project_members"
    )
    op.execute("DROP FUNCTION IF EXISTS public.notify_project_member_added()")
    op.drop_index("ix_notifications_recipient_created", table_name="notifications")
    op.drop_table("notifications")
