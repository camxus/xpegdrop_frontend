'use client';
import { FC } from 'react';
import { Handle, Position } from 'reactflow';
import { Brain } from 'lucide-react';
import { VisionAnalysisResult } from '@/types/agent';

interface AIInsightNodeProps {
  data: {
    vision_analysis?: VisionAnalysisResult;
    confidence?: number;
    agent_type?: string;
    capabilities?: { name: string; description: string }[];
  };
}

export const AIInsightNode: FC<AIInsightNodeProps> = ({ data }) => {
  const analysis = data.vision_analysis;

  return (
    <div className="px-4 py-3 bg-white border-2 border-purple-300 rounded-lg shadow-md max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-4 h-4 text-purple-600" />
        <span className="text-sm font-semibold text-gray-900">AI Analysis</span>
      </div>
      {analysis && (
        <div className="text-xs text-gray-700 space-y-2">
          {analysis.scene && (
            <div>
              <span className="font-medium text-gray-800">Scene:</span>
              <p className="text-gray-600">{analysis.scene}</p>
            </div>
          )}
          {analysis.objects?.length > 0 && (
            <div>
              <span className="font-medium text-gray-800">Objects:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {analysis.objects.slice(0, 3).map((obj, i) => (
                  <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded">{obj}</span>
                ))}
                {analysis.objects.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">+{analysis.objects.length - 3}</span>
                )}
              </div>
            </div>
          )}
          {analysis.dominantColors?.length > 0 && (
            <div>
              <span className="font-medium text-gray-800">Colors:</span>
              <div className="flex gap-1 mt-1">
                {analysis.dominantColors.slice(0, 3).map((color, i) => (
                  <div key={i} className="w-6 h-6 rounded border border-gray-200" title={color} style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
          )}
          {typeof analysis.confidence === 'number' && (
            <div>
              <span className="font-medium text-gray-800">Confidence:</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${analysis.confidence * 100}%` }} />
                </div>
                <span className="text-gray-600">{(analysis.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
          {analysis.suggestedAgentType && (
            <div className="p-2 bg-purple-50 rounded">
              <span className="font-medium text-purple-900">Agent Type:</span>
              <p className="text-purple-700 font-semibold mt-1">{analysis.suggestedAgentType}</p>
            </div>
          )}
        </div>
      )}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};
