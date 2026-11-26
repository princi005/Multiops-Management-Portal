"""Store organization-scoped employee identity documents."""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "d7b1c9a4e630"
down_revision: Union[str, Sequence[str], None] = "c6a8f31d20b4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "employee_identity_documents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "organization_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "employee_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("employees.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("document_type", sa.String(20), nullable=False),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("content_type", sa.String(100), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("storage_key", sa.String(500), nullable=False),
        sa.Column("is_verified", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column(
            "verified_by_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "document_type IN ('pan', 'aadhaar')",
            name="ck_employee_identity_document_type",
        ),
        sa.UniqueConstraint(
            "organization_id",
            "employee_id",
            "document_type",
            name="uq_employee_identity_document_type",
        ),
    )
    op.create_index(
        "ix_employee_identity_documents_organization_id",
        "employee_identity_documents",
        ["organization_id"],
    )
    op.create_index(
        "ix_employee_identity_documents_employee_id",
        "employee_identity_documents",
        ["employee_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_employee_identity_documents_employee_id",
        table_name="employee_identity_documents",
    )
    op.drop_index(
        "ix_employee_identity_documents_organization_id",
        table_name="employee_identity_documents",
    )
    op.drop_table("employee_identity_documents")