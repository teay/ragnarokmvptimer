import { useRef, useEffect } from 'react';

export function useClickOutside(onClick: () => void, enabled: boolean = true) {
  const ref = useRef<any>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (!enabled) return;
      if (ref.current && !ref.current.contains(event.target)) {
        onClick();
      }
    }
    document.addEventListener('click', handleClickOutside, true);
    return () =>
      document.removeEventListener('click', handleClickOutside, true);
  }, [onClick, enabled]);

  return ref;
}
