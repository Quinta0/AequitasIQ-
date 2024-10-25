'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';

export function TestCategorization() {
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    try {
      setLoading(true);
      const response = await api.post('/test-categorize', null, {
        params: { description }
      });
      setResult(response.data);
    } catch (error) {
      setResult({ error: 'Failed to categorize' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Transaction Categorization</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Enter transaction description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleTest}
              disabled={!description || loading}
            >
              {loading ? 'Testing...' : 'Test Category'}
            </Button>
          </div>

          {result && (
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Result:</h3>
              <div className="space-y-2">
                <p>Description: {result.description}</p>
                {result.success ? (
                  <p>Category: <span className="font-medium">{result.category}</span></p>
                ) : (
                  <p className="text-red-500">Error: {result.error}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}