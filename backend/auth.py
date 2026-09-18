"""
Real authentication + role/permission enforcement for the Operations Portal.

Design:
- Password auth (bcrypt) against the existing `users` table — no separate auth system.
- Stateless JWTs carry only {sub: user_id, exp}. They prove IDENTITY, never AUTHORIZATION.
  Every permission check re-reads the user's current role/permissions from the database on
  each request, so a permission revoked by a SUPER_ADMIN takes effect on the user's very next
  request — a still-valid token can't carry stale access.
- SECTIONS is the single source of truth for what a "section.action" permission string means,
  mapped 1:1 to routes that actually exist in this app (no invented modules).
"""
import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.user import User

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "insecure-dev-key-change-me")
ALGORITHM = "HS256"
TOKEN_TTL_HOURS = 12

SUPER_ADMIN = "SUPER_ADMIN"
ADMIN = "ADMIN"

# Central permission registry — mirrors the portal's real pages/routes.
# Sections marked administrative=True are never assignable to an ADMIN; SUPER_ADMIN only.
SECTIONS = {
    "dashboard":        {"label": "Dashboard",         "route": "/",                  "actions": ["view"]},
    "sessions":         {"label": "Sessions",          "route": "/sessions",          "actions": ["view", "create", "edit", "delete"]},
    "mentors":          {"label": "Mentors",            "route": "/mentors",           "actions": ["view", "create", "edit", "delete"]},
    "batches":          {"label": "Batches",            "route": "/batches",           "actions": ["view", "create", "edit", "delete"]},
    "analytics":        {"label": "Analytics",          "route": "/analytics",         "actions": ["view", "export"]},
    "invoices":         {"label": "Invoices",           "route": "/invoice-generator", "actions": ["view", "create", "edit"]},
    "resources":        {"label": "Resource Portal",    "route": "/resources",         "actions": ["view", "manage"]},
    "feedback":         {"label": "Learner Feedback",   "route": "/nps",               "actions": ["view"]},
    "user_management":  {"label": "User Management",    "route": "/admin/users",       "actions": ["view", "create", "edit", "deactivate", "manage_permissions"], "administrative": True},
    "activity_logs":    {"label": "Activity Logs",      "route": "/admin/activity",    "actions": ["view"], "administrative": True},
    "portal_settings":  {"label": "Portal Settings",    "route": "/settings",          "actions": ["view", "manage"], "administrative": True},
}

ASSIGNABLE_SECTIONS = {k: v for k, v in SECTIONS.items() if not v.get("administrative")}


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode(), password_hash.encode())
    except ValueError:
        return False


def create_access_token(user: User) -> str:
    payload = {"sub": str(user.id), "exp": datetime.utcnow() + timedelta(hours=TOKEN_TTL_HOURS)}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _decode(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None


def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated.")
    payload = _decode(authorization.split(" ", 1)[1])
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please log in again.")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Account not found or deactivated.")
    return user


def user_public(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "username": user.username,
        "role": user.role,
        "is_active": user.is_active,
        "permissions": user.permissions or [],
        "has_photo": bool(user.photo_path),
        "photo_path": user.photo_path,
    }


def has_permission(user: User, section: str, action: str = "view") -> bool:
    if user.role == SUPER_ADMIN:
        return True
    perms = user.permissions or []
    return f"{section}.{action}" in perms


def require_permission(section: str, action: str = "view"):
    def _dep(user: User = Depends(get_current_user)) -> User:
        if not has_permission(user, section, action):
            raise HTTPException(status_code=403, detail=f"You don't have access to {SECTIONS.get(section, {}).get('label', section)}.")
        return user
    return _dep


def require_super_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Super Admin access required.")
    return user


def count_active_super_admins(db: Session, exclude_id: int = None) -> int:
    q = db.query(User).filter(User.role == SUPER_ADMIN, User.is_active == True)  # noqa: E712
    if exclude_id is not None:
        q = q.filter(User.id != exclude_id)
    return q.count()
