"""
Shared pytest fixtures. `client` gives every test an async HTTP client
wired directly to the FastAPI app (no real server/port needed).
"""

import httpx
import pytest_asyncio

from app.main import app


@pytest_asyncio.fixture
async def client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac