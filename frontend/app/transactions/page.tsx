import { TransactionsDataTable } from '@/components/transactions-data-table'
import ExportDialog from '@/components/export-dialog'
import dynamic from 'next/dynamic'
import { Suspense } from 'react'

const CSVImport = dynamic(() => import('@/components/csv-import'), {
  loading: () => <div>Loading import tool...</div>,
  ssr: false
})

export default function TransactionsPage() {
  return (
    <div className="container py-8 min-w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <ExportDialog />
      </div>
      <div className="py-8">
        <h2 className="text-2xl font-bold mb-4">Import Transactions</h2>
        <Suspense fallback={<div>Loading import tool...</div>}>
          <CSVImport />
        </Suspense>
      </div>
      <TransactionsDataTable />
    </div>
  )
}