import asyncio
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee import Employee
from app.models.employee_profile_details import EmployeeIdentityDocument
from app.models.organization import OrganizationAdminLog, OrganizationMember
from app.models.user import User
from app.schemas.identity_document import IdentityDocumentRead, IdentityDocumentType
from app.services.me_service import get_my_employee
from app.services.resume_files import MAX_RESUME_BYTES, clean_filename


STORAGE_ROOT = Path(__file__).resolve().parents[2] / "storage" / "identity-documents"
_ALLOWED_TYPES = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".webp": "image/webp",
    ".tif": "image/tiff",
    ".tiff": "image/tiff",
}


def _path_for(key: str) -> Path:
    root = STORAGE_ROOT.resolve()
    path = (root / key).resolve()
    if root not in path.parents:
        raise HTTPException(status_code=500, detail="Invalid identity-document storage path.")
    return path


def _detect_type(filename: str, content: bytes) -> tuple[str, str]:
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded document is empty.")
    if len(content) > MAX_RESUME_BYTES:
        raise HTTPException(status_code=413, detail="Identity documents must be 5 MB or smaller.")

    extension = Path(filename).suffix.lower()
    content_type = _ALLOWED_TYPES.get(extension)
    if content_type is None:
        raise HTTPException(status_code=400, detail="Upload a PDF or image file.")

    valid = (
        (extension == ".pdf" and content.startswith(b"%PDF-"))
        or (extension == ".png" and content.startswith(b"\x89PNG\r\n\x1a\n"))
        or (extension in {".jpg", ".jpeg"} and content.startswith(b"\xff\xd8\xff"))
        or (extension == ".gif" and content[:6] in {b"GIF87a", b"GIF89a"})
        or (extension == ".bmp" and content.startswith(b"BM"))
        or (
            extension == ".webp"
            and len(content) >= 12
            and content[:4] == b"RIFF"
            and content[8:12] == b"WEBP"
        )
        or (extension in {".tif", ".tiff"} and content[:4] in {b"II*\x00", b"MM\x00*"})
    )
    if not valid:
        raise HTTPException(status_code=400, detail="The file content does not match its extension.")

    return extension, content_type


async def list_my_identity_documents(
    db: AsyncSession, user: User, organization_id: uuid.UUID
) -> list[IdentityDocumentRead]:
    employee = await get_my_employee(db, user)
    result = await db.execute(
        select(EmployeeIdentityDocument)
        .where(
            EmployeeIdentityDocument.organization_id == organization_id,
            EmployeeIdentityDocument.employee_id == employee.id,
        )
        .order_by(EmployeeIdentityDocument.document_type)
    )
    return [IdentityDocumentRead.model_validate(row) for row in result.scalars().all()]


async def upload_my_identity_document(
    db: AsyncSession,
    user: User,
    organization_id: uuid.UUID,
    document_type: IdentityDocumentType,
    file: UploadFile,
) -> IdentityDocumentRead:
    employee = await get_my_employee(db, user)
    filename = clean_filename(file.filename)
    if not filename:
        raise HTTPException(status_code=400, detail="A valid filename is required.")

    content = await file.read(MAX_RESUME_BYTES + 1)
    extension, content_type = _detect_type(filename, content)

    existing = await db.scalar(
        select(EmployeeIdentityDocument).where(
            EmployeeIdentityDocument.organization_id == organization_id,
            EmployeeIdentityDocument.employee_id == employee.id,
            EmployeeIdentityDocument.document_type == document_type,
        )
    )
    if existing is not None and existing.is_verified:
        raise HTTPException(status_code=409, detail="This document is locked after verification.")

    key = f"{organization_id}/{employee.id}/{document_type}/{uuid.uuid4().hex}{extension}"
    path = _path_for(key)
    path.parent.mkdir(parents=True, exist_ok=True)
    await asyncio.to_thread(path.write_bytes, content)
    old_key = existing.storage_key if existing is not None else None

    if existing is None:
        document = EmployeeIdentityDocument(
            id=uuid.uuid4(),
            organization_id=organization_id,
            employee_id=employee.id,
            document_type=document_type,
        )
        db.add(document)
    else:
        document = existing

    document.uploaded_by_id = user.id
    document.original_filename = filename
    document.content_type = content_type
    document.size_bytes = len(content)
    document.storage_key = key
    document.is_verified = False
    document.verified_by_id = None
    document.verified_at = None

    db.add(
        OrganizationAdminLog(
            organization_id=organization_id,
            actor_user_id=user.id,
            action="employee.identity_document.uploaded",
            details={
                "employee_id": str(employee.id),
                "document_type": document_type,
            },
        )
    )

    try:
        await db.commit()
        await db.refresh(document)
    except Exception:
        await db.rollback()
        path.unlink(missing_ok=True)
        raise

    if old_key:
        _path_for(old_key).unlink(missing_ok=True)

    return IdentityDocumentRead.model_validate(document)


async def list_employee_identity_documents_for_hr(
    db: AsyncSession,
    organization_id: uuid.UUID,
    employee_id: uuid.UUID,
) -> list[IdentityDocumentRead]:
    employee = await db.scalar(
        select(Employee)
        .join(OrganizationMember, OrganizationMember.user_id == Employee.user_id)
        .where(
            Employee.id == employee_id,
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.is_active.is_(True),
        )
    )
    if employee is None:
        raise HTTPException(status_code=404, detail="Active employee membership not found in this organization.")

    result = await db.execute(
        select(EmployeeIdentityDocument)
        .where(
            EmployeeIdentityDocument.organization_id == organization_id,
            EmployeeIdentityDocument.employee_id == employee_id,
        )
        .order_by(EmployeeIdentityDocument.document_type)
    )
    return [IdentityDocumentRead.model_validate(row) for row in result.scalars().all()]


async def verify_employee_identity_document(
    db: AsyncSession,
    reviewer: User,
    organization_id: uuid.UUID,
    employee_id: uuid.UUID,
    document_type: IdentityDocumentType,
) -> IdentityDocumentRead:
    document = await db.scalar(
        select(EmployeeIdentityDocument)
        .where(
            EmployeeIdentityDocument.organization_id == organization_id,
            EmployeeIdentityDocument.employee_id == employee_id,
            EmployeeIdentityDocument.document_type == document_type,
        )
        .with_for_update()
    )
    if document is None:
        raise HTTPException(status_code=404, detail="Identity document not found.")
    if document.is_verified:
        raise HTTPException(status_code=409, detail="This document is already verified.")

    document.is_verified = True
    document.verified_by_id = reviewer.id
    document.verified_at = datetime.now(timezone.utc)
    db.add(
        OrganizationAdminLog(
            organization_id=organization_id,
            actor_user_id=reviewer.id,
            action="employee.identity_document.verified",
            details={
                "employee_id": str(employee_id),
                "document_type": document_type,
            },
        )
    )
    await db.commit()
    await db.refresh(document)
    return IdentityDocumentRead.model_validate(document)


async def get_identity_document_file_for_hr(
    db: AsyncSession,
    organization_id: uuid.UUID,
    employee_id: uuid.UUID,
    document_type: IdentityDocumentType,
) -> tuple[EmployeeIdentityDocument, Path]:
    document = await db.scalar(
        select(EmployeeIdentityDocument).where(
            EmployeeIdentityDocument.organization_id == organization_id,
            EmployeeIdentityDocument.employee_id == employee_id,
            EmployeeIdentityDocument.document_type == document_type,
        )
    )
    if document is None:
        raise HTTPException(status_code=404, detail="Identity document not found.")

    path = _path_for(document.storage_key)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="The stored identity document is missing.")
    return document, path