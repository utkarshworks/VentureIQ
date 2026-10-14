"""
User & Organization Repository.
"""
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User, Organization, OrganizationMember
from app.core.security import hash_password


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_email(self, email: str) -> Optional[User]:
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def get_by_id(self, user_id: str) -> Optional[User]:
        stmt = select(User).where(User.id == user_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def create_user_with_org(
        self,
        email: str,
        password: str,
        full_name: str,
        org_name: str,
    ) -> Tuple[User, Organization]:
        # Create user
        user = User(
            email=email,
            hashed_password=hash_password(password),
            full_name=full_name,
        )
        self.db.add(user)
        await self.db.flush()

        # Create organization
        slug = org_name.lower().replace(" ", "-").replace(".", "") + f"-{user.id[:6]}"
        org = Organization(name=org_name, slug=slug)
        self.db.add(org)
        await self.db.flush()

        # Add owner membership
        member = OrganizationMember(
            organization_id=org.id,
            user_id=user.id,
            role="owner",
        )
        self.db.add(member)
        await self.db.commit()
        await self.db.refresh(user)
        await self.db.refresh(org)
        return user, org

    async def get_user_organization(self, user_id: str) -> Optional[Tuple[Organization, str]]:
        stmt = (
            select(Organization, OrganizationMember.role)
            .join(OrganizationMember, Organization.id == OrganizationMember.organization_id)
            .where(OrganizationMember.user_id == user_id)
        )
        result = await self.db.execute(stmt)
        row = result.first()
        if row:
            return row[0], row[1]
        return None

