// components/transaction-list.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Transaction } from '@/types'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export function TransactionList() {
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const { data } = await api.get<Transaction[]>('/transactions', {
        params: {
          limit: 5,
        },
      })
      return data
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading transactions...</p>
        ) : transactions?.length === 0 ? (
          <p className="text-muted-foreground">No recent transactions</p>
        ) : (
          <div className="space-y-4">
            {transactions?.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(transaction.date), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    'font-medium',
                    transaction.type === 'expense' ? 'text-red-500' : 'text-green-500'
                  )}>
                    {transaction.type === 'expense' ? '-' : '+'}€{transaction.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.category}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}