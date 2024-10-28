// types/index.ts
export interface Transaction {
  id?: number;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: 'expense' | 'income';
  is_fixed: boolean;
  frequency?: 'monthly' | 'quarterly' | 'yearly';
  created_at?: string;
  updated_at?: string;
}

export interface TransactionDialogProps {
  transaction?: Transaction;
  onSave: (data: Partial<EditableTransactionFields>) => Promise<any>;
  children?: React.ReactNode;
}

export type EditableTransactionFields = Pick<
  Transaction,
  'date' | 'description' | 'amount' | 'category' | 'type' | 'is_fixed' | 'frequency'
>;

export interface TransactionResponse {
  transactions: Transaction[];
  total: number;
}

export interface SortConfig {
  field: keyof Transaction;
  direction: 'asc' | 'desc';
}

export type FilterConfig = {
  search?: string;
  type?: 'expense' | 'income' | null;
  category?: string;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}