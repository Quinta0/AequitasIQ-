'use client';

import { useDebounce } from '@/hooks/use-debounce';
import React, { useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Transaction, TransactionResponse } from '@/types';
import { format } from 'date-fns';
import { MoreHorizontal, Plus, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransactionDialog } from '@/components/transaction-dialog';
import { useToast } from '@/hooks/use-toast';
import { useDataVisibility } from '@/contexts/data-visibility-context';

export function TransactionsDataTable() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    type: null as 'expense' | 'income' | null,
    search: '',
  });
  const [sort, setSort] = useState({ field: 'date' as keyof Transaction, direction: 'desc' as 'asc' | 'desc' });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const limit = 10;

  const { showData } = useDataVisibility();

  const formatAmount = (amount: number, type: 'expense' | 'income') => {
    if (!showData) return '••••••';
    return `${type === 'expense' ? '-' : '+'}CHF ${amount.toFixed(2)}`;
  };

  // Add debounced search value
  const debouncedSearch = useDebounce(filters.search, 300);

  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions', page, debouncedSearch, filters.type, sort.field, sort.direction],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.append('skip', String((page - 1) * limit));
      searchParams.append('limit', String(limit));
      
      if (debouncedSearch) {
        searchParams.append('search', debouncedSearch);
      }
      
      if (filters.type) {
        searchParams.append('type', filters.type);
      }
      
      if (sort.field) {
        searchParams.append('sort_field', sort.field);
        searchParams.append('sort_direction', sort.direction);
      }
  
      console.log('Fetching with params:', Object.fromEntries(searchParams));
      
      const response = await api.get(`/transactions?${searchParams.toString()}`);
      console.log('API Response:', response.data);
      
      // The FastAPI endpoint already returns the correct structure
      // { transactions: [...], total: number }
      return response.data;
    },
  });

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPage(1); // Reset to first page when searching
  };

  const handleTypeFilter = (value: string) => {
    setFilters(prev => ({
      ...prev,
      type: value === 'all' ? null : value as 'expense' | 'income'
    }));
    setPage(1);
  };

  const handleSort = (field: keyof Transaction) => {
    setSort(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSave = async (transactionData: Partial<Transaction>) => {
    try {
      await api.post('/transactions', transactionData);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Success",
        description: "Transaction saved successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save transaction",
      });
    }
  };

  const getSortIcon = (field: keyof Transaction) => {
    if (sort.field !== field) return <ArrowUpDown className="h-4 w-4 ml-2" />;
    return sort.direction === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-2" />
      : <ArrowDown className="h-4 w-4 ml-2" />;
  };

  if (error) {
    console.error('Query error:', error);
    return <div>Error loading transactions</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 min-w-[200px] max-w-[400px]">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filters.type === null ? 'all' : filters.type}
            onValueChange={handleTypeFilter}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>

          <TransactionDialog onSave={handleSave}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </TransactionDialog>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('date')}
                  className="flex items-center"
                >
                  Date {getSortIcon('date')}
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('description')}
                  className="flex items-center"
                >
                  Description {getSortIcon('description')}
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('category')}
                  className="flex items-center"
                >
                  Category {getSortIcon('category')}
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('type')}
                  className="flex items-center"
                >
                  Type {getSortIcon('type')}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button 
                  variant="ghost" 
                  onClick={() => handleSort('amount')}
                  className="flex items-center justify-end w-full"
                >
                  Amount {getSortIcon('amount')}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Loading transactions...</TableCell>
              </TableRow>
            ) : !data?.transactions || data.transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No transactions found</TableCell>
              </TableRow>
            ) : (
              data.transactions.map((transaction: Transaction) => (
                <TableRow key={transaction.id || transaction.date + transaction.description}>
                  <TableCell>{format(new Date(transaction.date), 'MMM d, yyyy')}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                        transaction.type === 'expense'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      )}
                    >
                      {transaction.type}
                    </span>
                  </TableCell>
                  <TableCell className={cn(
                    'text-right font-medium',
                    transaction.type === 'expense' ? 'text-red-500' : 'text-green-500'
                  )}>
                    {formatAmount(transaction.amount, transaction.type)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {((page - 1) * limit) + 1} to {Math.min((page * limit), data?.total || 0)} of {data?.total || 0} entries
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={!data?.transactions?.length || data.transactions.length < limit}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}