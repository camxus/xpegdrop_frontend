import { api } from './client';
import {
  AgentSessionResponse,
  AgentInteractionResponse,
  CapabilityInfo,
  SessionStatus,
  InteractionStatus,
} from '@/types/agent';

export const agentApi = {
  createAgentFromImage: async (formData: FormData): Promise<{ data: AgentSessionResponse }> => {
    return await api.post('/agents/from-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
  },

  getAgentSession: async (sessionId: string): Promise<{ data: AgentSessionResponse }> => {
    return await api.get(`/agents/${encodeURIComponent(sessionId)}`);
  },

  interactWithAgent: async (
    sessionId: string,
    payload: {
      query: string;
      capabilityName: string;
      parameters?: Record<string, unknown>;
    }
  ): Promise<{ data: AgentInteractionResponse }> => {
    return await api.post(`/agents/${encodeURIComponent(sessionId)}/interact`, {
      query: payload.query,
      capability_name: payload.capabilityName,
      parameters: payload.parameters,
    });
  },

  getAgentInteractions: async (
    sessionId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<{
    data: AgentInteractionResponse[];
    pagination: { total: number; limit: number; offset: number };
  }> => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString();
    return await api.get(`/agents/${encodeURIComponent(sessionId)}/interactions${qs ? `?${qs}` : ''}`);
  },

  saveEnvironment: async (payload: {
    sessionId: string;
    nodes: unknown[];
    edges: unknown[];
  }): Promise<{ data: { session_id: string; environment_id: string; nodes: unknown[]; edges: unknown[]; saved_at: number } }> => {
    return await api.post(`/agents/${encodeURIComponent(payload.sessionId)}/environment`, {
      session_id: payload.sessionId,
      nodes: payload.nodes,
      edges: payload.edges,
    });
  },
};
