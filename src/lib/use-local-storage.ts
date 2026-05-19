"use client";

import { useCallback, useEffect, useState } from "react";

type LocalStorageOptions<T> = {
  normalize?: (value: T) => T;
};

export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  options: LocalStorageOptions<T> = {},
) {
  const normalizeOption = options.normalize;
  const normalize = useCallback(
    (next: T) => normalizeOption ? normalizeOption(next) : next,
    [normalizeOption],
  );
  const [loaded, setLoaded] = useState(false);
  const [value, setValue] = useState<T>(() => {
    return normalize(initialValue);
  });

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue !== null) {
        setValue(normalize(JSON.parse(storedValue) as T));
      }
      setLoaded(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [key, normalize]);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, loaded, value]);

  return [value, setValue] as const;
}
