// types/index.ts
// types/index.ts
export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'expense' | 'income';
  is_fixed: boolean;
  frequency?: 'monthly' | 'quarterly' | 'yearly';
  created_at: string;
  updated_at: string;
}

export type EditableTransactionFields = Pick<
  Transaction,
  'date' | 'description' | 'amount' | 'category' | 'type' | 'is_fixed' | 'frequency'
>;

export type TransactionCreate = Omit<
  Transaction,
  'id' | 'created_at' | 'updated_at'
>;

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

