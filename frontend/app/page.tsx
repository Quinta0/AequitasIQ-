import { Suspense } from 'react'
import { FinancialMetrics } from '@/components/financial-metrics'
import { TransactionList } from '@/components/transaction-list'
import { BillCalendar } from '@/components/bill-calendar'
import { Statistics } from '@/components/statistics'

export default function DashboardPage() {
  return (
    <div className="container space-y-8 py-8 min-w-full">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<div>Loading overview...</div>}>
          <FinancialMetrics />
        </Suspense>
        
        <Suspense fallback={<div>Loading transactions...</div>}>
          <TransactionList />
        </Suspense>
      </div>
      
      <Suspense fallback={<div>Loading calendar...</div>}>
        <BillCalendar />
      </Suspense>

      <Suspense fallback={<div>Loading statistics...</div>}>
        <Statistics />
      </Suspense>
    </div>
  )
} 