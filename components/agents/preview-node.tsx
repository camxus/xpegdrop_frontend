'use client';
import { FC } from 'react';
import { Handle, Position } from 'reactflow';
import { Eye, Image as ImageIcon, Video, Music } from 'lucide-react';
import Image from 'next/image';

interface PreviewNodeProps {
  data: {
    content?: unknown;
    result_type?: 'text' | 'json' | 'table' | 'image' | 'video' | 'audio';
    title?: string;
    image_url?: string;
    source_url?: string;
    mime_type?: string;
  };
}

export const PreviewNode: FC<PreviewNodeProps> = ({ data }) => {
  const src = data.image_url || data.source_url;
  const isImage = data.result_type === 'image' || data.mime_type?.startsWith('image/');
  const isVideo = data.result_type === 'video' || data.mime_type?.startsWith('video/');
  const isAudio = data.result_type === 'audio' || data.mime_type?.startsWith('audio/');

  const renderContent = () => {
    if (!data.content && !src) return <p className="text-gray-400 italic">No content</p>;

    if (isAudio && src) {
      return (
        <div className="w-64">
          <audio controls className="w-full">
            <source src={src} type={data.mime_type || 'audio/mpeg'} />
          </audio>
        </div>
      );
    }

    if (isVideo && src) {
      return (
        <div className="w-64">
          <video controls className="w-full rounded border border-gray-200">
            <source src={src} type={data.mime_type || 'video/mp4'} />
          </video>
        </div>
      );
    }

    if (isImage && src) {
      return (
        <div className="w-64">
          <Image
            src={src}
            alt={data.title || 'Generated image'}
            width={256}
            height={192}
            className="rounded border border-gray-200 object-cover"
          />
        </div>
      );
    }

    if (data.result_type === 'json') {
      try {
        const parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
        return (
          <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-48 text-gray-700">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        );
      } catch {
        return <p className="text-xs text-gray-600 break-words">{String(data.content)}</p>;
      }
    }

    if (data.result_type === 'table') {
      return (
        <div className="text-xs overflow-auto max-h-48">
          <table className="w-full text-left border-collapse">
            <tbody>
              {Array.isArray(data.content) ? (
                data.content.map((row, i) => (
                  <tr key={i} className="border-b border-gray-200">
                    {Array.isArray(row) ? (
                      row.map((cell, j) => (
                        <td key={j} className="px-2 py-1 border-r border-gray-200 last:border-r-0">{String(cell)}</td>
                      ))
                    ) : (
                      <td className="px-2 py-1">{String(row)}</td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-2 py-1">{String(data.content)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    return <p className="text-xs text-gray-700 break-words max-h-48 overflow-auto">{String(data.content)}</p>;
  };

  return (
    <div className="px-4 py-3 bg-white border-2 border-green-300 rounded-lg shadow-md max-w-sm">
      <div className="flex items-center gap-2 mb-2">
        {isImage ? <ImageIcon className="w-4 h-4 text-green-600" /> : isVideo ? <Video className="w-4 h-4 text-green-600" /> : isAudio ? <Music className="w-4 h-4 text-green-600" /> : <Eye className="w-4 h-4 text-green-600" />}
        <span className="text-sm font-semibold text-gray-900">{data.title || 'Preview'}</span>
      </div>
      <div className="text-xs bg-green-50 p-3 rounded border border-green-100">
        {renderContent()}
      </div>
      <Handle type="target" position={Position.Left} />
    </div>
  );
};

export default PreviewNode;
