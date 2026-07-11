from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.settings import ApiKey
from app.services.api_key import ApiKeyService
from typing import Annotated, Optional

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.APP_NAME}/api/v1/auth/login", auto_error=False)

async def get_current_user(
    db: Annotated[AsyncSession, Depends(get_db)],
    token: Optional[str] = Depends(oauth2_scheme),
    x_api_key: Optional[str] = Header(None)
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
        
        # Return a synthetic user bound to the company_id for downstream dependencies
        return User(id=api_key.created_by, company_id=api_key.company_id, is_active=True, is_superuser=False)

    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    stmt = select(User).where(User.id == user_id)
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
