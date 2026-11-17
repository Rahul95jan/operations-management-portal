from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.session import Session as SessionModel
from schemas.session import SessionCreate, SessionResponse
from auth import get_current_user

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post("/", response_model=SessionResponse)
def create_session(
    session_data: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mentor = db.query(User).filter(User.id == session_data.mentor_id).first()
    if not mentor or mentor.role != "mentor":
        raise HTTPException(status_code=400, detail="Invalid mentor")

    session = SessionModel(
        topic=session_data.topic,
        mentor_id=session_data.mentor_id,
        mentor_name=session_data.mentor_name,
        batch_name=session_data.batch_name,
        session_date=session_data.session_date,
        session_time=session_data.session_time,
        status=session_data.status,
        meeting_link=session_data.meeting_link,
        created_by=current_user.id,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/", response_model=list[SessionResponse])
def get_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    mentor_id: int = None,
    status: str = None,
):
    query = db.query(SessionModel)
    if current_user.role == "mentor":
        query = query.filter(SessionModel.mentor_id == current_user.id)
    if mentor_id:
        query = query.filter(SessionModel.mentor_id == mentor_id)
    if status:
        query = query.filter(SessionModel.status == status)
    return query.order_by(SessionModel.session_date.desc()).all()


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session