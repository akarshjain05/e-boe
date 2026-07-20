from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import sqlalchemy
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User, Role
from app.services.api_key import ApiKeyService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.APP_NAME}/api/v1/auth/login", auto_error=False)

async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    token: str | None = Depends(oauth2_scheme),
    x_api_key: str | None = Header(None)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if x_api_key:
        service = ApiKeyService(db)
        api_key = await service.verify_key(x_api_key)
        if not api_key:
            raise HTTPException(status_code=401, detail="Invalid or expired API Key")
        
        # Return the actual user who created the API key
        stmt = select(User).where(User.id == api_key.created_by, User.is_deleted == False)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=401, detail="API Key owner not found")
        return user

    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
            
        import uuid
        user_uuid = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    stmt = (
        select(User)
        .options(
            sqlalchemy.orm.selectinload(User.role).selectinload(Role.permissions),
            sqlalchemy.orm.selectinload(User.company)
        )
        .where(User.id == user_uuid, User.is_deleted == False)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    return user


async def get_current_active_superuser(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


def require_permission(permission_name: str):
    async def permission_checker(current_user: Annotated[User, Depends(get_current_user)]):
        if current_user.is_superuser:
            return current_user
        if not current_user.role:
            raise HTTPException(status_code=403, detail="Not enough privileges (No role)")
        has_perm = any(p.name == permission_name for p in current_user.role.permissions)
        if not has_perm:
            raise HTTPException(status_code=403, detail=f"Not enough privileges (Requires {permission_name})")
        return current_user
    return permission_checker


async def require_financier(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Ensure the user's company is a financier and their profile is verified."""
    if not current_user.company:
        raise HTTPException(status_code=403, detail="User is not associated with any company")
    
    if current_user.company.company_type != "financier":
        raise HTTPException(status_code=403, detail="Company is not a financier")
    
    from app.models.company import FinancierProfile
    stmt = select(FinancierProfile).where(FinancierProfile.company_id == current_user.company_id)
    profile = (await db.execute(stmt)).scalar_one_or_none()
    
    if not profile or not profile.is_verified:
        raise HTTPException(status_code=403, detail="Financier profile is not verified yet")
        
    return current_user
