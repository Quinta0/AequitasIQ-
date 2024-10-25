'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PieChart, Pie, Treemap, Sankey, ResponsiveContainer, Cell, Tooltip } from 'recharts';

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8',
  '#82CA9D', '#FFC658', '#FF6B6B', '#4ECDC4', '#556270'
];

type PeriodType = 'monthly' | 'yearly';

interface TreemapData {
  name: string;
  size: number;
  value: number;
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

  if (isLoading) return <div>Loading statistics...</div>;

  const incomeData = Object.entries(data?.income || {}).map(([name, value]: [string, any]) => ({
    name,
    value: value.total,
  }));

  const expenseData = {
    name: 'Expenses',
    children: Object.entries(data?.expenses || {}).map(([name, value]: [string, any]) => ({
      name,
      size: value.total,
      value: value.total,
    })) as TreemapData[],
  };

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
      ...Object.entries(data?.expenses || {}).map(([name, value]: [string, any], index) => ({
        source: Object.keys(data?.income || {}).length + 1,
        target: Object.keys(data?.income || {}).length + 2 + index,
        value: value.total,
      })),
    ],
  };

  return (
    <div className="space-y-6">
      <Card>
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
        <Card>
          <CardHeader>
            <CardTitle>Income Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] flex items-center justify-center">
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
                  <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] flex items-center justify-center">
              <ResponsiveContainer>
                <Treemap
                  data={[expenseData]}
                  dataKey="value"
                  aspectRatio={1}
                  stroke="#fff"
                >
                  {(props: any) => {
                    const { x, y, width, height, depth, index, name } = props;
                    if (depth === 1) {
                      return (
                        <g>
                          <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            style={{
                              fill: COLORS[index % COLORS.length],
                              stroke: '#fff',
                              strokeWidth: 2,
                            }}
                          />
                          {width > 30 && height > 30 && (
                            <text
                              x={x + width / 2}
                              y={y + height / 2}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="#fff"
                              fontSize={12}
                            >
                              {name}
                            </text>
                          )}
                        </g>
                      );
                    }
                    return null;
                  }}
                  <Tooltip 
                    formatter={(value) => `€${Number(value).toFixed(2)}`}
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                  />
                </Treemap>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Money Flow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[800px]">
            <ResponsiveContainer width="100%" height="100%">
              <Sankey
                data={sankeyData}
                nodePadding={50}
                nodeWidth={10}
                link={{ stroke: '#77909c' }}
              >
                <Tooltip />
              </Sankey>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}