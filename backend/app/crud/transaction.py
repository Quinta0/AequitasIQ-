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

def get_transaction(db: Session, transaction_id: int):
    """Get a single transaction by ID"""
    return db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()

# In crud.py

from sqlalchemy import or_
from typing import Optional

def get_transactions(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    transaction_type: Optional[str] = None,
    sort_field: Optional[str] = None,
    sort_direction: Optional[str] = 'desc'
) -> dict:
    query = db.query(models.Transaction)
    
    # Apply search filter
    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                models.Transaction.description.ilike(search_term),
                models.Transaction.category.ilike(search_term)
            )
        )
    
    # Apply type filter
    if transaction_type:
        query = query.filter(models.Transaction.type == transaction_type)
    
    # Get total before pagination
    total = query.count()
    
    # Apply sorting
    if sort_field and hasattr(models.Transaction, sort_field):
        order_col = getattr(models.Transaction, sort_field)
        if sort_direction == 'desc':
            order_col = order_col.desc()
        query = query.order_by(order_col)
    else:
        # Default sort
        query = query.order_by(models.Transaction.date.desc())
    
    # Apply pagination
    transactions = query.offset(skip).limit(limit).all()
    
    return {
        "transactions": transactions,
        "total": total
    }

def get_fixed_transactions(
    db: Session,
    frequency: Optional[str] = None
) -> List[models.Transaction]:
    query = db.query(models.Transaction).filter(models.Transaction.is_fixed == True)
    
    if frequency:
        query = query.filter(models.Transaction.frequency == frequency)
    
    return query.all()

def update_transaction(db: Session, transaction_id: int, transaction_update: schemas.TransactionUpdate):
    db_transaction = get_transaction(db=db, transaction_id=transaction_id)
    if db_transaction:
        update_data = transaction_update.dict(exclude_unset=True)
        
        # Handle frequency update when is_fixed changes
        if 'is_fixed' in update_data and not update_data['is_fixed']:
            update_data['frequency'] = None
            
        for field, value in update_data.items():
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

def process_fixed_transactions(db: Session, target_date: date) -> List[models.Transaction]:
    """
    Process fixed transactions and create new instances for the target date
    """
    fixed_transactions = db.query(models.Transaction).filter(
        models.Transaction.is_fixed == True
    ).all()
    
    new_transactions = []
    for transaction in fixed_transactions:
        # Check if we should create a new transaction based on frequency
        should_create = False
        if transaction.frequency == 'monthly':
            should_create = True
        elif transaction.frequency == 'quarterly':
            should_create = target_date.month % 3 == 1
        elif transaction.frequency == 'yearly':
            should_create = target_date.month == 1
            
        if should_create:
            new_transaction = models.Transaction(
                date=target_date,
                description=transaction.description,
                amount=transaction.amount,
                category=transaction.category,
                type=transaction.type,
                is_fixed=True,
                frequency=transaction.frequency
            )
            new_transactions.append(new_transaction)
            
    if new_transactions:
        db.bulk_save_objects(new_transactions)
        db.commit()
        
    return new_transactions