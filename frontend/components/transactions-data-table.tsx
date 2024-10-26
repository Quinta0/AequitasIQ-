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
import { format, isValid, parseISO } from 'date-fns'
import { MoreHorizontal, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TransactionDialog } from '@/components/transaction-dialog'
import axios from 'axios'

type TransactionKey = keyof Transaction
type TransactionKeys = keyof Omit<Transaction, 'id' | 'created_at' | 'updated_at'>;
type EditableFields = Pick<Transaction, 'date' | 'description' | 'amount' | 'category' | 'type'>;

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

  const formatDate = (date: string | Date): string => {
    if (typeof date === 'string') {
      // If it's already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return date
      }
      // Try to parse the date string
      const parsedDate = parseISO(date)
      if (isValid(parsedDate)) {
        return format(parsedDate, 'yyyy-MM-dd')
      }
    }
    if (date instanceof Date && isValid(date)) {
      return format(date, 'yyyy-MM-dd')
    }
    // Default to current date if invalid
    return format(new Date(), 'yyyy-MM-dd')
  }

  const handleSave = async (transactionData: Partial<EditableFields>) => {
    try {
      const formattedData = {
        ...transactionData,
        date: formatDate(transactionData.date!),
        amount: typeof transactionData.amount === 'string' 
          ? parseFloat(transactionData.amount)
          : transactionData.amount
      }

      console.log('Initial formatted data:', formattedData)
      
      let response
      if (selectedTransaction) {
        // For updates, only include changed fields
        const changedFields = (Object.keys(formattedData) as TransactionKeys[]).reduce((acc, key) => {
          const value = formattedData[key]
          if (value !== undefined && selectedTransaction[key] !== value) {
            (acc as any)[key] = value
          }
          return acc
        }, {} as Partial<EditableFields>)

        console.log('Changed fields for update:', changedFields)
        
        response = await api.put(
          `/transactions/${selectedTransaction.id}`, 
          changedFields,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      } else {
        response = await api.post(
          '/transactions', 
          formattedData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }
      
      console.log('API Response:', response.data)
      
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setSelectedTransaction(undefined)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('API Error Details:', error.response?.data)
        const errorMessage = error.response?.data?.detail 
          ? JSON.stringify(error.response?.data.detail)
          : 'Failed to save transaction'
        throw new Error(errorMessage)
      } else {
        console.error('Error saving transaction:', error)
        throw error
      }
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
                    {transaction.type === 'expense' ? '-' : '+'}CHF 
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