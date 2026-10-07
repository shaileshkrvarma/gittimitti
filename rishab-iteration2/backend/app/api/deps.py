from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.security import decode_access_token
from app.integrations.payment_gateway import PaymentGateway, get_payment_gateway
from app.models import Supplier, User, UserRole

bearer = HTTPBearer(auto_error=False)

DB = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DB, creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if creds is None:
        raise unauthorized
    user_id = decode_access_token(creds.credentials)
    if user_id is None:
        raise unauthorized
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise unauthorized
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_admin(user: CurrentUser) -> User:
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


AdminUser = Annotated[User, Depends(require_admin)]


def require_supplier(db: DB, user: CurrentUser) -> Supplier:
    supplier = (
        db.scalar(select(Supplier).where(Supplier.user_id == user.id))
        if user.role == UserRole.SUPPLIER
        else None
    )
    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Supplier access required"
        )
    return supplier


CurrentSupplier = Annotated[Supplier, Depends(require_supplier)]
Gateway = Annotated[PaymentGateway, Depends(get_payment_gateway)]
