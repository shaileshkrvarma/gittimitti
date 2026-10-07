"""Create or promote an admin user.

Usage: python -m app.scripts.create_admin --email admin@example.com --name "Admin"
The password is read from ADMIN_PASSWORD or prompted; it is never hard-coded.
"""

import argparse
import getpass
import os

from sqlalchemy import func, select

from app.core.db import SessionLocal
from app.core.security import hash_password
from app.models import User, UserRole


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", default="Administrator")
    args = parser.parse_args()

    password = os.environ.get("ADMIN_PASSWORD") or getpass.getpass("Admin password: ")
    if len(password) < 8:
        raise SystemExit("Password must be at least 8 characters")

    with SessionLocal() as db:
        email = args.email.lower()
        user = db.scalar(select(User).where(func.lower(User.email) == email))
        if user is None:
            user = User(full_name=args.name, email=email, password_hash=hash_password(password))
            db.add(user)
        else:
            user.password_hash = hash_password(password)
        user.role = UserRole.ADMIN
        user.is_active = True
        db.commit()
        print(f"Admin ready: {email}")


if __name__ == "__main__":
    main()
