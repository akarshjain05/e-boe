from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserUpdate, UserResponse
from app.api.dependencies.auth import get_current_user

from sqlalchemy import select
from typing import List
from app.core.security import hash_password
from app.schemas.user import UserCreate

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
async def get_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.company_id:
        return []
    result = await db.execute(
        select(User).where(User.company_id == current_user.company_id)
    )
    return result.scalars().all()

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.company_id:
        raise HTTPException(status_code=400, detail="User is not associated with a company")
        
    # Check if email exists
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    import secrets
    pwd = data.password if data.password else secrets.token_urlsafe(16)

    new_user = User(
        email=data.email,
        password_hash=hash_password(pwd),
        first_name=data.first_name,
        last_name=data.last_name,
        phone=data.phone,
        pan_number=data.pan_number,
        company_id=current_user.company_id
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Update fields
    current_user.first_name = data.first_name
    current_user.last_name = data.last_name
    if data.phone is not None:
        current_user.phone = data.phone
    if data.pan_number is not None:
        current_user.pan_number = data.pan_number
        
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    return current_user
