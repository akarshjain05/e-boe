from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel

T = TypeVar('T')

class PaginationParams(BaseModel):
    page: int = 1
    per_page: int = 10
    sort_by: str | None = None
    sort_order: str = "asc"

class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    per_page: int
    pages: int

class MessageResponse(BaseModel):
    message: str
    success: bool = True

class ErrorResponse(BaseModel):
    detail: str
    error_code: str
    success: bool = False

class BulkActionRequest(BaseModel):
    ids: list[UUID]
    action: str

class BulkActionResponse(BaseModel):
    success_count: int
    failed_count: int
    errors: list[dict] | None = None
    
class DateRangeFilter(BaseModel):
    start_date: str | None = None
    end_date: str | None = None
