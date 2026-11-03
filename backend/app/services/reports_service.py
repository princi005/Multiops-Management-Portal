"""
Trial Balance: for each GL account, sum all debits and credits from
posted, non-deleted journal entries in the given period. Debit-normal
account types (asset, expense) show balance = debit - credit;
credit-normal types (liability, equity, income) show balance = credit - debit.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.financial_period import FinancialPeriod
from app.models.gl_account import AccountType, GLAccount
from app.models.journal_entry import JournalEntry, JournalEntryStatus
from app.models.journal_entry_line import JournalEntryLine
from app.schemas.reports import TrialBalanceLine, TrialBalanceReport

DEBIT_NORMAL = {AccountType.ASSET, AccountType.EXPENSE}


async def get_trial_balance(db: AsyncSession, period_id: uuid.UUID) -> TrialBalanceReport:
    result = await db.execute(select(FinancialPeriod).where(FinancialPeriod.id == period_id))
    period = result.scalar_one_or_none()
    if period is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Financial period not found.")

    result = await db.execute(
        select(
            GLAccount.id,
            GLAccount.code,
            GLAccount.name,
            GLAccount.account_type,
            func.coalesce(func.sum(JournalEntryLine.debit), 0),
            func.coalesce(func.sum(JournalEntryLine.credit), 0),
        )
        .select_from(GLAccount)
        .outerjoin(JournalEntryLine, JournalEntryLine.gl_account_id == GLAccount.id)
        .outerjoin(
            JournalEntry,
            (JournalEntry.id == JournalEntryLine.journal_entry_id)
            & (JournalEntry.period_id == period_id)
            & (JournalEntry.status == JournalEntryStatus.POSTED)
            & (JournalEntry.deleted_at.is_(None)),
        )
        .where(GLAccount.is_active.is_(True))
        .group_by(GLAccount.id, GLAccount.code, GLAccount.name, GLAccount.account_type)
        .order_by(GLAccount.code)
    )

    lines: list[TrialBalanceLine] = []
    total_debit = 0.0
    total_credit = 0.0

    for account_id, code, name, account_type, debit_sum, credit_sum in result.all():
        debit_sum = float(debit_sum)
        credit_sum = float(credit_sum)
        if debit_sum == 0 and credit_sum == 0:
            continue

        balance = (debit_sum - credit_sum) if account_type in DEBIT_NORMAL else (credit_sum - debit_sum)

        lines.append(
            TrialBalanceLine(
                gl_account_id=account_id,
                code=code,
                name=name,
                account_type=account_type.value,
                total_debit=debit_sum,
                total_credit=credit_sum,
                balance=balance,
            )
        )
        total_debit += debit_sum
        total_credit += credit_sum

    return TrialBalanceReport(
        period_id=period.id,
        period_name=period.name,
        lines=lines,
        total_debit=round(total_debit, 2),
        total_credit=round(total_credit, 2),
        is_balanced=round(total_debit, 2) == round(total_credit, 2),
    )