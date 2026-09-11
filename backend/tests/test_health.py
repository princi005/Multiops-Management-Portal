"""
Verifies the API boots and can reach the database.
"""


async def test_hello(client):
    response = await client.get("/hello")
    assert response.status_code == 200
    assert response.json() == {"message": "Hello from the Company Knowledge Platform API"}


async def test_health(client):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"