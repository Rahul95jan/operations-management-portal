import os
import unittest

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_users.db")

from auth import hash_password
from database import SessionLocal, engine
from models.user import Base, User
from routers.auth import login
from routers.users import create_user, delete_user
from schemas.user import LoginRequest, UserCreate


class AdminUserCreationTest(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            db.query(User).delete()
            db.commit()
            admin = User(
                name="Admin User",
                email="admin@example.com",
                hashed_password=hash_password("AdminPass123"),
                role="admin",
                hourly_rate=0.0,
            )
            db.add(admin)
            db.commit()
        finally:
            db.close()

    def test_admin_can_create_user_and_new_user_can_login(self):
        db = SessionLocal()
        try:
            admin = db.query(User).filter(User.email == "admin@example.com").one()
        finally:
            db.close()

        login_response = login(
            LoginRequest(email="admin@example.com", password="AdminPass123"),
            db=SessionLocal(),
        )
        self.assertTrue(login_response.access_token)

        db = SessionLocal()
        try:
            created_user = create_user(
                user_data=UserCreate(
                    name="Mentor User",
                    email="mentor@example.com",
                    password="MentorPass123",
                    role="mentor",
                    hourly_rate=30.0,
                ),
                db=db,
                current_user=admin,
            )
        finally:
            db.close()

        self.assertEqual(created_user.email, "mentor@example.com")

        db = SessionLocal()
        try:
            user = db.query(User).filter(User.email == "mentor@example.com").one()
            self.assertNotEqual(user.hashed_password, "MentorPass123")
            self.assertTrue(user.hashed_password.startswith("$2b$"))
        finally:
            db.close()

        login_response = login(
            LoginRequest(email="mentor@example.com", password="MentorPass123"),
            db=SessionLocal(),
        )
        self.assertEqual(login_response.role, "mentor")

    def test_admin_can_delete_a_user(self):
        db = SessionLocal()
        try:
            admin = db.query(User).filter(User.email == "admin@example.com").one()
            created_user = create_user(
                user_data=UserCreate(
                    name="Delete Me",
                    email="delete@example.com",
                    password="DeleteMe123",
                    role="mentor",
                    hourly_rate=20.0,
                ),
                db=db,
                current_user=admin,
            )

            result = delete_user(created_user.id, db=db, current_user=admin)
            self.assertEqual(result["user_id"], created_user.id)
            self.assertIsNone(db.query(User).filter(User.email == "delete@example.com").first())
        finally:
            db.close()
