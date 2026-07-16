import hashlib
import os
from uuid import UUID, uuid4

import aiofiles
from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.document import Document
from app.models.user import User

router = APIRouter()

ALLOWED_TYPES = settings.ALLOWED_FILE_TYPES.split(",")
MAX_SIZE = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024  # Convert to bytes

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form("general"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Validate file extension
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else ""
    if ext not in ALLOWED_TYPES:
        return {"error": f"File type .{ext} not allowed. Allowed: {', '.join(ALLOWED_TYPES)}"}

    # Read file content
    content = await file.read()
    
    # Validate size
    if len(content) > MAX_SIZE:
        return {"error": f"File size exceeds maximum of {settings.MAX_UPLOAD_SIZE_MB}MB"}

    # Generate unique filename
    file_hash = hashlib.sha256(content).hexdigest()[:12]
    unique_name = f"{uuid4().hex[:8]}_{file_hash}.{ext}"
    
    # Save to disk
    company_dir = os.path.join(settings.STORAGE_LOCAL_PATH, str(current_user.company_id))
    os.makedirs(company_dir, exist_ok=True)
    file_path = os.path.join(company_dir, unique_name)
    
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # Create database record
    document = Document(
        id=uuid4(),
        company_id=current_user.company_id,
        name=unique_name,
        original_name=file.filename or "unnamed",
        mime_type=file.content_type or "application/octet-stream",
        size=len(content),
        path=file_path,
        storage_type="local",
        category=category,
        uploaded_by=current_user.id,
        checksum=hashlib.sha256(content).hexdigest(),
        created_by=current_user.id,
        updated_by=current_user.id
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    return {
        "id": str(document.id),
        "name": document.original_name,
        "size": document.size,
        "mime_type": document.mime_type,
        "url": f"/api/v1/documents/{document.id}/download"
    }

@router.get("/{document_id}/download")
async def download_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi.responses import FileResponse
    from sqlalchemy import select
    
    stmt = select(Document).where(
        Document.id == document_id,
        Document.company_id == current_user.company_id,
        Document.is_deleted == False
    )
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    
    if not document:
        return {"error": "Document not found"}
    
    if not os.path.exists(document.path):
        return {"error": "File not found on disk"}

    return FileResponse(
        path=document.path,
        filename=document.original_name,
        media_type=document.mime_type
    )
