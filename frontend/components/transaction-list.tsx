'use client';

import React from 'react';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Transaction } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useDataVisibility } from '@/contexts/data-visibility-context';

export function TransactionList() {
  const { showData } = useDataVisibility();
  
  const { data, isLoading } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const { data } = await api.get<{ transactions: Transaction[], total: number }>('/transactions', {
        params: { limit: 5 },
      });
      return data.transactions;
    },
  });

  if (isLoading) {
    return (
      <div className="h-full p-6 space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const formatAmount = (amount: number, type: string) => {
    if (!showData) return '••••••';
    return `${type === 'expense' ? '-' : '+'}CHF ${amount.toFixed(2)}`;
  };

  return (
    <div className="h-full p-6">
      <CardHeader className="px-0">
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {!data || data.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No recent transactions
          </p>
        ) : (
          <div className="space-y-4">
            {data.map((transaction) => (
              <div
                key={transaction.id || `${transaction.date}-${transaction.description}`}
                className="group flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:bg-muted/50 hover:shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-2 rounded-full transition-colors",
                    transaction.type === 'expense' 
                      ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                      : "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
                  )}>
                    {transaction.type === 'expense' 
                      ? <ArrowDownRight className="h-4 w-4" />
                      : <ArrowUpRight className="h-4 w-4" />
                    }
                  </div>
                  <div>
                    <p className="font-medium group-hover:text-primary transition-colors">
                      {transaction.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{format(new Date(transaction.date), 'MMM d, yyyy')}</span>
                      <span>•</span>
                      <span>{transaction.category}</span>
                    </div>
                  </div>
                </div>
                <p className={cn(
                  'font-medium tabular-nums',
                  transaction.type === 'expense' 
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                )}>
                  {formatAmount(transaction.amount, transaction.type)}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </div>
  );
}