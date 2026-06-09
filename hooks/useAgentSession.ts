import { useEnvironment } from '@/lib/contexts/environment-context';

export const useCurrentSession = () => {
  const { currentSession } = useEnvironment();
  return currentSession;
};

export const useCurrentSessionId = () => {
  const { currentSessionId } = useEnvironment();
  return currentSessionId;
};

export const useSessionLoading = () => {
  const { loading } = useEnvironment();
  return loading;
};

export const useSessionError = () => {
  const { error } = useEnvironment();
  return error;
};

export const useInteractions = () => {
  const { interactions } = useEnvironment();
  return interactions;
};

export const useInteractionsLoading = () => {
  const { interactionsLoading } = useEnvironment();
  return interactionsLoading;
};

export const useSessionHistory = () => {
  const { currentSession } = useEnvironment();
  return currentSession ? [currentSession] : [];
};

export const useSessionActions = () => {
  const { setCurrentSession, setCurrentSessionId, clearCurrentSession, setLoading, setError, addInteraction, setInteractions, setInteractionsLoading, clearInteractions } = useEnvironment();
  return {
    setCurrentSession,
    setCurrentSessionId,
    clearCurrentSession,
    setLoading,
    setError,
    addInteraction,
    setInteractions,
    setInteractionsLoading,
    clearInteractions,
  };
};
