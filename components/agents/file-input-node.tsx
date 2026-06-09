'use client';
import { FC } from 'react';
import { Handle, Position } from 'reactflow';
import { ImageIcon, Video, Music } from 'lucide-react';
import Image from 'next/image';

interface FileInputNodeProps {
  data: {
    file_name?: string;
    file_size?: number;
    mime_type?: string;
    width?: number;
    height?: number;
    thumbnail_url?: string;
    url?: string;
    source_url?: string;
  };
}

export const FileInputNode: FC<FileInputNodeProps> = ({ data }) => {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isImage = data.mime_type?.startsWith('image/');
  const isVideo = data.mime_type?.startsWith('video/');
  const isAudio = data.mime_type?.startsWith('audio/');
  const src = data.source_url || data.url || data.thumbnail_url;

  return (
    <div className="px-3 py-3 bg-white border-2 border-blue-300 rounded-lg shadow-md">
      <div className="flex items-center gap-2 mb-2">
        {isImage ? <ImageIcon className="w-4 h-4 text-blue-600" /> : isVideo ? <Video className="w-4 h-4 text-blue-600" /> : <Music className="w-4 h-4 text-blue-600" />}
        <span className="text-sm font-semibold text-gray-900">Media Input</span>
      </div>

      {isImage && src && (
        <div className="mb-2">
          <Image
            src={src}
            alt={data.file_name || 'Uploaded media'}
            width={160}
            height={120}
            className="rounded border border-gray-200 object-cover"
          />
        </div>
      )}

      {isVideo && src && (
        <div className="mb-2">
          <video controls className="w-40 rounded border border-gray-200">
            <source src={src} type={data.mime_type} />
          </video>
        </div>
      )}

      {isAudio && src && (
        <div className="mb-2">
          <audio controls className="w-40">
            <source src={src} type={data.mime_type} />
          </audio>
        </div>
      )}

      <div className="text-xs text-gray-600 space-y-1">
        {data.file_name && <div className="truncate" title={data.file_name}>📄 {data.file_name}</div>}
        {data.file_size && <div>{formatFileSize(data.file_size)}</div>}
        {data.mime_type && <div>{data.mime_type}</div>}
        {data.width && data.height && <div>{data.width}x{data.height}px</div>}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default FileInputNode;
