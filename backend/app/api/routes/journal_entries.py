import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.audit_log import AuditLogRead
from app.schemas.journal_entry import (
    JournalEntryCreate,
    JournalEntryDelete,
    JournalEntryRead,
    JournalEntryRestore,
    JournalEntryUpdate,
)
from app.services import audit_log_service, journal_entry_service

router = APIRouter(prefix="/gl/journal-entries", tags=["general-ledger"])


@router.get("", response_model=list[JournalEntryRead])
async def list_entries(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("CEO", "Accounts")),
):
    return await journal_entry_service.list_entries(db)


@router.get("/{entry_id}", response_model=JournalEntryRead)
async def get_entry(
    entry_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("CEO", "Accounts")),
):
    return await journal_entry_service.get_entry(db, entry_id)


@router.get("/{entry_id}/audit-log", response_model=list[AuditLogRead])
async def entry_audit_log(
    entry_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("CEO", "Accounts")),
):
    return await audit_log_service.list_audit_logs(db, journal_entry_service.ENTITY_TYPE, entry_id)


@router.post("", response_model=JournalEntryRead, status_code=201)
async def create_entry(
    payload: JournalEntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("Accounts")),
):
    return await journal_entry_service.create_entry(db, payload, current_user)


@router.put("/{entry_id}", response_model=JournalEntryRead)
async def update_entry(
    entry_id: uuid.UUID,
    payload: JournalEntryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("Accounts")),
):
    return await journal_entry_service.update_entry(db, entry_id, payload, current_user)


@router.delete("/{entry_id}", response_model=JournalEntryRead)
async def delete_entry(
    entry_id: uuid.UUID,
    payload: JournalEntryDelete,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("Accounts")),
):
    return await journal_entry_service.delete_entry(db, entry_id, payload.reason, current_user)


@router.post("/{entry_id}/restore", response_model=JournalEntryRead)
async def restore_entry(
    entry_id: uuid.UUID,
    payload: JournalEntryRestore,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("Accounts")),
):
    return await journal_entry_service.restore_entry(db, entry_id, payload.reason, current_user)