from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import Optional, List
from .. import models, schemas

def create_bill(db: Session, bill: schemas.BillCreate):
    db_bill = models.Bill(**bill.dict())
    db.add(db_bill)
    db.commit()
    db.refresh(db_bill)
    return db_bill

def get_bills(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None
) -> List[models.Bill]:
    query = db.query(models.Bill)
    
    if start_date:
        query = query.filter(models.Bill.due_date >= start_date)
    if end_date:
        query = query.filter(models.Bill.due_date <= end_date)
    if category:
        query = query.filter(models.Bill.category == category)
        
    return query.offset(skip).limit(limit).all()

def get_bill(db: Session, bill_id: int):
    return db.query(models.Bill).filter(models.Bill.id == bill_id).first()

def update_bill(db: Session, bill_id: int, bill: schemas.BillUpdate):
    db_bill = get_bill(db=db, bill_id=bill_id)
    if db_bill:
        update_data = bill.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_bill, key, value)
        db.commit()
        db.refresh(db_bill)
    return db_bill