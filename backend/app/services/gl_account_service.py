"""
Chart of Accounts logic. Enforces: unique codes, and a child account
must share its parent's account_type (a Liability account can't have
an Asset parent) — a basic sanity rule for the hierarchy.
"""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gl_account import GLAccount
from app.schemas.gl_account import GLAccountCreate


async def list_accounts(db: AsyncSession) -> list[GLAccount]:
    result = await db.execute(select(GLAccount).order_by(GLAccount.code))
    return list(result.scalars().all())


async def get_account(db: AsyncSession, account_id: uuid.UUID) -> GLAccount:
    result = await db.execute(select(GLAccount).where(GLAccount.id == account_id))
    account = result.scalar_one_or_none()
    if account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")
    return account


async def create_account(db: AsyncSession, payload: GLAccountCreate) -> GLAccount:
    result = await db.execute(select(GLAccount).where(GLAccount.code == payload.code))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account code already exists.")

    if payload.parent_account_id is not None:
        result = await db.execute(select(GLAccount).where(GLAccount.id == payload.parent_account_id))
        parent = result.scalar_one_or_none()
        if parent is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Parent account does not exist.")
        if parent.account_type != payload.account_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Child account must have the same account_type as its parent.",
            )

    account = GLAccount(id=uuid.uuid4(), **payload.model_dump())
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return account