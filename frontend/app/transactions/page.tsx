'use client';
import React from 'react';
import { TransactionsDataTable } from '@/components/transactions-data-table';
import ExportDialog from '@/components/export-dialog';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const CSVImport = dynamic(() => import('@/components/csv-import'), {
  loading: () => <div>Loading import tool...</div>,
  ssr: false
});

export default function TransactionsPage() {
  return (
    <div className="container py-8 min-w-full space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            Manage, search, and analyze your transactions
          </p>
        </div>
        <div className="flex gap-2">
          <ExportDialog />
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card className="p-6">
            <TransactionsDataTable />
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Import Transactions</h2>
            <Suspense fallback={<Skeleton className="h-[400px]" />}>
              <CSVImport />
            </Suspense>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}