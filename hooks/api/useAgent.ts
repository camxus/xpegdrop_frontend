import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentApi } from '@/lib/api/agentApi';
import { useEnvironment } from '@/lib/contexts/environment-context';

export function useAgentSession(sessionId: string) {
  const { setCurrentSession, setError, setLoading } = useEnvironment();

  return useQuery({
    queryKey: ['agentSession', sessionId],
    queryFn: () => agentApi.getAgentSession(sessionId),
    enabled: !!sessionId,
  });
}

export function useUploadImage() {
  const { setCurrentSession, setError, setLoading } = useEnvironment();

  return useMutation({
    mutationFn: (formData: unknown) => agentApi.createAgentFromImage(formData as Parameters<typeof agentApi.createAgentFromImage>[0]),
    onSuccess: (res) => {
      setCurrentSession(res.data);
    },
    onError: (err: any) => {
      setError(err?.message || 'Failed to create agent');
    },
    onSettled: () => setLoading(false),
  });
}

export function useInteractWithAgent() {
  const queryClient = useQueryClient();
  const { addInteraction } = useEnvironment();
  const { currentSessionId } = useEnvironment();

  const mutation = useMutation({
    mutationFn: ({
      sessionId,
      query,
      capabilityName,
      parameters,
    }: {
      sessionId: string;
      query: string;
      capabilityName: string;
      parameters?: Record<string, unknown>;
    }) => agentApi.interactWithAgent(sessionId, { query, capabilityName, parameters }),
  });

  const interact = async (params: {
    sessionId: string;
    query: string;
    capabilityName: string;
    parameters?: Record<string, unknown>;
  }) => {
    const res = await mutation.mutateAsync(params);
    addInteraction({
      interaction_id: res.data.interaction_id,
      session_id: res.data.session_id,
      query: res.data.query,
      capability_name: res.data.capability_name,
      response: res.data.response,
      response_data: res.data.response_data,
      status: res.data.status,
      execution_time_ms: res.data.execution_time_ms,
      created_at: res.data.created_at,
      parameters: undefined,
      tokens_used: undefined,
      completed_at: undefined,
    });
    queryClient.invalidateQueries({
      queryKey: ['agentInteractions', params.sessionId || currentSessionId],
    });
    return res.data;
  };

  return { ...mutation, interact };
}

export function useAgentInteractions(
  sessionId: string,
  params?: { limit?: number; offset?: number }
) {
  const { setInteractions, setInteractionsLoading } = useEnvironment();

  return useQuery({
    queryKey: ['agentInteractions', sessionId, params],
    queryFn: () => agentApi.getAgentInteractions(sessionId, params),
    enabled: !!sessionId,
  });
}

export function useSaveEnvironment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      sessionId: string;
      nodes: unknown[];
      edges: unknown[];
    }) => agentApi.saveEnvironment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['environments'] });
    },
  });
}
