'use client';
import { FC, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Zap, Send, Loader2 } from 'lucide-react';

interface ToolNodeProps {
  data: {
    capability_name?: string;
    description?: string;
    on_execute?: (query: string) => Promise<unknown>;
    result?: unknown;
  };
  id: string;
}

export const ToolNode: FC<ToolNodeProps> = ({ data, id }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleExecute = async () => {
    if (!query.trim() || !data.on_execute) return;

    setIsLoading(true);
    try {
      const res = await data.on_execute(query);
      setResult(res);
    } catch (err) {
      setResult({
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 py-3 bg-white border-2 border-yellow-300 rounded-lg shadow-md max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-yellow-600" />
        <span className="text-sm font-semibold text-gray-900 truncate">
          {data.capability_name || 'Tool'}
        </span>
      </div>
      {data.description && <p className="text-xs text-gray-600 mb-2">{data.description}</p>}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter query..."
          disabled={isLoading}
          className="flex-1 px-2 py-1 text-xs border border-yellow-200 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50"
        />
        <button
          onClick={handleExecute}
          disabled={isLoading || !query.trim()}
          className="px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-1"
        >
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
        </button>
      </div>
      {result && (
        <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-100 text-xs">
          {result.error ? <p className="text-red-600 font-medium">Error: {result.error}</p> : <p className="text-gray-700 max-h-20 overflow-auto">{JSON.stringify(result)}</p>}
        </div>
      )}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
};
