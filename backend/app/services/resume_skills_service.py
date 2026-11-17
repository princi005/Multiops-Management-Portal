"""
Suggests skills found in the logged-in employee's uploaded resume. Nothing is
saved here: the employee reviews the suggestions and saves the ones they want
through the normal skills editor. The resume text is read into memory, scanned
and thrown away - it is never stored or logged.

Skills the employee already has are left out of the suggestions.
"""

import asyncio

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.employee_skill import EmployeeSkill
from app.models.skill import Skill
from app.models.user import User
from app.schemas.resume import SkillSuggestion, SkillSuggestions
from app.services import resume_service
from app.services.me_service import get_my_employee
from app.services.resume_text import (
    MAX_SUGGESTIONS,
    MIN_CATALOG_USERS,
    ResumeTextError,
    build_vocabulary,
    compile_vocabulary,
    extract_text,
    find_skills,
)
from app.services.skill_vocabulary import BUILTIN_SKILLS, CASE_SENSITIVE


async def suggest_skills_from_resume(db: AsyncSession, user: User) -> SkillSuggestions:
    resume, path = await resume_service.get_my_resume_file(db, user)

    content = await asyncio.to_thread(path.read_bytes)
    try:
        text = await asyncio.to_thread(extract_text, path.suffix.lower(), content)
    except ResumeTextError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=exc.message) from exc

    readable = len(text.strip())
    if readable == 0:
        return SkillSuggestions(suggestions=[], characters_read=0)

    employee = await get_my_employee(db, user)

    catalog_result = await db.execute(select(Skill.name))
    catalog_names = list(catalog_result.scalars().all())

    popular_result = await db.execute(
        select(Skill.name)
        .join(EmployeeSkill, EmployeeSkill.skill_id == Skill.id)
        .group_by(Skill.id, Skill.name)
        .having(func.count(EmployeeSkill.employee_id) >= MIN_CATALOG_USERS)
    )
    popular_names = list(popular_result.scalars().all())

    current_result = await db.execute(
        select(Skill.name)
        .join(EmployeeSkill, EmployeeSkill.skill_id == Skill.id)
        .where(EmployeeSkill.employee_id == employee.id)
    )
    current = {name.lower() for name in current_result.scalars().all()}

    vocabulary = build_vocabulary(BUILTIN_SKILLS, CASE_SENSITIVE, catalog_names, popular_names)
    found = find_skills(text, compile_vocabulary(vocabulary))

    suggestions = [
        SkillSuggestion(name=name, mentions=mentions)
        for name, mentions in found
        if name.lower() not in current
    ][:MAX_SUGGESTIONS]
    return SkillSuggestions(suggestions=suggestions, characters_read=readable)