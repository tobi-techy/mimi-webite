/**
 * A JSON value kept in sessionStorage for the demo session, readable with useSyncExternalStore.
 * The snapshot is cached so React sees a stable reference until the value changes.
 */
type SessionValue<T> = {
  get: () => T;
  getServer: () => T;
  set: (value: T) => void;
  subscribe: (listener: () => void) => () => void;
};

export function sessionValue<T>(key: string, fallback: T): SessionValue<T> {
  const listeners = new Set<() => void>();
  let cache: { value: T } | null = null;

  function read(): T {
    try {
      const raw = window.sessionStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  return {
    get() {
      cache ??= { value: read() };
      return cache.value;
    },
    getServer: () => fallback,
    set(value) {
      cache = { value };
      try {
        window.sessionStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* storage full or blocked: keep the in-memory value */
      }
      listeners.forEach((l) => l());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
