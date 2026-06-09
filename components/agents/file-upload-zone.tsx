'use client';

import { useRef } from 'react';
import { useUploadImage } from '@/hooks/api/useAgent';
import { useEnvironment } from '@/lib/contexts/environment-context';

export function FileUploadZone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadImage();
  const { setLoading, setError, setCurrentSessionId } = useEnvironment();

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Only image uploads are supported.');
      return;
    }
    setError(null);
    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    upload.mutate(formData);
  };

  return (
    <div
      className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-400"
      onClick={() => inputRef.current?.click()}
    >
      <span className="text-sm text-gray-600">Click to upload an image</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
    </div>
  );
}
