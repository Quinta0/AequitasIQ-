'use client';

import React from 'react';
import { TrendingUp, TrendingDown } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, TooltipProps } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
} from "@/components/ui/chart";
import { useDataVisibility } from '@/contexts/data-visibility-context';

interface BudgetChartProps {
  data: {
    current_month: {
      total_income: number;
      total_expenses: number;
    };
    rollover: number;
    trend: Array<{
      month: string;
      available: number;
      rollover: number;
    }>;
  };
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

// Custom tooltip component
const CustomTooltip = ({
  active,
  payload,
  label
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

export function BudgetChart({ data }: BudgetChartProps) {
  const { showData } = useDataVisibility();

  if (!data?.trend) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Analysis</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const chartData = data.trend.map(item => ({
    month: item.month,
    available: showData ? item.available : null,
    expenses: showData ? Math.abs(item.available - item.rollover) : null,
  }));

  // Calculate trend percentage
  const lastTwoMonths = data.trend.slice(-2);
  const trendPercentage = lastTwoMonths.length === 2
    ? ((lastTwoMonths[1].available - lastTwoMonths[0].available) / lastTwoMonths[0].available) * 100
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Overview</CardTitle>
        <CardDescription>
          Last {data.trend.length} months analysis
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
  );
}