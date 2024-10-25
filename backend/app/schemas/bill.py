from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional

class BillBase(BaseModel):
    name: str = Field(..., min_length=1)
    amount: float = Field(..., gt=0)
    due_date: date
    category: str
    is_recurring: bool = False
    frequency: Optional[str] = Field(None, pattern="^(monthly|quarterly|yearly)$")

class BillCreate(BillBase):
    pass

class BillUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1)
    amount: Optional[float] = Field(None, gt=0)
    due_date: Optional[date] = None
    category: Optional[str] = None
    is_recurring: Optional[bool] = None
    frequency: Optional[str] = Field(None, pattern="^(monthly|quarterly|yearly)$")

class Bill(BillBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True