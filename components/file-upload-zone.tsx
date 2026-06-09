'use client';

import { useRef } from 'react';
import { FileUploadZone as AgentFileUploadZone } from '@/components/agents/file-upload-zone';

export { AgentFileUploadZone as FileUploadZone };
export default function FileUploadZoneDeprecated() {
  return <AgentFileUploadZone />;
}
