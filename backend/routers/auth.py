from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.user import UserCreate, LoginRequest, TokenResponse, UserResponse
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    email = user_data.email.strip().casefold()
    existing = db.query(User).filter(func.lower(User.email) == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        name=user_data.name,
        email=email,
        hashed_password=hash_password(user_data.password),
        role=user_data.role,
        hourly_rate=user_data.hourly_rate,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    email = credentials.email.strip().casefold()
    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"user_id": user.id, "role": user.role})
    return TokenResponse(
        access_token=token,
        user_id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
