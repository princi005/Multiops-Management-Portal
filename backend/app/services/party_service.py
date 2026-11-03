import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.party import Party, PartyType
from app.schemas.party import PartyCreate


async def list_parties(db: AsyncSession, party_type: PartyType | None = None) -> list[Party]:
    query = select(Party).order_by(Party.name)
    if party_type is not None:
        query = query.where(Party.party_type == party_type)
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_party(db: AsyncSession, payload: PartyCreate) -> Party:
    party = Party(id=uuid.uuid4(), **payload.model_dump())
    db.add(party)
    await db.commit()
    await db.refresh(party)
    return party