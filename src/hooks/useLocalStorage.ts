import { useState, useEffect, useCallback } from "react";

/**
 * Custom hook for managing state that persists in localStorage
 *
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 *
 * // Later in your component
 * const toggleTheme = () => {
 *   setTheme(theme === 'light' ? 'dark' : 'light');
 * };
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    /** Serialize function to convert value to string */
    serialize?: (value: T) => string;
    /** Deserialize function to convert string to value */
    deserialize?: (value: string) => T;
    /** Storage object to use (defaults to localStorage) */
    storage?: Storage;
  }
): [T, (value: T | ((val: T) => T)) => void] {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    storage = typeof window !== "undefined" ? window.localStorage : undefined,
  } = options || {};

  // Get from localStorage on initial render, falling back to initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!storage) return initialValue;

    try {
      const item = storage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to localStorage
        if (storage) {
          storage.setItem(key, serialize(valueToStore));
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serialize, storage, storedValue]
  );

  // Listen for changes to this localStorage key in other tabs/windows
  useEffect(() => {
    if (!storage) return;

    function handleStorageChange(e: StorageEvent) {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue));
        } catch (error) {
          console.error(
            `Error parsing localStorage change for key "${key}":`,
            error
          );
        }
      }
    }

    // Listen for storage events to keep different tabs in sync
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, storage, deserialize]);

  return [storedValue, setValue];
}

/**
 * Custom hook for managing multiple localStorage values as an object
 */
export function useLocalStorageObject<T extends Record<string, any>>(
  key: string,
  initialValue: T
): [T, (value: Partial<T> | ((val: T) => T)) => void] {
  const [storedObject, setStoredObject] = useLocalStorage<T>(key, initialValue);

  // Provide a setter that merges the new values with the existing object
  const setPartialObject = useCallback(
    (value: Partial<T> | ((val: T) => T)) => {
      if (value instanceof Function) {
        setStoredObject(value);
      } else {
        setStoredObject((prev) => ({ ...prev, ...value }));
      }
    },
    [setStoredObject]
  );

  return [storedObject, setPartialObject];
}
