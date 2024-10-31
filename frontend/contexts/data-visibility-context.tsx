// contexts/data-visibility-context.tsx
'use client';

import { createContext, useContext, useState } from 'react';

interface DataVisibilityContextType {
  showData: boolean;
  toggleDataVisibility: () => void;
}

const DataVisibilityContext = createContext<DataVisibilityContextType | undefined>(undefined);

export function DataVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [showData, setShowData] = useState(true);

  const toggleDataVisibility = () => {
    setShowData(prev => !prev);
  };

  return (
    <DataVisibilityContext.Provider value={{ showData, toggleDataVisibility }}>
      {children}
    </DataVisibilityContext.Provider>
  );
}

export function useDataVisibility() {
  const context = useContext(DataVisibilityContext);
  if (context === undefined) {
    throw new Error('useDataVisibility must be used within a DataVisibilityProvider');
  }
  return context;
}