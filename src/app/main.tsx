import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/shared/styles/globals.css';
import { env } from '@/shared/config/env';
import { installAxiosMockAdapter } from '@/mocks/install-axios-mock';
import { App } from './App';

if (env.enableMocks) {
  installAxiosMockAdapter();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
