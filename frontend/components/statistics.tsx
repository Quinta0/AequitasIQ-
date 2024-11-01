'use client';

import React, { useMemo, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getStatisticsSummary, CategorySummaryResponse } from '@/lib/api';
import { PieChart, Pie, Treemap, Sankey, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { MoneyFlow } from '@/components/MoneyFlow';
import PeriodContext from '@/app/page';
import { usePeriod } from '@/contexts/period-context';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

type PeriodType = 'monthly' | 'yearly';

interface TreemapData {
  name: string;
  size: number;
  value: number;
}

interface TreemapContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  value: number;
  depth: number;
  index: number;
  maxValue: number;
}

const CustomizedContent = ({
  x,
  y,
  width,
  height,
  name,
  value,
  maxValue,
}: TreemapContentProps) => {
  const opacity = 0.2 + (value / maxValue) * 0.8;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={`hsl(var(--primary)/${opacity})`}
        stroke="hsl(var(--border))"
        strokeWidth={1}
      />
      {width > 50 && height > 25 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            fill="currentColor"
            fontSize={12}
            fontWeight="bold"
            className="select-none pointer-events-none fill-primary-foreground"
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 8}
            textAnchor="middle"
            fill="currentColor"
            fontSize={10}
            className="select-none pointer-events-none fill-primary-foreground"
          >
            CHF {value.toFixed(2)}
          </text>
        </>
      )}
    </g>
  );
};

interface ExpenseTreemapProps {
  data: TreemapData[];
}

export function ExpenseTreemap({ data }: ExpenseTreemapProps) {
  const maxValue = useMemo(() => {
    return Math.max(...data.map(item => item.value));
  }, [data]);

  return (
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="value"
          aspectRatio={1}
          animationDuration={450}
          animationBegin={0}
        >
          {(props: TreemapContentProps) => (
            <CustomizedContent {...props} maxValue={maxValue} />
          )}
          <Tooltip
            content={({ payload }) => {
              if (payload && payload.length > 0) {
                const data = payload[0].payload;
                return (
                  <div className="bg-card p-2 rounded-md border shadow-sm">
                    <p className="font-medium">{data.name}</p>
                    <p className="text-sm text-muted-foreground">
                      CHF {Number(data.value).toFixed(2)}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}

export function Statistics() {
  const { year, month, periodType } = usePeriod();

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--background))',
    borderColor: 'hsl(var(--border))',
    color: 'hsl(var(--foreground))',
  };

  const { data, isLoading } = useQuery<CategorySummaryResponse>({
    queryKey: ['category-summary', year, month, periodType],
    queryFn: async () => {
      const startDate = periodType === 'monthly'
        ? `${year}-${String(month).padStart(2, '0')}-01`
        : `${year}-01-01`;
        
      const endDate = periodType === 'monthly'
        ? new Date(year, month ?? 1, 0).toISOString().split('T')[0]
        : `${year}-12-31`;

      return getStatisticsSummary(startDate, endDate);
    },
  });

  console.log('Query Data:', data); // For debugging

  console.log('Query Data:', data); // For debugging

  const incomeData = useMemo(() => 
    Object.entries(data?.income || {}).map(([name, value]: [string, any]) => ({
      name,
      value: value.total,
    }))
  , [data?.income]);

  const expenseData = useMemo(() => 
    Object.entries(data?.expenses || {}).map(([name, value]: [string, any]) => ({
      name,
      value: value.total,
      size: value.total,
    })).sort((a, b) => b.value - a.value)
  , [data?.expenses]);

  if (isLoading) return <Skeleton className="h-[1200px] w-full" />;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle>Income Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex items-center justify-center">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={incomeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {incomeData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `CHF ${Number(value).toFixed(2)}`} 
                    contentStyle={tooltipStyle}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseTreemap data={expenseData} />
          </CardContent>
        </Card>
      </div>

      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle>Money Flow</CardTitle>
        </CardHeader>
        <CardContent>
          {data && (
            <MoneyFlow 
              data={{
                income: data.income,
                expenses: data.expenses,
                totals: data.totals
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}