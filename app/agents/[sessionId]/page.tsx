'use client';

import { useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useAgentSession } from '@/hooks/api/useAgent';
import { EnvironmentContainer } from '@/components/agents/environment-container';
import { EnvironmentProvider, useEnvironment } from '@/lib/contexts/environment-context';
import { useToast } from '@/hooks/use-toast';

function AgentEnvironmentPageInner() {
  const params = useParams<{ sessionId: string }>();
  const search = useSearchParams();
  const sessionId = params?.sessionId;
  const fileId = search.get('fileId');
  const fileName = search.get('fileName');
  const fileType = search.get('fileType');
  const { toast } = useToast();
  const { setCurrentSessionId, setCurrentSession, setLoading, setError } = useEnvironment();
  const { isError, error } = useAgentSession(sessionId || '');

  useEffect(() => {
    if (!sessionId) return;
    setCurrentSessionId(sessionId);
  }, [sessionId, setCurrentSessionId]);

  useEffect(() => {
    if (isError) {
      toast({
        title: 'Failed to load agent session',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  }, [isError, error, toast]);

  const media = {
    fileId: fileId || '',
    fileName: fileName || '',
    fileType: fileType || '',
  };

  if (!sessionId) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-sm text-muted-foreground">Missing session ID.</p>
      </div>
    );
  }

  if (!media.fileId || !media.fileName || !media.fileType) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-sm text-muted-foreground">Missing media information.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <EnvironmentContainer sessionId={sessionId} media={media} />
    </div>
  );
}

export default function AgentEnvironmentPage() {
  return (
    <EnvironmentProvider>
      <AgentEnvironmentPageInner />
    </EnvironmentProvider>
  );
}
