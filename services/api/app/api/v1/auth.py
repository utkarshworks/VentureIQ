"""
Authentication API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import verify_password, create_access_token
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
    OrganizationResponse,
)
from app.repositories.user_repository import UserRepository
from app.api.deps import get_current_user, get_current_organization
from app.models.user import User, Organization
from typing import Tuple

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(req: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    existing = await repo.get_by_email(req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists",
        )
    user, org = await repo.create_user_with_org(
        email=req.email,
        password=req.password,
        full_name=req.full_name,
        org_name=req.organization_name,
    )
    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user.id, email=user.email, full_name=user.full_name, is_active=user.is_active),
        organization=OrganizationResponse(id=org.id, name=org.name, slug=org.slug, role="owner"),
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    user = await repo.get_by_email(req.email)
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    org_info = await repo.get_user_organization(user.id)
    if not org_info:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No active organization found")
    org, role = org_info
    token = create_access_token(user.id)
    return TokenResponse(
        access_token=token,
        user=UserResponse(id=user.id, email=user.email, full_name=user.full_name, is_active=user.is_active),
        organization=OrganizationResponse(id=org.id, name=org.name, slug=org.slug, role=role),
    )


@router.get("/me")
async def get_me(
    current_user: User = Depends(get_current_user),
    org_info: Tuple[Organization, str] = Depends(get_current_organization),
):
    org, role = org_info
    return {
        "user": UserResponse(
            id=current_user.id,
            email=current_user.email,
            full_name=current_user.full_name,
            is_active=current_user.is_active,
        ),
        "organization": OrganizationResponse(
            id=org.id,
            name=org.name,
            slug=org.slug,
            role=role,
        ),
    }
