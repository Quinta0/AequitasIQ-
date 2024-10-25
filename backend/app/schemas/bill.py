from pydantic import BaseModel, Field, validator
from datetime import date, datetime
from typing import Optional

class BillBase(BaseModel):
    name: str = Field(min_length=1)
    amount: float = Field(gt=0)
    due_date: date
    category: str = Field(min_length=1)
    is_recurring: bool = False
    frequency: Optional[str] = Field(None, pattern="^(monthly|quarterly|yearly)$")

    @validator("amount", pre=True)
    def validate_amount(cls, v):
        if v is not None:
            return round(float(v), 2)
        return v

    class Config:
        from_attributes = True

class BillCreate(BillBase):
    pass

class BillUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    amount: Optional[float] = Field(None, gt=0)
    due_date: Optional[date] = None
    category: Optional[str] = Field(None, min_length=1)
    is_recurring: Optional[bool] = None
    frequency: Optional[str] = Field(None, pattern="^(monthly|quarterly|yearly)$")

    @validator("amount", pre=True)
    def validate_amount(cls, v):
        if v is not None:
            return round(float(v), 2)
        return v

    class Config:
        from_attributes = True

class Bill(BillBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True