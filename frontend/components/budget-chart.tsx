import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function BudgetChart({ data }: BudgetChartProps) {
  const { showData } = useDataVisibility();

  if (!data?.trend) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = data.trend.map(item => ({
    name: item.month,
    Income: showData ? (item.available + item.rollover) : null,
    Expenses: showData ? -item.available : null,
    Balance: showData ? item.rollover : null
  }));

  const formatValue = (value: number) => {
    if (!showData) return '••••';
    return `CHF ${Math.abs(value).toFixed(2)}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {showData ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis
                  width={80}
                  tickFormatter={(value) => `CHF ${Math.abs(value).toFixed(0)}`}
                />
                <Tooltip
                  formatter={(value: number) => formatValue(value)}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="Income"
                  name="Available Budget"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Expenses"
                  name="Expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Balance"
                  name="Running Balance"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-4xl font-mono">
              ••••••
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}