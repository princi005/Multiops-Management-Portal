import asyncio
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profile_change_request import ChangeField, ChangeStatus, ProfileChangeEvidence, ProfileChangeRequest
from app.models.organization import OrganizationAdminLog
from app.models.user import User
from app.schemas.profile_change import ChangeEvidenceRead
from app.services.me_service import get_my_employee
from app.services.resume_files import MAX_RESUME_BYTES, clean_filename


STORAGE_ROOT = Path(__file__).resolve().parents[2] / "storage" / "profile-change-evidence"
_ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
_CONTENT_TYPES = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}


def _storage_path(key: str) -> Path:
    root = STORAGE_ROOT.resolve()
    path = (root / key).resolve()
    if root not in path.parents:
        raise HTTPException(status_code=500, detail="Invalid evidence storage path.")
    return path


def _validate_evidence(filename: str, content: bytes) -> tuple[str, str]:
    if not content:
        raise HTTPException(status_code=400, detail="The uploaded evidence file is empty.")
    if len(content) > MAX_RESUME_BYTES:
        raise HTTPException(status_code=413, detail="Evidence files must be 5 MB or smaller.")

    extension = Path(filename).suffix.lower()
    if extension not in _ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Evidence must be a PDF, PNG, or JPEG file.")

    valid_signature = (
        (extension == ".pdf" and content.startswith(b"%PDF-"))
        or (extension == ".png" and content.startswith(b"\x89PNG\r\n\x1a\n"))
        or (extension in {".jpg", ".jpeg"} and content.startswith(b"\xff\xd8\xff"))
    )
    if not valid_signature:
        raise HTTPException(status_code=400, detail="The file content does not match its extension.")

    return extension, _CONTENT_TYPES[extension]


async def _owned_legal_name_request(
    db: AsyncSession, user: User, organization_id: uuid.UUID, request_id: uuid.UUID
) -> tuple[ProfileChangeRequest, uuid.UUID]:
    employee = await get_my_employee(db, user)
    request = await db.scalar(
        select(ProfileChangeRequest).where(
            ProfileChangeRequest.id == request_id,
            ProfileChangeRequest.employee_id == employee.id,
            ProfileChangeRequest.organization_id == organization_id,
        )
    )
    if request is None:
        raise HTTPException(status_code=404, detail="Profile-change request not found.")
    if request.field != ChangeField.FULL_NAME:
        raise HTTPException(status_code=422, detail="Evidence can only be attached to a legal-name request.")
    return request, employee.id


async def upload_supporting_evidence(
    db: AsyncSession,
    user: User,
    organization_id: uuid.UUID,
    request_id: uuid.UUID,
    file: UploadFile,
) -> ChangeEvidenceRead:
    request, employee_id = await _owned_legal_name_request(db, user, organization_id, request_id)
    if request.status != ChangeStatus.PENDING:
        raise HTTPException(status_code=409, detail="Evidence can only be uploaded while the request is pending.")

    filename = clean_filename(file.filename)
    if not filename:
        raise HTTPException(status_code=400, detail="A valid filename is required.")

    content = await file.read(MAX_RESUME_BYTES + 1)
    extension, content_type = _validate_evidence(filename, content)

    key = f"{organization_id}/{employee_id}/{request_id}/{uuid.uuid4().hex}{extension}"
    path = _storage_path(key)
    path.parent.mkdir(parents=True, exist_ok=True)
    await asyncio.to_thread(path.write_bytes, content)

    evidence = ProfileChangeEvidence(
        id=uuid.uuid4(),
        organization_id=organization_id,
        request_id=request_id,
        employee_id=employee_id,
        uploaded_by_id=user.id,
        original_filename=filename,
        content_type=content_type,
        size_bytes=len(content),
        storage_key=key,
    )
    db.add(evidence)
    db.add(
        OrganizationAdminLog(
            organization_id=organization_id,
            actor_user_id=user.id,
            action="profile_change.evidence.uploaded",
            details={
                "request_id": str(request_id),
                "evidence_id": str(evidence.id),
            },
        )
    )

    try:
        await db.commit()
        await db.refresh(evidence)
    except Exception:
        await db.rollback()
        path.unlink(missing_ok=True)
        raise

    return ChangeEvidenceRead.model_validate(evidence)


async def list_my_supporting_evidence(
    db: AsyncSession,
    user: User,
    organization_id: uuid.UUID,
    request_id: uuid.UUID,
) -> list[ChangeEvidenceRead]:
    _request, employee_id = await _owned_legal_name_request(db, user, organization_id, request_id)
    result = await db.execute(
        select(ProfileChangeEvidence)
        .where(
            ProfileChangeEvidence.organization_id == organization_id,
            ProfileChangeEvidence.request_id == request_id,
            ProfileChangeEvidence.employee_id == employee_id,
        )
        .order_by(ProfileChangeEvidence.uploaded_at)
    )
    return [ChangeEvidenceRead.model_validate(row) for row in result.scalars().all()]


async def list_evidence_for_hr(
    db: AsyncSession,
    organization_id: uuid.UUID,
    request_id: uuid.UUID,
) -> list[ChangeEvidenceRead]:
    request = await db.scalar(
        select(ProfileChangeRequest).where(
            ProfileChangeRequest.id == request_id,
            ProfileChangeRequest.organization_id == organization_id,
            ProfileChangeRequest.field == ChangeField.FULL_NAME,
        )
    )
    if request is None:
        raise HTTPException(status_code=404, detail="Legal-name request not found.")

    result = await db.execute(
        select(ProfileChangeEvidence)
        .where(
            ProfileChangeEvidence.organization_id == organization_id,
            ProfileChangeEvidence.request_id == request_id,
        )
        .order_by(ProfileChangeEvidence.uploaded_at)
    )
    return [ChangeEvidenceRead.model_validate(row) for row in result.scalars().all()]


async def get_evidence_file_for_hr(
    db: AsyncSession,
    organization_id: uuid.UUID,
    request_id: uuid.UUID,
    evidence_id: uuid.UUID,
) -> tuple[ProfileChangeEvidence, Path]:
    evidence = await db.scalar(
        select(ProfileChangeEvidence).where(
            ProfileChangeEvidence.id == evidence_id,
            ProfileChangeEvidence.organization_id == organization_id,
            ProfileChangeEvidence.request_id == request_id,
        )
    )
    if evidence is None:
        raise HTTPException(status_code=404, detail="Evidence file not found.")

    path = _storage_path(evidence.storage_key)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="The stored evidence file is missing.")
    return evidence, path