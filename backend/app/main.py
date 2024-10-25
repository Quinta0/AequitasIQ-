from fastapi import Body, FastAPI, Depends, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import extract, case, func
from typing import List, Optional
from datetime import date, datetime

from .database import engine, get_db
from .models.base import Base
from .models.transaction import Transaction  
from .models import transaction as models   
from .models.bill import Bill
from .services.llm_service import LLMService
from . import schemas
from . import crud
import json
import pandas as pd
from io import StringIO
from dateutil.relativedelta import relativedelta

from pydantic import BaseModel

import logging  

logger = logging.getLogger(__name__)
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

class QuestionRequest(BaseModel):
    question: str

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
    # If category is not provided, use LLM to categorize
    if not transaction.category:
        try:
            transaction.category = llm_service.categorize_transaction(transaction.description)
        except Exception as e:
            print(f"Error in LLM categorization: {str(e)}")
            transaction.category = "Other"
    
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
async def update_transaction(
    transaction_id: int, 
    transaction: schemas.TransactionUpdate,
    db: Session = Depends(get_db)
):
    try:
        # Log the incoming data
        logger.info(f"Updating transaction {transaction_id}")
        logger.info(f"Received data: {transaction.dict(exclude_unset=True)}")
        
        # Validate the data
        transaction_dict = transaction.dict(exclude_unset=True)
        logger.info(f"Validated data: {transaction_dict}")
        
        # Attempt to update
        updated_transaction = crud.update_transaction(db, transaction_id, transaction)
        
        if updated_transaction is None:
            logger.error(f"Transaction {transaction_id} not found")
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        logger.info(f"Successfully updated transaction {transaction_id}")
        return updated_transaction
        
    except ValidationError as ve:
        logger.error(f"Validation error: {str(ve)}")
        raise HTTPException(
            status_code=422,
            detail={"message": "Validation error", "errors": ve.errors()}
        )
    except Exception as e:
        logger.error(f"Error updating transaction: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

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

def end_month(date_obj: date) -> date:
    """Return the last day of the given month"""
    next_month = date_obj.replace(day=28) + relativedelta(days=4)
    return next_month - relativedelta(days=next_month.day)

def validate_csv_columns(df: pd.DataFrame) -> bool:
    """Validate that the CSV has the required columns"""
    required_columns = {'date', 'description', 'amount', 'type'}
    return required_columns.issubset(set(map(str.lower, df.columns)))

# Add these new routes
@app.get("/statistics/budget")
def get_budget_statistics(
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db)
):
    # Get current month stats
    current_month = db.query(
        func.sum(case((Transaction.type == 'income', Transaction.amount), else_=0)).label('total_income'),
        func.sum(case((Transaction.type == 'expense', Transaction.amount), else_=0)).label('total_expenses')
    ).filter(
        Transaction.date.between(start_date, end_date)
    ).first()
    
    # Calculate rollover from previous months
    rollover = db.query(
        func.sum(case((Transaction.type == 'income', Transaction.amount), else_=-Transaction.amount))
    ).filter(
        Transaction.date < start_date
    ).scalar() or 0
    
    # Get trend data for the last 6 months
    trend_data = []
    running_rollover = 0
    
    for i in range(5, -1, -1):
        month_start = start_date - relativedelta(months=i)
        month_end = end_month(month_start)
        
        month_stats = db.query(
            func.sum(case((Transaction.type == 'income', Transaction.amount), else_=0)).label('income'),
            func.sum(case((Transaction.type == 'expense', Transaction.amount), else_=0)).label('expenses')
        ).filter(
            Transaction.date.between(month_start, month_end)
        ).first()
        
        month_income = month_stats.income or 0
        month_expenses = month_stats.expenses or 0
        running_rollover += (month_income - month_expenses)
        
        trend_data.append({
            'month': month_start.strftime('%b %Y'),
            'available': month_income - month_expenses,
            'rollover': running_rollover
        })
    
    return {
        'current_month': {
            'total_income': current_month.total_income or 0,
            'total_expenses': current_month.total_expenses or 0,
        },
        'rollover': rollover,
        'trend': trend_data
    }

@app.post("/transactions/import")
async def import_transactions(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(400, "File must be a CSV")
    
    try:
        # Read CSV content
        contents = await file.read()
        df = pd.read_csv(StringIO(contents.decode('utf-8')))
        
        # Validate required columns
        required_columns = {'date', 'description', 'amount', 'type'}
        if not required_columns.issubset(set(map(str.lower, df.columns))):
            raise HTTPException(
                400, 
                f"CSV must contain these columns: {', '.join(required_columns)}"
            )
        
        # Normalize column names
        df.columns = df.columns.str.lower()
        
        # Convert date strings to datetime
        df['date'] = pd.to_datetime(df['date']).dt.date
        
        # Initialize LLM service for categorization
        llm_service = LLMService()
        
        # Process transactions in batches
        batch_size = 100
        new_transactions = []
        total_imported = 0
        failed_rows = []
        categorization_results = []
        
        for i in range(0, len(df), batch_size):
            batch = df.iloc[i:i + batch_size]
            print(f"Processing batch {i//batch_size + 1}, rows {i} to {min(i + batch_size, len(df))}")
            
            # Get categories for batch
            descriptions = batch['description'].tolist()
            try:
                categories = llm_service.batch_categorize(descriptions)
                print(f"Successfully categorized {len(categories)} transactions in batch")
            except Exception as e:
                print(f"Error in batch categorization: {str(e)}")
                categories = ["Other"] * len(descriptions)
            
            # Create transaction objects
            for j, row in batch.iterrows():
                try:
                    category = categories[j - i] if j - i < len(categories) else "Other"
                    
                    transaction_data = {
                        'date': row['date'],
                        'description': str(row['description']),
                        'amount': abs(float(row['amount'])),  # Ensure positive amount
                        'type': str(row['type']).lower(),
                        'category': category
                    }
                    
                    # Store categorization result for response
                    categorization_results.append({
                        'row': j + 2,  # +2 for header row and 1-based indexing
                        'description': transaction_data['description'],
                        'assigned_category': category
                    })
                    
                    # Validate transaction type
                    if transaction_data['type'] not in ['income', 'expense']:
                        transaction_data['type'] = 'expense'  # Default to expense if invalid
                    
                    # Create transaction using the Transaction model directly
                    db_transaction = Transaction(**transaction_data)  # Use Transaction instead of models.Transaction
                    new_transactions.append(db_transaction)
                    
                except Exception as e:
                    error_msg = str(e)
                    print(f"Error processing row {j + 2}: {error_msg}")
                    failed_rows.append({
                        'row': j + 2,
                        'error': error_msg
                    })
            
            # Batch insert transactions
            if new_transactions:
                try:
                    db.bulk_save_objects(new_transactions)
                    total_imported += len(new_transactions)
                    new_transactions = []
                    db.commit()
                    print(f"Successfully imported {total_imported} transactions so far")
                except Exception as e:
                    db.rollback()
                    error_msg = str(e)
                    print(f"Error importing batch starting at row {i + 2}: {error_msg}")
                    raise HTTPException(
                        500, 
                        f"Error importing batch starting at row {i + 2}: {error_msg}"
                    )
        
        # Prepare category summary
        categories_summary = {}
        for result in categorization_results:
            category = result['assigned_category']
            categories_summary[category] = categories_summary.get(category, 0) + 1
        
        response_data = {
            "status": "success",
            "imported": total_imported,
            "message": f"Successfully imported {total_imported} transactions",
            "categorization": {
                "total": len(categorization_results),
                "results": categorization_results[:10],  # Send first 10 results for verification
                "categories_summary": categories_summary
            }
        }
        
        if failed_rows:
            response_data["failed_rows"] = failed_rows
            response_data["message"] += f" ({len(failed_rows)} rows failed)"
        
        return response_data
        
    except pd.errors.EmptyDataError:
        raise HTTPException(400, "The CSV file is empty")
    except pd.errors.ParserError:
        raise HTTPException(400, "Error parsing CSV file. Please check the format")
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Error importing transactions: {str(e)}")

@app.get("/statistics/category-summary")
def get_category_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Get summary of transactions by category"""
    query = db.query(
        Transaction.category,
        Transaction.type,
        func.sum(Transaction.amount).label('total'),
        func.count(Transaction.id).label('count')
    ).group_by(Transaction.category, Transaction.type)
    
    if start_date:
        query = query.filter(Transaction.date >= start_date)
    if end_date:
        query = query.filter(Transaction.date <= end_date)
    
    results = query.all()
    
    summary = {
        'expenses': {},
        'income': {},
        'totals': {
            'income': 0,
            'expenses': 0
        }
    }
    
    for category, type_, total, count in results:
        if type_ == 'expense':
            summary['expenses'][category] = {
                'total': float(total),
                'count': count
            }
            summary['totals']['expenses'] += float(total)
        else:
            summary['income'][category] = {
                'total': float(total),
                'count': count
            }
            summary['totals']['income'] += float(total)
    
    return summary


#### testing LLM service 
@app.post("/test-categorize")
def test_categorize(description: str):
    """Test endpoint to check LLM categorization"""
    try:
        category = llm_service.categorize_transaction(description)
        return {
            "description": description,
            "category": category,
            "success": True
        }
    except Exception as e:
        return {
            "description": description,
            "error": str(e),
            "success": False
        }
    
### Advisor page 
@app.post("/finance/ask")
async def ask_financial_question(
    request: QuestionRequest,
    db: Session = Depends(get_db)
):
    try:
        current_date = datetime.now()
        month_start = current_date.replace(day=1)
        month_end = (month_start + relativedelta(months=1)) - relativedelta(days=1)
        
        # Get financial data
        stats = db.query(
            func.sum(case((Transaction.type == 'income', Transaction.amount), else_=0)).label('total_income'),
            func.sum(case((Transaction.type == 'expense', Transaction.amount), else_=0)).label('total_expenses')
        ).filter(
            Transaction.date.between(month_start, month_end)
        ).first()

        # Handle None values
        total_income = float(stats.total_income if stats.total_income is not None else 0)
        total_expenses = float(stats.total_expenses if stats.total_expenses is not None else 0)
        
        # Get recurring bills
        bills = db.query(Bill).filter(
            Bill.is_recurring == True
        ).all()
        
        # Format data for LLM
        financial_context = {
            "current_month": {
                "income": total_income,
                "expenses": total_expenses,
                "available": total_income - total_expenses
            },
            "recurring_bills": [
                {
                    "name": bill.name,
                    "amount": float(bill.amount)
                }
                for bill in bills
            ]
        }
        
        prompt = f"""
        You are a financial advisor. Based on the following financial information:
        
        Current Month:
        - Total Income: €{financial_context['current_month']['income']}
        - Total Expenses: €{financial_context['current_month']['expenses']}
        - Available Budget: €{financial_context['current_month']['available']}
        
        Recurring Bills:
        {json.dumps(financial_context['recurring_bills'], indent=2)}
        
        Question: {request.question}
        
        Provide advice considering:
        1. Current financial situation
        2. Recurring obligations
        3. Financial health and savings
        4. Risk factors
        
        Format your response in a clear, structured way with specific recommendations.
        """
        
        response = llm_service.get_financial_advice(prompt)
        
        return {
            "response": response,
            "context": financial_context
        }
        
    except Exception as e:
        print(f"Error in financial advisor: {str(e)}")  # Add logging
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing question: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)