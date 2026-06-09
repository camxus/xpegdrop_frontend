'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { AgentSessionResponse, AgentInteractionItem } from '@/types/agent';

interface EnvironmentState {
  currentSession: AgentSessionResponse | null;
  currentSessionId: string | null;
  loading: boolean;
  error: string | null;
  interactions: AgentInteractionItem[];
  interactionsLoading: boolean;
}

interface EnvironmentContextValue extends EnvironmentState {
  setCurrentSession: (session: AgentSessionResponse) => void;
  setCurrentSessionId: (id: string) => void;
  clearCurrentSession: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addInteraction: (interaction: AgentInteractionItem) => void;
  setInteractions: (interactions: AgentInteractionItem[]) => void;
  setInteractionsLoading: (loading: boolean) => void;
  clearInteractions: () => void;
}

const EnvironmentContext = createContext<EnvironmentContextValue | undefined>(undefined);

export function EnvironmentProvider({ children }: { children: ReactNode }) {
  const [currentSession, setCurrentSession] = useState<AgentSessionResponse | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interactions, setInteractions] = useState<AgentInteractionItem[]>([]);
  const [interactionsLoading, setInteractionsLoading] = useState(false);

  return (
    <EnvironmentContext.Provider
      value={{
        currentSession,
        currentSessionId,
        loading,
        error,
        interactions,
        interactionsLoading,
        setCurrentSession,
        setCurrentSessionId,
        clearCurrentSession: () => {
          setCurrentSession(null);
          setCurrentSessionId(null);
          setInteractions([]);
        },
        setLoading,
        setError,
        addInteraction: (interaction) => setInteractions((prev) => [interaction, ...prev]),
        setInteractions,
        setInteractionsLoading,
        clearInteractions: () => setInteractions([]),
      }}
    >
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  return context;
}
