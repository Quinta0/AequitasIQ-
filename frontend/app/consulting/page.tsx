'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export function FinancialAdvisor() {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    
    setLoading(true);
    try {
      const { data } = await api.post('/finance/ask', { question });
      setResponse(data.response);
    } catch (error) {
      setResponse('Sorry, I was unable to process your question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className='my-8'>
      <CardHeader>
        <CardTitle>Financial Advisor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Ask about your financial situation... (e.g., 'Can I afford a new laptop costing €1,200?')"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[100px]"
            />
            <Button
              onClick={handleAskQuestion}
              disabled={loading || !question.trim()}
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Analyzing...' : 'Ask Question'}
            </Button>
          </div>

          {response && (
            <div className="p-4 border rounded-lg bg-muted">
              <h3 className="font-medium mb-2">Response:</h3>
              <p className="whitespace-pre-wrap">{response}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
export default FinancialAdvisor;