import { useEffect, useRef, useState } from 'react';

/**
 * Like useState but auto-persists the value to localStorage under `key`.
 * On mount, reads the stored value (if any) and seeds state with it.
 * Pass a stable key per component (e.g. `admin:blog:form`).
 */
export function usePersistedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw) as T;
    } catch {}
    return initial;
  });
  const hydrated = useRef(true);
  useEffect(() => {
    if (!hydrated.current) return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }, [key, value]);
  return [value, setValue] as const;
}
