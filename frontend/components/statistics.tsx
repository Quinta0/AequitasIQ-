'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PieChart, Pie, Treemap, Sankey, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

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
            €{value.toFixed(2)}
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
                      €{Number(data.value).toFixed(2)}
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
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');

  const { data, isLoading } = useQuery({
    queryKey: ['category-summary', selectedYear, selectedMonth, periodType],
    queryFn: async () => {
      const params = periodType === 'monthly' 
        ? {
            start_date: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`,
            end_date: new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0],
          }
        : {
            start_date: `${selectedYear}-01-01`,
            end_date: `${selectedYear}-12-31`,
          };

      const { data } = await api.get('/statistics/category-summary', { params });
      return data;
    },
  });

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


  // Prepare Sankey data
  const sankeyData = {
    nodes: [
      { name: 'Total Income' },
      ...Object.keys(data?.income || {}).map(name => ({ name })),
      { name: 'Total Expenses' },
      ...Object.keys(data?.expenses || {}).map(name => ({ name })),
    ],
    links: [
      // Income to Total Income
      ...Object.entries(data?.income || {}).map(([name, value]: [string, any], index) => ({
        source: index + 1,
        target: 0,
        value: value.total,
      })),
      // Total Income to Total Expenses
      {
        source: 0,
        target: Object.keys(data?.income || {}).length + 1,
        value: data?.totals?.expenses || 0,
      },
      // Total Expenses to Expense Categories
      ...Object.entries(data?.expenses || 

 {}).map(([name, value]: [string, any], index) => ({
        source: Object.keys(data?.income || {}).length + 1,
        target: Object.keys(data?.income || {}).length + 2 + index,
        value: value.total,
      })),
    ],
  };

  return (
    <div className="space-y-6">
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle>Period Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-center gap-4">
              <Toggle
                pressed={periodType === 'monthly'}
                onPressedChange={() => setPeriodType('monthly')}
              >
                Monthly
              </Toggle>
              <Toggle
                pressed={periodType === 'yearly'}
                onPressedChange={() => setPeriodType('yearly')}
              >
                Yearly
              </Toggle>
            </div>

            <div className="flex gap-4">
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {periodType === 'monthly' && (
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(value) => setSelectedMonth(parseInt(value))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <SelectItem key={month} value={month.toString()}>
                        {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} />
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
          <div className="h-[600px]">
            <ResponsiveContainer width="100%" height="100%">
              <Sankey
                data={sankeyData}
                nodePadding={50}
                nodeWidth={10}
                link={{ stroke: 'hsl(var(--muted-foreground))' }}
              >
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }} />
              </Sankey>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}