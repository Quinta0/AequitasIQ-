from sqlalchemy.orm import Session
from datetime import datetime, date
from typing import Optional, List
from .. import models, schemas

def create_transaction(db: Session, transaction: schemas.TransactionCreate):
    db_transaction = models.Transaction(**transaction.dict())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

def get_transactions(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
    transaction_type: Optional[str] = None
) -> List[models.Transaction]:
    query = db.query(models.Transaction)
    
    if start_date:
        query = query.filter(models.Transaction.date >= start_date)
    if end_date:
        query = query.filter(models.Transaction.date <= end_date)
    if category:
        query = query.filter(models.Transaction.category == category)
    if transaction_type:
        query = query.filter(models.Transaction.type == transaction_type)
        
    return query.offset(skip).limit(limit).all()

def get_transaction(db: Session, transaction_id: int):
    return db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()

def update_transaction(db: Session, transaction_id: int, transaction_update: schemas.TransactionUpdate):
    db_transaction = get_transaction(db=db, transaction_id=transaction_id)
    if db_transaction:
        # Convert Pydantic model to dict, excluding unset fields
        update_data = transaction_update.dict(exclude_unset=True)
        
        # Update only provided fields
        for field, value in update_data.items():
            if value is not None:  # Only update if value is provided
                setattr(db_transaction, field, value)
        
        try:
            db.commit()
            db.refresh(db_transaction)
            return db_transaction
        except Exception as e:
            db.rollback()
            raise e
    return None

def delete_transaction(db: Session, transaction_id: int) -> bool:
    db_transaction = get_transaction(db=db, transaction_id=transaction_id)
    if db_transaction:
        db.delete(db_transaction)
        db.commit()
        return True
    return False