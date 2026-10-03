from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    username: Optional[str] = None
    created_at: datetime


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PageCreate(BaseModel):
    title: str = "Generated Page"
    description: Optional[str] = None
    platform: str = "react"
    code: str = ""


class PageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    title: str
    description: Optional[str] = None
    platform: str
    code: str
    created_at: datetime
