from sqlalchemy import Column, Integer, String, Float
from database import Base


class OperationsAnalytics(Base):
    __tablename__ = "operations_analytics"

    id = Column(Integer, primary_key=True, index=True)

    project_name = Column(String)
    batch_name = Column(String)
    mentor_name = Column(String)

    total_sessions = Column(Integer, default=0)
    completed_sessions = Column(Integer, default=0)
    cancelled_sessions = Column(Integer, default=0)

    sla_percentage = Column(Float, default=0)
    completion_percentage = Column(Float, default=0)

    mentor_utilization = Column(Float, default=0)
    resource_utilization = Column(Float, default=0)

    productivity_score = Column(Float, default=0)

    status = Column(String)