'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Transaction } from '@/types'
import { format } from 'date-fns'
import { MoreHorizontal, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TransactionDialog } from '@/components/transaction-dialog'

export function TransactionsDataTable() {
  const [page, setPage] = useState(1)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>()
  const queryClient = useQueryClient()
  const limit = 10

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page],
    queryFn: async () => {
      const { data } = await api.get<Transaction[]>('/transactions', {
        params: {
          skip: (page - 1) * limit,
          limit,
        },
      })
      return data
    },
  })

  const handleSave = async (transactionData: Partial<Transaction>) => {
    try {
      if (selectedTransaction) {
        // Update existing transaction
        await api.put(`/transactions/${selectedTransaction.id}`, transactionData)
      } else {
        // Create new transaction
        await api.post('/transactions', transactionData)
      }
      // Refetch transactions after save
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setSelectedTransaction(undefined)
    } catch (error) {
      console.error('Error saving transaction:', error)
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
  }

  const handleDelete = async (transaction: Transaction) => {
    try {
      await api.delete(`/transactions/${transaction.id}`)
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">
            Manage and view all your transactions
          </p>
        </div>
        <TransactionDialog onSave={handleSave}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </TransactionDialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Loading transactions...
                </TableCell>
              </TableRow>
            ) : data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No transactions found
                </TableCell>
              </TableRow>
            ) : (
              data?.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(new Date(transaction.date), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                        transaction.type === 'expense'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      )}
                    >
                      {transaction.type}
                    </span>
                  </TableCell>
                  <TableCell className={cn(
                    'text-right font-medium',
                    transaction.type === 'expense' ? 'text-red-500' : 'text-green-500'
                  )}>
                    {transaction.type === 'expense' ? '-' : '+'}€
                    {transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(transaction)}
                          className="text-red-600"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedTransaction && (
        <TransactionDialog
          transaction={selectedTransaction}
          onSave={handleSave}
        />
      )}

      {data && data.length > 0 && (
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={data.length < limit}
          >
            Next  
          </Button>
        </div>
      )}
    </div>
  )
}