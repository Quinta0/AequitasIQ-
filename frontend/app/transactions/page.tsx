import { TransactionsDataTable } from '@/components/transactions-data-table'
import ExportDialog from '@/components/export-dialog'

export default function TransactionsPage() {
  return (
    <div className="container py-8 min-w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <ExportDialog />
      </div>
      <TransactionsDataTable />
    </div>
  )
}