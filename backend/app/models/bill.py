from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean
from sqlalchemy.sql import func
from .base import Base

class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    due_date = Column(Date, nullable=False)
    category = Column(String, nullable=False)
    is_recurring = Column(Boolean, default=False)
    frequency = Column(String)  # monthly, quarterly, yearly
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())