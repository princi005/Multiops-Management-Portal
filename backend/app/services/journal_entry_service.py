"""
Journal entry logic: double-entry validation, audited edits, and a
soft delete/restore pair for entries created by mistake.

Every posted entry must:
  1. Belong to an OPEN financial period (closed periods are locked)
  2. Have at least 2 lines
  3. Have lines that are each a debit OR a credit, never both, never neither
  4. Balance: total debits == total credits, and > 0
  5. Reference existing, active GL accounts (and existing, active parties)

Editing, deleting, or restoring a posted entry is allowed only while its
period is open, always requires a reason, and always writes a
before/after (or action) record to audit_logs in the same transaction.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.financial_period import FinancialPeriod, PeriodStatus
from app.models.gl_account import GLAccount
from app.models.journal_entry import JournalEntry
from app.models.journal_entry_line import JournalEntryLine
from app.models.party import Party
from app.models.user import User
from app.schemas.journal_entry import JournalEntryCreate, JournalEntryLineInput, JournalEntryUpdate
from app.services.audit_log_service import write_audit_log

ENTITY_TYPE = "journal_entry"


def _bad_request(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def _line_dict(line) -> dict:
    return {
        "gl_account_id": str(line.gl_account_id),
        "department_id": str(line.department_id) if line.department_id else None,
        "party_id": str(line.party_id) if line.party_id else None,
        "debit": float(line.debit),
        "credit": float(line.credit),
        "line_description": line.line_description,
    }


def _snapshot(entry_date, reference, description, lines) -> dict:
    line_dicts = sorted(
        (_line_dict(line) for line in lines),
        key=lambda d: (d["credit"] > 0, d["gl_account_id"], d["debit"], d["credit"], d["party_id"] or ""),
    )
    return {
        "entry_date": entry_date.isoformat(),
        "reference": reference,
        "description": description,
        "lines": line_dicts,
    }


async def _get_period(db: AsyncSession, period_id: uuid.UUID) -> FinancialPeriod:
    result = await db.execute(select(FinancialPeriod).where(FinancialPeriod.id == period_id))
    period = result.scalar_one_or_none()
    if period is None:
        raise _bad_request("Financial period not found.")
    return period


async def _require_open_period(db: AsyncSession, period_id: uuid.UUID, closed_message: str) -> FinancialPeriod:
    period = await _get_period(db, period_id)
    if period.status != PeriodStatus.OPEN:
        raise _bad_request(closed_message)
    return period


async def _validate_lines(db: AsyncSession, lines: list[JournalEntryLineInput]) -> None:
    if len(lines) < 2:
        raise _bad_request("A journal entry needs at least 2 lines (one debit, one credit).")

    total_debit = 0.0
    total_credit = 0.0
    for i, line in enumerate(lines):
        label = f"Line {i + 1}"

        if (line.debit > 0) == (line.credit > 0):
            raise _bad_request(f"{label}: must have either a debit OR a credit amount, not both or neither.")

        result = await db.execute(select(GLAccount).where(GLAccount.id == line.gl_account_id))
        account = result.scalar_one_or_none()
        if account is None:
            raise _bad_request(f"{label}: GL account not found.")
        if not account.is_active:
            raise _bad_request(f"{label}: GL account '{account.code}' is inactive.")

        if line.party_id is not None:
            result = await db.execute(select(Party).where(Party.id == line.party_id))
            party = result.scalar_one_or_none()
            if party is None:
                raise _bad_request(f"{label}: customer/vendor not found.")
            if not party.is_active:
                raise _bad_request(f"{label}: customer/vendor '{party.name}' is inactive.")

        total_debit += line.debit
        total_credit += line.credit

    if round(total_debit, 2) != round(total_credit, 2):
        raise _bad_request(
            f"Entry does not balance: total debits ({total_debit}) != total credits ({total_credit})."
        )
    if total_debit == 0:
        raise _bad_request("Entry total cannot be zero.")


async def list_entries(db: AsyncSession) -> list[JournalEntry]:
    result = await db.execute(
        select(JournalEntry)
        .options(selectinload(JournalEntry.lines))
        .order_by(JournalEntry.entry_date.desc(), JournalEntry.created_at.desc())
    )
    return list(result.scalars().all())


async def get_entry(db: AsyncSession, entry_id: uuid.UUID) -> JournalEntry:
    result = await db.execute(
        select(JournalEntry)
        .where(JournalEntry.id == entry_id)
        .options(selectinload(JournalEntry.lines))
        .execution_options(populate_existing=True)
    )
    entry = result.scalar_one_or_none()
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found.")
    return entry


async def _get_active_entry(db: AsyncSession, entry_id: uuid.UUID) -> JournalEntry:
    entry = await get_entry(db, entry_id)
    if entry.deleted_at is not None:
        raise _bad_request("This entry has been deleted.")
    return entry


async def create_entry(db: AsyncSession, payload: JournalEntryCreate, created_by: User) -> JournalEntry:
    await _require_open_period(db, payload.period_id, "Cannot post to a closed period.")
    await _validate_lines(db, payload.lines)

    entry = JournalEntry(
        id=uuid.uuid4(),
        period_id=payload.period_id,
        entry_date=payload.entry_date,
        reference=payload.reference,
        description=payload.description,
        created_by_id=created_by.id,
    )
    db.add(entry)
    await db.flush()

    for line in payload.lines:
        db.add(
            JournalEntryLine(
                id=uuid.uuid4(),
                journal_entry_id=entry.id,
                gl_account_id=line.gl_account_id,
                department_id=line.department_id,
                party_id=line.party_id,
                debit=line.debit,
                credit=line.credit,
                line_description=line.line_description,
            )
        )

    write_audit_log(
        db,
        entity_type=ENTITY_TYPE,
        entity_id=entry.id,
        action="create",
        reason="Initial posting",
        changed_by=created_by,
        previous_value=None,
        new_value=_snapshot(payload.entry_date, payload.reference, payload.description, payload.lines),
    )

    await db.commit()
    await db.refresh(entry, attribute_names=["lines"])
    return entry


async def update_entry(
    db: AsyncSession, entry_id: uuid.UUID, payload: JournalEntryUpdate, changed_by: User
) -> JournalEntry:
    entry = await _get_active_entry(db, entry_id)
    await _require_open_period(db, entry.period_id, "This entry belongs to a closed period and is locked.")
    await _validate_lines(db, payload.lines)

    result = await db.execute(select(JournalEntryLine).where(JournalEntryLine.journal_entry_id == entry.id))
    old_lines = list(result.scalars().all())

    previous = _snapshot(entry.entry_date, entry.reference, entry.description, old_lines)
    new = _snapshot(payload.entry_date, payload.reference, payload.description, payload.lines)
    if previous == new:
        raise _bad_request("No changes detected.")

    entry.entry_date = payload.entry_date
    entry.reference = payload.reference
    entry.description = payload.description

    await db.execute(delete(JournalEntryLine).where(JournalEntryLine.journal_entry_id == entry.id))
    for line in payload.lines:
        db.add(
            JournalEntryLine(
                id=uuid.uuid4(),
                journal_entry_id=entry.id,
                gl_account_id=line.gl_account_id,
                department_id=line.department_id,
                party_id=line.party_id,
                debit=line.debit,
                credit=line.credit,
                line_description=line.line_description,
            )
        )

    write_audit_log(
        db,
        entity_type=ENTITY_TYPE,
        entity_id=entry.id,
        action="update",
        reason=payload.reason.strip(),
        changed_by=changed_by,
        previous_value=previous,
        new_value=new,
    )

    await db.commit()
    return await get_entry(db, entry.id)


async def delete_entry(db: AsyncSession, entry_id: uuid.UUID, reason: str, deleted_by: User) -> JournalEntry:
    entry = await _get_active_entry(db, entry_id)
    await _require_open_period(db, entry.period_id, "This entry belongs to a closed period and is locked.")

    from datetime import datetime, timezone

    entry.deleted_at = datetime.now(timezone.utc)
    entry.deleted_by_id = deleted_by.id

    write_audit_log(
        db,
        entity_type=ENTITY_TYPE,
        entity_id=entry.id,
        action="delete",
        reason=reason.strip(),
        changed_by=deleted_by,
        previous_value={"deleted": False},
        new_value={"deleted": True},
    )

    await db.commit()
    return await get_entry(db, entry.id)


async def restore_entry(db: AsyncSession, entry_id: uuid.UUID, reason: str, restored_by: User) -> JournalEntry:
    entry = await get_entry(db, entry_id)
    if entry.deleted_at is None:
        raise _bad_request("This entry is not deleted.")
    await _require_open_period(db, entry.period_id, "This entry belongs to a closed period and is locked.")

    entry.deleted_at = None
    entry.deleted_by_id = None

    write_audit_log(
        db,
        entity_type=ENTITY_TYPE,
        entity_id=entry.id,
        action="restore",
        reason=reason.strip(),
        changed_by=restored_by,
        previous_value={"deleted": True},
        new_value={"deleted": False},
    )

    await db.commit()
    return await get_entry(db, entry.id)