from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.dependencies.auth import get_current_user
from app.core.database import get_db
from app.models.company import FinancierProfile, Company
from app.models.user import User
from app.schemas.company import FinancierProfileCreate, FinancierProfileUpdate, FinancierProfileResponse, CompanyResponse
from typing import List

router = APIRouter()


@router.get("/profile", response_model=FinancierProfileResponse)
async def get_financier_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.company_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not associated with any company")

    stmt = select(FinancierProfile).where(FinancierProfile.company_id == current_user.company_id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Financier profile not found")

    return profile


@router.post("/profile", response_model=FinancierProfileResponse)
async def create_financier_profile(
    data: FinancierProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.company_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not associated with any company")

    # Check if company is actually a financier
    stmt_company = select(Company).where(Company.id == current_user.company_id)
    result_company = await db.execute(stmt_company)
    company = result_company.scalar_one_or_none()

    if not company or company.company_type != "financier":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Company is not a financier")

    # Check if profile already exists
    stmt_existing = select(FinancierProfile).where(FinancierProfile.company_id == current_user.company_id)
    result_existing = await db.execute(stmt_existing)
    if result_existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Financier profile already exists")

    profile = FinancierProfile(
        id=uuid4(),
        company_id=current_user.company_id,
        created_by=current_user.id,
        updated_by=current_user.id,
        **data.model_dump()
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    return profile


@router.patch("/profile", response_model=FinancierProfileResponse)
async def update_financier_profile(
    data: FinancierProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.company_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not associated with any company")

    stmt = select(FinancierProfile).where(FinancierProfile.company_id == current_user.company_id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Financier profile not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)

    profile.updated_by = current_user.id
    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    return profile

@router.post("/register", response_model=FinancierProfileResponse)
async def register_financier(
    data: FinancierProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Alias for profile creation as requested by API catalogue."""
    return await create_financier_profile(data=data, db=db, current_user=current_user)

@router.get("/", response_model=List[CompanyResponse])
async def list_verified_financiers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Company).join(FinancierProfile).where(
        Company.company_type == "financier", 
        FinancierProfile.is_verified == True
    )
    return (await db.execute(stmt)).scalars().all()
