export type AgentType =
  | 'document-processor'
  | 'visual-qa'
  | 'data-extractor'
  | 'image-analyzer'
  | 'content-classifier'
  | 'metadata-enricher'
  | 'generic';

export type SessionStatus = 'active' | 'processing' | 'completed' | 'failed' | 'expired';
export type InteractionStatus = 'pending' | 'processing' | 'success' | 'error';

export interface CapabilityInfo {
  name: string;
  description: string;
  parameters?: Record<string, any>;
}

export interface VisionAnalysisResult {
  objects: string[];
  text?: string;
  scene: string;
  dominantColors: string[];
  confidence: number;
  suggestedAgentType: AgentType;
  inferredContext: {
    useCase: string;
    domain: string;
    dataTypes: string[];
  };
}

export interface AgentContextData {
  image_id: string;
  vision_analysis: VisionAnalysisResult;
  agent_type: AgentType;
  custom_instructions?: string;
  tools: string[];
  constraints: {
    max_tokens: number;
    timeout: number;
    rate_limit: number;
  };
}

export interface AgentSessionItem {
  session_id: string;
  user_id: string;
  image_id: string;
  agent_type: AgentType;
  status: SessionStatus;
  context_data: AgentContextData;
  capabilities: CapabilityInfo[];
  created_at: number;
  expires_at: number;
}

export interface AgentInteractionItem {
  interaction_id: string;
  session_id: string;
  query: string;
  capability_name: string;
  parameters?: Record<string, any>;
  response: string;
  response_data?: Record<string, any>;
  status: InteractionStatus;
  execution_time_ms: number;
  tokens_used?: number;
  created_at: number;
  completed_at?: number;
}

// API Response types (camelCase from backend, but we'll convert in API layer)
export interface AgentSessionResponse {
  session_id: string;
  agent_type: AgentType;
  status: SessionStatus;
  context_data: AgentContextData;
  capabilities: CapabilityInfo[];
  vision_analysis: VisionAnalysisResult;
  image_url?: string;
  expires_at: number;
}

export interface AgentInteractionResponse {
  interaction_id: string;
  session_id: string;
  query: string;
  capability_name: string;
  response: string;
  response_data?: Record<string, any>;
  status: InteractionStatus;
  execution_time_ms: number;
  created_at: number;
}

// Node data structure for ReactFlow components (snake_case as per plan)
export interface NodeData {
  // FileInputNode
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;

  // AIInsightNode
  vision_analysis?: VisionAnalysisResult;
  confidence?: number;
  agent_type?: string;
  capabilities?: CapabilityInfo[];

  // ToolNode
  capability_name?: string;
  description?: string;
  on_execute?: (query: string) => Promise<unknown>;
  result?: unknown;

  // PreviewNode
  content?: string;
  result_type?: 'text' | 'json' | 'table';
  title?: string;
}
