"""
Health and hello endpoints — used to verify the API is running
and can reach the database.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db

router = APIRouter(tags=["health"])


@router.get("/hello")
async def hello():
    return {"message": "Hello from the Company Knowledge Platform API"}


@router.get("/health")
async def health(db: AsyncSession = Depends(get_db)):
    """
    Confirms both the API process is alive AND it can reach Postgres.
    """
    result = await db.execute(text("SELECT 1"))
    db_ok = result.scalar() == 1

    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "unreachable",
    }