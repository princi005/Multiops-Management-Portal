"""
Generic audit trail helpers. write_audit_log() only ADDS a row to the
caller's open transaction (no commit), so an audit record and the change
it describes are saved together or not at all.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit_log import AuditLogRead


def write_audit_log(
    db: AsyncSession,
    *,
    entity_type: str,
    entity_id: uuid.UUID,
    action: str,
    reason: str,
    changed_by: User,
    previous_value: dict | None,
    new_value: dict | None,
) -> None:
    db.add(
        AuditLog(
            id=uuid.uuid4(),
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            reason=reason,
            previous_value=previous_value,
            new_value=new_value,
            changed_by_id=changed_by.id,
        )
    )


async def list_audit_logs(db: AsyncSession, entity_type: str, entity_id: uuid.UUID) -> list[AuditLogRead]:
    result = await db.execute(
        select(AuditLog)
        .where(AuditLog.entity_type == entity_type, AuditLog.entity_id == entity_id)
        .options(selectinload(AuditLog.changed_by))
        .order_by(AuditLog.created_at.desc())
    )
    return [
        AuditLogRead(
            id=log.id,
            entity_type=log.entity_type,
            entity_id=log.entity_id,
            action=log.action,
            reason=log.reason,
            previous_value=log.previous_value,
            new_value=log.new_value,
            changed_by_id=log.changed_by_id,
            changed_by_email=log.changed_by.email if log.changed_by else None,
            created_at=log.created_at,
        )
        for log in result.scalars().all()
    ]