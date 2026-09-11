"""
Async SQLAlchemy engine and session factory, connected to Supabase
Postgres via the Session Pooler (see backend/.env DATABASE_URL).
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings

settings = get_settings()

# asyncpg needs the "postgresql+asyncpg://" driver prefix; DATABASE_URL
# in .env is stored as a plain "postgresql://" URI, so we convert it here
# rather than duplicating two near-identical URLs in .env.
ASYNC_DATABASE_URL = settings.database_url.replace(
    "postgresql://", "postgresql+asyncpg://", 1
)

engine = create_async_engine(
    ASYNC_DATABASE_URL,
    echo=False,  # set True temporarily if you need to see generated SQL
    connect_args={"ssl": "require"},
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
)


async def get_db():
    """
    FastAPI dependency: yields a database session per request,
    and guarantees it's closed afterward even if an error occurs.
    """
    async with AsyncSessionLocal() as session:
        yield session