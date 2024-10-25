'use client';

import { FinancialAdvisor } from '@/components/financial-advisor';

export default function ConsultingPage() {
  return (
    <div className="container py-8 min-w-full">
      <h1 className="text-3xl font-bold mb-8">Financial Consulting</h1>
      <FinancialAdvisor />
    </div>
  );
}