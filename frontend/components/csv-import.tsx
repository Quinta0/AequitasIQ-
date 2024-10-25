'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Upload } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface PreviewRow {
  [key: string]: string;
}

interface ImportResult {
  status: string;
  imported: number;
  message: string;
  categorization?: {
    total: number;
    results: Array<{
      row: number;
      description: string;
      assigned_category: string;
    }>;
    categories_summary: Record<string, number>;
  };
  failed_rows?: Array<{
    row: number;
    error: string;
  }>;
}

const CSVImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const queryClient = useQueryClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setFile(file);
    setError(null);

    // Preview the first few rows
    const text = await file.text();
    const rows = text.split('\n').slice(0, 6);
    const headers = rows[0].split(',');
    const previewData = rows.slice(1).map(row => {
      const values = row.split(',');
      return headers.reduce((obj, header, i) => ({
        ...obj,
        [header.trim()]: values[i]?.trim() || ''
      }), {} as PreviewRow);
    });

    setPreview(previewData);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post<ImportResult>('/transactions/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-stats'] });
      queryClient.invalidateQueries({ queryKey: ['budget-overview'] });
      
      setFile(null);
      setPreview([]);
      
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        err.message || 
        'Failed to import CSV'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="flex-1"
            />
            <Button
              onClick={handleUpload}
              disabled={!file || loading}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {loading ? 'Importing...' : 'Import'}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4">
              <Alert variant={result.status === 'success' ? 'default' : 'destructive'}>
                <AlertTitle>Import Result</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>

              {result.categorization && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Category Summary:</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(result.categorization.categories_summary).map(([category, count]) => (
                        <div key={category} className="flex justify-between border p-2 rounded">
                          <span>{category}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Sample Categorizations:</h3>
                    <div className="space-y-2">
                      {result.categorization.results.map((item, index) => (
                        <div key={index} className="border p-2 rounded">
                          <p className="text-sm text-muted-foreground">Row {item.row}</p>
                          <p className="font-medium">{item.description}</p>
                          <p className="text-sm">Category: <span className="font-medium">{item.assigned_category}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {result.failed_rows && result.failed_rows.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Failed Rows:</h3>
                  <div className="space-y-2">
                    {result.failed_rows.map((row, index) => (
                      <div key={index} className="border p-2 rounded bg-red-50">
                        <p>Row {row.row}: {row.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {preview.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium">Preview:</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {Object.keys(preview[0]).map((header) => (
                        <th key={header} className="p-2 text-left border">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i}>
                        {Object.entries(row).map(([key, value], j) => (
                          <td key={`${i}-${j}`} className="p-2 border">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CSVImport;