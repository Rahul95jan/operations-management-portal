from database import engine
from models.user import Base
from models.session import Session

Base.metadata.create_all(bind=engine)

print("Tables Created Successfully")