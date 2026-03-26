from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import RoleEnum

class UserBase(BaseModel):
    username: str
    email: EmailStr
    role: RoleEnum = RoleEnum.alumno
    active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[RoleEnum] = None
    active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
