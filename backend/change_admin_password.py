"""One-time script to change admin password. Run inside the backend container:
   docker compose exec backend python change_admin_password.py
"""
import asyncio
from sqlalchemy import select, update
from database.connection import async_session
from database.models import User
from functions.auth import get_password_hash

NEW_PASSWORD = "sardor+2606+sh"
ADMIN_EMAIL = "admin@revmatology.uz"


async def main():
    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == ADMIN_EMAIL))
        user = result.scalar_one_or_none()
        if not user:
            print(f"User {ADMIN_EMAIL} not found!")
            return
        user.hashed_password = get_password_hash(NEW_PASSWORD)
        await session.commit()
        print(f"Password for {ADMIN_EMAIL} updated successfully.")


if __name__ == "__main__":
    asyncio.run(main())
