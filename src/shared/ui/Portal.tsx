import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

export function Portal({ children }: { children: ReactNode }) {
  const [container] = useState(() => document.createElement('div'));
  useEffect(() => {
    container.setAttribute('data-cadence-portal', '');
    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  }, [container]);
  return createPortal(children, container);
}
