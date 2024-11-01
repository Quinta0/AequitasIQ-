// contexts/period-context.tsx
'use client';

import React, { createContext, useContext } from 'react';

export interface PeriodContextType {
  year: number;
  month?: number;
  periodType: 'monthly' | 'yearly';
  setPeriodType: (type: 'monthly' | 'yearly') => void;
}

export const PeriodContext = createContext<PeriodContextType>({
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  periodType: 'monthly',
  setPeriodType: () => {},
});

export function usePeriod() {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error('usePeriod must be used within a PeriodProvider');
  }
  return context;
}

interface PeriodProviderProps {
  children: React.ReactNode;
  value: PeriodContextType;
}

export function PeriodProvider({ children, value }: PeriodProviderProps) {
  return (
    <PeriodContext.Provider value={value}>
      {children}
    </PeriodContext.Provider>
  );
}