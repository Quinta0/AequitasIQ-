from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional

class TransactionBase(BaseModel):
    date: date
    description: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    category: Optional[str] = None
    type: str = Field(..., pattern="^(expense|income)$")

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    date: Optional[date] = None
    description: Optional[str] = Field(None, min_length=1)
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = None
    type: Optional[str] = Field(None, pattern="^(expense|income)$")

class Transaction(TransactionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True