from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import require_role
from app.db.session import get_db
from app.models.party import PartyType
from app.models.user import User
from app.schemas.party import PartyCreate, PartyRead
from app.services import party_service

router = APIRouter(prefix="/gl/parties", tags=["general-ledger"])


@router.get("", response_model=list[PartyRead])
async def list_parties(
    party_type: PartyType | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("CEO", "Accounts")),
):
    return await party_service.list_parties(db, party_type)


@router.post("", response_model=PartyRead, status_code=201)
async def create_party(
    payload: PartyCreate,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(require_role("Accounts")),
):
    return await party_service.create_party(db, payload)