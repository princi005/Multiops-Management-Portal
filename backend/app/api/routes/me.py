import uuid
from fastapi import APIRouter, Depends, File, Response, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.api.tenant import get_current_organization
from app.db.session import get_db
from app.models.user import User
from app.schemas.employee import SkillTag
from app.schemas.me import MyPersonalDetailsRead, MyPersonalDetailsUpdate, MyProfile, MySalary, MySkillsUpdate, ProfileCourseCreate, ProfileCourseRead, ProfileCourseUpdate, ProfileExperienceCreate, ProfileExperienceRead, ProfileExperienceUpdate
from app.schemas.resume import MyResume, SkillSuggestions
from app.services import me_service, resume_service, resume_skills_service
from app.services import employee_profile_details_service
from app.services import employee_profile_entries_service

router = APIRouter(prefix="/me", tags=["me"])


@router.get("/profile", response_model=MyProfile)
async def my_profile(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await me_service.get_my_profile(db, user)


@router.get("/profile-details", response_model=MyPersonalDetailsRead)
async def my_personal_details(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    return await employee_profile_details_service.get_my_personal_details(
        db, user, organization.id
    )


@router.patch("/profile-details", response_model=MyPersonalDetailsRead)
async def update_my_personal_details(
    payload: MyPersonalDetailsUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    return await employee_profile_details_service.update_my_personal_details(
        db, user, organization.id, payload
    )

@router.put("/skills", response_model=list[SkillTag])
async def update_my_skills(
    payload: MySkillsUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await me_service.set_my_skills(db, user, payload.skills)


@router.get("/experiences", response_model=list[ProfileExperienceRead])
async def list_my_experiences(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    return await employee_profile_entries_service.list_experiences(db, user, organization.id)


@router.post("/experiences", response_model=ProfileExperienceRead, status_code=status.HTTP_201_CREATED)
async def create_my_experience(
    payload: ProfileExperienceCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    return await employee_profile_entries_service.create_experience(db, user, organization.id, payload)


@router.patch("/experiences/{entry_id}", response_model=ProfileExperienceRead)
async def update_my_experience(
    entry_id: uuid.UUID,
    payload: ProfileExperienceUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    return await employee_profile_entries_service.update_experience(
        db, user, organization.id, entry_id, payload
    )


@router.delete("/experiences/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_experience(
    entry_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    await employee_profile_entries_service.delete_experience(db, user, organization.id, entry_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/courses", response_model=list[ProfileCourseRead])
async def list_my_courses(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    return await employee_profile_entries_service.list_courses(db, user, organization.id)


@router.post("/courses", response_model=ProfileCourseRead, status_code=status.HTTP_201_CREATED)
async def create_my_course(
    payload: ProfileCourseCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    return await employee_profile_entries_service.create_course(db, user, organization.id, payload)


@router.patch("/courses/{entry_id}", response_model=ProfileCourseRead)
async def update_my_course(
    entry_id: uuid.UUID,
    payload: ProfileCourseUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    return await employee_profile_entries_service.update_course(
        db, user, organization.id, entry_id, payload
    )


@router.delete("/courses/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_course(
    entry_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    active=Depends(get_current_organization),
):
    organization, _membership = active
    await employee_profile_entries_service.delete_course(db, user, organization.id, entry_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/resume", response_model=MyResume | None)
async def my_resume(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await resume_service.get_my_resume(db, user)


@router.post("/resume", response_model=MyResume, status_code=status.HTTP_201_CREATED)
async def upload_my_resume(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await resume_service.save_my_resume(db, user, file)


@router.post("/resume/suggest-skills", response_model=SkillSuggestions)
async def suggest_skills_from_my_resume(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await resume_skills_service.suggest_skills_from_resume(db, user)


@router.get("/resume/download")
async def download_my_resume(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    resume, path = await resume_service.get_my_resume_file(db, user)
    return FileResponse(
        path,
        media_type=resume.content_type,
        filename=resume.original_filename,
        headers={"X-Content-Type-Options": "nosniff"},
    )


@router.delete("/resume", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_resume(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    await resume_service.delete_my_resume(db, user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/salary", response_model=MySalary)
async def my_salary(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await me_service.get_my_salary(db, user)