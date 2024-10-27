from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean
from sqlalchemy.sql import func
from .base import Base

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 'expense' or 'income'
    is_fixed = Column(Boolean, default=False, nullable=False)  # Add this line
    frequency = Column(String, nullable=True)  # Add this line
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())