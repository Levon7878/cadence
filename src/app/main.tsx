import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/shared/styles/globals.css';
import { env } from '@/shared/config/env';
import { App } from './App';

async function enableMocking() {
  if (!env.enableMocks) return;
  try {
    const { startMockWorker } = await import('@/mocks/browser');
    await startMockWorker();
  } catch (error) {
    console.error('Failed to start the mock API. Login will not work until the service worker is available.', error);
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
