"""
One-off script to verify that Python can reach the Supabase Postgres
database using the credentials in backend/.env.
Run this once from the repo root — it is not part of the FastAPI app.
"""

import asyncio
import os
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

# backend/.env lives one level down from this script's parent (repo root)
env_path = Path(__file__).resolve().parent.parent / "backend" / ".env"
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

async def main() -> None:
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not found. Check backend/.env exists and is filled in.")
        return

    print("Connecting to Supabase Postgres...")
    conn = await asyncpg.connect(dsn=DATABASE_URL, ssl="require")

    version = await conn.fetchval("SELECT version();")
    print("Connected successfully.")
    print(f"Postgres version: {version}")

    await conn.close()
    print("Connection closed cleanly.")


if __name__ == "__main__":
    asyncio.run(main())