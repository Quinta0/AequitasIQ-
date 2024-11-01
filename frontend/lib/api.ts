// Updated API service
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Existing interfaces
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

// New interfaces for statistics
export interface CategorySummaryItem {
  total: number;
  count: number;
}

export interface CategorySummaryResponse {
  income: Record<string, CategorySummaryItem>;
  expenses: Record<string, CategorySummaryItem>;
  totals: {
    income: number;
    expenses: number;
  };
}

// Type the API response for better type safety
export const getStatisticsSummary = async (
  startDate: string,
  endDate: string
): Promise<CategorySummaryResponse> => {
  const { data } = await api.get<CategorySummaryResponse>('/statistics/category-summary', {
    params: {
      start_date: startDate,
      end_date: endDate,
    },
  });
  
  console.log('API Response:', data); // For debugging
  return data;
};