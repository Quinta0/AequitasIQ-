from pydantic import BaseModel, Field, validator
from datetime import date, datetime
from typing import Optional

class TransactionBase(BaseModel):
    date: date
    description: str = Field(min_length=1)
    amount: float = Field(gt=0)
    category: str = Field(min_length=1)
    type: str = Field(pattern="^(expense|income)$")

    @validator("amount", pre=True)
    def validate_amount(cls, v):
        if v is not None:
            return round(float(v), 2)
        return v

    class Config:
        from_attributes = True

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    date: Optional[date] = None
    description: Optional[str] = Field(None, min_length=1)
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, min_length=1)
    type: Optional[str] = Field(None, pattern="^(expense|income)$")

    class Config:
        from_attributes = True

class Transaction(TransactionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True