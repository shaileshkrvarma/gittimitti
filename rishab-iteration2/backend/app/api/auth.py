from fastapi import APIRouter, HTTPException, status
from sqlalchemy import func, select

from app.api.deps import DB, CurrentUser
from app.core.security import create_access_token, hash_password, verify_password
from app.models import Supplier, User, UserRole
from app.schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(data: RegisterRequest, db: DB) -> User:
    email = data.email.lower()
    if db.scalar(select(User).where(func.lower(User.email) == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    user = User(
        full_name=data.full_name.strip(),
        email=email,
        phone=data.phone,
        password_hash=hash_password(data.password),
        role=UserRole(data.role),
    )
    db.add(user)
    if user.role == UserRole.SUPPLIER:
        name = data.supplier_name.strip()
        if db.scalar(select(Supplier).where(func.lower(Supplier.name) == name.lower())):
            raise HTTPException(status.HTTP_409_CONFLICT, "Supplier name already registered")
        db.flush()
        db.add(Supplier(name=name, email=email, phone=data.phone, user_id=user.id))
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: DB) -> TokenResponse:
    user = db.scalar(select(User).where(func.lower(User.email) == data.email.lower()))
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account is deactivated")
    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser) -> User:
    return user
