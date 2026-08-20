from sqlalchemy import Column, Integer, String
from database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)

    mentor_name = Column(String, nullable=False)

    mentor_email = Column(String, nullable=True)

    batch_name = Column(String, nullable=False)

    month = Column(String, nullable=False)

    total_sessions = Column(Integer, nullable=False)

    total_hours = Column(String, nullable=False)

    hourly_rate = Column(String, nullable=False)

    total_amount = Column(String, nullable=False)

    payment_status = Column(String, nullable=False)

    invoice_number = Column(String, unique=True, nullable=True)

    