'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ResponsiveContainer, RadialBarChart, RadialBar, Tooltip } from 'recharts';

interface FinancialStats {
  total_income: number;
  total_expenses: number;
  net_savings: number;
  saving_rate: number;
}

export function FinancialMetrics() {
  const { data: stats, isLoading } = useQuery<FinancialStats>({
    queryKey: ['monthly-stats'],
    queryFn: async () => {
      const { data } = await api.get('/statistics/monthly', {
        params: {
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
        },
      });
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  const savingsRate = stats?.saving_rate || 0;
  const gaugeData = [
    {
      name: 'Savings Rate',
      value: savingsRate * 100,
      fill: savingsRate >= 0.2 ? '#22c55e' : savingsRate >= 0.1 ? '#facc15' : '#ef4444',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Income</p>
            <p className="text-2xl font-bold text-green-600">
              €{stats?.total_income?.toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">
              €{stats?.total_expenses?.toFixed(2)}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Net Savings</p>
            <p className="text-2xl font-bold">
              €{stats?.net_savings?.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="h-[200px] mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="100%"
              barSize={10}
              data={gaugeData}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar
                background
                dataKey="value"
                cornerRadius={10}
              />
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-current font-bold text-lg"
              >
                {(savingsRate * 100).toFixed(1)}%
              </text>
              <Tooltip />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}