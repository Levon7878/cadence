import { useEffect } from 'react';
import type { RefObject } from 'react';

export function useClickOutside(
  refs: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  handler: () => void,
  active = true,
) {
  useEffect(() => {
    if (!active) return;
    const list = Array.isArray(refs) ? refs : [refs];
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (list.some((ref) => ref.current?.contains(target))) return;
      handler();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [refs, handler, active]);
}
