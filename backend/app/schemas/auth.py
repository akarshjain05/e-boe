from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID

class LoginRequest(BaseModel):
    gst_number: str
    password: str
    remember_me: bool = False

class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: dict  # Will be UserResponse schema

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str
    last_name: str
    phone: Optional[str] = None
    company_name: str
    company_email: EmailStr
    organization_type: str
    company_pan: str
    owner_pan: str
    company_phone: str
    company_website: Optional[str] = None
    gst_number: str
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)

class VerifyEmailRequest(BaseModel):
    token: str

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class Setup2FAResponse(BaseModel):
    secret: str
    qr_code_url: str

class Verify2FARequest(BaseModel):
    token: str

class TokenPayload(BaseModel):
    sub: str
    exp: int
    type: str
    company_id: Optional[str] = None
    role: Optional[str] = None
