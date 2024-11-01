import React, { useMemo } from 'react';
import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';
import { useDataVisibility } from '@/contexts/data-visibility-context';

interface MoneyFlowProps {
  data: {
    income: Record<string, { total: number; count: number }>;
    expenses: Record<string, { total: number; count: number }>;
    totals: {
      income: number;
      expenses: number;
    };
  };
}

export function MoneyFlow({ data }: MoneyFlowProps) {
  const { showData } = useDataVisibility();

  const sankeyData = useMemo(() => {
    if (!data?.income || !data?.expenses) {
      return { nodes: [], links: [] };
    }

    const nodes = [
      { name: 'Total Income' },
      ...Object.keys(data.income).map(name => ({ name })),
      { name: 'Total Expenses' },
      ...Object.keys(data.expenses).map(name => ({ name }))
    ];

    const links = [];
    const incomeCategories = Object.entries(data.income);
    const expenseCategories = Object.entries(data.expenses);

    // Calculate node indices
    const totalIncomeIndex = 0;
    const firstExpenseIndex = incomeCategories.length + 1;

    // Income category to Total Income links
    incomeCategories.forEach(([name, { total }], index) => {
      links.push({
        source: index + 1,
        target: totalIncomeIndex,
        value: total,
        sourceName: name,
        targetName: 'Total Income'
      });
    });

    // Total Income to Total Expenses
    if (data.totals.expenses > 0) {
      links.push({
        source: totalIncomeIndex,
        target: firstExpenseIndex,
        value: data.totals.expenses,
        sourceName: 'Total Income',
        targetName: 'Total Expenses'
      });
    }

    // Total Expenses to expense categories
    expenseCategories.forEach(([name, { total }], index) => {
      links.push({
        source: firstExpenseIndex,
        target: firstExpenseIndex + 1 + index,
        value: total,
        sourceName: 'Total Expenses',
        targetName: name
      });
    });

    return { nodes, links };
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || payload.length === 0 || !showData) return null;

    // Access the source and target directly from the payload
    const link = payload[0];
    const sourceName = link?.sourceName || '';
    const targetName = link?.targetName || '';
    const value = link?.value || 0;

    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <div className="grid gap-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              From: <span className="text-primary">{sourceName}</span>
            </p>
            <p className="text-sm font-medium">
              To: <span className="text-primary">{targetName}</span>
            </p>
          </div>
          <div className="pt-1 border-t">
            <p className="text-sm text-muted-foreground">
              Amount: <span className="font-medium text-foreground">
                CHF {Number(value).toFixed(2)}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (!showData || sankeyData.nodes.length === 0) {
    return (
      <div className="h-[800px] flex items-center justify-center text-muted-foreground">
        {!showData ? "••••••" : "No flow data available"}
      </div>
    );
  }

  return (
    <div className="h-[800px]">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={sankeyData}
          nodePadding={50}
          nodeWidth={10}
          link={{ 
            stroke: 'hsl(var(--muted-foreground))',
            opacity: 0.5
          }}
          node={{
            fill: 'hsl(var(--primary))',
            opacity: 0.8
          }}
        >
          <Tooltip content={<CustomTooltip />} />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
}