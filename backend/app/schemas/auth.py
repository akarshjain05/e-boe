
from pydantic import BaseModel, EmailStr, Field


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
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    company_name: str | None = None
    company_email: EmailStr | None = None
    organization_type: str | None = None
    company_pan: str | None = None
    owner_pan: str | None = None
    company_phone: str | None = None
    company_website: str | None = None
    gst_number: str
    address_line1: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None
    postal_code: str | None = None

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
    company_id: str | None = None
    role: str | None = None
