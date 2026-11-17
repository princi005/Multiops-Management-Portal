import uuid

from pydantic import BaseModel


class DirectoryEmployee(BaseModel):
    """Minimal, non-sensitive employee info a manager needs to pick project members and assignees."""

    id: uuid.UUID
    employee_code: str
    full_name: str | None
    email: str
    designation: str | None
    department_name: str | None