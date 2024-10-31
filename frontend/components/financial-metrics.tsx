'use client';
import React from 'react';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ResponsiveContainer, RadialBarChart, RadialBar, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useDataVisibility } from '@/contexts/data-visibility-context';

export function FinancialMetrics() {
  const { showData } = useDataVisibility();
  
  const { data: stats, isLoading } = useQuery({
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
    return <Skeleton className="h-full w-full" />;
  }

  const savingsRate = stats?.saving_rate || 0;
  const gaugeData = [
    {
      name: 'Savings Rate',
      value: savingsRate * 100,
      fill:
        savingsRate >= 0.2
          ? 'hsl(var(--chart-2))'
          : savingsRate >= 0.1
          ? 'hsl(var(--chart-4))'
          : 'hsl(var(--chart-1))',
    },
  ];

  const formatCurrency = (amount: number) => {
    return showData 
      ? `CHF ${amount?.toFixed(2)}` 
      : '••••••';
  };

  const formatPercentage = (value: number) => {
    return showData 
      ? `${(value * 100).toFixed(1)}%` 
      : '••••';
  };

  return (
    <div className="h-full p-6">
      <CardHeader className="px-0">
        <CardTitle className="text-center text-2xl">Financial Overview</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="grid grid-cols-2 gap-4">
          {/* Top Metrics Row */}
          <div
            className={cn(
              'p-4 rounded-xl',
              'bg-gradient-to-br from-blue-500 to-blue-600',
              'flex flex-col items-center justify-center'
            )}
          >
            <p className="text-sm font-medium text-white">Age of Money</p>
            <p className="text-2xl font-bold text-white">
              {showData
                ? `${Math.floor(
                    ((stats?.net_savings || 0) / (stats?.total_expenses || 1)) * 30
                  )} days`
                : '••••'}
            </p>
          </div>

          <div
            className={cn(
              'p-4 rounded-xl',
              'bg-gradient-to-br from-green-500 to-green-600',
              'flex flex-col items-center justify-center'
            )}
          >
            <p className="text-sm font-medium text-white">Net Worth</p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(stats?.net_savings || 0)}
            </p>
          </div>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Income</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(stats?.total_income || 0)}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Expenses</p>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(stats?.total_expenses || 0)}
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">Savings</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(stats?.net_savings || 0)}
            </p>
          </div>
        </div>

        {/* Savings Rate Gauge */}
        <div className="mt-4 h-[200px]">
          <div className="text-center text-xl font-medium text-muted-foreground">
            Savings Rate
          </div>
          {showData ? (
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
                <RadialBar background dataKey="value" cornerRadius={10} />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="fill-current font-bold text-lg"
                >
                  {formatPercentage(savingsRate)}
                </text>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-4xl font-mono">
              ••••
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
}