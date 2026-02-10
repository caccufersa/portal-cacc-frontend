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
    if (key) store.delete(key);
    else store.clear();
}

export async function cachedFetch<T>(
    key: string,
    url: string,
    ttl = DEFAULT_TTL,
    opts?: RequestInit,
): Promise<T | null> {
    const cached = getCached<T>(key, ttl);
    if (cached) return cached;

    try {
        const res = await fetch(url, { ...opts, cache: 'no-store' });
        if (!res.ok) return getStale<T>(key);
        const data: T = await res.json();
        setCache(key, data);
        return data;
    } catch {
        return getStale<T>(key);
    }
}
