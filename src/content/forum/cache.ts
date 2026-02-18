interface CacheEntry<T> {
    data: T;
    ts: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 30_000;

export function getCached<T>(key: string, ttl = DEFAULT_TTL): T | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > ttl) return null;
    return entry.data as T;
}

export function getStale<T>(key: string): T | null {
    const entry = store.get(key);
    return entry ? (entry.data as T) : null;
}

export function setCache<T>(key: string, data: T): void {
    store.set(key, { data, ts: Date.now() });
}

export function invalidate(key?: string): void {
    if (!key) {
        store.clear();
        return;
    }
    // Support wildcard invalidation: "feed:*" clears all feed keys
    if (key.endsWith(':*')) {
        const prefix = key.slice(0, -1);
        for (const k of store.keys()) {
            if (k.startsWith(prefix)) store.delete(k);
        }
    } else {
        store.delete(key);
    }
}


