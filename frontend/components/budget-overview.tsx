'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { BudgetChart } from './budget-chart';

export default function BudgetOverview() {
  const currentDate = new Date();
  
  const { data: budgetData, isLoading } = useQuery({
    queryKey: ['budget-overview', format(currentDate, 'yyyy-MM')],
    queryFn: async () => {
      const { data } = await api.get('/statistics/budget', {
        params: {
          start_date: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
          end_date: format(endOfMonth(currentDate), 'yyyy-MM-dd'),
        },
      });
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading budget data...</div>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Current Month Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  €{budgetData?.current_month.total_income.toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">
                  €{budgetData?.current_month.total_expenses.toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Previous Month Rollover</p>
              <p className="text-2xl font-bold">
                €{budgetData?.rollover.toFixed(2)}
              </p>
            </div>
            
            <div className="pt-4 border-t">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Available Budget</p>
                <p className="text-3xl font-bold">
                  €{(
                    budgetData?.current_month.total_income +
                    budgetData?.rollover -
                    budgetData?.current_month.total_expenses
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <BudgetChart data={budgetData} />
    </div>
  );
}