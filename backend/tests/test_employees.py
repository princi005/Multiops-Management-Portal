"""
Verifies employee list access and that department creation is HR-only.
"""

from tests.test_auth import get_token


async def test_list_employees_as_hr(client):
    token = await get_token("hr.test@example.com", "HrTest123!")
    response = await client.get("/employees", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    employees = response.json()
    assert len(employees) >= 2
    assert any(e["employee_code"] == "EMP-CEO-001" for e in employees)


async def test_create_department_blocked_for_ceo(client):
    token = await get_token("ceo.test@example.com", "CeoTest123!")
    response = await client.post(
        "/departments",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Test-Should-Fail-Dept", "description": "Should not be created"},
    )
    assert response.status_code == 403


async def test_create_department_allowed_for_hr(client):
    token = await get_token("hr.test@example.com", "HrTest123!")
    response = await client.post(
        "/departments",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Marketing", "description": "Company marketing"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Marketing"