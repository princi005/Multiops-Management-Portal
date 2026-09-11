"""
Verifies auth rejection and role-protected access using the real
Supabase test accounts created by scripts/seed_data.py.
"""

import httpx

from app.core.config import get_settings

settings = get_settings()


async def get_token(email: str, password: str) -> str:
    async with httpx.AsyncClient() as ac:
        response = await ac.post(
            f"{settings.supabase_url}/auth/v1/token?grant_type=password",
            headers={"apikey": settings.supabase_anon_key, "Content-Type": "application/json"},
            json={"email": email, "password": password},
        )
        response.raise_for_status()
        return response.json()["access_token"]


async def test_me_rejects_missing_token(client):
    response = await client.get("/auth/me")
    assert response.status_code == 401  # HTTPBearer's actual default for missing credentials

async def test_me_returns_ceo_with_role(client):
    token = await get_token("ceo.test@example.com", "CeoTest123!")
    response = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "ceo.test@example.com"
    assert "CEO" in data["roles"]


async def test_ceo_dashboard_blocks_hr(client):
    token = await get_token("hr.test@example.com", "HrTest123!")
    response = await client.get("/dashboard/ceo", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


async def test_ceo_dashboard_allows_ceo(client):
    token = await get_token("ceo.test@example.com", "CeoTest123!")
    response = await client.get("/dashboard/ceo", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert "total_employees" in data