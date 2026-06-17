from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str
    email: str
    role: str

class SessionCreate(BaseModel):
    topic: str
    mentor_name: str
    batch_name: str
    session_date: str
    session_time: str
    status: str