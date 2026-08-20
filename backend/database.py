import socket
import psycopg2
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv
from urllib.parse import urlparse, parse_qs

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# This machine's route to Neon's pooler over IPv6 silently drops packets
# (DNS returns IPv6 first, and the connection then hangs forever instead of
# failing fast). Force IPv4 by resolving the hostname ourselves and passing
# it via hostaddr, while still passing host= so SSL hostname checks work.
def _connect():
    parsed = urlparse(DATABASE_URL)
    query = parse_qs(parsed.query)
    ipv4 = socket.getaddrinfo(parsed.hostname, parsed.port or 5432, socket.AF_INET)[0][4][0]

    return psycopg2.connect(
        host=parsed.hostname,
        hostaddr=ipv4,
        port=parsed.port or 5432,
        dbname=parsed.path.lstrip("/"),
        user=parsed.username,
        password=parsed.password,
        sslmode=query.get("sslmode", ["require"])[0],
        channel_binding=query.get("channel_binding", ["require"])[0],
    )

engine = create_engine("postgresql://", creator=_connect)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()