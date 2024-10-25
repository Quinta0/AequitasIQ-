import { TransactionsDataTable } from '@/components/transactions-data-table'

export default function TransactionsPage() {
  return (
    <div className="container py-8 min-w-full">
      <h1 className="text-3xl font-bold mb-8">Transactions</h1>
      <TransactionsDataTable />
    </div>
  )
}