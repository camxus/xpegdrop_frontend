'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUploadImage } from '@/hooks/api/useAgent';
import { useEnvironment } from '@/lib/contexts/environment-context';
import { useToast } from '@/hooks/use-toast';

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen bg-black text-white">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <h1 className="text-6xl font-serif tracking-wide text-white drop-shadow-lg">
          fframessAI
        </h1>
      </motion.div>

      <div className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full bg-white rounded-full"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.6, ease: 'easeInOut', repeat: Infinity, repeatType: 'mirror' }}
        />
      </div>

      <motion.p
        className="text-sm text-gray-300"
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
      >
        initializing fframessAI session
      </motion.p>
    </div>
  );
}

export default function AgentsPage() {
  const search = useSearchParams();
  const router = useRouter();
  const upload = useUploadImage();
  const { setCurrentSession, setCurrentSessionId, setLoading, setError } = useEnvironment();
  const { toast } = useToast();

  useEffect(() => {
    const file = search.get('file');
    const fileId = search.get('fileId');
    const fileName = search.get('fileName');
    const fileType = search.get('fileType');
    const projectId = search.get('projectId');

    if (!fileId || !fileName) {
      router.replace('/');
      return;
    }

    let cancelled = false;

    const start = async () => {
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('imageId', fileId);
        formData.append('projectId', projectId || '');
        formData.append('mediaName', fileName);
        if (file) formData.append('file', new File([], fileName, { type: fileType || 'application/octet-stream' }));
        const res = await upload.mutateAsync(formData);
        if (cancelled) return;
        setCurrentSession(res.data);
        setCurrentSessionId(res.data.session_id);
        router.replace(`/agents/${res.data.session_id}?fileId=${fileId}&fileName=${fileName}&fileType=${fileType}`);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        toast({
          title: 'Failed to start agent session',
          description: message,
          variant: 'destructive',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    start();

    return () => {
      cancelled = true;
    };
  }, [search, upload, setCurrentSession, setCurrentSessionId, setLoading, setError, router, toast]);

  return <LoadingScreen />;
}
