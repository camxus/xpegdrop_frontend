'use client';

import { FC } from 'react';
import { useEnvironment } from '@/lib/contexts/environment-context';
import EnvironmentCanvas from './environment-canvas';
import { FileUploadZone } from './file-upload-zone';
import { Button } from '../ui/button';

interface EnvironmentContainerProps {
  sessionId: string;
  media?: { fileId: string; fileName: string; fileType: string } | null;
  fallback?: React.ReactNode;
}

export const EnvironmentContainer: FC<EnvironmentContainerProps> = ({ sessionId, media }) => {
  const { currentSession, setCurrentSessionId } = useEnvironment();

  if (!currentSession) {
    return (
      <div className="flex flex-col items-start gap-3 p-4">
        <Button
          onClick={() => setCurrentSessionId(sessionId)}
        >
          Load existing environment
        </Button>
        <FileUploadZone />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] w-full">
      <EnvironmentCanvas sessionId={sessionId} media={media} />
    </div>
  );
};
