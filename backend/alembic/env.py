"""
Alembic environment configuration.

Uses psycopg2 (sync) for running migrations, even though the live
FastAPI app uses asyncpg (async) — see architecture note in Step 4.
Pulls the real connection string from backend/.env via app.core.config,
rather than storing it in alembic.ini.
"""

import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

# Make "app" importable from this file
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.core.config import get_settings  # noqa: E402
from app.db.base import Base  # noqa: E402

# Import all models so Base.metadata knows about them for autogenerate.
from app import models  # noqa: E402,F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

settings = get_settings()

# asyncpg URL uses "postgresql://" already (see backend/.env) — psycopg2
# accepts that scheme directly, we just need to force sslmode=require
# since psycopg2 reads sslmode from the URL, unlike asyncpg.
SYNC_DATABASE_URL = settings.database_url
if "sslmode" not in SYNC_DATABASE_URL:
    separator = "&" if "?" in SYNC_DATABASE_URL else "?"
    SYNC_DATABASE_URL = f"{SYNC_DATABASE_URL}{separator}sslmode=require"

config.set_main_option("sqlalchemy.url", SYNC_DATABASE_URL)


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()