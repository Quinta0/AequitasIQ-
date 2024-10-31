'use client';

import React from 'react';
import { ArrowDown, ArrowUp, DollarSign, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useDataVisibility } from '@/contexts/data-visibility-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, TooltipProps } from "recharts";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";


interface StatCardProps {
  title: string;
  value?: number;
  isLoading?: boolean;
  valueClassName?: string;
  icon?: React.ReactNode;
}

const chartConfig = {
  available: {
    label: "Available Budget",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Monthly Expenses",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

function StatCard({
  title,
  value,
  isLoading,
  valueClassName,
  icon,
}: StatCardProps) {
  const { showData } = useDataVisibility();

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
            {showData ? (
              `CHF ${value?.toFixed(2)}`
            ) : (
              <span className="font-mono">••••••</span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

const CustomTooltip = ({
  active,
  payload
}: TooltipProps<number, string>) => {
  const { showData } = useDataVisibility();
  
  if (!active || !payload?.length || !showData) return null;

  return (
    <div className="rounded-lg border bg-background p-2 shadow-sm">
      <div className="grid gap-2">
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            Available
          </span>
          <span className="font-bold">
            CHF {Number(payload[0]?.value).toFixed(2)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase text-muted-foreground">
            Expenses
          </span>
          <span className="font-bold">
            CHF {Number(payload[1]?.value).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

function BudgetOverview() {
  const currentDate = new Date();
  const { showData } = useDataVisibility();
  
  const { data: budgetData, isLoading, error } = useQuery({
    queryKey: ['budget-overview', format(currentDate, 'yyyy-MM')],
    queryFn: async () => {
      const { data } = await api.get('/statistics/budget', {
        params: {
          start_date: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
          end_date: format(endOfMonth(currentDate), 'yyyy-MM-dd'),
        },
      });
      return data;
    },
  });

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-destructive">
          Failed to load budget data. Please try again later.
        </div>
      </Card>
    );
  }

  // Transform data for the chart
  const chartData = budgetData?.trend?.map((item: { month: any; available: number; rollover: number; }) => ({
    month: item.month,
    available: showData ? item.available : null,
    expenses: showData ? Math.abs(item.available - item.rollover) : null,
  })) || [];

  // Calculate trend percentage
  const lastTwoMonths = budgetData?.trend?.slice(-2) || [];
  const trendPercentage = lastTwoMonths.length === 2
    ? ((lastTwoMonths[1].available - lastTwoMonths[0].available) / lastTwoMonths[0].available) * 100
    : 0;

  const availableBudget =
    budgetData?.current_month.total_income +
    budgetData?.rollover -
    budgetData?.current_month.total_expenses;

  return (
    <div className="space-y-4">      
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
                  valueClassName="text-emerald-600"
                  icon={<ArrowUp className="size-4" />}
                />
                <StatCard
                  title="Total Expenses"
                  value={budgetData?.current_month.total_expenses}
                  isLoading={isLoading}
                  valueClassName="text-rose-600"
                  icon={<ArrowDown className="size-4" />}
                />
              </div>
              
              <StatCard
                title="Previous Month Rollover"
                value={budgetData?.rollover}
                isLoading={isLoading}
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
                      {showData ? (
                        `CHF ${availableBudget?.toFixed(2)}`
                      ) : (
                        <span className="font-mono">••••••</span>
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
          <Card>
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
              <CardDescription>
                Last {budgetData?.trend?.length || 0} months analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <BarChart data={chartData}>
                  <CartesianGrid vertical={false} horizontal={true} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                    tickFormatter={(value) => showData ? `CHF ${value}` : '••••'}
                  />
                  <Tooltip
                    cursor={false}
                    content={<CustomTooltip />}
                  />
                  <Bar
                    dataKey="available"
                    fill={chartConfig.available.color}
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                  <Bar
                    dataKey="expenses"
                    fill={chartConfig.expenses.color}
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
              <div className="flex gap-2 font-medium leading-none">
                {trendPercentage > 0 ? "Budget increased" : "Budget decreased"} by{" "}
                {showData ? (
                  `${Math.abs(trendPercentage).toFixed(1)}%`
                ) : (
                  "••••"
                )}{" "}
                this month{" "}
                {trendPercentage > 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                )}
              </div>
              <div className="leading-none text-muted-foreground">
                Showing available budget and expenses trend
              </div>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}

// Export the component both as default and named
export { BudgetOverview };
export default BudgetOverview;