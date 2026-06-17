from fastapi import FastAPI
from sqlalchemy.orm import Session

from database import SessionLocal
from models.session import Session as SessionModel
from schemas import UserCreate, SessionCreate

app = FastAPI()

@app.get("/")
def home():
return {"message": "Operations Portal API Running"}

@app.post("/users")
def create_user(user: UserCreate):
return {
"message": "User Created",
"data": user
}

@app.post("/sessions")
def create_session(session: SessionCreate):

```
db = SessionLocal()

new_session = SessionModel(
    topic=session.topic,
    mentor_name=session.mentor_name,
    batch_name=session.batch_name,
    session_date=session.session_date,
    session_time=session.session_time,
    status=session.status
)

db.add(new_session)
db.commit()
db.refresh(new_session)

db.close()

return {
    "message": "Session Created Successfully",
    "id": new_session.id
}
@app.get("/sessions")
def get_sessions():

    db = SessionLocal()

    sessions = db.query(SessionModel).all()

    db.close()

    return sessions