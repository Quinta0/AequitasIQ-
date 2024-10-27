import dynamic from 'next/dynamic'
import { Suspense } from 'react'


const BudgetOverview = dynamic(() => import('@/components/budget-overview'), {
  loading: () => <div>Loading budget overview...</div>,
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
      </div>
    </div>
  )
}