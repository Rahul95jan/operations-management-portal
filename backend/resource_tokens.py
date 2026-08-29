import os
import secrets

PORTAL_URL = os.getenv("PORTAL_URL", "http://localhost:3000")


def generate_token():
    return secrets.token_urlsafe(24)


def get_or_create_session_token(db, session):
    """Stable per-session token — same link every time, generated lazily on
    first need (initial request email, reminder email, or manual lookup)."""
    if session.resource_access_token:
        return session.resource_access_token

    from models.session import Session as SessionModel

    token = generate_token()
    while db.query(SessionModel).filter(SessionModel.resource_access_token == token).first():
        token = generate_token()

    session.resource_access_token = token
    db.commit()
    db.refresh(session)
    return token


def get_session_by_token(db, token):
    from models.session import Session as SessionModel

    if not token:
        return None
    return db.query(SessionModel).filter(SessionModel.resource_access_token == token).first()


def submission_url(session):
    return f"{PORTAL_URL}/resources/submit/{session.resource_access_token}"
