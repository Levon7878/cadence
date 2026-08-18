import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

export async function startMockWorker() {
  await worker.start({
    onUnhandledRequest(request, print) {
      const { pathname, hostname } = new URL(request.url);
      if (hostname !== window.location.hostname) return;
      if (
        pathname.startsWith('/src/') ||
        pathname.startsWith('/@') ||
        pathname.startsWith('/node_modules') ||
        pathname.startsWith('/assets/')
      ) {
        return;
      }
      print.warning();
    },
    quiet: true,
  });
}
