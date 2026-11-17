from fastapi import APIRouter, Depends, File, Response, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.employee import SkillTag
from app.schemas.me import MyProfile, MySalary, MySkillsUpdate
from app.schemas.resume import MyResume, SkillSuggestions
from app.services import me_service, resume_service, resume_skills_service

router = APIRouter(prefix="/me", tags=["me"])


@router.get("/profile", response_model=MyProfile)
async def my_profile(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await me_service.get_my_profile(db, user)


@router.put("/skills", response_model=list[SkillTag])
async def update_my_skills(
    payload: MySkillsUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await me_service.set_my_skills(db, user, payload.skills)


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