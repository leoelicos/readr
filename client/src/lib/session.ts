import { decodeToken, isExpired, type TokenProfile } from './jwt';

/**
 * Tiny external store for the auth token so React (useSyncExternalStore), the Apollo link
 * and other tabs (storage events) all agree on who is signed in, without page reloads.
 */
const KEY = 'readr:token';
const LEGACY_KEYS = ['id_token', 'readr'];
const listeners = new Set<() => void>();

function safeStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export const session = {
  getToken(): string | null {
    const storage = safeStorage();
    const token = storage?.getItem(KEY) ?? null;
    if (token && isExpired(decodeToken(token))) {
      storage?.removeItem(KEY);
      return null;
    }
    return token;
  },

  getProfile(token: string | null): TokenProfile | null {
    return token ? (decodeToken(token)?.data ?? null) : null;
  },

  set(token: string | null) {
    const storage = safeStorage();
    if (token) storage?.setItem(KEY, token);
    else storage?.removeItem(KEY);
    emit();
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY || event.key === null) listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener('storage', onStorage);
    };
  },

  /** v1 stored an unverifiable token and a duplicate list of saved ids; clear them. */
  clearLegacy() {
    const storage = safeStorage();
    for (const key of LEGACY_KEYS) storage?.removeItem(key);
  },
};
