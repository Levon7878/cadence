import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/shared/styles/globals.css';
import { env } from '@/shared/config/env';
import { App } from './App';

async function enableMocking() {
  if (!env.enableMocks) return;
  const { startMockWorker } = await import('@/mocks/browser');
  await startMockWorker();
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
