// components/expense-overview.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function ExpenseOverview() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['monthly-stats'],
    queryFn: async () => {
      const { data } = await api.get('/statistics/monthly', {
        params: {
          year: new Date().getFullYear(),
        },
      })
      return data
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center">
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Expense Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center text-red-500">
            Error loading data
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                name="Expenses"
              />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#22c55e"
                name="Income"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}