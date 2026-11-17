"""
Resume storage for the logged-in employee. Files are kept on local disk
under backend/storage/resumes/<employee_id>/<random>.<ext>. The storage key
is always generated here (never taken from the client), and the resolved
path is checked to stay inside the storage folder.

Replacing a resume writes the new file first, updates the database, and
only then deletes the old file, so a failure never leaves a row pointing
at a missing file.
"""

import asyncio
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee_resume import EmployeeResume
from app.models.user import User
from app.services.me_service import get_my_employee
from app.services.resume_files import (
    ALLOWED_TYPES,
    MAX_RESUME_BYTES,
    ResumeFileError,
    clean_filename,
    validate_resume,
)

STORAGE_ROOT = Path(__file__).resolve().parents[2] / "storage" / "resumes"


def _path_for(key: str) -> Path:
    root = STORAGE_ROOT.resolve()
    path = (root / key).resolve()
    if root not in path.parents:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid storage path."
        )
    return path


async def get_my_resume(db: AsyncSession, user: User) -> EmployeeResume | None:
    employee = await get_my_employee(db, user)
    result = await db.execute(select(EmployeeResume).where(EmployeeResume.employee_id == employee.id))
    return result.scalar_one_or_none()


async def save_my_resume(db: AsyncSession, user: User, file: UploadFile) -> EmployeeResume:
    employee = await get_my_employee(db, user)

    filename = clean_filename(file.filename)
    content = await file.read(MAX_RESUME_BYTES + 1)
    try:
        ext = validate_resume(filename, content)
    except ResumeFileError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc

    key = f"{employee.id}/{uuid.uuid4().hex}{ext}"
    new_path = _path_for(key)
    new_path.parent.mkdir(parents=True, exist_ok=True)
    await asyncio.to_thread(new_path.write_bytes, content)

    existing_result = await db.execute(
        select(EmployeeResume).where(EmployeeResume.employee_id == employee.id)
    )
    resume = existing_result.scalar_one_or_none()
    old_key = resume.storage_key if resume is not None else None

    try:
        if resume is None:
            resume = EmployeeResume(id=uuid.uuid4(), employee_id=employee.id)
            db.add(resume)
        resume.original_filename = filename
        resume.content_type = ALLOWED_TYPES[ext]
        resume.size_bytes = len(content)
        resume.storage_key = key
        resume.uploaded_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(resume)
    except IntegrityError:
        await db.rollback()
        new_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Another upload is already in progress. Please try again.",
        )
    except Exception:
        await db.rollback()
        new_path.unlink(missing_ok=True)
        raise

    if old_key:
        _path_for(old_key).unlink(missing_ok=True)
    return resume


async def get_my_resume_file(db: AsyncSession, user: User) -> tuple[EmployeeResume, Path]:
    resume = await get_my_resume(db, user)
    if resume is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You have not uploaded a resume.")
    path = _path_for(resume.storage_key)
    if not path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The stored file is missing. Please upload your resume again.",
        )
    return resume, path


async def delete_my_resume(db: AsyncSession, user: User) -> None:
    resume = await get_my_resume(db, user)
    if resume is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You have not uploaded a resume.")
    key = resume.storage_key
    await db.delete(resume)
    await db.commit()
    _path_for(key).unlink(missing_ok=True)