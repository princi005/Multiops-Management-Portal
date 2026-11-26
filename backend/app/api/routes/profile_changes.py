import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.api.tenant import get_current_organization
from app.db.session import get_db
from app.models.profile_change_request import ChangeStatus
from app.models.user import User
from app.schemas.profile_change import (
    ChangeDecision,
    ChangeEvidenceRead,
    ChangeRequestCreate,
    ChangeRequestHRRead,
    ChangeRequestRead,
)
from app.services import profile_change_service
from app.services import profile_change_evidence_service
from app.schemas.identity_document import IdentityDocumentRead, IdentityDocumentType
from app.services import identity_document_service

router = APIRouter(tags=["profile-changes"])

@router.get(
    "/me/identity-documents",
    response_model=list[IdentityDocumentRead],
)
async def list_my_identity_documents(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    return await identity_document_service.list_my_identity_documents(
        db, user, organization.id
    )


@router.post(
    "/me/identity-documents/{document_type}",
    response_model=IdentityDocumentRead,
    status_code=201,
)
async def upload_my_identity_document(
    document_type: IdentityDocumentType,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    return await identity_document_service.upload_my_identity_document(
        db, user, organization.id, document_type, file
    )


@router.get(
    "/identity-documents/{employee_id}",
    response_model=list[IdentityDocumentRead],
)
async def list_identity_documents_for_hr(
    employee_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    active=Depends(get_current_organization),
):
    _require_org_reviewer(active)
    organization, _membership = active
    return await identity_document_service.list_employee_identity_documents_for_hr(
        db, organization.id, employee_id
    )


@router.get(
    "/identity-documents/{employee_id}/{document_type}/download",
)
async def download_identity_document_for_hr(
    employee_id: uuid.UUID,
    document_type: IdentityDocumentType,
    db: AsyncSession = Depends(get_db),
    active=Depends(get_current_organization),
):
    _require_org_reviewer(active)
    organization, _membership = active
    document, path = await identity_document_service.get_identity_document_file_for_hr(
        db, organization.id, employee_id, document_type
    )
    return FileResponse(
        path,
        media_type=document.content_type,
        filename=document.original_filename,
        headers={"X-Content-Type-Options": "nosniff"},
    )


@router.post(
    "/identity-documents/{employee_id}/{document_type}/verify",
    response_model=IdentityDocumentRead,
)
async def verify_identity_document_for_hr(
    employee_id: uuid.UUID,
    document_type: IdentityDocumentType,
    db: AsyncSession = Depends(get_db),
    reviewer: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    _require_org_reviewer(active)
    organization, _membership = active
    return await identity_document_service.verify_employee_identity_document(
        db, reviewer, organization.id, employee_id, document_type
    )

def _require_org_reviewer(active):
    _organization, membership = active
    if membership.role.casefold() not in {"hr", "ceo"}:
        raise HTTPException(status_code=403, detail="HR or CEO permission required in this organization.")



@router.post(
    "/me/change-requests/{request_id}/evidence",
    response_model=ChangeEvidenceRead,
    status_code=201,
)
async def upload_my_change_evidence(
    request_id: uuid.UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    return await profile_change_evidence_service.upload_supporting_evidence(
        db, user, organization.id, request_id, file
    )


@router.get(
    "/me/change-requests/{request_id}/evidence",
    response_model=list[ChangeEvidenceRead],
)
async def list_my_change_evidence(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    return await profile_change_evidence_service.list_my_supporting_evidence(
        db, user, organization.id, request_id
    )

# ---- the employee's own requests ----

@router.post("/me/change-requests", response_model=ChangeRequestRead, status_code=201)
async def submit_change_request(
    payload: ChangeRequestCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    return await profile_change_service.submit_change_request(db, user, payload, organization.id)


@router.get("/me/change-requests", response_model=list[ChangeRequestRead])
async def list_my_change_requests(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    return await profile_change_service.list_my_requests(db, user, organization.id)


@router.post("/me/change-requests/{request_id}/cancel", response_model=ChangeRequestRead)
async def cancel_my_change_request(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    return await profile_change_service.cancel_my_request(db, user, organization.id, request_id)


# ---- HR (the CEO can step in) ----

@router.get(
    "/change-requests/{request_id}/evidence",
    response_model=list[ChangeEvidenceRead],
)
async def list_change_evidence_for_hr(
    request_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    active=Depends(get_current_organization),
):
    _require_org_reviewer(active)
    organization, _membership = active
    return await profile_change_evidence_service.list_evidence_for_hr(
        db, organization.id, request_id
    )


@router.get(
    "/change-requests/{request_id}/evidence/{evidence_id}/download",
)
async def download_change_evidence_for_hr(
    request_id: uuid.UUID,
    evidence_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    active=Depends(get_current_organization),
):
    _require_org_reviewer(active)
    organization, _membership = active
    evidence, path = await profile_change_evidence_service.get_evidence_file_for_hr(
        db, organization.id, request_id, evidence_id
    )
    return FileResponse(
        path,
        media_type=evidence.content_type,
        filename=evidence.original_filename,
        headers={"X-Content-Type-Options": "nosniff"},
    )

@router.get("/change-requests", response_model=list[ChangeRequestHRRead])
async def list_change_requests(
    status_filter: ChangeStatus | None = Query(default=None, alias="status"),
    db: AsyncSession = Depends(get_db),
    active=Depends(get_current_organization),
):
    _require_org_reviewer(active)
    organization, _membership = active
    return await profile_change_service.list_requests_for_hr(db, organization.id, status_filter)


@router.post("/change-requests/{request_id}/approve", response_model=ChangeRequestHRRead)
async def approve_change_request(
    request_id: uuid.UUID,
    payload: ChangeDecision | None = None,
    db: AsyncSession = Depends(get_db),
    decider: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    _require_org_reviewer(active)
    organization, _membership = active
    note = payload.decision_note if payload else None
    return await profile_change_service.decide_request(db, decider, organization.id, request_id, True, note)


@router.post("/change-requests/{request_id}/reject", response_model=ChangeRequestHRRead)
async def reject_change_request(
    request_id: uuid.UUID,
    payload: ChangeDecision | None = None,
    db: AsyncSession = Depends(get_db),
    decider: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    _require_org_reviewer(active)
    organization, _membership = active
    note = payload.decision_note if payload else None
    return await profile_change_service.decide_request(db, decider, organization.id, request_id, False, note)