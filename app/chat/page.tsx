'use client';

import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const NexusApp = dynamic(() => import('@/components/NexusApp'), {
  ssr: false,
});

export default function ChatPage() {
  return (
    <ErrorBoundary>
      <NexusApp />
    </ErrorBoundary>
  );
}
