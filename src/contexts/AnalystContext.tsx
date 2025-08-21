import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AnalystContextType {
  analystName: string | null;
  setAnalystName: (name: string) => void;
  clearAnalyst: () => void;
}

const AnalystContext = createContext<AnalystContextType | undefined>(undefined);

export const AnalystProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [analystName, setAnalystNameState] = useState<string | null>(() => {
    return localStorage.getItem('analystName');
  });

  const setAnalystName = (name: string) => {
    setAnalystNameState(name);
    localStorage.setItem('analystName', name);
  };

  const clearAnalyst = () => {
    setAnalystNameState(null);
    localStorage.removeItem('analystName');
  };

  return (
    <AnalystContext.Provider value={{
      analystName,
      setAnalystName,
      clearAnalyst,
    }}>
      {children}
    </AnalystContext.Provider>
  );
};

export const useAnalyst = () => {
  const context = useContext(AnalystContext);
  if (context === undefined) {
    throw new Error('useAnalyst must be used within an AnalystProvider');
  }
  return context;
};