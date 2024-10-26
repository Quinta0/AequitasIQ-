'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Bill } from '@/types'
import { format } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

export function BillCalendar() {
  const [date, setDate] = useState<Date>(new Date())

  const { data: bills, isLoading } = useQuery({
    queryKey: ['bills', format(date, 'yyyy-MM')],
    queryFn: async () => {
      const { data } = await api.get<Bill[]>('/bills', {
        params: {
          start_date: format(new Date(date.getFullYear(), date.getMonth(), 1), 'yyyy-MM-dd'),
          end_date: format(new Date(date.getFullYear(), date.getMonth() + 1, 0), 'yyyy-MM-dd'),
        },
      })
      return data
    },
  })

  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle>Bills Calendar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 flex-col md:flex-row">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => date && setDate(date)}
            className="rounded-md border w-full md:w-auto"
          />
          
          <div className="space-y-4 flex-1">
            <h3 className="font-medium text-lg">
              Bills due on {format(date, 'MMMM d, yyyy')}
            </h3>
            
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : bills?.length === 0 ? (
              <p className="text-muted-foreground">No bills due on this date</p>
            ) : (
              <div className="space-y-2">
                {bills?.map((bill) => (
                  <div
                    key={bill.id}
                    className="p-4 border rounded-lg transition-colors hover:bg-muted/50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{bill.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {bill.category}
                        </p>
                      </div>
                      <p className="font-medium text-red-600 dark:text-red-400">CHF {bill.amount}</p>
                    </div>
                    {bill.is_recurring && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Recurring: {bill.frequency}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}