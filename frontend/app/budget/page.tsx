import dynamic from 'next/dynamic'
import { Suspense } from 'react'

import { TestCategorization } from '@/components/test-categorization';


const BudgetOverview = dynamic(() => import('@/components/budget-overview'), {
  loading: () => <div>Loading budget overview...</div>,
  ssr: false
})

const CSVImport = dynamic(() => import('@/components/csv-import'), {
  loading: () => <div>Loading import tool...</div>,
  ssr: false
})

export default function BudgetPage() {
  return (
    <div className="container py-8 min-w-full">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Budget Overview</h1>
          <p className="text-muted-foreground">
            Track your monthly budget, expenses, and savings
          </p>
        </div>

        <Suspense fallback={<div>Loading budget overview...</div>}>
          <BudgetOverview />
        </Suspense>

        <div className="pt-8">
          <h2 className="text-2xl font-bold mb-4">Import Transactions</h2>
          <Suspense fallback={<div>Loading import tool...</div>}>
            <CSVImport />
          </Suspense>
        </div>
      </div>
    </div>
  )
}