'use client';

import React, { useState } from 'react';
import { FinancialMetrics } from '@/components/financial-metrics';
import { TransactionList } from '@/components/transaction-list';
import { BillCalendar } from '@/components/bill-calendar';
import { Statistics } from '@/components/statistics';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PeriodSelection } from '@/components/period-selection';

interface PeriodContext {
  year: number;
  month?: number;
  periodType: 'monthly' | 'yearly';
}

// Create a context to share period selection state
export const PeriodContext = React.createContext<PeriodContext>({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  periodType: 'monthly',
});

export default function DashboardPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [periodType, setPeriodType] = useState<'monthly' | 'yearly'>('monthly');

  const periodContextValue = {
    year: selectedYear,
    month: periodType === 'monthly' ? selectedMonth : undefined,
    periodType,
  };

  return (
    <PeriodContext.Provider value={periodContextValue}>
      <div className="container py-8 min-w-full space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        </div>

        {/* Period Selection Component */}
        <PeriodSelection
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          periodType={periodType}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
          onPeriodTypeChange={setPeriodType}
        />

        {/* Bento Box Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)]">
          {/* Financial Metrics - Spans 2 columns */}
          <div className={cn(
            "row-span-2 md:col-span-2",
            "rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-lg"
          )}>
            <React.Suspense fallback={<Skeleton className="h-full w-full rounded-xl" />}>
              <FinancialMetrics />
            </React.Suspense>
          </div>

          {/* Recent Transactions - Right side, spans 2 rows */}
          <div className={cn(
            "row-span-2 md:col-span-2",
            "rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-lg"
          )}>
            <React.Suspense fallback={<Skeleton className="h-full w-full rounded-xl" />}>
              <TransactionList />
            </React.Suspense>
          </div>

          {/* Bills Calendar - Spans full width */}
          <div className={cn(
            "md:col-span-2 lg:col-span-4",
            "rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-lg"
          )}>
            <React.Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
              <BillCalendar />
            </React.Suspense>
          </div>

          {/* Statistics Section - Spans full width */}
          <div className={cn(
            "md:col-span-2 lg:col-span-4",
            "rounded-xl text-card-foreground shadow-sm transition-all hover:shadow-lg"
          )}>
            <React.Suspense fallback={<Skeleton className="h-[600px] w-full rounded-xl" />}>
              <Statistics />
            </React.Suspense>
          </div>
        </div>
      </div>
    </PeriodContext.Provider>
  );
}