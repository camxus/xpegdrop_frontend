'use client';

import { useMemo, useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  Edge,
  Node,
  Connection,
  NodeTypes,
  OnConnect,
  NodeMouseHandler,
} from 'reactflow';
import { useCurrentSession } from '@/hooks/useAgentSession';
import { useInteractWithAgent } from '@/hooks/api/useAgent';
import { useEnvironment } from '@/lib/contexts/environment-context';
import { FileInputNode } from '@/components/agents/file-input-node';
import { AIInsightNode } from '@/components/agents/ai-insight-node';
import { ToolNode } from '@/components/agents/tool-node';
import { PreviewNode } from '@/components/agents/preview-node';
import { NodeData } from '@/types/agent';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { FileUploadZone } from '../file-upload-zone';
import { useSaveEnvironment } from '@/hooks/api/useAgent';
import 'reactflow/dist/style.css';

const nodeTypes: NodeTypes = {
  fileInput: FileInputNode,
  aiInsight: AIInsightNode,
  tool: ToolNode,
  preview: PreviewNode,
};

type MediaMeta = {
  fileId?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  thumbnailUrl?: string;
  sourceUrl?: string;
};

function buildFileNodeData(media: MediaMeta | null | undefined): NodeData {
  const base: NodeData = {
    file_name: media?.fileName ?? 'uploaded-image.jpg',
    mime_type: media?.fileType ?? 'image/jpeg',
  };
  if (media) {
    base.file_name = media.fileName;
    base.mime_type = media.fileType;
    if (media.fileSize) (base as any).file_size = media.fileSize;
    if (media.width) (base as any).width = media.width;
    if (media.height) (base as any).height = media.height;
    if (media.thumbnailUrl) (base as any).thumbnail_url = media.thumbnailUrl;
    if (media.sourceUrl) (base as any).source_url = media.sourceUrl;
  } else {
    (base as any).width = 1920;
    (base as any).height = 1080;
    (base as any).file_size = 204800;
  }
  return base;
}

export default function EnvironmentCanvas({ sessionId, media }: { sessionId: string; media?: MediaMeta | null }) {
  const session = useCurrentSession();
  const { interact } = useInteractWithAgent();
  const { addInteraction } = useEnvironment();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mediaWithS3: MediaMeta = useMemo(() => {
    const s3Location = (session?.context_data as any)?.image_s3_location as { bucket?: string; key?: string; url?: string } | undefined;
    return {
      ...(media || {}),
      sourceUrl: s3Location?.url || media?.sourceUrl,
      thumbnailUrl: media?.thumbnailUrl || s3Location?.url,
    } as MediaMeta;
  }, [session, media]);

  const selectedNode = useMemo(() => {
    if (!selectedNodeId || !session) return null;
    const data = buildFileNodeData(mediaWithS3);
    const fileNode = {
      id: 'file-input',
      type: 'fileInput',
      position: { x: 0, y: 0 },
      data,
    };
    const aiNode = {
      id: 'ai-insight',
      type: 'aiInsight',
      position: { x: 260, y: 0 },
      data: {
        vision_analysis: session.context_data.vision_analysis,
        confidence: session.context_data.vision_analysis.confidence,
        agent_type: session.agent_type,
        capabilities: session.capabilities,
      },
    };
    const toolNodes = session.capabilities.map((cap, idx) => ({
      id: `tool-${idx}`,
      type: 'tool',
      position: { x: 520, y: idx * 120 },
      data: {
        capability_name: cap.name,
        description: cap.description,
      },
    }));
    const allNodes = [fileNode, aiNode, ...toolNodes];
    return allNodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, session, mediaWithS3]);

  const handleNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNodeId(node.id);
  }, []);

  const buildInitialNodes = useMemo(() => {
    if (!session) return [] as Node<NodeData>[];
    const fileNodeData = buildFileNodeData(mediaWithS3);
    const base: Node<NodeData>[] = [
      {
        id: 'file-input',
        type: 'fileInput',
        position: { x: 0, y: 0 },
        data: fileNodeData,
      },
      {
        id: 'ai-insight',
        type: 'aiInsight',
        position: { x: 260, y: 0 },
        data: {
          vision_analysis: session.context_data.vision_analysis,
          confidence: session.context_data.vision_analysis.confidence,
          agent_type: session.agent_type,
          capabilities: session.capabilities,
        },
      },
    ];

    session.capabilities.forEach((cap, index) => {
      base.push({
        id: `tool-${index}`,
        type: 'tool',
        position: { x: 520, y: index * 120 },
        data: {
          capability_name: cap.name,
          description: cap.description,
          on_execute: async (query: string) => {
            const res = await interact({
              sessionId: session.session_id,
              query,
              capabilityName: cap.name,
            });
            return res;
          },
        },
      });
    });

    base.push({
      id: 'preview',
      type: 'preview',
      position: { x: 780, y: 60 },
      data: {
        content: undefined,
        result_type: 'text',
        title: 'Preview',
      },
    });

    return base;
  }, [session, interact, mediaWithS3]);

  const buildInitialEdges = useMemo(() => {
    if (!session) return [] as Edge[];
    const edges: Edge[] = [
      { id: 'e-1', source: 'file-input', target: 'ai-insight', animated: true },
    ];
    session.capabilities.forEach((_, index) => {
      edges.push({ id: `e-${index + 1}`, source: `tool-${index}`, target: 'preview', animated: true });
    });
    return edges;
  }, [session]);

  const [nodes, setNodes, onNodesChange] = useNodesState(buildInitialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(buildInitialEdges);

  const handleConnect: OnConnect = (params) => {
    setEdges((eds) => addEdge(params, eds));
  };

  const saveEnv = useSaveEnvironment();
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  const triggerSave = useCallback(() => {
    if (!session?.session_id) return;
    saveEnv.mutate(
      { sessionId: session.session_id, nodes, edges },
      {
        onSuccess: () => setLastSavedAt(Date.now()),
      }
    );
  }, [session?.session_id, nodes, edges, saveEnv]);

  const handleNodesChange = useCallback(
    (changes: any[]) => {
      onNodesChange(changes);
      triggerSave();
    },
    [onNodesChange, triggerSave]
  );

  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      onEdgesChange(changes);
      triggerSave();
    },
    [onEdgesChange, triggerSave]
  );

  const handleSubmitPrompt = useCallback(async () => {
    if (!prompt.trim() || !session || !selectedNodeId) return;
    setIsSubmitting(true);
    try {
      const response = await interact({
        sessionId: session.session_id,
        query: prompt,
        capabilityName: selectedNodeId,
      });
      
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === 'preview') {
            const responseData = response.response_data;
            const isJson = responseData && typeof responseData === 'object';
            return {
              ...node,
              data: {
                ...node.data,
                content: isJson ? JSON.stringify(responseData, null, 2) : response.response,
                result_type: isJson ? 'json' : 'text',
                title: 'Preview',
              },
            };
          }
          return node;
        })
      );

      setPrompt('');
    } catch (err) {
      console.error('Prompt failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [prompt, session, selectedNodeId, interact, addInteraction]);

  const selectedNodeLabel = (selectedNode?.data as { capability_name?: string })?.capability_name || (selectedNode?.data as { file_name?: string })?.file_name || 'AI Analysis';

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={handleConnect}
            onNodeClick={handleNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white p-3">
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            Selected context: <span className="font-semibold text-gray-900">{selectedNodeLabel}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <FileUploadZone />
            <span className="text-xs text-gray-500">
              {lastSavedAt ? `Saved ${new Date(lastSavedAt).toLocaleTimeString()}` : 'Saving...'}
            </span>
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Ask about ${selectedNodeLabel}...`}
            className="flex-1 p-2"
            rows={2}
          />
          <Button
            disabled={isSubmitting || !selectedNodeId || !prompt.trim()}
            onClick={handleSubmitPrompt}
          >
            {isSubmitting ? 'Running...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
