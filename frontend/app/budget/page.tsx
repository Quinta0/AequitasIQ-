import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCcw } from "lucide-react";

// Import the named component type
import type { BudgetOverview } from '@/components/budget-overview';

const DynamicBudgetOverview = dynamic<React.ComponentProps<typeof BudgetOverview>>(
  () => import('@/components/budget-overview').then(mod => mod.BudgetOverview),
  {
    loading: () => <BudgetOverviewSkeleton />,
    ssr: false
  }
);

function BudgetOverviewSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle><Skeleton className="h-8 w-3/4" /></CardTitle>
        <CardDescription><Skeleton className="h-4 w-1/2" /></CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[200px] w-full" />
      </CardContent>
    </Card>
  );
}

export default function BudgetPage() {
  return (
    <main className="container py-8 min-w-full space-y-6">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Budget Overview</h1>
            <p className="text-muted-foreground">
              Track your monthly budget, expenses, and savings
            </p>
          </div>
          <Button variant="outline" size="icon">
            <RefreshCcw className="h-4 w-4" />
            <span className="sr-only">Refresh budget data</span>
          </Button>
        </div>

        <Suspense fallback={<BudgetOverviewSkeleton />}>
          <DynamicBudgetOverview />
        </Suspense>

        <p className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </main>
  );
}