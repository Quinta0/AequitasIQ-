'use client'

import React, { useState } from 'react'
import { ArrowDown, ArrowUp, DollarSign, Loader2, Eye, EyeOff } from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"
import { useQuery } from "@tanstack/react-query"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { BudgetChart } from "./budget-chart"

export default function Component() {
  const currentDate = new Date()
  const [isPrivate, setIsPrivate] = useState(false)
  
  const { data: budgetData, isLoading, error } = useQuery({
    queryKey: ['budget-overview', format(currentDate, 'yyyy-MM')],
    queryFn: async () => {
      const { data } = await api.get('/statistics/budget', {
        params: {
          start_date: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
          end_date: format(endOfMonth(currentDate), 'yyyy-MM-dd'),
        },
      })
      return data
    },
  })

  const availableBudget =
    budgetData?.current_month.total_income +
    budgetData?.rollover -
    budgetData?.current_month.total_expenses

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-destructive">
          Failed to load budget data. Please try again later.
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsPrivate(!isPrivate)}
          className="flex items-center gap-2"
        >
          {isPrivate ? (
            <>
              <Eye className="size-4" />
              Show Values
            </>
          ) : (
            <>
              <EyeOff className="size-4" />
              Hide Values
            </>
          )}
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Month Budget</CardTitle>
            <CardDescription>
              {format(currentDate, 'MMMM yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  title="Total Income"
                  value={budgetData?.current_month.total_income}
                  isLoading={isLoading}
                  isPrivate={isPrivate}
                  valueClassName="text-emerald-600"
                  icon={<ArrowUp className="size-4" />}
                />
                <StatCard
                  title="Total Expenses"
                  value={budgetData?.current_month.total_expenses}
                  isLoading={isLoading}
                  isPrivate={isPrivate}
                  valueClassName="text-rose-600"
                  icon={<ArrowDown className="size-4" />}
                />
              </div>
              
              <StatCard
                title="Previous Month Rollover"
                value={budgetData?.rollover}
                isLoading={isLoading}
                isPrivate={isPrivate}
                icon={<DollarSign className="size-4" />}
              />
              
              <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Available Budget
                  </h3>
                  {isLoading ? (
                    <Skeleton className="h-9 w-32" />
                  ) : (
                    <p className="text-3xl font-bold tracking-tight">
                      {isPrivate ? (
                        <span className="font-mono">••••••</span>
                      ) : (
                        `CHF ${availableBudget?.toFixed(2)}`
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card>
            <CardHeader>
              <CardTitle>Budget Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex h-[300px] items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <BudgetChart data={budgetData} isPrivate={isPrivate} />
        )}
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  isLoading,
  isPrivate,
  valueClassName,
  icon,
}: {
  title: string
  value?: number
  isLoading?: boolean
  isPrivate?: boolean
  valueClassName?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {icon}
          <span>{title}</span>
        </div>
        {isLoading ? (
          <Skeleton className="h-8 w-28" />
        ) : (
          <p className={`text-2xl font-bold tracking-tight ${valueClassName}`}>
            {isPrivate ? (
              <span className="font-mono">••••••</span>
            ) : (
              `CHF ${value?.toFixed(2)}`
            )}
          </p>
        )}
      </div>
    </div>
  )
}