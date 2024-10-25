import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
