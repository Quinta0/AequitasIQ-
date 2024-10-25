from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import extract
from typing import List, Optional
from datetime import date

from .database import engine, get_db
from .models.base import Base
from .models.transaction import Transaction  
from .models.bill import Bill  
from .services.llm_service import LLMService
from . import schemas
from . import crud  

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Finance Dashboard API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LLM service
llm_service = LLMService()

@app.get("/")
def read_root():
    return {"message": "Finance Dashboard API is running"}

@app.post("/categorize")
def categorize_transaction(description: str):
    category = llm_service.categorize_transaction(description)
    return {"category": category}

# Transaction routes
@app.post("/transactions/", response_model=schemas.Transaction)
def create_transaction(transaction: schemas.TransactionCreate, db: Session = Depends(get_db)):
    return crud.create_transaction(db=db, transaction=transaction)

@app.get("/transactions/", response_model=List[schemas.Transaction])
def read_transactions(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
    transaction_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    transactions = crud.get_transactions(
        db, 
        skip=skip, 
        limit=limit,
        start_date=start_date,
        end_date=end_date,
        category=category,
        transaction_type=transaction_type
    )
    return transactions

@app.get("/transactions/{transaction_id}", response_model=schemas.Transaction)
def read_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = crud.get_transaction(db, transaction_id=transaction_id)
    if transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@app.put("/transactions/{transaction_id}", response_model=schemas.Transaction)
def update_transaction(transaction_id: int, transaction: schemas.TransactionUpdate, db: Session = Depends(get_db)):
    updated_transaction = crud.update_transaction(db, transaction_id, transaction)
    if updated_transaction is None:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return updated_transaction

@app.delete("/transactions/{transaction_id}")
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    success = crud.delete_transaction(db, transaction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"status": "success", "message": "Transaction deleted"}

# Bill routes
@app.post("/bills/", response_model=schemas.Bill)
def create_bill(bill: schemas.BillCreate, db: Session = Depends(get_db)):
    return crud.create_bill(db=db, bill=bill)

@app.get("/bills/", response_model=List[schemas.Bill])
def read_bills(
    skip: int = 0,
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    bills = crud.get_bills(
        db, 
        skip=skip, 
        limit=limit,
        start_date=start_date,
        end_date=end_date,
        category=category
    )
    return bills

@app.get("/bills/{bill_id}", response_model=schemas.Bill)
def read_bill(bill_id: int, db: Session = Depends(get_db)):
    bill = crud.get_bill(db, bill_id=bill_id)
    if bill is None:
        raise HTTPException(status_code=404, detail="Bill not found")
    return bill

@app.put("/bills/{bill_id}", response_model=schemas.Bill)
def update_bill_route(
    bill_id: int,
    bill: schemas.BillCreate,
    db: Session = Depends(get_db)
):
    updated_bill = crud.update_bill(db, bill_id, bill)
    if updated_bill is None:
        raise HTTPException(status_code=404, detail="Bill not found")
    return updated_bill

# Statistics routes
@app.get("/statistics/monthly")
def get_monthly_statistics(
    year: int = Query(..., description="Year to get statistics for"),
    month: Optional[int] = Query(None, description="Month to get statistics for"),
    db: Session = Depends(get_db)
):
    # Create base query for transactions
    query = db.query(Transaction)
    
    # Filter by year
    query = query.filter(extract('year', Transaction.date) == year)
    
    # Filter by month if provided
    if month:
        query = query.filter(extract('month', Transaction.date) == month)
    
    # Get transactions
    transactions = query.all()
    
    # Calculate statistics
    total_income = sum(t.amount for t in transactions if t.type == 'income')
    total_expenses = sum(t.amount for t in transactions if t.type == 'expense')
    
    # Calculate monthly stats
    monthly_stats = {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_savings": total_income - total_expenses,
        "saving_rate": (total_income - total_expenses) / total_income if total_income > 0 else 0
    }
    
    return monthly_stats

@app.get("/statistics/category")
def get_category_statistics(
    year: int = Query(..., description="Year to get statistics for"),
    month: Optional[int] = Query(None, description="Month to get statistics for"),
    db: Session = Depends(get_db)
):
    # Create base query
    query = db.query(
        Transaction.category,
        Transaction.type,
        func.sum(Transaction.amount).label('total')
    ).group_by(Transaction.category, Transaction.type)
    
    # Filter by year
    query = query.filter(extract('year', Transaction.date) == year)
    
    # Filter by month if provided
    if month:
        query = query.filter(extract('month', Transaction.date) == month)
    
    # Execute query
    results = query.all()
    
    # Organize results by category and type
    stats = {
        'expenses': {},
        'income': {}
    }
    
    for category, type_, total in results:
        if type_ == 'expense':
            stats['expenses'][category] = float(total)
        else:
            stats['income'][category] = float(total)
    
    return stats

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)