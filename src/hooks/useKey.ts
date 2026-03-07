import { useEffect } from 'react';

export function useKey(key: string, callback: () => void) {
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInput && e.key !== 'Escape') return;

      const isMatch =
        e.key.toLowerCase() === key.toLowerCase() ||
        (key.length === 1 && e.code === `Key${key.toUpperCase()}`);

      if (isMatch) callback();
    };

    document.addEventListener('keydown', handleKeydown);

    return () => document.removeEventListener('keydown', handleKeydown);
  }, [key, callback]);
}
