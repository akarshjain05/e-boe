from pydantic import BaseModel, ConfigDict
from typing import Generic, TypeVar, List, Optional, Any
from uuid import UUID

T = TypeVar('T')

class PaginationParams(BaseModel):
    page: int = 1
    per_page: int = 10
    sort_by: Optional[str] = None
    sort_order: str = "asc"

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
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
    ids: List[UUID]
    action: str

class BulkActionResponse(BaseModel):
    success_count: int
    failed_count: int
    errors: Optional[List[dict]] = None
    
class DateRangeFilter(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
