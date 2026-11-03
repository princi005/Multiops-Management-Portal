import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.gl_account import GLAccountCreate, GLAccountRead
from app.services import gl_account_service

router = APIRouter(prefix="/gl/accounts", tags=["general-ledger"])


@router.get("", response_model=list[GLAccountRead])
async def list_accounts(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("CEO", "Accounts")),
):
    return await gl_account_service.list_accounts(db)


@router.get("/{account_id}", response_model=GLAccountRead)
async def get_account(
    account_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("CEO", "Accounts")),
):
    return await gl_account_service.get_account(db, account_id)


@router.post("", response_model=GLAccountRead, status_code=201)
async def create_account(
    payload: GLAccountCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("Accounts")),
):
    return await gl_account_service.create_account(db, payload)