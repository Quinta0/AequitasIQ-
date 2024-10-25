import { Suspense } from 'react'
import { FinancialMetrics } from '@/components/financial-metrics'
import { TransactionList } from '@/components/transaction-list'
import { BillCalendar } from '@/components/bill-calendar'
import { Statistics } from '@/components/statistics'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  return (
    <div className="container space-y-8 py-8 min-w-full">
      <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
          <FinancialMetrics />
        </Suspense>
        
        <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
          <TransactionList />
        </Suspense>
      </div>
      
      <Suspense fallback={<Skeleton className="h-[500px] w-full" />}>
        <BillCalendar />
      </Suspense>

      <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
        <Statistics />
      </Suspense>
    </div>
  )
}