'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ResponsiveContainer, RadialBarChart, RadialBar, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

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
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const savingsRate = stats?.saving_rate || 0;
  const gaugeData = [
    {
      name: 'Savings Rate',
      value: savingsRate * 100,
      fill: savingsRate >= 0.2 ? 'hsl(var(--chart-2))' : savingsRate >= 0.1 ? 'hsl(var(--chart-4))' : 'hsl(var(--chart-1))',
    },
  ];

  return (
    <Card className="transition-all duration-300 hover:shadow-lg ">
      <CardHeader className='text-center'>
        <CardTitle>Financial Overview</CardTitle>
      </CardHeader>
      <CardContent className="">
        <div className="grid gap-6 md:grid-cols-3 place-items-center">
          <div className="space-y-2 text-center">
            <p className="text-sm font-medium text-muted-foreground text-xl">Total Income</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              CHF {stats?.total_income?.toFixed(2)}
            </p>
          </div>

          <div className="space-y-2 text-center">
            <p className="text-sm font-medium text-muted-foreground text-xl">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              CHF {stats?.total_expenses?.toFixed(2)}
            </p>
          </div>

          <div className="space-y-2 text-center">
            <p className="text-sm font-medium text-muted-foreground text-xl">Net Savings</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              CHF {stats?.net_savings?.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-6 h-80">
          <div className="text-center w-full mt-8 text-xl">
            Savings Rate
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="100%"
              barSize={10}
              data={gaugeData}
              startAngle={210}
              endAngle={-30}
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
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}