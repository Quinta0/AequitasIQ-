// components/bills-calendar-view.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Bill } from '@/types'
import { format, isSameDay } from 'date-fns'
import { Plus } from 'lucide-react'
import { BillDialog } from '@/components/bill-dialog'

export function BillsCalendarView() {
  const [date, setDate] = useState<Date>(new Date())
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null)

  const { data: bills, isLoading, refetch } = useQuery({
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

  const handleSaveBill = async (billData: Partial<Bill>) => {
    try {
      if (selectedBill) {
        await api.put(`/bills/${selectedBill.id}`, billData)
      } else {
        await api.post('/bills', billData)
      }
      refetch()
      setSelectedBill(null)
    } catch (error) {
      console.error('Error saving bill:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bills Calendar</h2>
          <p className="text-muted-foreground">
            Manage your recurring bills and payments
          </p>
        </div>
        <BillDialog onSave={handleSaveBill}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Bill
          </Button>
        </BillDialog>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <Card>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => date && setDate(date)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bills for {format(date, 'MMMM yyyy')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading bills...</p>
            ) : bills?.length === 0 ? (
              <p className="text-muted-foreground">No bills for this month</p>
            ) : (
              <div className="space-y-4">
                {bills?.map((bill) => (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => setSelectedBill(bill)}
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{bill.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Due: {format(new Date(bill.due_date), 'MMM d, yyyy')}
                      </p>
                      {bill.is_recurring && (
                        <p className="text-sm text-muted-foreground">
                          Recurring: {bill.frequency}
                        </p>
                      )}
                    </div>
                    <div className="text-right space-y-1">
                      <p className="font-medium">€{bill.amount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">
                        {bill.category}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedBill && (
        <BillDialog
          bill={selectedBill}
          onSave={handleSaveBill}
          onClose={() => setSelectedBill(null)}
        />
      )}
    </div>
  )
}