// types/index.ts
export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'expense' | 'income';
  created_at: string;
  updated_at: string;
}

// Type for editable fields only
export type EditableTransactionFields = Pick<
  Transaction,
  'date' | 'description' | 'amount' | 'category' | 'type'
>;

// Type for creating a new transaction
export type TransactionCreate = Omit<
  Transaction,
  'id' | 'created_at' | 'updated_at'
>;

// Type for updating an existing transaction
export type TransactionUpdate = Partial<EditableTransactionFields>;
  
export interface Bill {
  id: number;
  name: string;
  amount: number;
  due_date: string;
  category: string;
  is_recurring: boolean;
  frequency?: 'monthly' | 'quarterly' | 'yearly';
  created_at: string;
  updated_at: string;
}

