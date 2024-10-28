import React, { Suspense } from 'react';
import { FinancialMetrics } from '@/components/financial-metrics';
import { TransactionList } from '@/components/transaction-list';
import { BillCalendar } from '@/components/bill-calendar';
import { Statistics } from '@/components/statistics';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  return (
    <div className="container py-8 min-w-full space-y-6">
      <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
      
      {/* Bento Box Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)]">
        {/* Financial Metrics - Spans 2 columns */}
        <div className={cn(
          "row-span-2 md:col-span-2",
          "rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-lg"
        )}>
          <Suspense fallback={<Skeleton className="h-full w-full rounded-xl" />}>
            <FinancialMetrics />
          </Suspense>
        </div>

        {/* Recent Transactions - Right side, spans 2 rows */}
        <div className={cn(
          "row-span-2 md:col-span-2",
          "rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-lg"
        )}>
          <Suspense fallback={<Skeleton className="h-full w-full rounded-xl" />}>
            <TransactionList />
          </Suspense>
        </div>

        {/* Bills Calendar - Spans full width */}
        <div className={cn(
          "md:col-span-2 lg:col-span-4",
          "rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-lg"
        )}>
          <Suspense fallback={<Skeleton className="h-[400px] w-full rounded-xl" />}>
            <BillCalendar />
          </Suspense>
        </div>

        {/* Statistics Section - Spans full width */}
        <div className={cn(
          "md:col-span-2 lg:col-span-4",
          "rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-lg"
        )}>
          <Suspense fallback={<Skeleton className="h-[600px] w-full rounded-xl" />}>
            <Statistics />
          </Suspense>
        </div>
      </div>
    </div>
  );
}