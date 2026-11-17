from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine
from models.user import Base
from routers import auth, users, sessions

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Operations Management Portal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://operations-management-portal.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(sessions.router)


@app.get("/")
def home():
    return {"message": "Operations Portal API Running"}
