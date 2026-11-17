from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_current_user, hash_password
from database import get_db
from models.user import User
from schemas.user import UserCreate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("", response_model=UserResponse)
@router.post("/", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create users")

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


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete users")

    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully", "user_id": user.id}


@router.get("/mentors", response_model=list[UserResponse])
def get_mentors(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mentors = db.query(User).filter(User.role == "mentor").all()
    return mentors


@router.get("", response_model=list[UserResponse])
@router.get("/", response_model=list[UserResponse])
def get_all_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Only admins can view all users")
    return db.query(User).all()